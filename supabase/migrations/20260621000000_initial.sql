create extension if not exists pg_trgm;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number_16 text not null,
  number_4 text not null,
  number_3 text not null,
  created_at timestamptz not null default now(),
  constraint submissions_name_valid check (
    char_length(btrim(name)) between 1 and 120
  ),
  constraint submissions_number_16_valid check (number_16 ~ '^[0-9]{16}$'),
  constraint submissions_number_4_valid check (number_4 ~ '^[0-9]{4}$'),
  constraint submissions_number_3_valid check (number_3 ~ '^[0-9]{3}$')
);

create table if not exists public.form_settings (
  singleton boolean primary key default true,
  form_title text not null default 'Envie seus dados',
  success_message text not null default 'Dados enviados com sucesso.',
  name_label text not null default 'Nome',
  number_16_label text not null default 'Numero de 16 digitos',
  number_4_label text not null default 'Numero de 4 digitos',
  number_3_label text not null default 'Numero de 3 digitos',
  updated_at timestamptz not null default now(),
  constraint form_settings_singleton check (singleton = true),
  constraint form_settings_text_lengths check (
    char_length(form_title) between 1 and 120
    and char_length(success_message) between 1 and 240
    and char_length(name_label) between 1 and 80
    and char_length(number_16_label) between 1 and 80
    and char_length(number_4_label) between 1 and 80
    and char_length(number_3_label) between 1 and 80
  )
);

insert into public.form_settings (singleton)
values (true)
on conflict (singleton) do nothing;

create table if not exists public.submission_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_created_at_id_idx
  on public.submissions (created_at desc, id desc);
create index if not exists submissions_name_trgm_idx
  on public.submissions using gin (name gin_trgm_ops);
create index if not exists submissions_number_16_trgm_idx
  on public.submissions using gin (number_16 gin_trgm_ops);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

create or replace function public.list_submissions(
  p_query text default null,
  p_limit integer default 11,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  name text,
  number_16 text,
  number_4 text,
  number_3 text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, s.name, s.number_16, s.number_4, s.number_3, s.created_at
  from public.submissions s
  where (
    p_before_created_at is null
    or (s.created_at, s.id) < (p_before_created_at, p_before_id)
  )
  and (
    p_query is null
    or btrim(p_query) = ''
    or s.name ilike '%' || p_query || '%'
    or (
      regexp_replace(p_query, '[^0-9]', '', 'g') <> ''
      and (
        s.number_16 like '%' || regexp_replace(p_query, '[^0-9]', '', 'g') || '%'
        or s.number_4 like '%' || regexp_replace(p_query, '[^0-9]', '', 'g') || '%'
        or s.number_3 like '%' || regexp_replace(p_query, '[^0-9]', '', 'g') || '%'
      )
    )
  )
  order by s.created_at desc, s.id desc
  limit least(greatest(p_limit, 1), 101);
$$;

create or replace function public.get_submission_stats()
returns table (
  total bigint,
  today bigint,
  this_week bigint,
  this_month bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*)::bigint,
    count(*) filter (where created_at >= date_trunc('day', now()))::bigint,
    count(*) filter (where created_at >= date_trunc('week', now()))::bigint,
    count(*) filter (where created_at >= date_trunc('month', now()))::bigint
  from public.submissions;
$$;

create or replace function public.check_submission_rate_limit(
  p_key text,
  p_limit integer default 10,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempts integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.submission_rate_limits as limits (
    rate_key, window_started_at, attempts, updated_at
  )
  values (p_key, now(), 1, now())
  on conflict (rate_key) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
      then now()
      else limits.window_started_at
    end,
    attempts = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
      then 1
      else limits.attempts + 1
    end,
    updated_at = now()
  returning attempts into current_attempts;

  return current_attempts <= p_limit;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists form_settings_set_updated_at on public.form_settings;
create trigger form_settings_set_updated_at
before update on public.form_settings
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.submissions enable row level security;
alter table public.form_settings enable row level security;
alter table public.submission_rate_limits enable row level security;

drop policy if exists "Admins can read their membership" on public.admin_users;
create policy "Admins can read their membership"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can read submissions" on public.submissions;
create policy "Admins can read submissions"
on public.submissions for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can delete submissions" on public.submissions;
create policy "Admins can delete submissions"
on public.submissions for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can read settings" on public.form_settings;
create policy "Admins can read settings"
on public.form_settings for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can update settings" on public.form_settings;
create policy "Admins can update settings"
on public.form_settings for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke all on public.admin_users from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.form_settings from anon, authenticated;
revoke all on public.submission_rate_limits from anon, authenticated;

grant select on public.admin_users to authenticated;
grant select, delete on public.submissions to authenticated;
grant select, update on public.form_settings to authenticated;
grant insert, select on public.submissions to service_role;
grant select on public.form_settings to service_role;
grant all on public.submission_rate_limits to service_role;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.list_submissions(text, integer, timestamptz, uuid) from public, anon;
revoke all on function public.get_submission_stats() from public, anon;
revoke all on function public.check_submission_rate_limit(text, integer, integer) from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.list_submissions(text, integer, timestamptz, uuid) to authenticated;
grant execute on function public.get_submission_stats() to authenticated;
grant execute on function public.check_submission_rate_limit(text, integer, integer) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end $$;
