-- Schedule daily auto-archive of expired events.
-- Idempotent: re-running this migration replaces the existing schedule.
-- pg_cron requires Supabase Pro. On free tier this no-ops and prints a notice
-- instead of erroring out the migration.

do $$
declare
  has_cron boolean;
  has_job boolean;
  job_name constant text := '4tercios_archive_expired';
begin
  select exists (select 1 from pg_extension where extname = 'pg_cron') into has_cron;

  if not has_cron then
    -- Try to enable it (works on Pro, no-ops if already on; raises on free tier).
    begin
      execute 'create extension if not exists pg_cron';
      select exists (select 1 from pg_extension where extname = 'pg_cron') into has_cron;
    exception when others then
      raise notice 'pg_cron extension not available — skipping schedule. Enable in Database → Extensions on Supabase Pro.';
      return;
    end;
  end if;

  if not has_cron then
    raise notice 'pg_cron extension not available — skipping schedule.';
    return;
  end if;

  -- Replace any prior schedule with the same name so re-running is safe.
  select exists (select 1 from cron.job where jobname = job_name) into has_job;
  if has_job then
    perform cron.unschedule(job_name);
  end if;

  perform cron.schedule(
    job_name,
    '0 4 * * *', -- 04:00 UTC = 22:00 Honduras
    $cron$
      select public.archive_expired_events();
      select public.purge_expired_event_media();
    $cron$
  );

  raise notice 'Scheduled daily auto-archive at 04:00 UTC.';
end$$;
