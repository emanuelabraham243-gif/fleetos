-- ============================================================================
-- Driver fields Phase 5 needs that Phase 1 had no use for yet: an
-- employee/reference id (distinct from the license number), and org-scoped
-- uniqueness on both -- the same "duplicate reference within an org is a
-- real mistake" rule Phase 3 already applied to vehicles.license_plate.
-- ============================================================================
alter table public.drivers add column employee_id text;

alter table public.drivers add constraint drivers_organization_id_employee_id_key unique (organization_id, employee_id);
alter table public.drivers add constraint drivers_organization_id_license_number_key unique (organization_id, license_number);

-- ============================================================================
-- driver_status gets ON_LEAVE (a driver can be temporarily unavailable
-- without being INACTIVE or SUSPENDED, which both carry a different
-- meaning -- inactive/suspended are administrative decisions, on-leave is
-- a scheduling fact) and moves to the same UPPER_SNAKE_CASE convention
-- every other status enum introduced since Phase 2 already uses
-- (trip_status, delivery_status, trip_stop_status). This enum has zero UI
-- call sites today (drivers.status was never surfaced before this phase),
-- so the rename is a clean swap, not a breaking one.
-- ============================================================================
alter table public.drivers alter column status drop default;
alter table public.drivers alter column status type text using status::text;
drop type public.driver_status;

create type public.driver_status as enum ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

alter table public.drivers
  alter column status type public.driver_status using upper(status)::public.driver_status,
  alter column status set default 'ACTIVE';

-- ============================================================================
-- driver_documents needs a document_number field, the same one
-- vehicle_documents already got in Phase 3 (a license/certificate number is
-- a distinct fact from which document type it is or when it expires).
-- ============================================================================
alter table public.driver_documents add column document_number text;

-- ============================================================================
-- Disputes get a driver_response field: the driver's own account of what
-- happened, preserved alongside the dispute's own facts/resolution -- never
-- silently overwritten, so it's append-only at the application layer. The
-- Phase 1 audit trigger is already attached to disputes, so every change to
-- this field (or anything else on the row) is already provably tracked.
-- ============================================================================
alter table public.disputes add column driver_response text;
