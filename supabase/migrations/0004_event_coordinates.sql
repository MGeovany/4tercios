-- Add optional map coordinates for events.
alter table public.events
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

alter table public.events
  drop constraint if exists events_location_lat_chk,
  drop constraint if exists events_location_lng_chk;

alter table public.events
  add constraint events_location_lat_chk
    check (location_lat is null or (location_lat >= -90 and location_lat <= 90)),
  add constraint events_location_lng_chk
    check (location_lng is null or (location_lng >= -180 and location_lng <= 180));
