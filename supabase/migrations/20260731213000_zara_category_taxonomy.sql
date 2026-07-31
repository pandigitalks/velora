begin;

-- Stable product taxonomy based on Zara Albania's current Woman, Man, Kids
-- and Beauty navigation. Seasonal campaigns, collaborations and sale pages
-- are intentionally excluded because they are merchandising, not categories.
insert into public.categories (slug, name_sq, name_en, sort_order)
values
  ('women', 'Femra', 'Women', 10),
  ('men', 'Meshkuj', 'Men', 20),
  ('kids', 'Fëmijë', 'Kids', 30),
  ('beauty', 'Bukuri', 'Beauty', 40)
on conflict (slug) do update set
  name_sq = excluded.name_sq,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  parent_id = null,
  is_active = true;

with groups(parent_slug, slug, name_sq, name_en, sort_order) as (
  values
    ('women','women-clothing','Veshje','Clothing',10),
    ('women','women-shoes-accessories','Këpucë dhe aksesorë','Shoes & accessories',20),
    ('men','men-clothing','Veshje','Clothing',10),
    ('men','men-shoes-accessories','Këpucë dhe aksesorë','Shoes & accessories',20),
    ('kids','girl-6-14','Vajza 6–14 vjeç','Girl 6–14 years',10),
    ('kids','boy-6-14','Djem 6–14 vjeç','Boy 6–14 years',20),
    ('kids','girl-1-6','Vajza 1½–6 vjeç','Girl 1½–6 years',30),
    ('kids','boy-1-6','Djem 1½–6 vjeç','Boy 1½–6 years',40),
    ('kids','baby-0-18','Bebe 0–18 muaj','Baby 0–18 months',50),
    ('beauty','beauty-products','Parfume dhe kozmetikë','Perfumes & cosmetics',10)
)
insert into public.categories (parent_id, slug, name_sq, name_en, sort_order)
select p.id, g.slug, g.name_sq, g.name_en, g.sort_order
from groups g join public.categories p on p.slug = g.parent_slug
on conflict (slug) do update set
  parent_id = excluded.parent_id, name_sq = excluded.name_sq,
  name_en = excluded.name_en, sort_order = excluded.sort_order, is_active = true;

