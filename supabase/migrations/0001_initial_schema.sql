-- 4tercios — initial schema
-- Domain: photographers upload event photos, attendees find themselves via selfie search.
-- Face matching uses 512-d embeddings (ArcFace-style) stored in pgvector.

create extension if not exists "vector";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Photographers (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.photographers (
  id              uuid primary key references auth.users (id) on delete cascade,
  business_name   text not null default '',
  whatsapp        text,
  brand_color     text default '#18181b',
  payout_country  text default 'HN',
  payout_method   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create type public.event_type as enum ('Carrera','Graduacion','Boda','Torneo','Corporativo','Otro');
create type public.event_status as enum ('Borrador','Subiendo','Procesando','Listo','Con errores','Archivado');

create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  photographer_id     uuid not null references public.photographers (id) on delete cascade,
  slug                citext not null unique,
  name                text not null,
  type                public.event_type not null default 'Otro',
  date                date not null,
  city                text,
  venue               text,
  description         text,
  cover_photo_id      uuid,
  price_per_photo_hnl integer not null default 0,
  online_days         integer not null default 14,
  whatsapp            text,
  status              public.event_status not null default 'Borrador',
  is_public           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists events_photographer_idx on public.events (photographer_id, created_at desc);
create index if not exists events_public_idx on public.events (is_public, status) where is_public;

-- ---------------------------------------------------------------------------
-- Photos
-- ---------------------------------------------------------------------------
create type public.photo_status as enum ('uploaded','processing','ready','error');

create table if not exists public.photos (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,
  storage_path    text not null unique,            -- path inside the photos-original bucket
  thumb_path      text,                            -- path inside the photo-thumbs bucket (public)
  filename        text not null,
  bytes           bigint,
  width           integer,
  height          integer,
  taken_at        timestamptz,
  status          public.photo_status not null default 'uploaded',
  faces_count     integer not null default 0,
  error_message   text,
  created_at      timestamptz not null default now(),
  processed_at    timestamptz
);

create index if not exists photos_event_idx on public.photos (event_id, created_at desc);
create index if not exists photos_status_idx on public.photos (status) where status <> 'ready';

alter table public.events
  add constraint events_cover_photo_fk foreign key (cover_photo_id) references public.photos (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Faces (vector embeddings)
-- ---------------------------------------------------------------------------
create table if not exists public.faces (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references public.photos (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade, -- denormalised for fast filtering
  bbox        jsonb not null,                       -- {x,y,w,h} normalized 0..1
  quality     real,                                 -- detector confidence
  embedding   vector(512) not null,
  created_at  timestamptz not null default now()
);

create index if not exists faces_event_idx on public.faces (event_id);
create index if not exists faces_photo_idx on public.faces (photo_id);

-- IVFFlat index for cosine similarity. List count tuned for ~50k rows; recreate with more lists at scale.
create index if not exists faces_embedding_idx
  on public.faces using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------------
-- Selfie queries (anonymous searches)
-- ---------------------------------------------------------------------------
create table if not exists public.selfie_queries (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  embedding   vector(512) not null,
  ip_hash     text,                                 -- hashed source IP, never raw
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '24 hours')
);

create index if not exists selfie_queries_event_idx on public.selfie_queries (event_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create type public.order_status as enum ('pending','paid','delivered','cancelled');
create type public.payment_provider as enum ('manual_whatsapp','clinpays');

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  customer_name       text not null,
  customer_whatsapp   text not null,
  customer_email      text,
  selfie_query_id     uuid references public.selfie_queries (id) on delete set null,
  photo_ids           uuid[] not null,
  total_hnl           integer not null,
  status              public.order_status not null default 'pending',
  payment_provider    public.payment_provider not null default 'manual_whatsapp',
  payment_reference   text,
  payment_url         text,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  delivered_at        timestamptz
);

create index if not exists orders_event_idx on public.orders (event_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- ---------------------------------------------------------------------------
-- Trigger: maintain photographer + event aggregates on photo state changes.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger photographers_set_updated_at
before update on public.photographers
for each row execute function public.touch_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: find similar photos for an embedding (used by selfie search).
-- Aggregates per-photo best-match score so each photo is returned once.
-- ---------------------------------------------------------------------------
create or replace function public.search_photos_by_embedding(
  p_event_id uuid,
  p_embedding vector(512),
  p_limit int default 60,
  p_min_score real default 0.45
) returns table (
  photo_id      uuid,
  score         real,
  faces_count   int
)
language sql
stable
parallel safe
as $$
  select
    f.photo_id,
    max(1 - (f.embedding <=> p_embedding))::real as score,
    count(*)::int as faces_count
  from public.faces f
  where f.event_id = p_event_id
  group by f.photo_id
  having max(1 - (f.embedding <=> p_embedding)) >= p_min_score
  order by score desc
  limit p_limit;
$$;

grant execute on function public.search_photos_by_embedding(uuid, vector, int, real) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.photographers enable row level security;
alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.faces enable row level security;
alter table public.selfie_queries enable row level security;
alter table public.orders enable row level security;

-- photographers: each user manages their own row.
create policy photographers_self_select on public.photographers
  for select using (id = auth.uid());

create policy photographers_self_modify on public.photographers
  for all using (id = auth.uid()) with check (id = auth.uid());

-- events: photographer owns. Public can read public/active events.
create policy events_owner_all on public.events
  for all using (photographer_id = auth.uid()) with check (photographer_id = auth.uid());

create policy events_public_select on public.events
  for select using (is_public and status in ('Procesando','Listo'));

-- photos: photographer of the event manages all. Public reads ready photos of public events.
create policy photos_owner_all on public.photos
  for all using (
    exists (select 1 from public.events e where e.id = event_id and e.photographer_id = auth.uid())
  ) with check (
    exists (select 1 from public.events e where e.id = event_id and e.photographer_id = auth.uid())
  );

create policy photos_public_select on public.photos
  for select using (
    status = 'ready' and exists (
      select 1 from public.events e where e.id = event_id and e.is_public and e.status in ('Procesando','Listo')
    )
  );

-- faces: server-side only via service role. Photographer can read own.
create policy faces_owner_select on public.faces
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.photographer_id = auth.uid())
  );

-- selfie_queries: writes flow through service role. Photographers see queries on their events.
create policy selfie_queries_owner_select on public.selfie_queries
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.photographer_id = auth.uid())
  );

-- orders: photographer manages their orders; anonymous customers create via service role.
create policy orders_owner_all on public.orders
  for all using (
    exists (select 1 from public.events e where e.id = event_id and e.photographer_id = auth.uid())
  );
