-- Phase 5: public customer check-in submissions and controlled public catalog access.

create type public.transaction_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create sequence public.customer_check_in_number_seq
  as bigint
  start with 1
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  mobile_number text not null,
  mobile_number_normalized text not null,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customers_first_name_valid check (char_length(btrim(first_name)) between 1 and 80),
  constraint customers_last_name_valid check (char_length(btrim(last_name)) between 1 and 80),
  constraint customers_mobile_number_valid check (char_length(btrim(mobile_number)) between 7 and 32),
  constraint customers_mobile_number_normalized_valid check (mobile_number_normalized ~ '^09[0-9]{9}$'),
  constraint customers_email_valid check (
    email is null
    or (
      char_length(btrim(email)) between 3 and 254
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    )
  )
);

create table public.customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  vehicle_category_id uuid not null references public.vehicle_categories (id) on delete restrict,
  plate_number text,
  plate_number_normalized text,
  make text,
  model text,
  color text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_vehicles_plate_number_valid check (plate_number is null or char_length(btrim(plate_number)) between 1 and 32),
  constraint customer_vehicles_plate_number_normalized_valid check (
    plate_number_normalized is null or plate_number_normalized ~ '^[A-Z0-9]{1,32}$'
  ),
  constraint customer_vehicles_make_valid check (make is null or char_length(btrim(make)) between 1 and 80),
  constraint customer_vehicles_model_valid check (model is null or char_length(btrim(model)) between 1 and 80),
  constraint customer_vehicles_color_valid check (color is null or char_length(btrim(color)) between 1 and 50)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  idempotency_key uuid not null unique,
  customer_id uuid not null references public.customers (id) on delete restrict,
  vehicle_id uuid not null references public.customer_vehicles (id) on delete restrict,
  customer_name_snapshot text not null,
  vehicle_category_name_snapshot text not null,
  plate_number_snapshot text,
  make_snapshot text,
  model_snapshot text,
  color_snapshot text,
  status public.transaction_status not null default 'pending'::public.transaction_status,
  service_subtotal numeric(14, 2) not null default 0,
  product_subtotal numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint transactions_number_valid check (transaction_number ~ '^CW-[0-9]{8}-[0-9]+$'),
  constraint transactions_customer_name_snapshot_valid check (char_length(btrim(customer_name_snapshot)) between 1 and 161),
  constraint transactions_vehicle_category_name_snapshot_valid check (char_length(btrim(vehicle_category_name_snapshot)) between 1 and 80),
  constraint transactions_vehicle_snapshot_lengths_valid check (
    (plate_number_snapshot is null or char_length(btrim(plate_number_snapshot)) between 1 and 32)
    and (make_snapshot is null or char_length(btrim(make_snapshot)) between 1 and 80)
    and (model_snapshot is null or char_length(btrim(model_snapshot)) between 1 and 80)
    and (color_snapshot is null or char_length(btrim(color_snapshot)) between 1 and 50)
  ),
  constraint transactions_subtotals_valid check (
    service_subtotal >= 0
    and product_subtotal >= 0
    and total >= 0
    and service_subtotal < 1000000000000
    and product_subtotal < 1000000000000
    and total < 1000000000000
  ),
  constraint transactions_total_matches_subtotals check (total = service_subtotal + product_subtotal)
);

create table public.transaction_services (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  service_name_snapshot text not null,
  size_class_snapshot public.vehicle_size not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null default 1,
  line_total numeric(14, 2) not null,
  line_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint transaction_services_name_valid check (char_length(btrim(service_name_snapshot)) between 1 and 120),
  constraint transaction_services_unit_price_valid check (unit_price >= 0 and unit_price < 10000000000),
  constraint transaction_services_quantity_valid check (quantity > 0 and quantity <= 99),
  constraint transaction_services_line_total_valid check (
    line_total >= 0
    and line_total = round(unit_price * quantity, 2)
  ),
  constraint transaction_services_line_order_valid check (line_order between 0 and 999)
);

