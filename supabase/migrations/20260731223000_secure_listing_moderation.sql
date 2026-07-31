alter table public.listings
  add column if not exists moderation_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

create index if not exists listings_moderation_queue_idx
  on public.listings (status, created_at desc)
  where status in ('pending_review', 'changes_requested');

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Active listings are public" on public.listings;
create policy "Active listings are public" on public.listings for select to anon, authenticated
using (status = 'active' or seller_id = (select auth.uid()));

drop policy if exists "Admins read all listings" on public.listings;
create policy "Admins read all listings" on public.listings for select to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Sellers create own listings" on public.listings;
create policy "Sellers create pending listings" on public.listings for insert to authenticated
with check (seller_id = (select auth.uid()) and status = 'pending_review');

drop policy if exists "Sellers update own listings" on public.listings;
create policy "Sellers update own listings" on public.listings for update to authenticated
using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()));

drop policy if exists "Admins moderate listings" on public.listings;
create policy "Admins moderate listings" on public.listings for update to authenticated
using ((select public.current_user_is_admin())) with check ((select public.current_user_is_admin()));

drop policy if exists "Sellers delete own draft listings" on public.listings;
create policy "Sellers delete own unpublished listings" on public.listings for delete to authenticated
using (seller_id = (select auth.uid()) and status in ('draft', 'pending_review', 'changes_requested', 'rejected'));

create or replace function public.enforce_listing_moderation() returns trigger
language plpgsql set search_path = '' as $$
declare
  is_privileged boolean := coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or public.current_user_is_admin();
begin
  if tg_op = 'INSERT' then
    if not is_privileged and new.status <> 'pending_review' then
      raise exception 'New listings must be submitted for review';
    end if;
    return new;
  end if;
  if is_privileged then
    if new.status is distinct from old.status and new.status in ('active', 'rejected', 'changes_requested') then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
      if new.status = 'active' then new.published_at := coalesce(new.published_at, now()); end if;
    end if;
    return new;
  end if;
  if new.seller_id is distinct from old.seller_id then raise exception 'The listing owner cannot be changed'; end if;
  if new.moderation_note is distinct from old.moderation_note
     or new.reviewed_at is distinct from old.reviewed_at
     or new.reviewed_by is distinct from old.reviewed_by then
    raise exception 'Moderation fields are managed by CLOZER';
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'active' and new.status = 'paused')
    or (old.status in ('draft', 'paused', 'rejected', 'changes_requested') and new.status = 'pending_review')
  ) then raise exception 'This status change requires admin approval'; end if;
  return new;
end;
$$;

drop trigger if exists enforce_listing_moderation_trigger on public.listings;
create trigger enforce_listing_moderation_trigger before insert or update on public.listings
for each row execute function public.enforce_listing_moderation();
revoke all on function public.enforce_listing_moderation() from public, anon, authenticated;

create or replace function public.notify_listing_moderation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('active', 'rejected', 'changes_requested') then
    insert into public.notifications (user_id, type, title, body, href)
    values (new.seller_id, 'listing_moderation',
      case new.status when 'active' then 'Produkti u aprovua' when 'changes_requested' then 'Kërkohen ndryshime' else 'Produkti nuk u aprovua' end,
      case new.status when 'active' then 'Produkti "' || new.title || '" tani është publik në CLOZER.'
        when 'changes_requested' then coalesce(nullif(new.moderation_note, ''), 'Përditëso të dhënat ose fotografitë dhe ridërgoje për shqyrtim.')
        else coalesce(nullif(new.moderation_note, ''), 'Kontakto ekipin CLOZER nëse ke nevojë për sqarim.') end,
      '/dashboard');
  end if;
  return new;
end;
$$;

drop trigger if exists notify_listing_moderation_trigger on public.listings;
create trigger notify_listing_moderation_trigger after update on public.listings
for each row execute function public.notify_listing_moderation();
revoke all on function public.notify_listing_moderation() from public, anon, authenticated;

drop policy if exists "Sellers create boosts for own listings" on public.listing_boosts;
create policy "Sellers create boosts for approved listings" on public.listing_boosts for insert to authenticated
with check (seller_id = (select auth.uid()) and exists (
  select 1 from public.listings l where l.id = listing_boosts.listing_id
    and l.seller_id = (select auth.uid()) and l.status = 'active'
));
