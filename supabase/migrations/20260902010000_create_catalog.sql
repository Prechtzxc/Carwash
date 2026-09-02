-- Phase 3: catalog configuration for vehicle categories, services, and prices.

create type public.vehicle_size as enum ('small', 'medium', 'large', 'xl');

create table public.vehicle_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  size_class public.vehicle_size not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicle_categories_name_not_blank check (char_length(btrim(name)) between 1 and 80),
  constraint vehicle_categories_description_length check (description is null or char_length(description) <= 240),
  constraint vehicle_categories_sort_order_nonnegative check (sort_order >= 0)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_name_not_blank check (char_length(btrim(name)) between 1 and 80),
  constraint services_description_length check (description is null or char_length(description) <= 240),
  constraint services_sort_order_nonnegative check (sort_order >= 0)
);

create table public.service_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete restrict,
  size_class public.vehicle_size not null,
  price numeric(10, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_prices_price_nonnegative check (price >= 0),
  constraint service_prices_service_size_unique unique (service_id, size_class)
);

comment on table public.vehicle_categories is 'Configurable vehicle categories and their default service size class.';
comment on column public.vehicle_categories.size_class is 'Default size used to select service pricing for this category.';
comment on table public.services is 'Configurable wash and add-on services.';
comment on table public.service_prices is 'One configurable price per service and vehicle size class.';

create unique index vehicle_categories_name_lower_key
  on public.vehicle_categories (lower(name));

create index vehicle_categories_active_sort_order_idx
  on public.vehicle_categories (active, sort_order, name);

create unique index services_name_lower_key
  on public.services (lower(name));

create index services_active_sort_order_idx
  on public.services (active, sort_order, name);

create index service_prices_service_id_idx
  on public.service_prices (service_id);

create index service_prices_size_class_idx
  on public.service_prices (size_class);

create trigger vehicle_categories_set_updated_at
  before update on public.vehicle_categories
  for each row execute function public.set_updated_at();

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create trigger service_prices_set_updated_at
  before update on public.service_prices
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER keeps role checks from depending on the profile table's own
-- self-read policy. The fixed search_path prevents object shadowing.
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
      and role in ('admin'::public.app_role, 'staff'::public.app_role)
  );
$$;

create or replace function public.is_active_admin()
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
revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_catalog_user() to authenticated;
grant execute on function public.is_active_admin() to authenticated;

alter table public.vehicle_categories enable row level security;
alter table public.services enable row level security;
alter table public.service_prices enable row level security;

revoke all on table public.vehicle_categories, public.services, public.service_prices from anon, authenticated;
grant usage on type public.vehicle_size to authenticated;

grant select on table public.vehicle_categories to authenticated;
grant insert (name, description, size_class, active, sort_order)
  on table public.vehicle_categories to authenticated;
grant update (name, description, size_class, active, sort_order)
  on table public.vehicle_categories to authenticated;

grant select on table public.services to authenticated;
grant insert (name, description, active, sort_order)
  on table public.services to authenticated;
grant update (name, description, active, sort_order)
  on table public.services to authenticated;

grant select on table public.service_prices to authenticated;
grant insert (service_id, size_class, price, active)
  on table public.service_prices to authenticated;
grant update (service_id, size_class, price, active)
  on table public.service_prices to authenticated;

create policy "Active admin or staff can read vehicle categories"
  on public.vehicle_categories
  for select
  to authenticated
  using ((select public.is_active_catalog_user()));

create policy "Active admins can create vehicle categories"
  on public.vehicle_categories
  for insert
  to authenticated
  with check ((select public.is_active_admin()));

create policy "Active admins can update vehicle categories"
  on public.vehicle_categories
  for update
  to authenticated
  using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

create policy "Active admin or staff can read services"
  on public.services
  for select
  to authenticated
  using ((select public.is_active_catalog_user()));

create policy "Active admins can create services"
  on public.services
  for insert
  to authenticated
  with check ((select public.is_active_admin()));

create policy "Active admins can update services"
  on public.services
  for update
  to authenticated
  using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

create policy "Active admin or staff can read service prices"
  on public.service_prices
  for select
  to authenticated
  using ((select public.is_active_catalog_user()));

create policy "Active admins can create service prices"
  on public.service_prices
  for insert
  to authenticated
  with check ((select public.is_active_admin()));

create policy "Active admins can update service prices"
  on public.service_prices
  for update
  to authenticated
  using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

-- These defaults are intentionally documented and editable. They are only a
-- starting point for category-to-size selection; no service prices are seeded.
insert into public.vehicle_categories (name, description, size_class, sort_order)
values
  ('Sedan', 'Standard passenger cars.', 'small'::public.vehicle_size, 10),
  ('Hatchback', 'Compact passenger cars with a rear liftgate.', 'small'::public.vehicle_size, 20),
  ('MPV', 'Multi-purpose passenger vehicles.', 'medium'::public.vehicle_size, 30),
  ('SUV', 'Sport utility vehicles.', 'large'::public.vehicle_size, 40),
  ('Pickup', 'Pickup trucks and utility vehicles.', 'xl'::public.vehicle_size, 50),
  ('Van', 'Passenger and commercial vans.', 'xl'::public.vehicle_size, 60)
on conflict (lower(name)) do nothing;

insert into public.services (name, description, sort_order)
values
  ('Basic Wash', 'Core exterior wash service.', 10),
  ('Premium Wash', 'Expanded wash package.', 20),
  ('Interior Vacuum', 'Interior vacuum add-on.', 30),
  ('Wax', 'Wax finish add-on.', 40),
  ('Tire Shine', 'Tire shine add-on.', 50)
on conflict (lower(name)) do nothing;
