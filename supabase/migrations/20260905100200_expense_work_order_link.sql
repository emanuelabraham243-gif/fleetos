-- ============================================================================
-- A repair that generates a financial expense should be traceable back to
-- the work order that caused it (Expense -> Vehicle -> Work Order), without
-- building a second cost-tracking system alongside work_orders.total_cost.
-- Nullable: most expenses (fuel, tolls, insurance, ...) have nothing to do
-- with a work order.
-- ============================================================================
alter table public.expenses add column work_order_id uuid references public.work_orders (id) on delete set null;

create index expenses_work_order_id_idx on public.expenses (work_order_id);
