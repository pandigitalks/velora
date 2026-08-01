-- Cash on delivery orders are created atomically, with the listing locked and reserved.
create or replace function public.create_cash_on_delivery_order(
  p_listing_id uuid,
  p_shipping_address jsonb,
  p_shipping_method text,
  p_shipping_amount numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer_id uuid := (select auth.uid());
  v_listing public.listings%rowtype;
  v_order_id uuid;
begin
  if v_buyer_id is null then
    raise exception 'Duhet të kyçesh për të bërë porosi.';
  end if;

  if p_shipping_method not in ('courier_standard', 'courier_express', 'personal_pickup') then
    raise exception 'Mënyra e transportit nuk është e vlefshme.';
  end if;

  if coalesce(p_shipping_amount, 0) < 0 then
    raise exception 'Kostoja e transportit nuk është e vlefshme.';
  end if;

  if p_shipping_method <> 'personal_pickup'
     and nullif(btrim(coalesce(p_shipping_address->>'address', '')), '') is null then
    raise exception 'Adresa e dërgesës është e detyrueshme.';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found or v_listing.status <> 'active' then
    raise exception 'Ky produkt nuk është më i disponueshëm.';
  end if;

  if v_listing.seller_id = v_buyer_id then
    raise exception 'Nuk mund ta blesh shpalljen tënde.';
  end if;

  if p_shipping_method <> 'personal_pickup' and not v_listing.shipping_available then
    raise exception 'Ky shitës nuk ofron dërgesë për këtë produkt.';
  end if;

  insert into public.orders (
    buyer_id, seller_id, status, subtotal, shipping_amount, platform_fee, total,
    currency, shipping_address, payment_provider, payment_reference
  ) values (
    v_buyer_id, v_listing.seller_id, 'pending', v_listing.price, coalesce(p_shipping_amount, 0), 0,
    v_listing.price + coalesce(p_shipping_amount, 0), v_listing.currency, p_shipping_address,
    'cash_on_delivery', 'COD'
  ) returning id into v_order_id;

  insert into public.order_items (order_id, listing_id, title_snapshot, price, quantity)
  values (v_order_id, v_listing.id, v_listing.title, v_listing.price, 1);

  insert into public.shipments (order_id, method, status)
  values (v_order_id, p_shipping_method, 'preparing');

  update public.listings
  set status = 'reserved'
  where id = v_listing.id;

  insert into public.notifications (user_id, type, title, body, href)
  values
    (v_listing.seller_id, 'order', 'Porosi e re me pagesë në dorëzim', 'Përgatite produktin për dërgim te blerësi.', '/porosite'),
    (v_buyer_id, 'order', 'Porosia u konfirmua', 'Paguaje korrierin kur ta pranosh porosinë.', '/porosite');

  return v_order_id;
end;
$$;

revoke all on function public.create_cash_on_delivery_order(uuid, jsonb, text, numeric) from public, anon;
grant execute on function public.create_cash_on_delivery_order(uuid, jsonb, text, numeric) to authenticated;