create table public.transaction_products (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  product_name_snapshot text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  line_total numeric(14, 2) not null,
  line_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint transaction_products_name_valid check (char_length(btrim(product_name_snapshot)) between 1 and 120),
  constraint transaction_products_unit_price_valid check (unit_price >= 0 and unit_price < 10000000000),
  constraint transaction_products_quantity_valid check (quantity > 0 and quantity <= 99),
  constraint transaction_products_line_total_valid check (
    line_total >= 0
    and line_total = round(unit_price * quantity, 2)
  ),
  constraint transaction_products_line_order_valid check (line_order between 0 and 999)
);

comment on table public.customers is 'Public check-in customer records without Supabase Auth accounts.';
comment on column public.customers.mobile_number_normalized is 'Canonical Philippine mobile number used for private submission-time deduplication; it is not publicly searchable.';
comment on table public.customer_vehicles is 'Vehicles associated with customer records from public check-ins.';
comment on table public.transactions is 'Customer check-in submissions and their authoritative server-calculated totals.';
comment on column public.transactions.idempotency_key is 'One-time submission-session key used only to make retries return the original submission.';
comment on column public.transactions.customer_name_snapshot is 'Customer name shown for this submission; retained so retry results do not depend on mutable customer data.';
comment on column public.transactions.vehicle_category_name_snapshot is 'Vehicle category shown for this submission; retained so retry results do not depend on mutable catalog data.';
comment on table public.transaction_services is 'Immutable service snapshots belonging to a customer submission.';
comment on table public.transaction_products is 'Immutable shop product snapshots belonging to a customer submission.';

create index customers_mobile_number_normalized_idx
  on public.customers (mobile_number_normalized);

create index customers_created_at_idx
  on public.customers (created_at desc);

create index customer_vehicles_customer_id_idx
  on public.customer_vehicles (customer_id, created_at desc);

create index customer_vehicles_plate_number_normalized_idx
  on public.customer_vehicles (customer_id, plate_number_normalized)
  where plate_number_normalized is not null;

create index transactions_status_created_at_idx
  on public.transactions (status, created_at desc);

create index transactions_customer_id_created_at_idx
  on public.transactions (customer_id, created_at desc);

create index transactions_vehicle_id_idx
  on public.transactions (vehicle_id);

create index transaction_services_transaction_id_idx
  on public.transaction_services (transaction_id, line_order, created_at);

create index transaction_services_service_id_idx
  on public.transaction_services (service_id);

create index transaction_products_transaction_id_idx
  on public.transaction_products (transaction_id, line_order, created_at);

create index transaction_products_inventory_item_id_idx
  on public.transaction_products (inventory_item_id);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger customer_vehicles_set_updated_at
  before update on public.customer_vehicles
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create or replace function public.normalize_public_mobile(p_mobile text)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  digits text;
begin
  digits = regexp_replace(btrim(coalesce(p_mobile, '')), '[^0-9]', '', 'g');

  if char_length(digits) = 12 and left(digits, 2) = '63' then
    digits = '0' || substring(digits from 3);
  elsif char_length(digits) = 10 and left(digits, 1) = '9' then
    digits = '0' || digits;
  end if;

  if digits !~ '^09[0-9]{9}$' then
    raise exception using
      errcode = '22023',
      message = 'Enter a valid Philippine mobile number.';
  end if;

  return digits;
end;
$$;

