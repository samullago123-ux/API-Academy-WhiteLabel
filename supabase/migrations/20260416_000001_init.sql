create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default ''
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.certificates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  certificate_id text,
  public boolean not null default false,
  issued_at bigint,
  display_name text,
  course_version text,
  scores jsonb,
  signature text,
  data jsonb
);

create unique index if not exists certificates_certificate_id_idx on public.certificates (certificate_id);

create table if not exists public.events (
  user_id uuid references auth.users(id) on delete cascade,
  event_id text not null,
  name text not null,
  at bigint not null,
  session_id text,
  props jsonb not null default '{}'::jsonb,
  primary key (user_id, event_id)
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;
alter table public.events enable row level security;

drop policy if exists profiles_rw_own on public.profiles;
create policy profiles_rw_own on public.profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists progress_rw_own on public.progress;
create policy progress_rw_own on public.progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists certificates_rw_own on public.certificates;
create policy certificates_rw_own on public.certificates
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists events_rw_own on public.events;
create policy events_rw_own on public.events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.verify_certificate(p_certificate_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when c.certificate_id is null then null
      else jsonb_build_object(
        'certificateId', c.certificate_id,
        'displayName', c.display_name,
        'issuedAt', c.issued_at,
        'courseVersion', c.course_version,
        'scores', coalesce(c.scores, '{}'::jsonb),
        'signature', coalesce(c.signature, '')
      )
    end
  from public.certificates c
  where c.certificate_id = p_certificate_id
    and c.public = true
  limit 1
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
