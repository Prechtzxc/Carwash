-- Phase 4: inventory items, atomic stock movements, and service consumable recipes.

create type public.inventory_item_type as enum ('consumable', 'shop_product');
create type public.inventory_unit as enum ('ml', 'g', 'piece');
create type public.inventory_movement_type as enum (
  'stock_in',
  'adjustment_in',
  'adjustment_out',
  'service_usage',
  'product_sale'
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  item_type public.inventory_item_type not null,
  unit public.inventory_unit not null,
  current_stock numeric(14, 3) not null default 0,
  minimum_stock numeric(14, 3) not null default 0,
  selling_price numeric(12, 2),
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inventory_items_name_not_blank check (char_length(btrim(name)) between 1 and 120),
  constraint inventory_items_description_length check (description is null or char_length(description) <= 500),
  constraint inventory_items_stock_values_valid check (
    current_stock >= 0
    and current_stock < 100000000000
    and minimum_stock >= 0
    and minimum_stock < 100000000000
  ),
  constraint inventory_items_selling_price_rule check (
    (item_type = 'consumable'::public.inventory_item_type and selling_price is null)
    or (
      item_type = 'shop_product'::public.inventory_item_type
      and selling_price is not null
      and selling_price >= 0
      and selling_price < 10000000000
    )
  ),
  constraint inventory_items_sort_order_valid check (sort_order between 0 and 9999)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity numeric(14, 3) not null,
  stock_before numeric(14, 3) not null,
  stock_after numeric(14, 3) not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint inventory_movements_quantity_valid check (quantity > 0 and quantity < 100000000000),
  constraint inventory_movements_stock_before_valid check (stock_before >= 0 and stock_before < 100000000000),
  constraint inventory_movements_stock_after_valid check (stock_after >= 0 and stock_after < 100000000000),
  constraint inventory_movements_reference_type_valid check (
    reference_type is null or char_length(btrim(reference_type)) between 1 and 80
  ),
  constraint inventory_movements_notes_length check (notes is null or char_length(notes) <= 500)
);

create table public.service_inventory_requirements (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  quantity_required numeric(14, 3) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_inventory_requirements_quantity_valid check (
    quantity_required > 0 and quantity_required < 100000000000
  ),
  constraint service_inventory_requirements_service_item_unique unique (service_id, inventory_item_id)
);

comment on table public.inventory_items is 'Canonical inventory records for internal consumables and optional shop products.';
comment on column public.inventory_items.unit is 'The one base unit used for all stock quantities for this item.';
comment on column public.inventory_items.selling_price is 'Required PHP selling price for shop products; always null for consumables.';
comment on table public.inventory_movements is 'Append-only stock ledger. Current stock changes are performed by the atomic movement function.';
comment on table public.service_inventory_requirements is 'Configured consumable quantity used by a service; this does not deduct stock.';

create unique index inventory_items_name_lower_key
  on public.inventory_items (lower(btrim(name)));

create index inventory_items_active_sort_order_idx
  on public.inventory_items (active, sort_order, name);

create index inventory_items_type_active_idx
  on public.inventory_items (item_type, active, sort_order, name);

create index inventory_movements_item_created_at_idx
  on public.inventory_movements (inventory_item_id, created_at desc);

create index inventory_movements_created_at_idx
  on public.inventory_movements (created_at desc);

create index inventory_movements_type_created_at_idx
  on public.inventory_movements (movement_type, created_at desc);

create index service_inventory_requirements_service_id_idx
  on public.service_inventory_requirements (service_id);

create index service_inventory_requirements_inventory_item_id_idx
  on public.service_inventory_requirements (inventory_item_id);

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create trigger service_inventory_requirements_set_updated_at
  before update on public.service_inventory_requirements
  for each row execute function public.set_updated_at();

-- Only the atomic movement function may change current_stock. The transaction-local
-- setting is set by that function and cannot be supplied through a table update.
create or replace function public.prevent_direct_inventory_stock_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('app.inventory_stock_movement', true), 'false') <> 'true'
    and (
      (tg_op = 'INSERT' and new.current_stock is distinct from 0)
      or (tg_op = 'UPDATE' and new.current_stock is distinct from old.current_stock)
    ) then
    raise exception using
      errcode = '42501',
      message = 'Inventory stock changes must use an inventory movement.';
  end if;

  return new;
end;
$$;

create trigger inventory_items_stock_change_guard
  before insert or update on public.inventory_items
  for each row execute function public.prevent_direct_inventory_stock_change();

-- A recipe may point only to a consumable. This trigger also protects the rule
-- if an existing item is later edited from consumable to shop_product.
create or replace function public.validate_service_inventory_requirement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_item_type public.inventory_item_type;
begin
  select item_type
    into selected_item_type
  from public.inventory_items
  where id = new.inventory_item_id;

  if selected_item_type is distinct from 'consumable'::public.inventory_item_type then
    raise exception using
      errcode = '23514',
      message = 'Service requirements may use consumable inventory items only.';
  end if;

  return new;
end;
$$;

create trigger service_inventory_requirements_consumable_guard
  before insert or update on public.service_inventory_requirements
  for each row execute function public.validate_service_inventory_requirement();