create or replace function public.normalize_public_plate(p_plate text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select nullif(regexp_replace(upper(btrim(coalesce(p_plate, ''))), '[^A-Z0-9]', '', 'g'), '');
$$;

-- This is the only public catalog read path. It returns no stock, recipes,
-- operator-facing descriptions, inactive records, or size-class labels.
create or replace function public.get_public_check_in_catalog()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'vehicleCategories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', category.id,
          'name', category.name
        )
        order by category.sort_order, category.name
      )
      from public.vehicle_categories as category
      where category.active = true
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', service.id,
          'name', service.name,
          'description', service.description
        )
        order by service.sort_order, service.name
      )
      from public.services as service
      where service.active = true
    ), '[]'::jsonb),
    'servicePrices', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'serviceId', price.service_id,
          'vehicleCategoryId', category.id,
          'price', price.price
        )
        order by category.sort_order, service.sort_order, service.name
      )
      from public.service_prices as price
      join public.services as service
        on service.id = price.service_id
       and service.active = true
      join public.vehicle_categories as category
        on category.size_class = price.size_class
       and category.active = true
      where price.active = true
    ), '[]'::jsonb),
    'shopProducts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', item.id,
          'name', item.name,
          'sellingPrice', item.selling_price
        )
        order by item.sort_order, item.name
      )
      from public.inventory_items as item
      where item.item_type = 'shop_product'::public.inventory_item_type
        and item.active = true
        and item.selling_price is not null
    ), '[]'::jsonb)
  );
$$;

create or replace function public.build_public_check_in_result(p_transaction_id uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'transactionNumber', transaction.transaction_number,
    'customerName', transaction.customer_name_snapshot,
    'vehicleCategoryName', transaction.vehicle_category_name_snapshot,
    'vehicleDetails', jsonb_build_object(
      'plateNumber', transaction.plate_number_snapshot,
      'make', transaction.make_snapshot,
      'model', transaction.model_snapshot,
      'color', transaction.color_snapshot
    ),
    'serviceSubtotal', transaction.service_subtotal,
    'productSubtotal', transaction.product_subtotal,
    'total', transaction.total,
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', line.service_name_snapshot,
          'unitPrice', line.unit_price,
          'quantity', line.quantity,
          'lineTotal', line.line_total
        )
        order by line.line_order, line.created_at, line.id
      )
      from public.transaction_services as line
      where line.transaction_id = transaction.id
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', line.product_name_snapshot,
          'unitPrice', line.unit_price,
          'quantity', line.quantity,
          'lineTotal', line.line_total
        )
        order by line.line_order, line.created_at, line.id
      )
      from public.transaction_products as line
      where line.transaction_id = transaction.id
    ), '[]'::jsonb)
  )
  from public.transactions as transaction
  where transaction.id = p_transaction_id;
$$;

