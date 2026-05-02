alter table public.photographers
  add column if not exists theme_palette text not null default 'deep-blue',
  add column if not exists theme_font text not null default 'inter',
  add column if not exists watermark_style text not null default 'subtle',
  add column if not exists watermark_color text not null default '#ffffff',
  add column if not exists watermark_font text not null default 'sans';

alter table public.photographers
  add constraint photographers_theme_palette_check
  check (theme_palette in ('deep-blue', 'sunset', 'forest', 'mono'));

alter table public.photographers
  add constraint photographers_theme_font_check
  check (theme_font in ('inter', 'poppins', 'lora', 'space-grotesk'));

alter table public.photographers
  add constraint photographers_watermark_style_check
  check (watermark_style in ('none', 'subtle', 'bold'));

alter table public.photographers
  add constraint photographers_watermark_font_check
  check (watermark_font in ('sans', 'serif', 'mono', 'display'));
