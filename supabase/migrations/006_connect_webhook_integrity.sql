-- Follow-up integrity fixes for installations that have applied 005.
-- This migration is safe to run once or repeatedly in Supabase SQL Editor.

alter table public.contacts
  drop constraint if exists contacts_source_connection_id_fkey;
alter table public.contacts
  add constraint contacts_source_connection_id_fkey
  foreign key (source_connection_id) references public.connections(id) on delete set null;

-- A non-partial unique index is required for INSERT .. ON CONFLICT(provider, provider_subscription_id).
drop index if exists public.subscriptions_provider_subscription_unique;
create unique index if not exists subscriptions_provider_subscription_unique
  on public.subscriptions(provider, provider_subscription_id);

create or replace function public.request_connection(p_recipient_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Authentication required'; end if;
  if v_me = p_recipient_id then raise exception 'Cannot connect to yourself'; end if;
  perform 1 from public.profiles where id = p_recipient_id and status = 'Active' and discoverable for key share;
  if not found then raise exception 'Connection unavailable'; end if;
  if exists (select 1 from public.blocks where (blocker_id = v_me and blocked_id = p_recipient_id) or (blocker_id = p_recipient_id and blocked_id = v_me)) then
    raise exception 'Connection unavailable';
  end if;
  insert into public.connections(requester_id, recipient_id) values (v_me, p_recipient_id) returning id into v_id;
  insert into public.connection_events(connection_id, actor_id, event_type) values (v_id, v_me, 'requested');
  insert into public.notifications(user_id, type, content) values (p_recipient_id, 'connection_request', 'You have a new connection request.');
  return v_id;
exception when unique_violation then raise exception 'A connection already exists';
end $$;

-- Keep webhook de-duplication and entitlement mutation in one database transaction.
create or replace function public.process_whop_event(
  p_event_id text, p_payload jsonb, p_user_id uuid, p_user_email text,
  p_subscription_id text, p_event_type text, p_period_end timestamptz default null
) returns boolean language plpgsql security definer set search_path = public as $$
declare inserted_count integer;
begin
  insert into public.webhook_events(provider, event_id, payload)
  values ('whop', p_event_id, p_payload)
  on conflict (provider, event_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;
  if p_event_type ~ '(payment_succeeded|membership_activated|membership_renewed)' then
    insert into public.subscriptions(user_id, user_email, provider, provider_subscription_id, status, entitlement_active, current_period_end)
    values (p_user_id, p_user_email, 'whop', p_subscription_id, 'active', true, p_period_end)
    on conflict (provider, provider_subscription_id) do update set
      user_id = excluded.user_id, user_email = excluded.user_email, status = excluded.status,
      entitlement_active = excluded.entitlement_active, current_period_end = excluded.current_period_end, updated_at = now();
  elsif p_event_type ~ '(cancelled|expired|refunded|payment_failed)' then
    update public.subscriptions set status = 'inactive', entitlement_active = false, updated_at = now()
      where provider = 'whop' and provider_subscription_id = p_subscription_id;
  end if;
  return true;
end $$;

revoke all on function public.process_whop_event(text,jsonb,uuid,text,text,text,timestamptz) from public, anon, authenticated;

-- Prevent ordinary users from changing authorization-only profile fields.
create or replace function public.prevent_profile_privilege_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (new.role is distinct from old.role or new.status is distinct from old.status or new.email is distinct from old.email) then
    raise exception 'Restricted profile field';
  end if;
  return new;
end $$;
drop trigger if exists profiles_restrict_privileged_fields on public.profiles;
create trigger profiles_restrict_privileged_fields before update on public.profiles
  for each row execute function public.prevent_profile_privilege_changes();
