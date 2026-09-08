-- Phase 9: admin-only client directory, history, aggregates, and current-record edits.

create index customers_name_sort_idx
  on public.customers (lower(last_name), lower(first_name), id);

create index customer_vehicles_plate_search_idx
  on public.customer_vehicles (plate_number_normalized)
  where plate_number_normalized is not null;

create index transactions_customer_completed_at_idx
  on public.transactions (customer_id, completed_at desc)
  where status = 'completed'::public.transaction_status;

create or replace function public.get_admin_client_directory(
  p_search text default null,
  p_page integer default 1,
  p_page_size integer default 20,
  p_sort text default 'recent'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  search_value text;
  normalized_search text;
  safe_sort text;
  total_customers bigint;
  returning_customers bigint;
  total_matches bigint;
  total_pages integer;
  customer_rows jsonb;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can read the client directory.';
  end if;

  if p_page is null or p_page < 1 or p_page > 100000 then
    raise exception using
      errcode = '22023',
      message = 'The client directory page is invalid.';
  end if;

  if p_page_size is null or p_page_size not between 1 and 50 then
    raise exception using
      errcode = '22023',
      message = 'The client directory page size is invalid.';
  end if;

  search_value = nullif(btrim(coalesce(p_search, '')), '');

  if search_value is not null and char_length(search_value) > 100 then
    raise exception using
      errcode = '22023',
      message = 'The client search is too long.';
  end if;

  normalized_search = regexp_replace(upper(coalesce(search_value, '')), '[^A-Z0-9]', '', 'g');

  if normalized_search ~ '^63[0-9]{10}$' then
    normalized_search = '0' || substring(normalized_search from 3);
  elsif normalized_search ~ '^9[0-9]{9}$' then
    normalized_search = '0' || normalized_search;
  end if;
  safe_sort = case
    when p_sort in ('recent', 'name', 'visits', 'last_visit') then p_sort
    else 'recent'
  end;

  select count(*)
    into total_customers
  from public.customers;

  select count(*)
    into returning_customers
  from (
    select transaction.customer_id
    from public.transactions as transaction
    where transaction.status = 'completed'::public.transaction_status
    group by transaction.customer_id
    having count(*) >= 2
  ) as returning_rows;

  select count(*)
    into total_matches
  from public.customers as customer
  where search_value is null
    or lower(concat_ws(' ', customer.first_name, customer.last_name)) like '%' || lower(search_value) || '%'
    or lower(concat_ws(' ', customer.last_name, customer.first_name)) like '%' || lower(search_value) || '%'
    or customer.mobile_number ilike '%' || search_value || '%'
    or (
      normalized_search <> ''
      and customer.mobile_number_normalized like '%' || normalized_search || '%'
    )
    or exists (
      select 1
      from public.customer_vehicles as vehicle
      where vehicle.customer_id = customer.id
        and (
          vehicle.plate_number ilike '%' || search_value || '%'
          or (
            normalized_search <> ''
            and vehicle.plate_number_normalized like '%' || normalized_search || '%'
          )
        )
    );

  total_pages = case
    when total_matches = 0 then 0
    else ceil(total_matches::numeric / p_page_size)::integer
  end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', page_row.id,
        'customerName', page_row.customer_name,
        'mobileNumber', page_row.mobile_number,
        'email', page_row.email,
        'vehicleCount', page_row.vehicle_count,
        'completedVisits', page_row.completed_visits,
        'lastCompletedVisit', page_row.last_completed_visit,
        'totalTransactionAmount', page_row.total_transaction_amount,
        'createdAt', page_row.created_at
      )
      order by
        case when safe_sort = 'name' then lower(page_row.last_name) end asc nulls last,
        case when safe_sort = 'name' then lower(page_row.first_name) end asc nulls last,
        case when safe_sort = 'visits' then page_row.completed_visits end desc nulls last,
        case when safe_sort = 'last_visit' then page_row.last_completed_visit end desc nulls last,
        case when safe_sort = 'recent' then page_row.latest_activity end desc nulls last,
        page_row.latest_activity desc nulls last,
        lower(page_row.last_name),
        lower(page_row.first_name),
        page_row.id
    ),
    '[]'::jsonb
  )
  into customer_rows
  from (
    select
      customer.id,
      customer.first_name,
      customer.last_name,
      concat_ws(' ', customer.first_name, customer.last_name) as customer_name,
      customer.mobile_number,
      customer.email,
      customer.created_at,
      (
        select count(*)::integer
        from public.customer_vehicles as vehicle
        where vehicle.customer_id = customer.id
      ) as vehicle_count,
      (
        select count(*)::integer
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ) as completed_visits,
      (
        select max(transaction.completed_at)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ) as last_completed_visit,
      coalesce((
        select sum(transaction.total)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ), 0) as total_transaction_amount,
      coalesce((
        select max(transaction.completed_at)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ), customer.created_at) as latest_activity
    from public.customers as customer
    where search_value is null
      or lower(concat_ws(' ', customer.first_name, customer.last_name)) like '%' || lower(search_value) || '%'
      or lower(concat_ws(' ', customer.last_name, customer.first_name)) like '%' || lower(search_value) || '%'
      or customer.mobile_number ilike '%' || search_value || '%'
      or (
        normalized_search <> ''
        and customer.mobile_number_normalized like '%' || normalized_search || '%'
      )
      or exists (
        select 1
        from public.customer_vehicles as vehicle
        where vehicle.customer_id = customer.id
          and (
            vehicle.plate_number ilike '%' || search_value || '%'
            or (
              normalized_search <> ''
              and vehicle.plate_number_normalized like '%' || normalized_search || '%'
            )
          )
      )
    order by
      case when safe_sort = 'name' then lower(customer.last_name) end asc nulls last,
      case when safe_sort = 'name' then lower(customer.first_name) end asc nulls last,
      case when safe_sort = 'visits' then (
        select count(*)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ) end desc nulls last,
      case when safe_sort = 'last_visit' then (
        select max(transaction.completed_at)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ) end desc nulls last,
      case when safe_sort = 'recent' then coalesce((
        select max(transaction.completed_at)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ), customer.created_at) end desc nulls last,
      coalesce((
        select max(transaction.completed_at)
        from public.transactions as transaction
        where transaction.customer_id = customer.id
          and transaction.status = 'completed'::public.transaction_status
      ), customer.created_at) desc nulls last,
      lower(customer.last_name),
      lower(customer.first_name),
      customer.id
    limit p_page_size
    offset ((p_page - 1) * p_page_size)
  ) as page_row;

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'totalCustomers', total_customers,
      'returningCustomers', returning_customers
    ),
    'pagination', jsonb_build_object(
      'page', p_page,
      'pageSize', p_page_size,
      'totalMatches', total_matches,
      'totalPages', total_pages
    ),
    'customers', customer_rows
  );
