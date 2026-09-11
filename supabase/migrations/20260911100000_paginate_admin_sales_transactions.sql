-- Keep the protected Sales report aggregates intact while returning only the
-- requested completed-transaction window to the admin application.

create or replace function public.get_admin_sales_report_page(
  p_start_date date default null,
  p_end_date date default null,
  p_page integer default 1,
  p_page_size integer default 20
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
  requested_page integer;
  page_size_value integer;
  page_value integer;
  total_pages integer;
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

  requested_page = coalesce(p_page, 1);
  page_size_value = coalesce(p_page_size, 20);

  if requested_page < 1 or page_size_value < 1 or page_size_value > 50 then
    raise exception using
      errcode = '22023',
      message = 'Sales report pagination is invalid.';
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

  total_pages = greatest(1, ceil(filtered_completed_count::numeric / page_size_value)::integer);
  page_value = least(requested_page, total_pages);

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
  from (
    select sale.*
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
    order by sale.completed_at desc, sale.id desc
    limit page_size_value
    offset ((page_value - 1) * page_size_value)
  ) as sale;

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
    'transactionPagination', jsonb_build_object(
      'page', page_value,
      'pageSize', page_size_value,
      'totalItems', filtered_completed_count,
      'totalPages', total_pages
    ),
    'staffEarnings', staff_earnings
  );
end;
$$;

comment on function public.get_admin_sales_report_page(date, date, integer, integer) is
  'Returns protected completed-sales aggregates and a bounded, newest-first transaction page for the active admin.';

revoke all on function public.get_admin_sales_report_page(date, date, integer, integer) from public;
grant execute on function public.get_admin_sales_report_page(date, date, integer, integer) to authenticated;
