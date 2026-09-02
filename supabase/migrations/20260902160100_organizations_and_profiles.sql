-- ============================================================================
-- organizations: the tenant boundary. Every operational record belongs to one.
-- ============================================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- profiles: one row per authenticated user, 1:1 with auth.users, scoped to
-- exactly one organization.
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) > 0),
  email text not null,
  role public.org_role not null default 'viewer',
  phone text,
  avatar_url text,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates a profile automatically when a new auth user signs up.
-- Expects organization_id and full_name to be passed via signup metadata
-- (raw_user_meta_data) -- see src/lib/supabase/auth.ts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'organization_id')::uuid,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.org_role, 'viewer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS helper functions.
-- security definer + fixed search_path so they can safely read `profiles`
-- (which itself has RLS) without recursion or search-path hijacking.
-- ============================================================================
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns public.org_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_org_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_role() in ('owner', 'admin');
$$;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_org_admin() to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

create policy "members can read their own organization"
  on public.organizations for select
  to authenticated
  using (id = public.current_org_id());

create policy "admins can update their own organization"
  on public.organizations for update
  to authenticated
  using (id = public.current_org_id() and public.is_org_admin())
  with check (id = public.current_org_id() and public.is_org_admin());

create policy "members can read profiles in their organization"
  on public.profiles for select
  to authenticated
  using (organization_id = public.current_org_id());

create policy "members can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and organization_id = public.current_org_id());

create policy "admins can update profiles in their organization"
  on public.profiles for update
  to authenticated
  using (organization_id = public.current_org_id() and public.is_org_admin())
  with check (organization_id = public.current_org_id() and public.is_org_admin());
