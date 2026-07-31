begin;

-- Keep a user's current privilege value intact while allowing normal profile edits.
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and is_admin = (select p.is_admin from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins manage brands" on public.brands;
create policy "Admins manage brands" on public.brands for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins manage messages" on public.messages;
create policy "Admins manage messages" on public.messages for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create or replace function public.admin_dashboard_snapshot()
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when not public.current_user_is_admin() then jsonb_build_object('error','forbidden')
  else jsonb_build_object(
    'generated_at', now(),
    'metrics', jsonb_build_object(
      'users',(select count(*) from public.profiles),
      'verified_sellers',(select count(*) from public.profiles where seller_verified),
      'active_listings',(select count(*) from public.listings where status='active'),
      'pending_listings',(select count(*) from public.listings where status in ('pending_review','changes_requested')),
      'orders',(select count(*) from public.orders),
      'open_orders',(select count(*) from public.orders where status not in ('delivered','cancelled','refunded')),
      'gmv',coalesce((select sum(total) from public.orders where status not in ('cancelled','refunded')),0),
      'revenue',coalesce((select sum(platform_fee) from public.orders where status not in ('cancelled','refunded')),0),
      'pending_authenticity',(select count(*) from public.authenticity_checks where status in ('pending','ai_review','manual_review')),
      'unread_messages',(select count(*) from public.messages where read_at is null),
      'disputes',(select count(*) from public.orders where status='disputed'),
      'approval_rate',coalesce((select round(100.0*count(*) filter(where status in ('active','reserved','sold'))/nullif(count(*),0)) from public.listings),100)
    ),
    'trends',(select coalesce(jsonb_agg(jsonb_build_object('day',d.day::date,'users',(select count(*) from public.profiles p where p.created_at>=d.day and p.created_at<d.day+interval '1 day'),'listings',(select count(*) from public.listings l where l.created_at>=d.day and l.created_at<d.day+interval '1 day'),'orders',(select count(*) from public.orders o where o.created_at>=d.day and o.created_at<d.day+interval '1 day'),'revenue',coalesce((select sum(o.platform_fee) from public.orders o where o.created_at>=d.day and o.created_at<d.day+interval '1 day'),0)) order by d.day),'[]'::jsonb) from generate_series(date_trunc('day',now())-interval '13 days',date_trunc('day',now()),interval '1 day') d(day)),
    'users',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select p.id,p.full_name,p.username,u.email,p.city,p.country_code,p.seller_verified,p.identity_verified,p.is_admin,u.email_confirmed_at,u.last_sign_in_at,p.created_at from public.profiles p join auth.users u on u.id=p.id order by p.created_at desc limit 100)x),
    'listings',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select l.id,l.title,l.price,l.currency,l.status,l.authenticity_status,l.views_count,l.created_at,coalesce(p.full_name,p.username,'Pa emër') seller_name,b.name brand_name,c.name_sq category_name from public.listings l join public.profiles p on p.id=l.seller_id left join public.brands b on b.id=l.brand_id left join public.categories c on c.id=l.category_id order by l.created_at desc limit 100)x),
    'orders',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select o.id,o.status,o.total,o.currency,o.platform_fee,o.tracking_number,o.created_at,coalesce(bp.full_name,bp.username,'Pa emër') buyer_name,coalesce(sp.full_name,sp.username,'Pa emër') seller_name from public.orders o join public.profiles bp on bp.id=o.buyer_id join public.profiles sp on sp.id=o.seller_id order by o.created_at desc limit 100)x),
    'messages',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select m.id,m.conversation_id,m.body,m.read_at,m.created_at,coalesce(p.full_name,p.username,'Pa emër') sender_name from public.messages m join public.profiles p on p.id=m.sender_id order by m.created_at desc limit 100)x),
    'authenticity',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select a.id,a.status,a.confidence,a.risk_flags,a.created_at,l.title listing_title from public.authenticity_checks a join public.listings l on l.id=a.listing_id order by a.created_at desc limit 100)x),
    'categories',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name_sq,'slug',slug,'kind','Kategori','is_active',is_active) order by sort_order),'[]'::jsonb) from public.categories),
    'brands',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug,'kind','Markë','is_active',is_active) order by name),'[]'::jsonb) from public.brands)
  ) end;
$$;

create or replace function public.review_seller_application(target_user_id uuid,decision public.seller_application_status,review_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not (select public.current_user_is_admin()) then raise exception 'Admin access required' using errcode='42501'; end if;
  if decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected' using errcode='22023'; end if;
  update public.seller_applications set status=decision,admin_note=nullif(btrim(review_note),''),reviewed_by=(select auth.uid()),reviewed_at=now(),updated_at=now() where user_id=target_user_id and status='pending';
  if not found then raise exception 'Pending seller application not found' using errcode='P0002'; end if;
  update public.profiles set seller_verified=(decision='approved'),updated_at=now() where id=target_user_id;
  insert into public.notifications(user_id,type,title,body,href) values(target_user_id,'seller_application',case when decision='approved' then 'Aplikimi u aprovua' else 'Aplikimi nuk u aprovua' end,case when decision='approved' then 'Paneli i shitësit është aktiv tani.' else coalesce(nullif(btrim(review_note),''),'Kontakto CLOZER për më shumë informacion.') end,'/dashboard');
end; $$;

commit;