-- This function validates and writes the entire submission in one database
-- transaction. It intentionally never reads or changes inventory stock.
create or replace function public.submit_public_check_in(
  p_idempotency_key uuid,
  p_first_name text,
  p_last_name text,
  p_mobile_number text,
  p_email text default null,
  p_vehicle_category_id uuid default null,
  p_plate_number text default null,
  p_make text default null,
  p_model text default null,
  p_color text default null,
  p_service_ids uuid[] default null,
  p_product_lines jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_category public.vehicle_categories%rowtype;
  selected_customer public.customers%rowtype;
  selected_vehicle public.customer_vehicles%rowtype;
  selected_service record;
  selected_product record;
  product_input jsonb;
  existing_transaction_id uuid;
  transaction_row public.transactions%rowtype;
  vehicle_found boolean := false;
  service_count integer := 0;
  product_count integer := 0;
  service_subtotal numeric := 0;
  product_subtotal numeric := 0;
  product_ids uuid[] := '{}'::uuid[];
  product_id uuid;
  product_quantity numeric;
  product_quantity_integer integer;
  product_line_order integer := 0;
  first_name_value text;
  last_name_value text;
  mobile_display_value text;
  mobile_normalized_value text;
  email_value text;
  plate_value text;
  plate_normalized_value text;
  make_value text;
  model_value text;
  color_value text;
begin
  if p_idempotency_key is null then
    raise exception using
      errcode = '22023',
      message = 'A submission key is required.';
  end if;

  -- Serialize retries with the same key before checking the unique column.
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select id
    into existing_transaction_id
  from public.transactions
  where idempotency_key = p_idempotency_key;

  if found then
    return public.build_public_check_in_result(existing_transaction_id);
  end if;

  first_name_value = btrim(coalesce(p_first_name, ''));
  last_name_value = btrim(coalesce(p_last_name, ''));
  mobile_display_value = btrim(coalesce(p_mobile_number, ''));
  email_value = nullif(lower(btrim(coalesce(p_email, ''))), '');

  if char_length(first_name_value) not between 1 and 80
    or char_length(last_name_value) not between 1 and 80 then
    raise exception using
      errcode = '22023',
      message = 'First and last name are required.';
  end if;

  if char_length(mobile_display_value) not between 7 and 32 then
    raise exception using
      errcode = '22023',
      message = 'Enter a valid mobile number.';
  end if;

  mobile_normalized_value = public.normalize_public_mobile(mobile_display_value);

  if email_value is not null
    and (
      char_length(email_value) not between 3 and 254
      or email_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    ) then
    raise exception using
      errcode = '22023',
      message = 'Enter a valid email address or leave it blank.';
  end if;

  plate_value = nullif(btrim(coalesce(p_plate_number, '')), '');
  make_value = nullif(btrim(coalesce(p_make, '')), '');
  model_value = nullif(btrim(coalesce(p_model, '')), '');
  color_value = nullif(btrim(coalesce(p_color, '')), '');

  if plate_value is not null and char_length(plate_value) > 32
    or make_value is not null and char_length(make_value) > 80
    or model_value is not null and char_length(model_value) > 80
    or color_value is not null and char_length(color_value) > 50 then
    raise exception using
      errcode = '22023',
      message = 'One or more vehicle details are too long.';
  end if;

  plate_normalized_value = public.normalize_public_plate(plate_value);

  if plate_value is not null and plate_normalized_value is null then
    raise exception using
      errcode = '22023',
      message = 'Enter a valid plate number or leave it blank.';
  end if;

  if p_vehicle_category_id is null then
    raise exception using
      errcode = '22023',
      message = 'Select a vehicle category.';
  end if;

  select *
    into selected_category
  from public.vehicle_categories
  where id = p_vehicle_category_id
    and active = true
  for share;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'The selected vehicle category is no longer available.';
  end if;

  if coalesce(cardinality(p_service_ids), 0) < 1
    or cardinality(p_service_ids) > 20 then
    raise exception using
      errcode = '22023',
      message = 'Select at least one service.';
  end if;

  if exists (select 1 from unnest(p_service_ids) as selected_id where selected_id is null)
    or (
      select count(*) from unnest(p_service_ids) as selected_id
    ) <> (
      select count(distinct selected_id) from unnest(p_service_ids) as selected_id
    ) then
    raise exception using
      errcode = '22023',
      message = 'A service may only be selected once.';
  end if;

  for selected_service in
    select service.id, service.name, price.price
    from public.services as service
    join public.service_prices as price
      on price.service_id = service.id
     and price.size_class = selected_category.size_class
     and price.active = true
    where service.id = any(p_service_ids)
      and service.active = true
    order by array_position(p_service_ids, service.id)
    for share
  loop
    service_count = service_count + 1;
    service_subtotal = service_subtotal + selected_service.price;
  end loop;

  if service_count <> cardinality(p_service_ids) then
    raise exception using
      errcode = '22023',
      message = 'One or more selected services are no longer available at the selected vehicle price.';
  end if;

  if jsonb_typeof(coalesce(p_product_lines, '[]'::jsonb)) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'Product selections are invalid.';
  end if;

  for product_input in
    select value
    from jsonb_array_elements(coalesce(p_product_lines, '[]'::jsonb)) as product_value(value)
  loop
    product_count = product_count + 1;

    if product_count > 20 or jsonb_typeof(product_input) <> 'object'
      or not (product_input ? 'inventoryItemId')
      or not (product_input ? 'quantity')
      or jsonb_typeof(product_input -> 'inventoryItemId') <> 'string'
      or jsonb_typeof(product_input -> 'quantity') <> 'number' then
      raise exception using
        errcode = '22023',
        message = 'Product selections are invalid.';
    end if;

    begin
      product_id = (product_input ->> 'inventoryItemId')::uuid;
      product_quantity = (product_input ->> 'quantity')::numeric;
    exception
      when invalid_text_representation or numeric_value_out_of_range then
        raise exception using
          errcode = '22023',
          message = 'Product selections are invalid.';
    end;

    if product_id is null
      or product_quantity is null
      or product_quantity <= 0
      or product_quantity > 99
      or product_quantity <> trunc(product_quantity)
      or product_quantity::text = 'NaN' then
      raise exception using
        errcode = '22023',
        message = 'Product quantities must be whole numbers from 1 to 99.';
    end if;

    product_quantity_integer = product_quantity::integer;

    if product_id = any(product_ids) then
      raise exception using
        errcode = '22023',
        message = 'A shop product may only be selected once.';
    end if;

    select item.id, item.name, item.selling_price
      into selected_product
    from public.inventory_items as item
    where item.id = product_id
      and item.item_type = 'shop_product'::public.inventory_item_type
      and item.active = true
      and item.selling_price is not null
    for share;

    if not found then
      raise exception using
        errcode = '22023',
        message = 'One or more selected shop products are no longer available.';
    end if;

    product_ids = array_append(product_ids, product_id);
    product_subtotal = product_subtotal + round(selected_product.selling_price * product_quantity_integer, 2);
  end loop;

  if service_subtotal >= 1000000000000
    or product_subtotal >= 1000000000000
    or service_subtotal + product_subtotal >= 1000000000000 then
    raise exception using
      errcode = '22023',
      message = 'The estimated total is too large to submit.';
  end if;

  -- Serialize matching submissions for the same normalized mobile without
  -- making mobile numbers globally unique.
  perform pg_advisory_xact_lock(hashtextextended(mobile_normalized_value, 0));

  select *
    into selected_customer
  from public.customers
  where mobile_number_normalized = mobile_normalized_value
  order by created_at, id
  limit 1
  for update;

  if found then
    -- A public form cannot prove ownership of a mobile number. Keep the
    -- canonical customer record unchanged and use the submitted details only
    -- in this transaction's display snapshot.
    null;
  else
    insert into public.customers (
      first_name,
      last_name,
      mobile_number,
      mobile_number_normalized,
      email
    )
    values (
      first_name_value,
      last_name_value,
      mobile_display_value,
      mobile_normalized_value,
      email_value
    )
    returning * into selected_customer;
  end if;

  if plate_normalized_value is not null then
    select *
      into selected_vehicle
    from public.customer_vehicles
    where customer_id = selected_customer.id
      and plate_number_normalized = plate_normalized_value
      and vehicle_category_id = selected_category.id
      and coalesce(make, '') = coalesce(make_value, '')
      and coalesce(model, '') = coalesce(model_value, '')
      and coalesce(color, '') = coalesce(color_value, '')
    order by created_at, id
    limit 1
    for update;
    vehicle_found = found;
  end if;

  if vehicle_found then
    -- Reuse only an exact match. Do not let an unauthenticated submission
    -- overwrite a vehicle saved by another visit.
    null;
  else
    insert into public.customer_vehicles (
      customer_id,
      vehicle_category_id,
      plate_number,
      plate_number_normalized,
      make,
      model,
      color
    )
    values (
      selected_customer.id,
      selected_category.id,
      plate_value,
      plate_normalized_value,
      make_value,
      model_value,
      color_value
    )
    returning * into selected_vehicle;
  end if;

  insert into public.transactions (
    transaction_number,
    idempotency_key,
    customer_id,
    vehicle_id,
    customer_name_snapshot,
    vehicle_category_name_snapshot,
    plate_number_snapshot,
    make_snapshot,
    model_snapshot,
    color_snapshot,
    status,
    service_subtotal,
    product_subtotal,
    total
  )
  values (
    'CW-' || to_char(timezone('Asia/Manila', now()), 'YYYYMMDD') || '-' || lpad(nextval('public.customer_check_in_number_seq')::text, 4, '0'),
    p_idempotency_key,
    selected_customer.id,
    selected_vehicle.id,
    concat_ws(' ', first_name_value, last_name_value),
    selected_category.name,
    plate_value,
    make_value,
    model_value,
    color_value,
    'pending'::public.transaction_status,
    service_subtotal,
    product_subtotal,
    service_subtotal + product_subtotal
  )
  returning * into transaction_row;

  for selected_service in
    select service.id, service.name, price.price, array_position(p_service_ids, service.id) - 1 as line_order
    from public.services as service
    join public.service_prices as price
      on price.service_id = service.id
     and price.size_class = selected_category.size_class
     and price.active = true
    where service.id = any(p_service_ids)
      and service.active = true
    order by array_position(p_service_ids, service.id)
  loop
    insert into public.transaction_services (
      transaction_id,
      service_id,
      service_name_snapshot,
      size_class_snapshot,
      unit_price,
      quantity,
      line_total,
      line_order
    )
    values (
      transaction_row.id,
      selected_service.id,
      selected_service.name,
      selected_category.size_class,
      selected_service.price,
      1,
      selected_service.price,
      selected_service.line_order
    );
  end loop;

  for product_input in
    select value
    from jsonb_array_elements(coalesce(p_product_lines, '[]'::jsonb)) as product_value(value)
  loop
    product_line_order = product_line_order + 1;
    product_id = (product_input ->> 'inventoryItemId')::uuid;
    product_quantity = (product_input ->> 'quantity')::numeric;
    product_quantity_integer = product_quantity::integer;

    select item.id, item.name, item.selling_price
      into selected_product
    from public.inventory_items as item
    where item.id = product_id
      and item.item_type = 'shop_product'::public.inventory_item_type
      and item.active = true
      and item.selling_price is not null
    for share;

    insert into public.transaction_products (
      transaction_id,
      inventory_item_id,
      product_name_snapshot,
      unit_price,
      quantity,
      line_total,
      line_order
    )
    values (
      transaction_row.id,
      selected_product.id,
      selected_product.name,
      selected_product.selling_price,
      product_quantity_integer,
      round(selected_product.selling_price * product_quantity_integer, 2),
      product_line_order - 1
    );
  end loop;

  return public.build_public_check_in_result(transaction_row.id);
end;
$$;

revoke all on sequence public.customer_check_in_number_seq from public, anon, authenticated;

revoke all on function public.normalize_public_mobile(text) from public;
revoke all on function public.normalize_public_plate(text) from public;
revoke all on function public.get_public_check_in_catalog() from public;
revoke all on function public.build_public_check_in_result(uuid) from public;
revoke all on function public.submit_public_check_in(uuid, text, text, text, text, uuid, text, text, text, text, uuid[], jsonb) from public;

grant execute on function public.get_public_check_in_catalog() to anon, authenticated;
grant execute on function public.submit_public_check_in(uuid, text, text, text, text, uuid, text, text, text, text, uuid[], jsonb) to anon, authenticated;

alter table public.customers enable row level security;
alter table public.customer_vehicles enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_services enable row level security;
alter table public.transaction_products enable row level security;

revoke all on table public.customers, public.customer_vehicles, public.transactions, public.transaction_services, public.transaction_products from PUBLIC, anon, authenticated;
grant select on table public.customers, public.customer_vehicles, public.transactions, public.transaction_services, public.transaction_products to authenticated;
grant usage on type public.transaction_status to authenticated;

create policy "Active admins can read customers"
  on public.customers
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can read customer vehicles"
  on public.customer_vehicles
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can read transactions"
  on public.transactions
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can read transaction services"
  on public.transaction_services
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can read transaction products"
  on public.transaction_products
  for select
  to authenticated
  using ((select public.is_active_admin()));
