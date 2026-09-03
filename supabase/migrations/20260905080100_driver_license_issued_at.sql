-- Add Driver's spec explicitly asks for a license issue date alongside the
-- existing expiry -- drivers had expiry/number/class but no issue date.
alter table public.drivers add column license_issued_at date;
