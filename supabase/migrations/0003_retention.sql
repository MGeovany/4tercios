-- Retention guardrails — keep storage costs predictable.
-- Photos & faces auto-archive after the gallery closes; selfies auto-expire.

alter table public.events
  drop constraint if exists events_online_days_range;
alter table public.events
  add constraint events_online_days_range check (online_days between 1 and 60);

-- Helper: compute when an event's gallery should close.
create or replace function public.event_close_at(e public.events) returns timestamptz
language sql stable as $$
  select (e.date::timestamptz + (e.online_days || ' days')::interval);
$$;

-- Auto-archive job: cron-equivalent via SQL function. Call from a daily Edge Function
-- or pg_cron schedule once enabled in your Supabase project:
--   select cron.schedule('lensia_archive_expired', '0 4 * * *', $$ select public.archive_expired_events(); $$);
create or replace function public.archive_expired_events() returns int
language plpgsql security definer as $$
declare
  affected int;
begin
  update public.events e
     set status = 'Archivado',
         is_public = false
   where status not in ('Archivado','Borrador')
     and public.event_close_at(e) < now();
  get diagnostics affected = row_count;

  -- Drop matching selfie queries that have outlived their TTL.
  delete from public.selfie_queries
   where expires_at < now();

  return affected;
end;
$$;

grant execute on function public.archive_expired_events() to service_role;
