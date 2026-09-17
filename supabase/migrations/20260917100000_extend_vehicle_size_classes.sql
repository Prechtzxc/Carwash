-- Extend the internal pricing classes without changing historical snapshots.

alter type public.vehicle_size add value if not exists 'motor' before 'small';
alter type public.vehicle_size add value if not exists 'big_bike' before 'small';
