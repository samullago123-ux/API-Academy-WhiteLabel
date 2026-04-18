create table if not exists public.public_certificates (
  certificate_id text primary key,
  public boolean not null default true,
  issued_at bigint not null,
  display_name text not null,
  course_version text not null,
  scores jsonb not null default '{}'::jsonb,
  signature text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.device_state (
  device_id text primary key,
  profile jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  certificate_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.device_events (
  device_id text not null,
  event_id text not null,
  name text not null,
  at bigint not null,
  session_id text,
  props jsonb not null default '{}'::jsonb,
  primary key (device_id, event_id)
);

create table if not exists public.certificate_rate_limits (
  ip text primary key,
  window_start bigint not null,
  count int not null default 0
);

alter table public.public_certificates enable row level security;
alter table public.device_state enable row level security;
alter table public.device_events enable row level security;
alter table public.certificate_rate_limits enable row level security;

drop policy if exists public_certificates_read on public.public_certificates;
create policy public_certificates_read on public.public_certificates
for select using (public = true);

drop policy if exists device_state_none on public.device_state;
create policy device_state_none on public.device_state
for all using (false) with check (false);

drop policy if exists device_events_none on public.device_events;
create policy device_events_none on public.device_events
for all using (false) with check (false);

drop policy if exists certificate_rate_limits_none on public.certificate_rate_limits;
create policy certificate_rate_limits_none on public.certificate_rate_limits
for all using (false) with check (false);

create or replace function public.verify_certificate(p_certificate_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when pc.certificate_id is null then null
      else jsonb_build_object(
        'certificateId', pc.certificate_id,
        'displayName', pc.display_name,
        'issuedAt', pc.issued_at,
        'courseVersion', pc.course_version,
        'scores', coalesce(pc.scores, '{}'::jsonb),
        'signature', coalesce(pc.signature, '')
      )
    end
  from public.public_certificates pc
  where pc.certificate_id = p_certificate_id
    and pc.public = true
  limit 1
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
