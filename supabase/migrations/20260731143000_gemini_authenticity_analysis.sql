begin;

alter table public.authenticity_checks
  add column if not exists risk_score smallint,
  add column if not exists classification text,
  add column if not exists review_status text not null default 'ai_completed',
  add column if not exists analyzed_at timestamptz;

alter table public.authenticity_checks
  drop constraint if exists authenticity_checks_risk_score_range,
  add constraint authenticity_checks_risk_score_range
    check (risk_score is null or risk_score between 0 and 100),
  drop constraint if exists authenticity_checks_classification_valid,
  add constraint authenticity_checks_classification_valid
    check (classification is null or classification in ('low_risk','medium_risk','high_risk','insufficient_evidence')),
  drop constraint if exists authenticity_checks_review_status_valid,
  add constraint authenticity_checks_review_status_valid
    check (review_status in ('ai_completed','manual_review_required','manual_review_completed'));

create index if not exists authenticity_checks_manual_queue_idx
  on public.authenticity_checks (created_at desc)
  where review_status = 'manual_review_required';

create table if not exists public.ai_authenticity_request_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_auth_request_user_window_idx
  on public.ai_authenticity_request_log (user_id, created_at desc);
create index if not exists ai_auth_request_listing_idx
  on public.ai_authenticity_request_log (listing_id, created_at desc);

alter table public.ai_authenticity_request_log enable row level security;
revoke all on public.ai_authenticity_request_log from public, anon, authenticated;
create policy "No client access to AI rate logs"
  on public.ai_authenticity_request_log for all to authenticated
  using (false) with check (false);

-- AI results may only be created by the trusted server using the service role.
drop policy if exists "Owners request authenticity checks" on public.authenticity_checks;
revoke insert, update, delete on public.authenticity_checks from anon, authenticated;

create or replace function public.protect_listing_authenticity_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.authenticity_status is distinct from old.authenticity_status
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
  then
    raise exception 'authenticity_status is managed by VELORA';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_protect_authenticity_status on public.listings;
create trigger listings_protect_authenticity_status
before update of authenticity_status on public.listings
for each row execute function public.protect_listing_authenticity_status();

commit;
