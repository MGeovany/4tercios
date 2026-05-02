-- Media retention: purge storage + heavy tables after a grace period.
-- Requirement: 14 days after an event becomes `Listo`, originals/thumbs should be deleted
-- to save storage. The event remains as history (audit), but photos no longer load.

alter table public.events
  add column if not exists ready_at timestamptz,
  add column if not exists purged_at timestamptz;

-- When an event is first promoted to `Listo`, stamp ready_at once.
create or replace function public.set_event_ready_at_once() returns trigger
language plpgsql as $$
begin
  if new.status = 'Listo' and (old.status is distinct from 'Listo') and new.ready_at is null then
    new.ready_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists events_set_ready_at on public.events;
create trigger events_set_ready_at
before update of status on public.events
for each row execute function public.set_event_ready_at_once();

-- Purge function: deletes storage objects by prefix, then DB rows.
-- Keep the event row for audit/history.
create or replace function public.purge_event_media(p_event_id uuid) returns void
language plpgsql security definer as $$
declare
  prefix text;
begin
  prefix := p_event_id::text || '/';

  -- Delete storage objects for this event.
  delete from storage.objects
   where name like prefix || '%'
     and bucket_id in ('photos-original', 'photo-thumbs', 'selfies');

  -- Delete heavy derived data.
  delete from public.faces where event_id = p_event_id;
  delete from public.selfie_queries where event_id = p_event_id;
  delete from public.photos where event_id = p_event_id;

  -- Mark as purged + keep as non-public history.
  update public.events
     set purged_at = now(),
         is_public = false,
         status = 'Archivado'
   where id = p_event_id;
end;
$$;

grant execute on function public.purge_event_media(uuid) to service_role;

-- Daily job runner: purge events 14 days after ready_at.
create or replace function public.purge_expired_event_media() returns int
language plpgsql security definer as $$
declare
  affected int := 0;
  r record;
begin
  for r in
    select id
      from public.events
     where ready_at is not null
       and purged_at is null
       and ready_at < now() - interval '14 days'
  loop
    perform public.purge_event_media(r.id);
    affected := affected + 1;
  end loop;
  return affected;
end;
$$;

grant execute on function public.purge_expired_event_media() to service_role;
