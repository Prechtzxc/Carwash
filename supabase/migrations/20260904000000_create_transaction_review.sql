-- Phase 6: protected admin review, revision, confirmation, and cancellation.

alter table public.transactions
  add column confirmed_at timestamptz,
  add column cancelled_at timestamptz,
  add column cancellation_reason text;

alter table public.transactions
  add constraint transactions_cancellation_reason_length
    check (cancellation_reason is null or char_length(btrim(cancellation_reason)) <= 500),
  add constraint transactions_confirmed_at_valid
    check (confirmed_at is null or confirmed_at >= created_at),
  add constraint transactions_cancelled_at_valid
    check (cancelled_at is null or cancelled_at >= created_at);

comment on column public.transactions.confirmed_at is 'Timestamp when an active admin accepted a pending customer request.';
comment on column public.transactions.cancelled_at is 'Timestamp when an active admin cancelled a pending or confirmed request.';
comment on column public.transactions.cancellation_reason is 'Optional internal reason for cancellation.';

create index transactions_confirmed_at_idx
  on public.transactions (confirmed_at desc)
  where confirmed_at is not null;

create index transactions_cancelled_at_idx
  on public.transactions (cancelled_at desc)
  where cancelled_at is not null;

-- Status changes are intentionally narrower than the full future lifecycle. The
-- Phase 7 migration can replace this function when confirmed -> completed is
-- introduced.
create or replace function public.enforce_transaction_status_transition()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'pending'::public.transaction_status
      and new.status in (
        'confirmed'::public.transaction_status,
        'cancelled'::public.transaction_status
      ) then
      null;
    elsif old.status = 'confirmed'::public.transaction_status
      and new.status = 'cancelled'::public.transaction_status then
      null;
    else
      raise exception using
        errcode = '22023',
        message = 'That transaction status transition is not allowed.';
    end if;
  end if;

  if old.status is distinct from new.status
    and new.status = 'confirmed'::public.transaction_status then
    new.confirmed_at = coalesce(new.confirmed_at, timezone('utc', now()));
    new.cancelled_at = null;
    new.cancellation_reason = null;
  elsif old.status is distinct from new.status
    and new.status = 'cancelled'::public.transaction_status then
    new.cancelled_at = coalesce(new.cancelled_at, timezone('utc', now()));
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_transaction_status_transition() from public;

drop trigger if exists transactions_status_transition_guard on public.transactions;
create trigger transactions_status_transition_guard
  before update of status on public.transactions
  for each row execute function public.enforce_transaction_status_transition();

-- Recalculate and replace all mutable snapshots for a pending transaction in a
-- single database transaction. This function never reads or changes stock.
create or replace function public.revise_pending_transaction(
  p_transaction_id uuid,
  p_first_name text,
  p_last_name text,
  p_mobile_number text,
  p_email text,
  p_vehicle_category_id uuid,
  p_plate_number text,
  p_make text,
  p_model text,
  p_color text,
  p_service_ids uuid[],
  p_product_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_transaction public.transactions%rowtype;
  selected_customer public.customers%rowtype;
  selected_vehicle public.customer_vehicles%rowtype;
  selected_category public.vehicle_categories%rowtype;
  selected_service record;
  selected_product record;
  product_input jsonb;
  service_count integer := 0;
  product_count integer := 0;
  product_line_order integer := 0;
  service_subtotal_value numeric := 0;
  product_subtotal_value numeric := 0;
  product_ids uuid[] := '{}'::uuid[];
  product_id uuid;
  product_quantity numeric;
  product_quantity_integer integer;
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
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can revise transactions.';
  end if;

  if p_transaction_id is null then
    raise exception using
      errcode = '22023',
      message = 'A transaction is required.';
  end if;

  select *
    into selected_transaction
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'That transaction no longer exists.';
  end if;

  if selected_transaction.status <> 'pending'::public.transaction_status then
    raise exception using
      errcode = '22023',
      message = 'Only pending transactions can be edited.';
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

  if (plate_value is not null and char_length(plate_value) > 32)
    or (make_value is not null and char_length(make_value) > 80)
    or (model_value is not null and char_length(model_value) > 80)
    or (color_value is not null and char_length(color_value) > 50) then
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
    service_subtotal_value = service_subtotal_value + selected_service.price;
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
    product_subtotal_value = product_subtotal_value + round(selected_product.selling_price * product_quantity_integer, 2);
  end loop;

  if service_subtotal_value >= 1000000000000
    or product_subtotal_value >= 1000000000000
    or service_subtotal_value + product_subtotal_value >= 1000000000000 then
    raise exception using
      errcode = '22023',
      message = 'The estimated total is too large to submit.';
  end if;

  select *
    into selected_customer
  from public.customers
  where id = selected_transaction.customer_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'The customer record no longer exists.';
  end if;

  select *
    into selected_vehicle
  from public.customer_vehicles
  where id = selected_transaction.vehicle_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'The vehicle record no longer exists.';
  end if;

  update public.customers
  set first_name = first_name_value,
      last_name = last_name_value,
      mobile_number = mobile_display_value,
      mobile_number_normalized = mobile_normalized_value,
      email = email_value
  where id = selected_customer.id;

  update public.customer_vehicles
  set vehicle_category_id = selected_category.id,
      plate_number = plate_value,
      plate_number_normalized = plate_normalized_value,
      make = make_value,
      model = model_value,
      color = color_value
  where id = selected_vehicle.id;

  delete from public.transaction_services
  where transaction_id = selected_transaction.id;

  delete from public.transaction_products
  where transaction_id = selected_transaction.id;

  update public.transactions
  set customer_name_snapshot = concat_ws(' ', first_name_value, last_name_value),
      vehicle_category_name_snapshot = selected_category.name,
      plate_number_snapshot = plate_value,
      make_snapshot = make_value,
      model_snapshot = model_value,
      color_snapshot = color_value,
      service_subtotal = service_subtotal_value,
      product_subtotal = product_subtotal_value,
      total = service_subtotal_value + product_subtotal_value
  where id = selected_transaction.id;

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
      selected_transaction.id,
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
    product_quantity_integer = (product_input ->> 'quantity')::integer;

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
      selected_transaction.id,
      selected_product.id,
      selected_product.name,
      selected_product.selling_price,
      product_quantity_integer,
      round(selected_product.selling_price * product_quantity_integer, 2),
      product_line_order - 1
    );
  end loop;

  return jsonb_build_object(
    'transactionId', selected_transaction.id,
    'transactionNumber', selected_transaction.transaction_number
  );
