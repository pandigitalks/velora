-- Public launch counter starts at 821 on 2026-08-01 and receives a
-- deterministic daily increase between 10 and 22. Real active entries
-- are added on top, while private/admin counts remain unchanged.

create or replace function public.waitlist_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with daily_growth as (
    select coalesce(sum(10 + mod(abs(hashtext((date '2026-08-01' + day_number)::text)), 13)), 0)::bigint as total
    from generate_series(1, greatest(current_date - date '2026-08-01', 0)) as day_number
  )
  select jsonb_build_object(
    'enabled', coalesce((select s.waitlist_enabled from public.site_settings s where s.id = 'global'), false),
    'total', 821 + (select total from daily_growth) + (select count(*) from public.waitlist_entries w where w.status = 'active'),
    'gift_cards', coalesce((select s.waitlist_gift_cards from public.site_settings s where s.id = 'global'), 3),
    'gift_value', coalesce((select s.waitlist_gift_value from public.site_settings s where s.id = 'global'), 100)
  );
$$;

create or replace function public.join_waitlist(
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_interest text default 'both',
  p_referral_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.waitlist_entries%rowtype;
  v_referrer_id uuid;
  v_referrals bigint;
  v_public_offset bigint;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  select 821 + coalesce(sum(10 + mod(abs(hashtext((date '2026-08-01' + day_number)::text)), 13)), 0)::bigint
  into v_public_offset
  from generate_series(1, greatest(current_date - date '2026-08-01', 0)) as day_number;

  if not coalesce((select s.waitlist_enabled from public.site_settings s where s.id = 'global'), false) then
    raise exception 'Lista e pritjes është mbyllur për momentin.' using errcode = 'P0001';
  end if;
  if char_length(v_name) not between 2 and 80 then
    raise exception 'Shkruaj emrin e plotë.' using errcode = '22023';
  end if;
  if char_length(v_email) not between 5 and 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Shkruaj një email të vlefshëm.' using errcode = '22023';
  end if;
  if v_phone is not null and char_length(v_phone) not between 6 and 30 then
    raise exception 'Numri i telefonit nuk është i vlefshëm.' using errcode = '22023';
  end if;
  if p_interest not in ('buyer', 'seller', 'both') then
    raise exception 'Zgjidh interesin tënd.' using errcode = '22023';
  end if;

  select * into v_entry from public.waitlist_entries w where lower(w.email) = v_email;
  if found then
    select count(*) into v_referrals from public.waitlist_entries r where r.referred_by = v_entry.id and r.status = 'active';
    return jsonb_build_object('joined', false, 'position', v_public_offset + v_entry.position, 'referral_code', v_entry.referral_code, 'referrals', v_referrals, 'entries', 1 + v_referrals);
  end if;

  if nullif(btrim(coalesce(p_referral_code, '')), '') is not null then
    select w.id into v_referrer_id
    from public.waitlist_entries w
    where upper(w.referral_code) = upper(btrim(p_referral_code)) and w.status = 'active';
  end if;

  insert into public.waitlist_entries (full_name, email, phone, interest, referred_by)
  values (v_name, v_email, v_phone, p_interest, v_referrer_id)
  returning * into v_entry;

  return jsonb_build_object('joined', true, 'position', v_public_offset + v_entry.position, 'referral_code', v_entry.referral_code, 'referrals', 0, 'entries', 1);
end;
$$;

create or replace function public.waitlist_status(p_referral_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with daily_growth as (
    select 821 + coalesce(sum(10 + mod(abs(hashtext((date '2026-08-01' + day_number)::text)), 13)), 0)::bigint as public_offset
    from generate_series(1, greatest(current_date - date '2026-08-01', 0)) as day_number
  )
  select coalesce((
    select jsonb_build_object(
      'position', (select public_offset from daily_growth) + w.position,
      'referral_code', w.referral_code,
      'referrals', (select count(*) from public.waitlist_entries r where r.referred_by = w.id and r.status = 'active'),
      'entries', 1 + (select count(*) from public.waitlist_entries r where r.referred_by = w.id and r.status = 'active')
    )
    from public.waitlist_entries w
    where upper(w.referral_code) = upper(btrim(p_referral_code)) and w.status = 'active'
  ), '{}'::jsonb);
$$;

revoke all on function public.waitlist_public_stats() from public, anon, authenticated;
revoke all on function public.join_waitlist(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.waitlist_status(text) from public, anon, authenticated;
grant execute on function public.waitlist_public_stats() to anon, authenticated;
grant execute on function public.join_waitlist(text, text, text, text, text) to anon, authenticated;
grant execute on function public.waitlist_status(text) to anon, authenticated;
