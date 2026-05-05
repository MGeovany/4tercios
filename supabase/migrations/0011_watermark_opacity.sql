-- User-configurable watermark opacity for previews and generated thumbs.
alter table public.photographers
  add column if not exists watermark_opacity real not null default 0.08;
