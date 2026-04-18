alter table if exists public.public_certificates
add column if not exists share_url text;

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
        'signature', coalesce(pc.signature, ''),
        'shareUrl', coalesce(pc.share_url, '')
      )
    end
  from public.public_certificates pc
  where pc.certificate_id = p_certificate_id
    and pc.public = true
  limit 1
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
