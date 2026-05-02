-- Auto-promote event status based on its photos.
-- Runs on every photos UPDATE that changes status. Cross-row aware so the event
-- status reflects the aggregate (Subiendo → Procesando → Listo / Con errores).

create or replace function public.refresh_event_status_for(p_event_id uuid) returns void
language plpgsql security definer as $$
declare
  total_count int;
  ready_count int;
  pending_count int; -- uploaded or processing
  error_count int;
  current_status public.event_status;
begin
  select count(*) into total_count from public.photos where event_id = p_event_id;
  if total_count = 0 then
    return;
  end if;

  select
    count(*) filter (where status = 'ready'),
    count(*) filter (where status in ('uploaded', 'processing')),
    count(*) filter (where status = 'error')
  into ready_count, pending_count, error_count
  from public.photos
  where event_id = p_event_id;

  select status into current_status from public.events where id = p_event_id;

  -- Don't override manual states.
  if current_status in ('Archivado', 'Borrador') then
    return;
  end if;

  if pending_count = 0 and ready_count > 0 and error_count = 0 then
    update public.events set status = 'Listo'
      where id = p_event_id and status is distinct from 'Listo';
  elsif pending_count = 0 and ready_count = 0 and error_count > 0 then
    update public.events set status = 'Con errores'
      where id = p_event_id and status is distinct from 'Con errores';
  elsif pending_count = 0 and ready_count > 0 and error_count > 0 then
    -- Mostly done but with at least one failure — surface the issue.
    update public.events set status = 'Con errores'
      where id = p_event_id and status is distinct from 'Con errores';
  elsif pending_count > 0 and (ready_count > 0 or error_count > 0) then
    update public.events set status = 'Procesando'
      where id = p_event_id and status not in ('Procesando');
  end if;
end;
$$;

create or replace function public.photos_status_trigger() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_event_status_for(new.event_id);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      perform public.refresh_event_status_for(new.event_id);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_event_status_for(old.event_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists photos_after_status_change on public.photos;
create trigger photos_after_status_change
after insert or update or delete on public.photos
for each row execute function public.photos_status_trigger();

grant execute on function public.refresh_event_status_for(uuid) to service_role;
