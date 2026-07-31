do $$ begin
  create type public.seller_application_status as enum ('pending','approved','rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.seller_applications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  city text not null check (char_length(city) between 2 and 80),
  seller_type text not null default 'individual' check (seller_type in ('individual','business')),
  note text check (note is null or char_length(note) <= 1000),
  status public.seller_application_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_applications enable row level security;
grant select, insert, update on public.seller_applications to authenticated;
grant select, insert, update on public.seller_applications to service_role;

create policy "Users read own seller application" on public.seller_applications
for select to authenticated
using ((select auth.uid()) = user_id or (select public.current_user_is_admin()));

create policy "Buyers submit seller application" on public.seller_applications
for insert to authenticated
with check (
  (select auth.uid()) = user_id and status = 'pending'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.seller_verified = false)
);

create policy "Users resubmit rejected seller application" on public.seller_applications
for update to authenticated
using ((select auth.uid()) = user_id and status = 'rejected')
with check ((select auth.uid()) = user_id and status = 'pending' and reviewed_by is null and reviewed_at is null);

drop policy if exists "Sellers create pending listings" on public.listings;
create policy "Approved sellers create pending listings" on public.listings
for insert to authenticated
with check (
  seller_id = (select auth.uid())
  and status = 'pending_review'::public.listing_status
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.seller_verified = true)
);

create or replace function public.review_seller_application(
  target_user_id uuid,
  decision public.seller_application_status,
  review_note text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not (select public.current_user_is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if decision not in ('approved','rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;
  update public.seller_applications
  set status = decision, admin_note = nullif(btrim(review_note), ''),
      reviewed_by = (select auth.uid()), reviewed_at = now(), updated_at = now()
  where user_id = target_user_id and status = 'pending';
  if not found then raise exception 'Pending seller application not found' using errcode = 'P0002'; end if;
  update public.profiles
  set seller_verified = (decision = 'approved'), updated_at = now()
  where id = target_user_id;
end;
$$;
revoke all on function public.review_seller_application(uuid, public.seller_application_status, text) from public;
revoke execute on function public.review_seller_application(uuid, public.seller_application_status, text) from anon;
grant execute on function public.review_seller_application(uuid, public.seller_application_status, text) to authenticated;
