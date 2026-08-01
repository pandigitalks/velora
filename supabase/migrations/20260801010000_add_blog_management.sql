begin;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  content text not null default '',
  category text not null default 'EDITORIAL' check (char_length(category) between 2 and 60),
  cover_image text not null default '/assets/editorial-luxury.webp',
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_public_feed_idx
  on public.blog_posts (featured desc, published_at desc)
  where status = 'published';

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;

drop policy if exists "Published blog posts are public" on public.blog_posts;
create policy "Published blog posts are public"
on public.blog_posts for select
to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Admins read all blog posts" on public.blog_posts;
create policy "Admins read all blog posts"
on public.blog_posts for select
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Admins create blog posts" on public.blog_posts;
create policy "Admins create blog posts"
on public.blog_posts for insert
to authenticated
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins update blog posts" on public.blog_posts;
create policy "Admins update blog posts"
on public.blog_posts for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins delete blog posts" on public.blog_posts;
create policy "Admins delete blog posts"
on public.blog_posts for delete
to authenticated
using ((select public.current_user_is_admin()));

insert into public.blog_posts
  (slug, title, excerpt, content, category, cover_image, status, featured, published_at)
values
  ('1', 'Si ta vlerësosh një çantë vintage', 'Nga qepjet dhe hardueri te seria dhe historia e pronësisë.', E'Në tregun e modës së përdorur, detajet krijojnë besimin. Një produkt nuk vlerësohet vetëm nga emri i brendit, por nga materiali, ndërtimi, gjendja dhe historia e tij.\n\nShiko provat, jo vetëm përshtypjen. Fotografitë e qarta, numrat e serisë të maskuar, dokumentet dhe raporti i gjendjes ndërtojnë një pamje më të plotë.', 'UDHËZUES', '/assets/bag-one.webp', 'published', true, now() - interval '6 days'),
  ('2', 'Pse orët e mira mbajnë vlerën', 'Modeli, gjendja, dokumentet dhe rrallësia ndikojnë në çmim.', E'Vlera e një ore ndërtohet nga modeli, gjendja, prejardhja dhe dokumentacioni. Pjesët e ruajtura mirë vazhdojnë të tregojnë historinë e tyre edhe pas shumë vitesh.\n\nRrallësia dhe kërkesa ndikojnë në treg, por transparenca është ajo që ndërton besimin.', 'KOLEKSIONE', '/assets/watch-one.webp', 'published', false, now() - interval '5 days'),
  ('3', 'Quiet luxury, i shpjeguar', 'Materialet dhe prerja flasin më shumë se logoja.', E'Quiet luxury vendos cilësinë, materialin dhe prerjen përpara logos. Është një qasje që favorizon pjesët e qëndrueshme dhe kombinimet që nuk varen nga një sezon i vetëm.\n\nNë tregun e rishitjes, kjo filozofi shpesh përkthehet në vlerë më afatgjatë.', 'EDITORIAL', '/assets/blazer-one.webp', 'published', false, now() - interval '4 days'),
  ('4', 'Çfarë kontrollon një ekspert', 'Një vështrim transparent brenda procesit të autentikimit.', E'Eksperti kontrollon materialet, ndërtimin, shenjat identifikuese dhe konsistencën e produktit. Çdo detaj krahasohet me standardet e modelit dhe periudhës së prodhimit.\n\nAnaliza digjitale ndihmon në identifikimin e rrezikut, ndërsa kontrolli fizik mbetet niveli më i fortë.', 'AUTENTIKIM', '/assets/bracelet-one.webp', 'published', false, now() - interval '3 days'),
  ('5', 'Atletet që kalojnë sezonet', 'Silueta ikonike që mbeten relevante.', 'Disa silueta mbeten të kërkuara sepse bashkojnë identitetin, komoditetin dhe historinë kulturore. Gjendja dhe origjinaliteti janë vendimtarë për vlerën e tyre në tregun e dytë.', 'STIL', '/assets/sneaker-one.webp', 'published', false, now() - interval '2 days'),
  ('6', 'Jeta e dytë e një ikone', 'Pse moda e përdorur po riformëson luksin.', E'Moda e përdorur po ndryshon mënyrën si e kuptojmë pronësinë dhe luksin. Një pjesë e mirë nuk humb rëndësinë kur ndryshon pronar; ajo fiton një kapitull të ri.\n\nZgjedhja e kujdesshme e zgjat jetën e produktit dhe ruan vlerën e tij.', 'KULTURË', '/assets/bag-two.webp', 'published', false, now() - interval '1 day')
on conflict (slug) do nothing;

commit;
