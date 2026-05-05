-- Watermark tile density: controls how many watermark instances appear across a photo.
-- 1.0 = default coverage, lower values = fewer tiles, higher values = more tiles.
alter table public.photographers
  add column if not exists watermark_density real not null default 1;
