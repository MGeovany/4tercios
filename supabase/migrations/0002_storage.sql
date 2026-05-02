-- Storage buckets and policies for Huella / 4tercios
-- Buckets:
--   photos-original  (private)  — full-resolution originals, signed URLs only
--   photo-thumbs     (public)   — 1024px watermarked thumbnails
--   selfies          (private)  — temporary selfies, deleted after search

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos-original', 'photos-original', false, 26214400, array['image/jpeg','image/png','image/webp','image/heic']),
  ('photo-thumbs',    'photo-thumbs',    true,  4194304,  array['image/jpeg','image/png','image/webp']),
  ('selfies',         'selfies',         false, 8388608,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Path layout: {event_id}/{photo_id}.{ext}
-- Photographer can read/write paths whose first segment is an event id they own.

create policy "photos-original owner read"
on storage.objects for select to authenticated
using (
  bucket_id = 'photos-original'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.photographer_id = auth.uid()
  )
);

create policy "photos-original owner write"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos-original'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.photographer_id = auth.uid()
  )
);

create policy "photos-original owner update"
on storage.objects for update to authenticated
using (
  bucket_id = 'photos-original'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.photographer_id = auth.uid()
  )
);

create policy "photos-original owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'photos-original'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.photographer_id = auth.uid()
  )
);

-- Thumbnails are public.
create policy "photo-thumbs public read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'photo-thumbs');

create policy "photo-thumbs owner write"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photo-thumbs'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.photographer_id = auth.uid()
  )
);

-- Selfies: anyone can upload to a per-event prefix; only service role reads/deletes.
create policy "selfies anon insert"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'selfies'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.is_public
  )
);
