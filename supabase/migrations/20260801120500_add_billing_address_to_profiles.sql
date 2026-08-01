alter table public.profiles
  add column if not exists billing_address jsonb not null default '{}'::jsonb;

revoke update on table public.profiles from authenticated;
grant update (username, full_name, avatar_url, bio, city, country_code, phone, billing_address)
on table public.profiles to authenticated;