end;
$$;

create or replace function public.get_admin_client_detail(
  p_customer_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  selected_customer public.customers%rowtype;
  completed_visits bigint;
  last_completed_visit timestamptz;
  total_transaction_amount numeric;
  vehicle_rows jsonb;
  transaction_rows jsonb;
  vehicle_categories jsonb;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can read customer details.';
  end if;

  if p_customer_id is null then
    raise exception using
      errcode = '22023',
      message = 'A customer is required.';
  end if;

  select *
    into selected_customer
  from public.customers
  where id = p_customer_id;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'That customer no longer exists.';
  end if;

  select
    count(*),
    max(transaction.completed_at),
    coalesce(sum(transaction.total), 0)
  into completed_visits, last_completed_visit, total_transaction_amount
  from public.transactions as transaction
  where transaction.customer_id = selected_customer.id
    and transaction.status = 'completed'::public.transaction_status;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', vehicle.id,
        'vehicleCategoryId', vehicle.vehicle_category_id,
        'vehicleCategoryName', category.name,
        'vehicleCategoryActive', category.active,
        'plateNumber', vehicle.plate_number,
        'make', vehicle.make,
        'model', vehicle.model,
        'color', vehicle.color,
        'createdAt', vehicle.created_at,
        'completedVisits', (
          select count(*)
          from public.transactions as transaction
          where transaction.vehicle_id = vehicle.id
            and transaction.status = 'completed'::public.transaction_status
        ),
        'lastCompletedVisit', (
          select max(transaction.completed_at)
          from public.transactions as transaction
          where transaction.vehicle_id = vehicle.id
            and transaction.status = 'completed'::public.transaction_status
        )
      )
      order by vehicle.created_at desc, vehicle.id desc
    ),
    '[]'::jsonb
  )
  into vehicle_rows
  from public.customer_vehicles as vehicle
  join public.vehicle_categories as category
    on category.id = vehicle.vehicle_category_id
  where vehicle.customer_id = selected_customer.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', transaction.id,
        'transactionNumber', transaction.transaction_number,
        'completedAt', transaction.completed_at,
        'vehicle', jsonb_build_object(
          'categoryName', transaction.vehicle_category_name_snapshot,
          'plateNumber', transaction.plate_number_snapshot,
          'make', transaction.make_snapshot,
          'model', transaction.model_snapshot,
          'color', transaction.color_snapshot
        ),
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
        ), '[]'::jsonb),
        'total', transaction.total
      )
      order by transaction.completed_at desc, transaction.id desc
    ),
    '[]'::jsonb
  )
  into transaction_rows
  from public.transactions as transaction
  where transaction.customer_id = selected_customer.id
    and transaction.status = 'completed'::public.transaction_status;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', category.id,
        'name', category.name,
        'active', category.active
      )
      order by category.active desc, category.sort_order, category.name
    ),
    '[]'::jsonb
  )
  into vehicle_categories
  from public.vehicle_categories as category;

  return jsonb_build_object(
    'customer', jsonb_build_object(
      'id', selected_customer.id,
      'firstName', selected_customer.first_name,
      'lastName', selected_customer.last_name,
      'mobileNumber', selected_customer.mobile_number,
      'email', selected_customer.email,
      'createdAt', selected_customer.created_at
    ),
    'summary', jsonb_build_object(
      'completedVisits', completed_visits,
      'lastCompletedVisit', last_completed_visit,
      'totalTransactionAmount', total_transaction_amount
    ),
    'vehicles', vehicle_rows,
    'transactions', transaction_rows,
    'vehicleCategories', vehicle_categories
  );
