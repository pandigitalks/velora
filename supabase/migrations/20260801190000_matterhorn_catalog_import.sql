alter table public.listings
  add column if not exists supplier text,
  add column if not exists supplier_product_id text,
  add column if not exists supplier_cost numeric(12,2),
  add column if not exists supplier_shipping numeric(12,2),
  add column if not exists supplier_profit numeric(12,2),
  add column if not exists supplier_payload jsonb not null default '{}'::jsonb,
  add column if not exists supplier_last_synced_at timestamptz;

create unique index if not exists listings_supplier_product_unique
  on public.listings (supplier, supplier_product_id)
  where supplier is not null and supplier_product_id is not null;

create table if not exists public.listing_variants (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  supplier_variant_uid text not null,
  name text not null,
  stock integer not null default 0 check (stock >= 0),
  max_processing_time integer,
  ean text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, supplier_variant_uid)
);

create index if not exists listing_variants_listing_idx on public.listing_variants (listing_id, stock desc);
alter table public.listing_variants enable row level security;

drop policy if exists "Variants of visible listings are readable" on public.listing_variants;
create policy "Variants of visible listings are readable" on public.listing_variants
for select to anon, authenticated
using (exists (
  select 1 from public.listings l
  where l.id = listing_id
    and (l.status = 'active' or l.seller_id = (select auth.uid()) or (select public.current_user_is_admin()))
));

grant select on public.listing_variants to anon, authenticated;
grant all on public.listing_variants to service_role;
grant all on public.listings, public.listing_images, public.brands to service_role;

drop trigger if exists listing_variants_set_updated_at on public.listing_variants;
create trigger listing_variants_set_updated_at
before update on public.listing_variants
for each row execute function public.set_updated_at();
