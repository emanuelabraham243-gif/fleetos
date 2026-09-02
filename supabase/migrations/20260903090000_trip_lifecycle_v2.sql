-- ============================================================================
-- Replace the Phase 1 placeholder trip_status enum with the full trip
-- lifecycle the Command Center needs. `trips` has zero rows in every
-- environment this has been applied to, so this is a clean swap rather
-- than a data migration.
--
-- Values are UPPER_SNAKE_CASE, language-neutral tokens -- never the
-- English display label. The UI maps these to English text now and to
-- Amharic (or any other language) later without touching business logic
-- or the database.
-- ============================================================================
alter table public.trips alter column status drop default;
alter table public.trips alter column status type text using status::text;
drop type public.trip_status;

create type public.trip_status as enum (
  'DRAFT',
  'ASSIGNED',
  'LOADING',
  'DISPATCHED',
  'IN_TRANSIT',
  'ARRIVED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

alter table public.trips
  alter column status type public.trip_status using status::public.trip_status,
  alter column status set default 'DRAFT';
