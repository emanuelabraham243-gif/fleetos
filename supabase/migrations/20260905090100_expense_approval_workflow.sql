-- ============================================================================
-- Expenses get an approval workflow, separate from the existing
-- record_state column (active/voided/corrected/superseded/archived), which
-- already governs "is this row the authoritative record" and is shared
-- with fuel_transactions/revenues/payments. approval_status is a distinct
-- business-process concern (has a human reviewed this?) that only applies
-- to expenses, so it gets its own column and enum rather than overloading
-- record_state with values the other tables would never use.
-- ============================================================================
create type public.expense_approval_status as enum ('RECORDED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

alter table public.expenses add column approval_status public.expense_approval_status not null default 'RECORDED';
alter table public.expenses add column approved_by uuid references public.profiles (id) on delete set null;
alter table public.expenses add column approved_at timestamptz;
alter table public.expenses add column rejection_reason text;
alter table public.expenses add column void_reason text;

create index expenses_approval_status_idx on public.expenses (approval_status);

-- ============================================================================
-- Corrections: record_state already has 'corrected'/'superseded' values
-- from Phase 1, but nothing links which row replaced which. supersedes_id
-- makes that chain explicit -- a corrected expense is never edited in
-- place; a new row is inserted, the old row's status moves to 'corrected',
-- and the new row points back at it. History (the audit trigger already on
-- this table, plus this FK) shows both the original and corrected amounts,
-- never just the latest one.
-- ============================================================================
alter table public.expenses add column supersedes_id uuid references public.expenses (id) on delete set null;
alter table public.expenses add column correction_reason text;

create index expenses_supersedes_id_idx on public.expenses (supersedes_id);
