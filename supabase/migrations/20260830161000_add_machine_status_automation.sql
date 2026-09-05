begin;

-- Keep status timestamps consistent at the database boundary, regardless of
-- whether a change comes from an Edge Function, SQL Editor, or cron job.
create or replace function public.set_machine_status_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'in_use' then
      new.in_use_since := now();
    else
      new.in_use_since := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_machine_status_timestamp on public.machines;
create trigger set_machine_status_timestamp
before update of status on public.machines
for each row
execute function public.set_machine_status_timestamp();

-- History writes happen in the same transaction as the machine update.
create or replace function public.log_machine_status_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.machine_history (machine_id, status, timestamp)
    values (new.id, new.status, now());
  end if;

  return new;
end;
$$;

drop trigger if exists log_machine_status_change on public.machines;
create trigger log_machine_status_change
after update of status on public.machines
for each row
execute function public.log_machine_status_change();

-- Trigger functions are invoked by PostgreSQL, not exposed as public RPCs.
revoke all on function public.set_machine_status_timestamp() from public;
revoke all on function public.log_machine_status_change() from public;

-- Release overdue machines every minute. The status/history triggers above
-- clear in_use_since and create the matching history record atomically.
create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'auto-release-laundry-machines';

select cron.schedule(
  'auto-release-laundry-machines',
  '* * * * *',
  $job$
    update public.machines
    set status = 'free'
    where status = 'in_use'
      and in_use_since <= now() - interval '50 minutes';
  $job$
);

commit;