end;
$$;

create or replace function public.confirm_pending_transaction(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_transaction public.transactions%rowtype;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can confirm transactions.';
  end if;

  select *
    into selected_transaction
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'That transaction no longer exists.';
  end if;

  if selected_transaction.status <> 'pending'::public.transaction_status then
    raise exception using
      errcode = '22023',
      message = 'Only pending transactions can be confirmed.';
  end if;

  update public.transactions
  set status = 'confirmed'::public.transaction_status
  where id = selected_transaction.id;

  select *
    into selected_transaction
  from public.transactions
  where id = selected_transaction.id;

  return jsonb_build_object(
    'transactionId', selected_transaction.id,
    'transactionNumber', selected_transaction.transaction_number,
    'status', selected_transaction.status,
    'confirmedAt', selected_transaction.confirmed_at
  );
end;
$$;

create or replace function public.cancel_transaction(
  p_transaction_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_transaction public.transactions%rowtype;
  reason_value text;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can cancel transactions.';
  end if;

  reason_value = nullif(btrim(coalesce(p_reason, '')), '');

  if reason_value is not null and char_length(reason_value) > 500 then
    raise exception using
      errcode = '22023',
      message = 'The cancellation reason must be 500 characters or fewer.';
  end if;

  select *
    into selected_transaction
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'That transaction no longer exists.';
  end if;

  if selected_transaction.status not in (
    'pending'::public.transaction_status,
    'confirmed'::public.transaction_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'Only pending or confirmed transactions can be cancelled.';
  end if;

  update public.transactions
  set status = 'cancelled'::public.transaction_status,
      cancellation_reason = reason_value
  where id = selected_transaction.id;

  select *
    into selected_transaction
  from public.transactions
  where id = selected_transaction.id;

  return jsonb_build_object(
    'transactionId', selected_transaction.id,
    'transactionNumber', selected_transaction.transaction_number,
    'status', selected_transaction.status,
    'cancelledAt', selected_transaction.cancelled_at
  );
end;
$$;

revoke all on function public.revise_pending_transaction(uuid, text, text, text, text, uuid, text, text, text, text, uuid[], jsonb) from public;
revoke all on function public.confirm_pending_transaction(uuid) from public;
revoke all on function public.cancel_transaction(uuid, text) from public;

grant execute on function public.revise_pending_transaction(uuid, text, text, text, text, uuid, text, text, text, text, uuid[], jsonb) to authenticated;
grant execute on function public.confirm_pending_transaction(uuid) to authenticated;
grant execute on function public.cancel_transaction(uuid, text) to authenticated;
