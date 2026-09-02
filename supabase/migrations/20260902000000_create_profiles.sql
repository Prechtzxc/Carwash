-- Phase 2: identity and admin-access foundation.

create type public.app_role as enum ('admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'staff'::public.app_role,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'One-to-one application profile and access state for Supabase Auth users.';
comment on column public.profiles.role is 'Access role. New profiles default to staff and must be promoted by a database owner.';
comment on column public.profiles.active is 'Whether this profile may access the admin workspace.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that may have been created before this migration was applied.
insert into public.profiles (id, full_name)
select
  id,
  nullif(trim(raw_user_meta_data ->> 'full_name'), '')
from auth.users
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Public and anonymous clients receive no profile table privileges.
revoke all on table public.profiles from anon, authenticated;

-- Authenticated users can read only their own active admin/staff profile.
grant select on table public.profiles to authenticated;

-- Deliberately grant only the harmless display-name column for client updates.
-- Role, active state, identity, and timestamps remain database-owner controlled.
grant update (full_name) on table public.profiles to authenticated;

create policy "Authenticated users can read their own active profile"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    and active = true
    and role in ('admin'::public.app_role, 'staff'::public.app_role)
  );

create policy "Authenticated users can update their own full name"
  on public.profiles
  for update
  to authenticated
  using (
    id = (select auth.uid())
    and active = true
    and role in ('admin'::public.app_role, 'staff'::public.app_role)
  )
  with check (
    id = (select auth.uid())
    and active = true
    and role in ('admin'::public.app_role, 'staff'::public.app_role)
  );
