-- Medium-style claps/likes for public photographer profiles.
create table if not exists public.photographer_profile_likes (
  photographer_id uuid not null references public.photographers (id) on delete cascade,
  viewer_key text not null,
  clap_count integer not null default 1 check (clap_count >= 1 and clap_count <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (photographer_id, viewer_key)
);

create index if not exists photographer_profile_likes_photographer_idx
  on public.photographer_profile_likes (photographer_id);

create trigger photographer_profile_likes_set_updated_at
before update on public.photographer_profile_likes
for each row execute function public.touch_updated_at();

