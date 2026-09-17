-- Seed the initial Cool Car Centrale service menu and editable pricing matrix.
-- This migration only changes current catalog configuration. Transaction rows
-- retain their existing service and price snapshots.

-- Reuse the original placeholder MPV and Premium Wash rows when present. If a
-- newer named row already exists, keep the legacy row inactive rather than
-- deleting a record that may be referenced by historical transactions.
do $$
declare
  legacy_mpv_id uuid;
  medium_mpv_id uuid;
  legacy_premium_id uuid;
  premium_hand_wax_id uuid;
begin
  select id
    into legacy_mpv_id
  from public.vehicle_categories
  where lower(name) = 'mpv'
  limit 1;

  select id
    into medium_mpv_id
  from public.vehicle_categories
  where lower(name) = 'medium mpv'
  limit 1;

  if legacy_mpv_id is not null and medium_mpv_id is null then
    update public.vehicle_categories
    set name = 'Medium MPV'
    where id = legacy_mpv_id;
  elsif legacy_mpv_id is not null and medium_mpv_id is not null and legacy_mpv_id <> medium_mpv_id then
    update public.vehicle_categories
    set active = false
    where id = legacy_mpv_id;
  end if;

  select id
    into legacy_premium_id
  from public.services
  where lower(name) = 'premium wash'
  limit 1;

  select id
    into premium_hand_wax_id
  from public.services
  where lower(name) = 'premium wash w/ hand wax'
  limit 1;

  if legacy_premium_id is not null and premium_hand_wax_id is null then
    update public.services
    set name = 'Premium Wash w/ Hand Wax'
    where id = legacy_premium_id;
  elsif legacy_premium_id is not null and premium_hand_wax_id is not null and legacy_premium_id <> premium_hand_wax_id then
    update public.services
    set active = false
    where id = legacy_premium_id;
  end if;
end;
$$;

insert into public.vehicle_categories (name, description, size_class, active, sort_order)
values
  ('Motor', 'Motorcycles.', 'motor'::public.vehicle_size, true, 10),
  ('Big Bike', 'Large motorcycles.', 'big_bike'::public.vehicle_size, true, 20),
  ('Sedan', 'Standard passenger cars.', 'small'::public.vehicle_size, true, 30),
  ('Hatchback', 'Compact passenger cars with a rear liftgate.', 'small'::public.vehicle_size, true, 40),
  ('Medium MPV', 'Medium multi-purpose passenger vehicles.', 'medium'::public.vehicle_size, true, 50),
  ('Large MPV', 'Large multi-purpose passenger vehicles.', 'large'::public.vehicle_size, true, 60),
  ('SUV', 'Sport utility vehicles.', 'large'::public.vehicle_size, true, 70),
  ('Pickup', 'Pickup trucks and utility vehicles.', 'large'::public.vehicle_size, true, 80),
  ('Van', 'Passenger and commercial vans.', 'xl'::public.vehicle_size, true, 90),
  ('Jeep', 'Large utility and jeep vehicles.', 'xl'::public.vehicle_size, true, 100),
  ('L300', 'L300 and comparable extra-large vans.', 'xl'::public.vehicle_size, true, 110)
on conflict (lower(name)) do update
set description = excluded.description,
    size_class = excluded.size_class,
    active = excluded.active,
    sort_order = excluded.sort_order;

insert into public.services (name, description, active, sort_order)
values
  (
    'Basic Wash',
    'Foam Wash; Vacuum; Tire Black; Interior Dust-Off. Armor All + PHP 50: PENDING CLIENT CONFIRMATION.',
    true,
    10
  ),
  (
    'Premium Wash w/ Hand Wax',
    'Foam Wash; Vacuum; Tire Black; Armor All; Interior Dust-Off; Hand Wax.',
    true,
    20
  ),
  ('Buffing Wax w/o Wash', null, true, 30),
  ('Back to Zero with Carwash', 'Standalone bundled service.', true, 40),
  ('Engine Wash w/ Carwash', 'Standalone bundled service.', true, 50),
  ('Engine Wash + Carwash & Detailing', 'Standalone bundled service.', true, 60),
  ('Glass Detailing & Carwash', 'Standalone bundled service.', true, 70),
  ('Watermark Removal with Carwash', 'Standalone bundled service.', true, 80)
