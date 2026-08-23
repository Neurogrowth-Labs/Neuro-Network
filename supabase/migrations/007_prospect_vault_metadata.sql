-- Prospect/Vault metadata. Apply after 005 and 006.
alter table public.contacts add column if not exists profile_url text;
alter table public.contacts add column if not exists profile_url_normalized text;
alter table public.contacts add column if not exists location text default '';
alter table public.contacts add column if not exists role_category text default 'Other';
alter table public.contacts add column if not exists contact_status text not null default 'active';
alter table public.contacts add column if not exists last_interaction_at timestamptz;
alter table public.contacts add column if not exists custom_metadata jsonb not null default '{}'::jsonb;
create unique index if not exists contacts_user_linkedin_unique on public.contacts(user_id, profile_url_normalized) where profile_url_normalized is not null;
create index if not exists contacts_user_role_idx on public.contacts(user_id, role_category);
create index if not exists contacts_user_company_idx on public.contacts(user_id, company);
create index if not exists contacts_user_name_idx on public.contacts(user_id, full_name);
