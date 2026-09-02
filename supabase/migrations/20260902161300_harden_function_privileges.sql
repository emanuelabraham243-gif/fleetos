-- ============================================================================
-- Lock down function privileges flagged by the security advisor:
-- - `set_updated_at` had no fixed search_path.
-- - Every function below is granted EXECUTE to PUBLIC by default on
--   creation, which means `anon` could call the RLS helpers (harmless but
--   unintended) and, worse, `anon`/`authenticated` could call the
--   trigger-only functions directly via PostgREST's /rpc/ endpoint. Only
--   the three RLS helpers should be callable, and only by `authenticated`.
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.current_org_id() from public;
revoke execute on function public.current_role() from public;
revoke execute on function public.is_org_admin() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.record_audit_event() from public;
revoke execute on function public.upsert_vehicle_location() from public;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_org_admin() to authenticated;
