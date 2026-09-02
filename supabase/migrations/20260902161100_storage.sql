-- ============================================================================
-- Storage buckets. Files live in org-prefixed paths ("<organization_id>/...")
-- so the same RLS-style check used everywhere else applies to storage too.
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('attachments', 'attachments', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "org members can read their org's documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_org_id()::text);

create policy "org members can upload documents to their org"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = public.current_org_id()::text);

create policy "org members can read their org's attachments"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = public.current_org_id()::text);

create policy "org members can upload attachments to their org"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = public.current_org_id()::text);

create policy "anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can replace their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
