-- Allow photographers to customize watermark text while keeping style defaults.
alter table public.photographers
  add column if not exists watermark_label text not null default '4Tercios';
