-- Production Connect, Vault, card, QR and entitlement upgrade. Run after 001–004.
create extension if not exists pgcrypto;

-- Schema alterations
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists discoverable boolean not null default true;
alter table public.business_cards add column if not exists customization jsonb not null default '{"version":1,"theme":"executive"}'::jsonb;
alter table public.business_cards add column if not exists qr_token uuid not null default gen_random_uuid();
alter table public.contacts add column if not exists source_connection_id uuid;

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(), responded_at timestamptz,
  check (requester_id <> recipient_id)
);
create table if not exists public.connection_events (
  id uuid primary key default gen_random_uuid(), connection_id uuid not null references public.connections(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict, event_type text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.blocks (blocker_id uuid not null references auth.users(id) on delete cascade, blocked_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), primary key(blocker_id, blocked_id), check(blocker_id <> blocked_id));
create table if not exists public.qr_tokens (token uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, expires_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.webhook_events (provider text not null, event_id text not null, payload jsonb not null, received_at timestamptz not null default now(), primary key(provider,event_id));
alter table public.subscriptions add column if not exists provider text;
alter table public.subscriptions add column if not exists provider_subscription_id text;
alter table public.subscriptions add column if not exists provider_customer_id text;
alter table public.subscriptions add column if not exists entitlement_active boolean not null default false;

-- Indexes and integrity
create unique index if not exists profiles_username_unique on public.profiles (lower(username)) where username is not null;
create unique index if not exists business_cards_qr_token_unique on public.business_cards(qr_token);
create unique index if not exists connections_pair_unique on public.connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));
create unique index if not exists contacts_source_connection_unique on public.contacts(user_id, source_connection_id) where source_connection_id is not null;
create index if not exists connections_recipient_pending on public.connections(recipient_id, created_at desc) where status = 'pending';
create index if not exists connections_requester_status on public.connections(requester_id, status, created_at desc);
create index if not exists qr_tokens_owner_active on public.qr_tokens(owner_id) where revoked_at is null;
create unique index if not exists subscriptions_provider_subscription_unique on public.subscriptions(provider, provider_subscription_id) where provider is not null and provider_subscription_id is not null;

-- Server-side operations prevent client-forged relationships and synchronize Vault contacts.
create or replace function public.request_connection(p_recipient_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_me uuid := auth.uid();
begin
 if v_me is null then raise exception 'Authentication required'; end if;
 if v_me = p_recipient_id then raise exception 'Cannot connect to yourself'; end if;
 if exists(select 1 from public.blocks where (blocker_id=v_me and blocked_id=p_recipient_id) or (blocker_id=p_recipient_id and blocked_id=v_me)) then raise exception 'Connection unavailable'; end if;
 insert into public.connections(requester_id,recipient_id) values(v_me,p_recipient_id) returning id into v_id;
 insert into public.connection_events(connection_id,actor_id,event_type) values(v_id,v_me,'requested');
 insert into public.notifications(user_id,type,content) values(p_recipient_id,'connection_request','You have a new connection request.');
 return v_id;
exception when unique_violation then raise exception 'A connection already exists'; end $$;

create or replace function public.respond_to_connection(p_connection_id uuid, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare c public.connections; me uuid := auth.uid();
begin
 if me is null then raise exception 'Authentication required'; end if;
 select * into c from public.connections where id=p_connection_id for update;
 if not found or c.recipient_id <> me or c.status <> 'pending' then raise exception 'Connection request unavailable'; end if;
 update public.connections set status=case when p_accept then 'accepted' else 'rejected' end, responded_at=now() where id=c.id;
 insert into public.connection_events(connection_id,actor_id,event_type) values(c.id,me,case when p_accept then 'accepted' else 'rejected' end);
 if p_accept then
   insert into public.contacts(user_id,first_name,last_name,job_title,company,avatar_url,source_connection_id)
   select c.recipient_id, split_part(p.full_name,' ',1), nullif(substr(p.full_name,length(split_part(p.full_name,' ',1))+2),''), p.job_title,p.company,p.avatar_url,c.id from public.profiles p where p.id=c.requester_id on conflict do nothing;
   insert into public.contacts(user_id,first_name,last_name,job_title,company,avatar_url,source_connection_id)
   select c.requester_id, split_part(p.full_name,' ',1), nullif(substr(p.full_name,length(split_part(p.full_name,' ',1))+2),''), p.job_title,p.company,p.avatar_url,c.id from public.profiles p where p.id=c.recipient_id on conflict do nothing;
   insert into public.notifications(user_id,type,content) values(c.requester_id,'connection_accepted','Your connection request was accepted.');
 end if;
end $$;

create or replace function public.scan_qr_token(p_token uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare owner uuid; me uuid:=auth.uid(); result uuid;
begin
 if me is null then raise exception 'Authentication required'; end if;
 select owner_id into owner from public.qr_tokens where token=p_token and revoked_at is null and (expires_at is null or expires_at>now());
 if owner is null then raise exception 'Invalid or expired QR code'; end if;
 if owner=me then raise exception 'Cannot scan your own QR code'; end if;
 result := public.request_connection(owner); return result;
end $$;

create or replace function public.discover_profiles(p_query text default '', p_limit integer default 30)
returns table(id uuid, full_name text, job_title text, company text, avatar_url text)
language sql security definer set search_path = public as $$
  select p.id, p.full_name, p.job_title, p.company, p.avatar_url
  from public.profiles p
  where auth.uid() is not null and p.id <> auth.uid() and p.status = 'Active' and p.discoverable
    and (nullif(trim(p_query),'') is null or p.full_name ilike '%' || trim(p_query) || '%' or p.company ilike '%' || trim(p_query) || '%' or p.job_title ilike '%' || trim(p_query) || '%')
  order by p.full_name limit least(greatest(p_limit,1),50)
$$;

-- RLS: discovery exposes only a minimal active profile projection in the application; mutations are RPC-only.
alter table public.connections enable row level security;
alter table public.connection_events enable row level security;
alter table public.blocks enable row level security;
alter table public.qr_tokens enable row level security;
alter table public.webhook_events enable row level security;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists connections_participants on public.connections;
create policy connections_participants on public.connections for select using (auth.uid() in (requester_id,recipient_id));
drop policy if exists connection_events_participants on public.connection_events;
create policy connection_events_participants on public.connection_events for select using (exists(select 1 from public.connections c where c.id=connection_id and auth.uid() in(c.requester_id,c.recipient_id)));
drop policy if exists blocks_owner on public.blocks;
create policy blocks_owner on public.blocks for all using(auth.uid()=blocker_id) with check(auth.uid()=blocker_id);
drop policy if exists qr_tokens_owner on public.qr_tokens;
create policy qr_tokens_owner on public.qr_tokens for all using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
revoke all on public.webhook_events from anon, authenticated;
revoke insert, update, delete on public.connections, public.connection_events from authenticated;
grant execute on function public.request_connection(uuid), public.respond_to_connection(uuid,boolean), public.scan_qr_token(uuid), public.discover_profiles(text,integer) to authenticated;

-- Realtime tables. Enable replication in Dashboard if the publication was customized manually.
do $$ begin alter publication supabase_realtime add table public.connections; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.contacts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;
