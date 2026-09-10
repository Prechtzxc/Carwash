-- Phase 10: derive stock status in the database for filtered inventory reporting.

alter table public.inventory_items
  add column stock_status text generated always as (
    case
      when current_stock <= 0 then 'out_of_stock'
      when current_stock <= minimum_stock then 'low_stock'
      else 'in_stock'
    end
  ) stored,
  add constraint inventory_items_stock_status_valid check (
    stock_status in ('in_stock', 'low_stock', 'out_of_stock')
  );

-- The generated status keeps status filters and active summary counts in the
-- database instead of loading every item's stock balance into the browser.
create index inventory_items_stock_status_active_idx
  on public.inventory_items (stock_status, active, item_type, sort_order, name);
