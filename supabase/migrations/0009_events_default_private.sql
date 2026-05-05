-- New events should stay private until photographer explicitly publishes.
alter table public.events
  alter column is_public set default false;
