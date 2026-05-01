-- Storage policies: validate uploads against the photos row.
-- This avoids relying on foldername(name) parsing and guarantees the client
-- can only upload objects that were pre-registered in `public.photos`.

-- Originals: allow insert only if a matching photos.storage_path exists.
-- We purposefully rely on `public.photos` RLS to enforce ownership.
create policy "photos-original upload matches photos row"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos-original'
  and exists (
    select 1
    from public.photos p
    where p.storage_path = name
  )
);

-- Thumbs: server-side (service role) writes these today, but keeping the rule
-- consistent doesn't hurt if you ever let owners write thumbs directly.
create policy "photo-thumbs upload matches photos row"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photo-thumbs'
  and exists (
    select 1
    from public.photos p
    where p.thumb_path = name
  )
);
