-- Admin-only access cleanup. The legacy app_role.staff enum value remains in
-- place so this migration does not rewrite or invalidate applied history.

alter table public.profiles
  alter column role set default 'admin'::public.app_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'admin'::public.app_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop policy if exists "Authenticated users can read their own active profile" on public.profiles;
create policy "Active admins can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    and active = true
    and role = 'admin'::public.app_role
  );

drop policy if exists "Authenticated users can update their own full name" on public.profiles;
create policy "Active admins can update their own full name"
  on public.profiles
  for update
  to authenticated
  using (
    id = (select auth.uid())
    and active = true
    and role = 'admin'::public.app_role
  )
  with check (
    id = (select auth.uid())
    and active = true
    and role = 'admin'::public.app_role
  );

revoke all on table public.profiles from PUBLIC, anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- Keep the existing helper safe for any database callers that still reference
-- it, even though catalog policies below use the explicit admin helper.
create or replace function public.is_active_catalog_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and active = true
      and role = 'admin'::public.app_role
  );
$$;

revoke all on function public.is_active_catalog_user() from public;
grant execute on function public.is_active_catalog_user() to authenticated;

drop policy if exists "Active admin or staff can read vehicle categories" on public.vehicle_categories;
create policy "Active admins can read vehicle categories"
  on public.vehicle_categories
  for select
  to authenticated
  using ((select public.is_active_admin()));

drop policy if exists "Active admin or staff can read services" on public.services;
create policy "Active admins can read services"
  on public.services
  for select
  to authenticated
  using ((select public.is_active_admin()));

drop policy if exists "Active admin or staff can read service prices" on public.service_prices;
create policy "Active admins can read service prices"
  on public.service_prices
  for select
  to authenticated
  using ((select public.is_active_admin()));

revoke all on table public.vehicle_categories, public.services, public.service_prices from PUBLIC, anon, authenticated;
grant select on table public.vehicle_categories, public.services, public.service_prices to authenticated;
grant insert (name, description, size_class, active, sort_order)
  on table public.vehicle_categories to authenticated;
grant update (name, description, size_class, active, sort_order)
  on table public.vehicle_categories to authenticated;
grant insert (name, description, active, sort_order)
  on table public.services to authenticated;
grant update (name, description, active, sort_order)
  on table public.services to authenticated;
grant insert (service_id, size_class, price, active)
  on table public.service_prices to authenticated;
grant update (service_id, size_class, price, active)
  on table public.service_prices to authenticated;