create or replace function public.prevent_item_type_change_with_recipe()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.item_type = 'shop_product'::public.inventory_item_type
    and old.item_type is distinct from new.item_type
    and exists (
      select 1
      from public.service_inventory_requirements
      where inventory_item_id = old.id
    ) then
    raise exception using
      errcode = '23514',
      message = 'Remove service requirements before changing an item to a shop product.';
  end if;

  return new;
end;
$$;

create trigger inventory_items_recipe_type_guard
  before update of item_type on public.inventory_items
  for each row execute function public.prevent_item_type_change_with_recipe();

-- Performs validation, row locking, stock update, and ledger insert in one
-- transaction. The database rolls back both writes if any step fails.
create or replace function public.apply_inventory_movement(
  p_inventory_item_id uuid,
  p_movement_type public.inventory_movement_type,
  p_quantity numeric,
  p_notes text default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_item public.inventory_items;
  next_stock numeric;
  inserted_movement public.inventory_movements;
  normalized_notes text;
begin
  if not public.is_active_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an active admin can change inventory stock.';
  end if;

  if p_inventory_item_id is null then
    raise exception using
      errcode = '22023',
      message = 'An inventory item is required.';
  end if;

  if p_movement_type is null
    or p_movement_type not in (
      'stock_in'::public.inventory_movement_type,
      'adjustment_in'::public.inventory_movement_type,
      'adjustment_out'::public.inventory_movement_type
    ) then
    raise exception using
      errcode = '22023',
      message = 'This movement type is not available for manual inventory changes.';
  end if;

  if p_quantity is null or p_quantity <= 0 or p_quantity >= 100000000000 then
    raise exception using
      errcode = '22023',
      message = 'Movement quantity must be greater than zero.';
  end if;

  normalized_notes = nullif(btrim(p_notes), '');

  if normalized_notes is not null and char_length(normalized_notes) > 500 then
    raise exception using
      errcode = '22023',
      message = 'Notes must be 500 characters or fewer.';
  end if;

  select *
    into selected_item
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception using
      errcode = '23503',
      message = 'That inventory item no longer exists.';
  end if;

  if p_movement_type in (
    'stock_in'::public.inventory_movement_type,
    'adjustment_in'::public.inventory_movement_type
  ) then
    next_stock = selected_item.current_stock + p_quantity;
  else
    next_stock = selected_item.current_stock - p_quantity;
  end if;

  if next_stock < 0 then
    raise exception using
      errcode = '23514',
      message = 'This movement would make stock negative.';
  end if;

  perform set_config('app.inventory_stock_movement', 'true', true);

  update public.inventory_items
  set current_stock = next_stock
  where id = selected_item.id;

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    quantity,
    stock_before,
    stock_after,
    notes,
    created_by
  )
  values (
    selected_item.id,
    p_movement_type,
    p_quantity,
    selected_item.current_stock,
    next_stock,
    normalized_notes,
    (select auth.uid())
  )
  returning * into inserted_movement;

  return inserted_movement;
end;
$$;

revoke all on function public.prevent_direct_inventory_stock_change() from public;
revoke all on function public.validate_service_inventory_requirement() from public;
revoke all on function public.prevent_item_type_change_with_recipe() from public;
revoke all on function public.apply_inventory_movement(uuid, public.inventory_movement_type, numeric, text) from public;
grant execute on function public.apply_inventory_movement(uuid, public.inventory_movement_type, numeric, text) to authenticated;

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.service_inventory_requirements enable row level security;

revoke all on table public.inventory_items, public.inventory_movements, public.service_inventory_requirements from PUBLIC, anon, authenticated;
grant usage on type public.inventory_item_type, public.inventory_unit, public.inventory_movement_type to authenticated;

grant select on table public.inventory_items to authenticated;
grant insert (name, item_type, unit, minimum_stock, selling_price, description, active, sort_order)
  on table public.inventory_items to authenticated;
grant update (name, item_type, unit, minimum_stock, selling_price, description, active, sort_order)
  on table public.inventory_items to authenticated;

grant select on table public.inventory_movements to authenticated;

grant select on table public.service_inventory_requirements to authenticated;
grant insert (service_id, inventory_item_id, quantity_required)
  on table public.service_inventory_requirements to authenticated;
grant update (service_id, inventory_item_id, quantity_required)
  on table public.service_inventory_requirements to authenticated;
grant delete on table public.service_inventory_requirements to authenticated;

create policy "Active admins can read inventory items"
  on public.inventory_items
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can create inventory items"
  on public.inventory_items
  for insert
  to authenticated
  with check ((select public.is_active_admin()));

create policy "Active admins can update inventory item details"
  on public.inventory_items
  for update
  to authenticated
  using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

create policy "Active admins can read inventory movements"
  on public.inventory_movements
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can read service inventory requirements"
  on public.service_inventory_requirements
  for select
  to authenticated
  using ((select public.is_active_admin()));

create policy "Active admins can create service inventory requirements"
  on public.service_inventory_requirements
  for insert
  to authenticated
  with check ((select public.is_active_admin()));

create policy "Active admins can update service inventory requirements"
  on public.service_inventory_requirements
  for update
  to authenticated
  using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

create policy "Active admins can remove service inventory requirements"
  on public.service_inventory_requirements
  for delete
  to authenticated
  using ((select public.is_active_admin()));
