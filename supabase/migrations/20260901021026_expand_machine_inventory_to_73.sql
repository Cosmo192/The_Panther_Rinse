begin;

-- Existing deployments used a constraint capped at machine number 30. Keep
-- the prefix/type protection while allowing the expanded inventory and future
-- additions. Existing rows, tokens, and statuses are preserved.
alter table public.machines
  drop constraint if exists machines_id_format_check;

alter table public.machines
  add constraint machines_id_format_check
  check (id ~ '^(washer|dryer)_[1-9][0-9]*$');

insert into public.machines (id, type, status, in_use_since, qr_token)
select 'washer_' || machine_number, 'washer', 'free', null, gen_random_uuid()::text
from generate_series(1, 41) as machine_number
on conflict (id) do nothing;

insert into public.machines (id, type, status, in_use_since, qr_token)
select 'dryer_' || machine_number, 'dryer', 'free', null, gen_random_uuid()::text
from generate_series(1, 32) as machine_number
on conflict (id) do nothing;

commit;