on conflict (lower(name)) do update
set description = excluded.description,
    active = excluded.active,
    sort_order = excluded.sort_order;

-- Retain old example services for history and future admin use, but keep them
-- out of the initial customer menu until they have an approved business role.
update public.services
set active = false
where lower(name) in ('interior vacuum', 'wax', 'tire shine');

with price_seed(service_name, size_class, price) as (
  values
    ('Basic Wash', 'motor', 150.00::numeric),
    ('Basic Wash', 'big_bike', 200.00::numeric),
    ('Basic Wash', 'small', 170.00::numeric),
    ('Basic Wash', 'medium', 190.00::numeric),
    ('Basic Wash', 'large', 220.00::numeric),
    ('Basic Wash', 'xl', 250.00::numeric),
    ('Premium Wash w/ Hand Wax', 'motor', 270.00::numeric),
    ('Premium Wash w/ Hand Wax', 'big_bike', 300.00::numeric),
    ('Premium Wash w/ Hand Wax', 'small', 380.00::numeric),
    ('Premium Wash w/ Hand Wax', 'medium', 420.00::numeric),
    ('Premium Wash w/ Hand Wax', 'large', 480.00::numeric),
    ('Premium Wash w/ Hand Wax', 'xl', 500.00::numeric),
    ('Buffing Wax w/o Wash', 'small', 500.00::numeric),
    ('Buffing Wax w/o Wash', 'medium', 800.00::numeric),
    ('Buffing Wax w/o Wash', 'large', 1000.00::numeric),
    ('Buffing Wax w/o Wash', 'xl', 1500.00::numeric),
    ('Back to Zero with Carwash', 'small', 500.00::numeric),
    ('Back to Zero with Carwash', 'medium', 800.00::numeric),
    ('Back to Zero with Carwash', 'large', 1000.00::numeric),
    ('Back to Zero with Carwash', 'xl', 1500.00::numeric),
    ('Engine Wash w/ Carwash', 'small', 800.00::numeric),
    ('Engine Wash w/ Carwash', 'medium', 900.00::numeric),
    ('Engine Wash w/ Carwash', 'large', 1000.00::numeric),
    ('Engine Wash w/ Carwash', 'xl', 1000.00::numeric),
    ('Engine Wash + Carwash & Detailing', 'small', 1600.00::numeric),
    ('Engine Wash + Carwash & Detailing', 'medium', 1800.00::numeric),
    ('Engine Wash + Carwash & Detailing', 'large', 2000.00::numeric),
    ('Engine Wash + Carwash & Detailing', 'xl', 2250.00::numeric),
    ('Glass Detailing & Carwash', 'small', 2800.00::numeric),
    ('Glass Detailing & Carwash', 'medium', 3300.00::numeric),
    ('Glass Detailing & Carwash', 'large', 3300.00::numeric),
    ('Glass Detailing & Carwash', 'xl', 4000.00::numeric),
    ('Watermark Removal with Carwash', 'small', 1000.00::numeric),
    ('Watermark Removal with Carwash', 'medium', 1400.00::numeric),
    ('Watermark Removal with Carwash', 'large', 1800.00::numeric),
    ('Watermark Removal with Carwash', 'xl', 1800.00::numeric)
)
insert into public.service_prices (service_id, size_class, price, active)
select
  service.id,
  price_seed.size_class::public.vehicle_size,
  price_seed.price,
  true
from price_seed
join public.services as service
  on lower(service.name) = lower(price_seed.service_name)
on conflict (service_id, size_class) do update
set price = excluded.price,
    active = excluded.active;

-- No Motor or Big Bike prices are assumed for the services that do not have
-- those menu values. Existing rows, if any, remain editable but inactive.
update public.service_prices as price
set active = false
from public.services as service
where price.service_id = service.id
  and lower(service.name) in (
    'buffing wax w/o wash',
    'back to zero with carwash',
    'engine wash w/ carwash',
    'engine wash + carwash & detailing',
    'glass detailing & carwash',
    'watermark removal with carwash'
  )
  and price.size_class in ('motor'::public.vehicle_size, 'big_bike'::public.vehicle_size);

-- Service recipes intentionally remain empty until the client confirms actual
-- consumable quantities. No inventory usage is invented or seeded here.
