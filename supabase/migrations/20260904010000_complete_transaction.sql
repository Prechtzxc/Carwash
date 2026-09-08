-- Phase 7: atomically complete confirmed transactions and post inventory usage.

alter table public.transactions
  add constraint transactions_completed_at_valid
    check (completed_at is null or completed_at >= created_at),
  add constraint transactions_completion_timestamp_consistent
    check (
      (status = 'completed'::public.transaction_status and completed_at is not null)
      or (status <> 'completed'::public.transaction_status and completed_at is null)
    );

-- Replace the Phase 6 transition guard with the complete lifecycle. The
-- completion timestamp is database-managed so status writes cannot omit it.
create or replace function public.enforce_transaction_status_transition()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'completed'::public.transaction_status then
    raise exception using
      errcode = '22023',
      message = 'Completed transactions are read-only.';
  end if;

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
    elsif old.status = 'confirmed'::public.transaction_status
      and new.status = 'completed'::public.transaction_status then
      if coalesce(current_setting('app.transaction_completion', true), 'false') <> 'true' then
        raise exception using
          errcode = '42501',
          message = 'Transactions must be completed through the atomic completion operation.';
      end if;
    else
      raise exception using
        errcode = '22023',
        message = 'That transaction status transition is not allowed.';
    end if;
  end if;

  if new.completed_at is distinct from old.completed_at
    and new.status <> 'completed'::public.transaction_status then
    raise exception using
      errcode = '22023',
      message = 'The completion timestamp is only valid for completed transactions.';
  end if;

  if old.status is distinct from new.status
    and new.status = 'confirmed'::public.transaction_status then
    new.confirmed_at = coalesce(new.confirmed_at, timezone('utc', now()));
    new.cancelled_at = null;
    new.cancellation_reason = null;
  elsif old.status is distinct from new.status
    and new.status = 'cancelled'::public.transaction_status then
    new.cancelled_at = coalesce(new.cancelled_at, timezone('utc', now()));
  elsif old.status is distinct from new.status
    and new.status = 'completed'::public.transaction_status then
    new.completed_at = coalesce(new.completed_at, timezone('utc', now()));
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_transaction_status_transition() from public;

drop trigger if exists transactions_status_transition_guard on public.transactions;
create trigger transactions_status_transition_guard
  before update on public.transactions
  for each row execute function public.enforce_transaction_status_transition();

-- This is the only completion write path. It locks the transaction first, then
-- locks every required inventory item in UUID order before changing any stock.
-- All stock updates, ledger inserts, and the status change share this function
-- transaction and therefore roll back together on any error.
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

  perform set_config('app.transaction_completion', 'true', true);

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
  'Atomically deducts service and product inventory, writes transaction movements, and completes a confirmed transaction.';

revoke all on function public.complete_confirmed_transaction(uuid) from public;
grant execute on function public.complete_confirmed_transaction(uuid) to authenticated;
