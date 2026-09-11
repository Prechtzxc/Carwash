-- Phase 14: admin-only staff records, transaction assignments, and service earnings.

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile_number text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint staff_name_valid check (char_length(btrim(name)) between 1 and 120),
  constraint staff_mobile_number_valid check (
    mobile_number is null or char_length(btrim(mobile_number)) between 7 and 32
  )
);

create table public.transaction_staff (
  transaction_id uuid not null references public.transactions (id) on delete restrict,
  staff_id uuid not null references public.staff (id) on delete restrict,
  share_percent numeric(5, 2) not null,
  service_sales_snapshot numeric(14, 2),
  earnings_snapshot numeric(14, 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (transaction_id, staff_id),
  constraint transaction_staff_share_percent_valid check (
    share_percent > 0 and share_percent <= 40
  ),
  constraint transaction_staff_snapshot_pair_valid check (
    (service_sales_snapshot is null) = (earnings_snapshot is null)
  ),
  constraint transaction_staff_service_sales_snapshot_valid check (
    service_sales_snapshot is null
    or (service_sales_snapshot >= 0 and service_sales_snapshot < 1000000000000)
  ),
  constraint transaction_staff_earnings_snapshot_valid check (
    earnings_snapshot is null
    or (earnings_snapshot >= 0 and earnings_snapshot < 1000000000000)
  )
);

comment on table public.staff is 'Admin-managed business staff records without Supabase Auth accounts.';
comment on column public.staff.active is 'Whether this staff member can receive new transaction assignments.';
comment on table public.transaction_staff is 'Staff assignments and completion-time service earnings snapshots.';
comment on column public.transaction_staff.share_percent is 'The staff share of service sales for this transaction; all assigned shares must total 40 percent before completion.';
comment on column public.transaction_staff.service_sales_snapshot is 'The transaction service line total captured when the transaction was completed.';
comment on column public.transaction_staff.earnings_snapshot is 'The completion-time service sales share captured for this staff assignment.';

create unique index staff_name_lower_key
  on public.staff (lower(btrim(name)));

create index staff_active_name_idx
  on public.staff (active, lower(btrim(name)), name);

create index transaction_staff_staff_id_idx
  on public.transaction_staff (staff_id, transaction_id);

create trigger staff_set_updated_at
  before update on public.staff
  for each row execute function public.set_updated_at();

create trigger transaction_staff_set_updated_at
  before update on public.transaction_staff
  for each row execute function public.set_updated_at();

-- Assignment rows remain editable until completion. Snapshots are written only
-- by the atomic completion operation and completed assignments cannot be changed.
create or replace function public.prevent_transaction_staff_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  transaction_status_value public.transaction_status;
begin
  if tg_op = 'DELETE' then
    select status
      into transaction_status_value
    from public.transactions
    where id = old.transaction_id;
  else
    select status
      into transaction_status_value
    from public.transactions
    where id = new.transaction_id;
  end if;

  if transaction_status_value in (
    'completed'::public.transaction_status,
    'cancelled'::public.transaction_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'Completed or cancelled transaction assignments are read-only.';
  end if;

  if tg_op = 'UPDATE' then
    if (
      new.service_sales_snapshot is distinct from old.service_sales_snapshot
      or new.earnings_snapshot is distinct from old.earnings_snapshot
    )
      and coalesce(current_setting('app.transaction_completion', true), 'false') <> 'true' then
      raise exception using
        errcode = '42501',
        message = 'Earnings snapshots are database-managed.';
    end if;
  elsif tg_op = 'INSERT'
    and (new.service_sales_snapshot is not null or new.earnings_snapshot is not null)
    and coalesce(current_setting('app.transaction_completion', true), 'false') <> 'true' then
    raise exception using
      errcode = '42501',
      message = 'Earnings snapshots are database-managed.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_transaction_staff_mutation() from public;

create trigger transaction_staff_mutation_guard
  before insert or update or delete on public.transaction_staff
  for each row execute function public.prevent_transaction_staff_mutation();

-- Replace all editable assignments in one transaction. Partial shares are
-- allowed while a request is being prepared; completion enforces exactly 40.
create or replace function public.replace_transaction_staff(
  p_transaction_id uuid,
  p_assignments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_transaction public.transactions%rowtype;
  assignment_input jsonb;
  selected_staff public.staff%rowtype;
  staff_id_value uuid;
  share_percent_value numeric;
  assignment_count integer := 0;
  total_share numeric := 0;
  staff_ids uuid[] := '{}'::uuid[];
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can manage staff assignments.';
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

  if selected_transaction.status not in (
    'pending'::public.transaction_status,
    'confirmed'::public.transaction_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'Only pending or confirmed transactions can have staff assignments.';
  end if;

  if jsonb_typeof(coalesce(p_assignments, '[]'::jsonb)) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'Staff assignments are invalid.';
  end if;

  for assignment_input in
    select value
    from jsonb_array_elements(coalesce(p_assignments, '[]'::jsonb)) as assignment_value(value)
  loop
    assignment_count = assignment_count + 1;

    if assignment_count > 20
      or jsonb_typeof(assignment_input) <> 'object'
      or not (assignment_input ? 'staffId')
      or not (assignment_input ? 'sharePercent')
      or jsonb_typeof(assignment_input -> 'staffId') <> 'string'
      or jsonb_typeof(assignment_input -> 'sharePercent') <> 'number' then
      raise exception using
        errcode = '22023',
        message = 'Staff assignments are invalid.';
    end if;

    begin
      staff_id_value = (assignment_input ->> 'staffId')::uuid;
      share_percent_value = (assignment_input ->> 'sharePercent')::numeric;
    exception
      when invalid_text_representation or numeric_value_out_of_range then
        raise exception using
          errcode = '22023',
          message = 'Staff assignments are invalid.';
    end;

    if staff_id_value is null
      or share_percent_value is null
      or share_percent_value::text = 'NaN'
      or share_percent_value <= 0
      or share_percent_value > 40
      or share_percent_value <> round(share_percent_value, 2) then
      raise exception using
        errcode = '22023',
        message = 'Staff shares must be greater than zero and use at most two decimals.';
    end if;

    if staff_id_value = any(staff_ids) then
      raise exception using
        errcode = '22023',
        message = 'A staff member may only be assigned once per transaction.';
    end if;

    select *
      into selected_staff
    from public.staff
    where id = staff_id_value
      and active = true
    for share;

    if not found then
      raise exception using
        errcode = '22023',
        message = 'Select active staff members only.';
    end if;

    staff_ids = array_append(staff_ids, staff_id_value);
    total_share = total_share + share_percent_value;
  end loop;

  if total_share > 40 then
    raise exception using
      errcode = '22023',
      message = 'Staff shares cannot exceed 40 percent.';
  end if;

  delete from public.transaction_staff
  where transaction_id = selected_transaction.id;

  for assignment_input in
    select value
    from jsonb_array_elements(coalesce(p_assignments, '[]'::jsonb)) as assignment_value(value)
  loop
    insert into public.transaction_staff (
      transaction_id,
      staff_id,
      share_percent
    )
    values (
      selected_transaction.id,
      (assignment_input ->> 'staffId')::uuid,
      (assignment_input ->> 'sharePercent')::numeric
    );
  end loop;

  return jsonb_build_object(
    'transactionId', selected_transaction.id,
    'transactionNumber', selected_transaction.transaction_number,
    'assignedStaff', assignment_count,
    'sharePercent', total_share
  );
end;
$$;

revoke all on function public.replace_transaction_staff(uuid, jsonb) from public;
grant execute on function public.replace_transaction_staff(uuid, jsonb) to authenticated;

alter table public.staff enable row level security;
alter table public.transaction_staff enable row level security;

revoke all on table public.staff, public.transaction_staff from PUBLIC, anon, authenticated;

grant select on table public.staff to authenticated;
grant insert (name, mobile_number, active) on table public.staff to authenticated;
grant update (name, mobile_number, active) on table public.staff to authenticated;
grant select on table public.transaction_staff to authenticated;

create policy "Active admins can read staff"
  on public.staff
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can create staff"
  on public.staff
  for insert
  to authenticated
  with check ((select public.is_active_admin()));

create policy "Active admins can update staff"
  on public.staff
  for update
  to authenticated
  using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

create policy "Active admins can read transaction staff"
  on public.transaction_staff
  for select
  to authenticated
  using ((select public.is_active_admin()));

-- Extend the existing atomic completion path with staff validation and
-- completion-time earnings snapshots. Inventory behavior remains unchanged.
create or replace function public.complete_confirmed_transaction(
  p_transaction_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_transaction public.transactions%rowtype;
  locked_inventory_item public.inventory_items%rowtype;
  required_item record;
  required_item_ids uuid[] := '{}'::uuid[];
  required_item_names text[] := '{}'::text[];
  required_item_units public.inventory_unit[] := '{}'::public.inventory_unit[];
  required_service_quantities numeric[] := '{}'::numeric[];
  required_product_quantities numeric[] := '{}'::numeric[];
  required_total_quantities numeric[] := '{}'::numeric[];
  stock_before_values numeric[] := '{}'::numeric[];
  item_index integer;
  stock_before_value numeric;
  stock_after_value numeric;
  completion_time timestamptz;
  service_sales_value numeric := 0;
  service_line_count bigint := 0;
  staff_assignment_count bigint := 0;
  staff_share_total numeric := 0;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can complete transactions.';
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

  if selected_transaction.status = 'completed'::public.transaction_status then
    raise exception using
      errcode = '22023',
      message = 'That transaction is already completed.';
  end if;

  if selected_transaction.status <> 'confirmed'::public.transaction_status then
    raise exception using
      errcode = '22023',
      message = 'Only confirmed transactions can be completed.';
  end if;

  select
    coalesce(sum(line.line_total), 0),
    count(*)
  into service_sales_value, service_line_count
  from public.transaction_services as line
  where line.transaction_id = selected_transaction.id;

  select
    count(*),
    coalesce(sum(assignment.share_percent), 0)
  into staff_assignment_count, staff_share_total
  from public.transaction_staff as assignment
  where assignment.transaction_id = selected_transaction.id;

  if service_line_count > 0 and staff_assignment_count = 0 then
    raise exception using
      errcode = '22023',
      message = 'Assign at least one active staff member before completing a service transaction.';
  end if;

  if service_line_count > 0 and staff_share_total <> 40 then
    raise exception using
      errcode = '22023',
      message = 'Staff shares must total exactly 40 percent before completion.';
  end if;

  -- Aggregate all configured service usage and selected product quantities by
  -- inventory item before any row is locked or changed.
  for required_item in
    with service_usage as (
      select
        requirement.inventory_item_id,
        sum(requirement.quantity_required * line.quantity::numeric) as quantity
      from public.transaction_services as line
      join public.service_inventory_requirements as requirement
        on requirement.service_id = line.service_id
      where line.transaction_id = selected_transaction.id
      group by requirement.inventory_item_id
    ),
    product_usage as (
      select
        line.inventory_item_id,
        sum(line.quantity::numeric) as quantity
      from public.transaction_products as line
      where line.transaction_id = selected_transaction.id
      group by line.inventory_item_id
    ),
    used_items as (
      select inventory_item_id from service_usage
      union
      select inventory_item_id from product_usage
    )
    select
      item.id,
      item.name,
      item.unit,
      item.item_type,
      coalesce(service_usage.quantity, 0::numeric) as service_quantity,
      coalesce(product_usage.quantity, 0::numeric) as product_quantity,
      coalesce(service_usage.quantity, 0::numeric)
        + coalesce(product_usage.quantity, 0::numeric) as total_quantity
    from used_items
    join public.inventory_items as item
      on item.id = used_items.inventory_item_id
    left join service_usage
      on service_usage.inventory_item_id = item.id
    left join product_usage
      on product_usage.inventory_item_id = item.id
    order by item.id
  loop
    if required_item.service_quantity > 0
      and required_item.item_type <> 'consumable'::public.inventory_item_type then
      raise exception using
        errcode = '22023',
        message = 'A service consumable requirement is invalid.';
    end if;

    if required_item.product_quantity > 0
      and required_item.item_type <> 'shop_product'::public.inventory_item_type then
      raise exception using
        errcode = '22023',
        message = 'A selected shop product is invalid.';
    end if;

    required_item_ids = array_append(required_item_ids, required_item.id);
    required_item_names = array_append(required_item_names, required_item.name);
    required_item_units = array_append(required_item_units, required_item.unit);
    required_service_quantities = array_append(required_service_quantities, required_item.service_quantity);
    required_product_quantities = array_append(required_product_quantities, required_item.product_quantity);
    required_total_quantities = array_append(required_total_quantities, required_item.total_quantity);
  end loop;

  -- Lock and validate every item first. Sorting the ids gives concurrent
  -- completions a consistent lock order and prevents negative stock races.
  if cardinality(required_item_ids) > 0 then
    for item_index in 1..cardinality(required_item_ids) loop
      select *
        into locked_inventory_item
      from public.inventory_items
      where id = required_item_ids[item_index]
      for update;

      if not found then
        raise exception using
          errcode = '22023',
          message = 'A required inventory item is no longer available.';
      end if;

      if required_service_quantities[item_index] > 0
        and locked_inventory_item.item_type <> 'consumable'::public.inventory_item_type then
        raise exception using
          errcode = '22023',
          message = 'A service consumable requirement is invalid.';
      end if;

      if required_product_quantities[item_index] > 0
        and locked_inventory_item.item_type <> 'shop_product'::public.inventory_item_type then
        raise exception using
          errcode = '22023',
          message = 'A selected shop product is invalid.';
      end if;

      if locked_inventory_item.current_stock < required_total_quantities[item_index] then
        raise exception using
          errcode = '22023',
          message = format(
            'Insufficient stock: %s requires %s %s but only %s %s is available.',
            required_item_names[item_index],
            rtrim(rtrim(to_char(required_total_quantities[item_index], 'FM999999999999999999999999999990.000'), '0'), '.'),
            required_item_units[item_index]::text,
            rtrim(rtrim(to_char(locked_inventory_item.current_stock, 'FM999999999999999999999999999990.000'), '0'), '.'),
            required_item_units[item_index]::text
          );
      end if;

      stock_before_values = array_append(stock_before_values, locked_inventory_item.current_stock);
    end loop;
  end if;

  completion_time = timezone('utc', now());

  if cardinality(required_item_ids) > 0 then
    -- The stock guard trigger permits these updates only for this transaction.
    perform set_config('app.inventory_stock_movement', 'true', true);

    for item_index in 1..cardinality(required_item_ids) loop
      stock_before_value = stock_before_values[item_index];
      stock_after_value = stock_before_value - required_total_quantities[item_index];

      update public.inventory_items
      set current_stock = stock_after_value
      where id = required_item_ids[item_index];

      if required_service_quantities[item_index] > 0 then
        insert into public.inventory_movements (
          inventory_item_id,
          movement_type,
          quantity,
          stock_before,
          stock_after,
          reference_type,
          reference_id,
          notes,
          created_by
        )
        values (
          required_item_ids[item_index],
          'service_usage'::public.inventory_movement_type,
          required_service_quantities[item_index],
          stock_before_value,
          stock_before_value - required_service_quantities[item_index],
          'transaction',
          selected_transaction.id,
          format('Transaction %s service usage.', selected_transaction.transaction_number),
          (select auth.uid())
        );
      end if;

      if required_product_quantities[item_index] > 0 then
        insert into public.inventory_movements (
          inventory_item_id,
          movement_type,
          quantity,
          stock_before,
          stock_after,
          reference_type,
          reference_id,
          notes,
          created_by
        )
        values (
          required_item_ids[item_index],
          'product_sale'::public.inventory_movement_type,
          required_product_quantities[item_index],
          stock_before_value - required_service_quantities[item_index],
          stock_after_value,
          'transaction',
          selected_transaction.id,
          format('Transaction %s product sale.', selected_transaction.transaction_number),
          (select auth.uid())
        );
      end if;
    end loop;
  end if;

  -- Both earnings snapshots and the completion status are committed with the
  -- inventory writes above, so any validation failure rolls back everything.
  perform set_config('app.transaction_completion', 'true', true);

  if staff_assignment_count > 0 then
    update public.transaction_staff
    set service_sales_snapshot = service_sales_value,
        earnings_snapshot = round(service_sales_value * share_percent / 100, 2)
    where transaction_id = selected_transaction.id;
  end if;

  update public.transactions
  set status = 'completed'::public.transaction_status,
      completed_at = completion_time
  where id = selected_transaction.id
  returning * into selected_transaction;

  return jsonb_build_object(
    'transactionId', selected_transaction.id,
    'transactionNumber', selected_transaction.transaction_number,
    'status', selected_transaction.status,
    'completedAt', selected_transaction.completed_at
  );
end;
$$;

comment on function public.complete_confirmed_transaction(uuid) is
  'Atomically validates staff shares, snapshots service earnings, deducts service and product inventory, writes transaction movements, and completes a confirmed transaction.';

revoke all on function public.complete_confirmed_transaction(uuid) from public;
grant execute on function public.complete_confirmed_transaction(uuid) to authenticated;

-- Add staff allocation totals to the existing protected completed-sales report.
create or replace function public.get_admin_sales_report(
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  business_today date;
  business_month_start date;
  business_next_month_start date;
  all_sales numeric;
  today_sales numeric;
  month_sales numeric;
  all_completed_count bigint;
  filtered_sales numeric;
  filtered_completed_count bigint;
  filtered_average numeric;
  all_service_sales numeric;
  filtered_service_sales numeric;
  all_company_service_sales numeric;
  filtered_company_service_sales numeric;
  all_staff_earnings numeric;
  filtered_staff_earnings numeric;
  service_sales jsonb;
  product_sales jsonb;
  vehicle_category_sales jsonb;
  sales_trend jsonb;
  transaction_rows jsonb;
  staff_earnings jsonb;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can read sales reports.';
  end if;

  if (p_start_date is null) <> (p_end_date is null) then
    raise exception using
      errcode = '22023',
      message = 'Both sales report dates are required for a custom range.';
  end if;

  if p_start_date is not null and p_start_date > p_end_date then
    raise exception using
      errcode = '22023',
      message = 'The sales report start date cannot be after the end date.';
  end if;

  business_today = (timezone('Asia/Manila', now()))::date;
  business_month_start = date_trunc('month', business_today::timestamp)::date;
  business_next_month_start = (business_month_start + interval '1 month')::date;

  select
    coalesce(sum(sale.total), 0),
    count(*)
  into all_sales, all_completed_count
  from public.transactions as sale
  where sale.status = 'completed'::public.transaction_status;

  select coalesce(sum(sale.total), 0)
    into today_sales
  from public.transactions as sale
  where sale.status = 'completed'::public.transaction_status
    and sale.completed_at >= (business_today::timestamp at time zone 'Asia/Manila')
    and sale.completed_at < ((business_today + 1)::timestamp at time zone 'Asia/Manila');

  select coalesce(sum(sale.total), 0)
    into month_sales
  from public.transactions as sale
  where sale.status = 'completed'::public.transaction_status
    and sale.completed_at >= (business_month_start::timestamp at time zone 'Asia/Manila')
    and sale.completed_at < (business_next_month_start::timestamp at time zone 'Asia/Manila');

  select
    coalesce(sum(sale.total), 0),
    count(*),
    coalesce(round(sum(sale.total) / nullif(count(*), 0), 2), 0)
  into filtered_sales, filtered_completed_count, filtered_average
  from public.transactions as sale
  where sale.status = 'completed'::public.transaction_status
    and (
      p_start_date is null
      or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
    )
    and (
      p_end_date is null
      or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
    );

  select coalesce(sum(line.line_total), 0)
    into all_service_sales
  from public.transaction_services as line
  join public.transactions as sale
    on sale.id = line.transaction_id
  where sale.status = 'completed'::public.transaction_status;

  select coalesce(sum(line.line_total), 0)
    into filtered_service_sales
  from public.transaction_services as line
  join public.transactions as sale
    on sale.id = line.transaction_id
  where sale.status = 'completed'::public.transaction_status
    and (
      p_start_date is null
      or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
    )
    and (
      p_end_date is null
      or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
    );

  select coalesce(sum(assignment.earnings_snapshot), 0)
    into all_staff_earnings
  from public.transaction_staff as assignment
  join public.transactions as sale
    on sale.id = assignment.transaction_id
  where sale.status = 'completed'::public.transaction_status;

  select coalesce(sum(assignment.earnings_snapshot), 0)
    into filtered_staff_earnings
  from public.transaction_staff as assignment
  join public.transactions as sale
    on sale.id = assignment.transaction_id
  where sale.status = 'completed'::public.transaction_status
    and (
      p_start_date is null
      or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
    )
    and (
      p_end_date is null
      or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
    );

  all_company_service_sales = round(all_service_sales * 0.60, 2);
  filtered_company_service_sales = round(filtered_service_sales * 0.60, 2);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'staffId', summary.staff_id,
        'name', summary.name,
        'active', summary.active,
        'completedTransactions', summary.completed_transactions,
        'earnings', summary.earnings
      )
      order by summary.earnings desc, summary.name
    ),
    '[]'::jsonb
  )
  into staff_earnings
  from (
    select
      staff.id as staff_id,
      staff.name,
      staff.active,
      count(distinct sale.id) as completed_transactions,
      coalesce(sum(assignment.earnings_snapshot), 0) as earnings
    from public.transaction_staff as assignment
    join public.transactions as sale
      on sale.id = assignment.transaction_id
    join public.staff as staff
      on staff.id = assignment.staff_id
    where sale.status = 'completed'::public.transaction_status
      and (
        p_start_date is null
        or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
      )
      and (
        p_end_date is null
        or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
      )
    group by staff.id, staff.name, staff.active
  ) as summary;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', summary.name,
        'total', summary.total
      )
      order by summary.total desc, summary.name
    ),
    '[]'::jsonb
  )
  into service_sales
  from (
    select
      line.service_name_snapshot as name,
      sum(line.line_total) as total
    from public.transaction_services as line
    join public.transactions as sale
      on sale.id = line.transaction_id
    where sale.status = 'completed'::public.transaction_status
      and (
        p_start_date is null
        or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
      )
      and (
        p_end_date is null
        or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
      )
    group by line.service_name_snapshot
  ) as summary;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', summary.name,
        'total', summary.total
      )
      order by summary.total desc, summary.name
    ),
    '[]'::jsonb
  )
  into product_sales
  from (
    select
      line.product_name_snapshot as name,
      sum(line.line_total) as total
    from public.transaction_products as line
    join public.transactions as sale
      on sale.id = line.transaction_id
    where sale.status = 'completed'::public.transaction_status
      and (
        p_start_date is null
        or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
      )
      and (
        p_end_date is null
        or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
      )
    group by line.product_name_snapshot
  ) as summary;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', summary.name,
        'transactions', summary.transaction_count
      )
      order by summary.transaction_count desc, summary.name
    ),
    '[]'::jsonb
  )
  into vehicle_category_sales
  from (
    select
      sale.vehicle_category_name_snapshot as name,
      count(*) as transaction_count
    from public.transactions as sale
    where sale.status = 'completed'::public.transaction_status
      and (
        p_start_date is null
        or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
      )
      and (
        p_end_date is null
        or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
      )
    group by sale.vehicle_category_name_snapshot
  ) as summary;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', summary.sales_date,
        'total', summary.total
      )
      order by summary.sales_date
    ),
    '[]'::jsonb
  )
  into sales_trend
  from (
    select
      (sale.completed_at at time zone 'Asia/Manila')::date as sales_date,
      sum(sale.total) as total
    from public.transactions as sale
    where sale.status = 'completed'::public.transaction_status
      and (
        p_start_date is null
        or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
      )
      and (
        p_end_date is null
        or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
      )
    group by (sale.completed_at at time zone 'Asia/Manila')::date
  ) as summary;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sale.id,
        'transactionNumber', sale.transaction_number,
        'completedAt', sale.completed_at,
        'customerName', sale.customer_name_snapshot,
        'vehicleCategory', sale.vehicle_category_name_snapshot,
        'plateNumber', sale.plate_number_snapshot,
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
          where line.transaction_id = sale.id
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
          where line.transaction_id = sale.id
        ), '[]'::jsonb),
        'total', sale.total
      )
      order by sale.completed_at desc, sale.id desc
    ),
    '[]'::jsonb
  )
  into transaction_rows
  from public.transactions as sale
  where sale.status = 'completed'::public.transaction_status
    and (
      p_start_date is null
      or sale.completed_at >= (p_start_date::timestamp at time zone 'Asia/Manila')
    )
    and (
      p_end_date is null
      or sale.completed_at < ((p_end_date + 1)::timestamp at time zone 'Asia/Manila')
    );

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'totalSales', all_sales,
      'salesToday', today_sales,
      'salesThisMonth', month_sales,
      'completedTransactions', all_completed_count,
      'companyServiceSales', all_company_service_sales,
      'staffEarnings', all_staff_earnings
    ),
    'filtered', jsonb_build_object(
      'startDate', p_start_date,
      'endDate', p_end_date,
      'sales', filtered_sales,
      'completedTransactions', filtered_completed_count,
      'averageTransactionValue', filtered_average,
      'companyServiceSales', filtered_company_service_sales,
      'staffEarnings', filtered_staff_earnings
    ),
    'serviceSales', service_sales,
    'productSales', product_sales,
    'vehicleCategories', vehicle_category_sales,
    'trend', sales_trend,
    'transactions', transaction_rows,
    'staffEarnings', staff_earnings
  );
end;
$$;

comment on function public.get_admin_sales_report(date, date) is
  'Returns completed-transaction sales summaries, service allocation totals, staff earnings, and historical snapshot breakdowns for the active admin.';

revoke all on function public.get_admin_sales_report(date, date) from public;
grant execute on function public.get_admin_sales_report(date, date) to authenticated;
