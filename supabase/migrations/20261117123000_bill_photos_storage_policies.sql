-- Owner-only access to bill photos under {factory_id}/...

create policy bill_photos_select_owner
on storage.objects
for select
using (
  bucket_id = 'bill-photos'
  and public.current_role() = 'owner'
  and (storage.foldername(name))[1] = public.current_factory_id()::text
);

create policy bill_photos_insert_owner
on storage.objects
for insert
with check (
  bucket_id = 'bill-photos'
  and public.current_role() = 'owner'
  and (storage.foldername(name))[1] = public.current_factory_id()::text
);

create policy bill_photos_update_owner
on storage.objects
for update
using (
  bucket_id = 'bill-photos'
  and public.current_role() = 'owner'
  and (storage.foldername(name))[1] = public.current_factory_id()::text
)
with check (
  bucket_id = 'bill-photos'
  and public.current_role() = 'owner'
  and (storage.foldername(name))[1] = public.current_factory_id()::text
);

create policy bill_photos_delete_owner
on storage.objects
for delete
using (
  bucket_id = 'bill-photos'
  and public.current_role() = 'owner'
  and (storage.foldername(name))[1] = public.current_factory_id()::text
);
