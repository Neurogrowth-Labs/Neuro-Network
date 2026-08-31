-- Keep Connect discovery focused on other Neuro Network members.
-- This is also applied by the client as a defensive fallback for deployments that
-- have not yet run this migration.
create or replace function public.discover_profiles(p_query text default '', p_limit integer default 30)
returns table(id uuid, full_name text, job_title text, company text, avatar_url text)
language sql security definer set search_path = public as $$
  select p.id, p.full_name, p.job_title, p.company, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.status = 'Active'
    and p.discoverable
    and (
      nullif(trim(p_query), '') is null
      or p.full_name ilike '%' || trim(p_query) || '%'
      or p.company ilike '%' || trim(p_query) || '%'
      or p.job_title ilike '%' || trim(p_query) || '%'
    )
  order by p.full_name
  limit least(greatest(p_limit, 1), 50)
$$;

grant execute on function public.discover_profiles(text, integer) to authenticated;
