-- Seller approval belongs exclusively to the admin review workflow.
-- Users may update their own public profile fields, but never role flags.
revoke update on table public.profiles from authenticated;
grant update (username, full_name, avatar_url, bio, city, country_code, phone)
on table public.profiles to authenticated;
