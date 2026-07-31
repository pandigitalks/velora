begin;

drop policy if exists "Public avatar files" on storage.objects;
drop policy if exists "Public listing files" on storage.objects;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

drop policy if exists "Sellers manage listing images" on public.listing_images;
create policy "Sellers create listing images" on public.listing_images for insert to authenticated
  with check (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = (select auth.uid())
  ));
create policy "Sellers update listing images" on public.listing_images for update to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = (select auth.uid())
  ));
create policy "Sellers delete listing images" on public.listing_images for delete to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = (select auth.uid())
  ));

create index categories_parent_idx on public.categories (parent_id);
create index favorites_listing_idx on public.favorites (listing_id);
create index messages_sender_idx on public.messages (sender_id);
create index order_items_listing_idx on public.order_items (listing_id);
create index authenticity_checks_listing_idx on public.authenticity_checks (listing_id);
create index authenticity_checks_requester_idx on public.authenticity_checks (requested_by);
create index authenticity_checks_reviewer_idx on public.authenticity_checks (reviewed_by) where reviewed_by is not null;

commit;
