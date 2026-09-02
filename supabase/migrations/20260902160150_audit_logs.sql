-- ============================================================================
-- audit_logs: the evidence trail. Critical tables get an UPDATE/DELETE
-- trigger that writes here automatically, so a change to money or an
-- incident record can never happen silently.
-- ============================================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id uuid not null,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_id_idx on public.audit_logs (organization_id);
create index audit_logs_record_idx on public.audit_logs (table_name, record_id);

alter table public.audit_logs enable row level security;

create policy "org members can read their audit log"
  on public.audit_logs for select
  to authenticated
  using (organization_id = public.current_org_id());

-- No insert/update/delete policy for `authenticated`: audit rows are only
-- ever written by the trigger below, which runs security definer.

create or replace function public.record_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_record_id uuid;
begin
  if tg_op = 'DELETE' then
    v_org_id := old.organization_id;
    v_record_id := old.id;
  else
    v_org_id := new.organization_id;
    v_record_id := new.id;
  end if;

  insert into public.audit_logs (
    organization_id, actor_id, action, table_name, record_id, previous_value, new_value
  )
  values (
    v_org_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_record_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;
