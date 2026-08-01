alter table public.listings
  add column if not exists retail_price numeric(12,2) check (retail_price is null or retail_price >= 0),
  add column if not exists reference_code text;

comment on column public.listings.retail_price is 'Original retail price supplied by the seller.';
comment on column public.listings.reference_code is 'Seller supplied model or reference code.';