end;
$$;

create or replace function public.update_admin_customer_profile(
  p_customer_id uuid,
  p_first_name text,
  p_last_name text,
  p_mobile_number text,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_customer public.customers%rowtype;
  first_name_value text;
  last_name_value text;
  mobile_display_value text;
  mobile_normalized_value text;
  email_value text;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can edit customer details.';
  end if;

  if p_customer_id is null then
    raise exception using
      errcode = '22023',
      message = 'A customer is required.';
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

  perform pg_advisory_xact_lock(hashtextextended(mobile_normalized_value, 0));

  select *
    into selected_customer
  from public.customers
  where id = p_customer_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'That customer no longer exists.';
  end if;

  if exists (
    select 1
    from public.customers as other_customer
    where other_customer.mobile_number_normalized = mobile_normalized_value
      and other_customer.id <> selected_customer.id
  ) then
    raise exception using
      errcode = '23505',
      message = 'Another customer already uses that mobile number.';
  end if;

  update public.customers
  set first_name = first_name_value,
      last_name = last_name_value,
      mobile_number = mobile_display_value,
      mobile_number_normalized = mobile_normalized_value,
      email = email_value
  where id = selected_customer.id;

  return jsonb_build_object(
    'customerId', selected_customer.id,
    'mobileNumberNormalized', mobile_normalized_value
  );
end;
$$;

create or replace function public.update_admin_customer_vehicle(
  p_vehicle_id uuid,
  p_vehicle_category_id uuid,
  p_plate_number text default null,
  p_make text default null,
  p_model text default null,
  p_color text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_vehicle public.customer_vehicles%rowtype;
  plate_value text;
  plate_normalized_value text;
  make_value text;
  model_value text;
  color_value text;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can edit vehicle details.';
  end if;

  if p_vehicle_id is null or p_vehicle_category_id is null then
    raise exception using
      errcode = '22023',
      message = 'A vehicle and category are required.';
  end if;

  plate_value = nullif(btrim(coalesce(p_plate_number, '')), '');
  make_value = nullif(btrim(coalesce(p_make, '')), '');
  model_value = nullif(btrim(coalesce(p_model, '')), '');
  color_value = nullif(btrim(coalesce(p_color, '')), '');
  plate_normalized_value = public.normalize_public_plate(plate_value);

  if plate_value is not null and plate_normalized_value is null then
    raise exception using
      errcode = '22023',
      message = 'Enter a valid plate number or leave it blank.';
  end if;

  if plate_value is not null and char_length(plate_value) > 32
    or make_value is not null and char_length(make_value) > 80
    or model_value is not null and char_length(model_value) > 80
    or color_value is not null and char_length(color_value) > 50 then
    raise exception using
      errcode = '22023',
      message = 'One or more vehicle details are too long.';
  end if;

  if not exists (
    select 1
    from public.vehicle_categories
    where id = p_vehicle_category_id
  ) then
    raise exception using
      errcode = '22023',
      message = 'The selected vehicle category no longer exists.';
  end if;

  select *
    into selected_vehicle
  from public.customer_vehicles
  where id = p_vehicle_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'That vehicle no longer exists.';
  end if;

  update public.customer_vehicles
  set vehicle_category_id = p_vehicle_category_id,
      plate_number = plate_value,
      plate_number_normalized = plate_normalized_value,
      make = make_value,
      model = model_value,
      color = color_value
  where id = selected_vehicle.id;

  return jsonb_build_object('vehicleId', selected_vehicle.id);
end;
$$;

comment on function public.get_admin_client_directory(text, integer, integer, text) is
  'Returns a paginated, searchable active-admin client directory with completed-visit aggregates.';
comment on function public.get_admin_client_detail(uuid) is
  'Returns an active-admin customer profile, current vehicles, and completed snapshot history.';
comment on function public.update_admin_customer_profile(uuid, text, text, text, text) is
  'Updates current customer details without changing transaction snapshots.';
comment on function public.update_admin_customer_vehicle(uuid, uuid, text, text, text, text) is
  'Updates current vehicle details without changing transaction snapshots.';

revoke all on function public.get_admin_client_directory(text, integer, integer, text) from public;
revoke all on function public.get_admin_client_detail(uuid) from public;
revoke all on function public.update_admin_customer_profile(uuid, text, text, text, text) from public;
revoke all on function public.update_admin_customer_vehicle(uuid, uuid, text, text, text, text) from public;

grant execute on function public.get_admin_client_directory(text, integer, integer, text) to authenticated;
grant execute on function public.get_admin_client_detail(uuid) to authenticated;
grant execute on function public.update_admin_customer_profile(uuid, text, text, text, text) to authenticated;
grant execute on function public.update_admin_customer_vehicle(uuid, uuid, text, text, text, text) to authenticated;