with leaves(parent_slug, slug, name_sq, name_en, sort_order) as (
  values
    ('women-clothing','dresses','Fustane','Dresses',10),
    ('women-clothing','tops-bodies','Bluza dhe body','Tops & bodies',20),
    ('women-clothing','t-shirts-women','T-shirt','T-shirts',30),
    ('women-clothing','shirts-women','Këmisha','Shirts',40),
    ('women-clothing','trousers-women','Pantallona','Trousers',50),
    ('women-clothing','shorts-bermudas-women','Pantallona të shkurtra','Shorts & bermudas',60),
    ('women-clothing','cardigans-sweaters-women','Kardiganë dhe triko','Cardigans & sweaters',70),
    ('women-clothing','co-ords-women','Komplete','Co-ord sets',80),
    ('women-clothing','jeans-women','Xhinse','Jeans',90),
    ('women-clothing','skirts','Funde','Skirts',100),
    ('women-clothing','jackets-women','Xhaketa dhe pallto','Jackets & coats',110),
    ('women-clothing','blazers-women','Sako','Blazers',120),
    ('women-clothing','sweatshirts-joggers-women','Duksa dhe trenerka','Sweatshirts & joggers',130),
    ('women-clothing','swimwear-women','Rroba banje','Swimwear',140),
    ('women-clothing','lingerie','Të brendshme dhe pizhame','Lingerie & pyjamas',150),
    ('women-shoes-accessories','shoes-women','Këpucë','Shoes',10),
    ('women-shoes-accessories','trainers-women','Atlete','Trainers',20),
    ('women-shoes-accessories','bags-women','Çanta','Bags',30),
    ('women-shoes-accessories','accessories-jewellery-women','Aksesorë dhe bizhuteri','Accessories & jewellery',40),
    ('women-shoes-accessories','sunglasses-women','Syze dielli','Sunglasses',50),
    ('men-clothing','t-shirts-men','T-shirt','T-shirts',10),
    ('men-clothing','shirts-men','Këmisha','Shirts',20),
    ('men-clothing','polo-shirts','Polo','Polo shirts',30),
    ('men-clothing','shorts-jorts-men','Pantallona të shkurtra','Shorts & jorts',40),
    ('men-clothing','trousers-men','Pantallona','Trousers',50),
    ('men-clothing','jeans-men','Xhinse','Jeans',60),
    ('men-clothing','matching-sets-men','Komplete','Matching sets',70),
    ('men-clothing','sweaters-knits-men','Triko dhe kardiganë','Sweaters & cardigans',80),
    ('men-clothing','suits','Kostume','Suits',90),
    ('men-clothing','blazers-men','Sako','Blazers',100),
    ('men-clothing','jackets-overshirts-men','Xhaketa dhe overshirts','Jackets & overshirts',110),
    ('men-clothing','hoodies-sweatshirts-men','Duksa dhe trenerka','Hoodies & sweatshirts',120),
    ('men-clothing','swimwear-men','Rroba banje','Swimwear',130),
    ('men-clothing','underwear-socks-men','Të brendshme dhe çorape','Underwear & socks',140),
    ('men-shoes-accessories','shoes-men','Këpucë','Shoes',10),
    ('men-shoes-accessories','trainers-men','Atlete','Trainers',20),
    ('men-shoes-accessories','bags-backpacks-men','Çanta dhe çanta shpine','Bags & backpacks',30),
    ('men-shoes-accessories','accessories-men','Aksesorë','Accessories',40),
    ('men-shoes-accessories','watches-men','Ora','Watches',50),
    ('men-shoes-accessories','sunglasses-men','Syze dielli','Sunglasses',60),
    ('beauty-products','perfumes-women','Parfume për femra','Women''s perfumes',10),
    ('beauty-products','perfumes-men','Parfume për meshkuj','Men''s perfumes',20),
    ('beauty-products','perfumes-kids','Parfume për fëmijë','Kids'' perfumes',30),
    ('beauty-products','makeup','Grim','Makeup',40),
    ('beauty-products','hair','Kujdes për flokët','Hair',50),
    ('beauty-products','cosmetics','Kozmetikë','Cosmetics',60)
)
insert into public.categories (parent_id, slug, name_sq, name_en, sort_order)
select p.id, l.slug, l.name_sq, l.name_en, l.sort_order
from leaves l join public.categories p on p.slug = l.parent_slug
on conflict (slug) do update set
  parent_id = excluded.parent_id, name_sq = excluded.name_sq,
  name_en = excluded.name_en, sort_order = excluded.sort_order, is_active = true;

with age_groups(slug) as (
  values ('girl-6-14'), ('boy-6-14'), ('girl-1-6'), ('boy-1-6'), ('baby-0-18')
), kid_types(base_slug, name_sq, name_en, sort_order) as (
  values
    ('coats-jackets-kids','Pallto dhe xhaketa','Coats & jackets',10),
    ('dresses-jumpsuits-kids','Fustane dhe kominoshe','Dresses & jumpsuits',20),
    ('knitwear-kids','Triko','Knitwear',30),
    ('sweatshirts-kids','Duksa','Sweatshirts',40),
    ('t-shirts-kids','T-shirt','T-shirts',50),
    ('shirts-blouses-kids','Këmisha dhe bluza','Shirts & blouses',60),
    ('trousers-kids','Pantallona','Trousers',70),
    ('jeans-kids','Xhinse','Jeans',80),
    ('leggings-kids','Leggings','Leggings',90),
    ('skirts-shorts-kids','Funde dhe pantallona të shkurtra','Skirts & shorts',100),
    ('underwear-socks-kids','Të brendshme dhe çorape','Underwear & socks',110),
    ('shoes-kids','Këpucë','Shoes',120),
    ('bags-backpacks-kids','Çanta dhe çanta shpine','Bags & backpacks',130),
    ('accessories-swimwear-kids','Aksesorë dhe rroba banje','Accessories & swimwear',140)
)
insert into public.categories (parent_id, slug, name_sq, name_en, sort_order)
select p.id, a.slug || '-' || k.base_slug, k.name_sq, k.name_en, k.sort_order
from age_groups a
join public.categories p on p.slug = a.slug
cross join kid_types k
on conflict (slug) do update set
  parent_id = excluded.parent_id, name_sq = excluded.name_sq,
  name_en = excluded.name_en, sort_order = excluded.sort_order, is_active = true;

commit;
