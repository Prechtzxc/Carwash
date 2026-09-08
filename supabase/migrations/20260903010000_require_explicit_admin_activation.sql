-- Require explicit owner activation before a newly created Auth user can enter
-- the admin workspace. Existing migration files remain unchanged.

alter table public.profiles
  alter column active set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'admin'::public.app_role,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
