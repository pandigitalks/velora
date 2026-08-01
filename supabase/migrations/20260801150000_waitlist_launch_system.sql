begin;

create table if not exists public.site_settings (
  id text primary key default 'global' check (id = 'global'),
  waitlist_enabled boolean not null default true,
  waitlist_headline text not null default 'CLOZER po vjen. Hyr para të gjithëve.',
  waitlist_gift_cards integer not null default 3 check (waitlist_gift_cards between 0 and 20),
  waitlist_gift_value numeric(10,2) not null default 100 check (waitlist_gift_value >= 0),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, waitlist_enabled)
values ('global', true)
on conflict (id) do nothing;

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  position bigint generated always as identity unique,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text check (phone is null or char_length(btrim(phone)) between 6 and 30),
  interest text not null check (interest in ('buyer', 'seller', 'both')),
  referral_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  referred_by uuid references public.waitlist_entries(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'disqualified')),
  is_winner boolean not null default false,
  winner_value numeric(10,2) check (winner_value is null or winner_value >= 0),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists waitlist_entries_email_lower_idx
on public.waitlist_entries (lower(email));
create index if not exists waitlist_entries_referred_by_idx
on public.waitlist_entries (referred_by);
create index if not exists waitlist_entries_created_at_idx
on public.waitlist_entries (created_at desc);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists waitlist_entries_set_updated_at on public.waitlist_entries;
create trigger waitlist_entries_set_updated_at before update on public.waitlist_entries
for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
alter table public.waitlist_entries enable row level security;

drop policy if exists "Admins read site settings" on public.site_settings;
create policy "Admins read site settings" on public.site_settings for select to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins read waitlist" on public.waitlist_entries;
create policy "Admins read waitlist" on public.waitlist_entries for select to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins update waitlist" on public.waitlist_entries;
create policy "Admins update waitlist" on public.waitlist_entries for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins delete waitlist" on public.waitlist_entries;
create policy "Admins delete waitlist" on public.waitlist_entries for delete to authenticated
using ((select public.current_user_is_admin()));

revoke all on public.site_settings from anon, authenticated;
revoke all on public.waitlist_entries from anon, authenticated;
grant select, update on public.site_settings to authenticated;
grant select, update, delete on public.waitlist_entries to authenticated;

create or replace function public.waitlist_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'enabled', coalesce((select s.waitlist_enabled from public.site_settings s where s.id = 'global'), false),
    'total', (select count(*) from public.waitlist_entries w where w.status = 'active'),
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
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
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
    return jsonb_build_object('joined', false, 'position', v_entry.position, 'referral_code', v_entry.referral_code, 'referrals', v_referrals, 'entries', 1 + v_referrals);
  end if;

  if nullif(btrim(coalesce(p_referral_code, '')), '') is not null then
    select w.id into v_referrer_id
    from public.waitlist_entries w
    where upper(w.referral_code) = upper(btrim(p_referral_code)) and w.status = 'active';
  end if;

  insert into public.waitlist_entries (full_name, email, phone, interest, referred_by)
  values (v_name, v_email, v_phone, p_interest, v_referrer_id)
  returning * into v_entry;

  return jsonb_build_object('joined', true, 'position', v_entry.position, 'referral_code', v_entry.referral_code, 'referrals', 0, 'entries', 1);
end;
$$;

create or replace function public.waitlist_status(p_referral_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select jsonb_build_object(
      'position', w.position,
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

commit;
