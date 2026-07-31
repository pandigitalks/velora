export type CategoryNode = {
  slug: string;
  nameSq: string;
  nameEn: string;
  children?: CategoryNode[];
};

const clothingWomen: CategoryNode[] = [
  ["dresses", "Fustane", "Dresses"],
  ["tops-bodies", "Bluza dhe body", "Tops & bodies"],
  ["t-shirts-women", "T-shirt", "T-shirts"],
  ["shirts-women", "Këmisha", "Shirts"],
  ["trousers-women", "Pantallona", "Trousers"],
  ["shorts-bermudas-women", "Pantallona të shkurtra", "Shorts & bermudas"],
  ["cardigans-sweaters-women", "Kardiganë dhe triko", "Cardigans & sweaters"],
  ["co-ords-women", "Komplete", "Co-ord sets"],
  ["jeans-women", "Xhinse", "Jeans"],
  ["skirts", "Funde", "Skirts"],
  ["jackets-women", "Xhaketa dhe pallto", "Jackets & coats"],
  ["blazers-women", "Sako", "Blazers"],
  ["sweatshirts-joggers-women", "Duksa dhe trenerka", "Sweatshirts & joggers"],
  ["swimwear-women", "Rroba banje", "Swimwear"],
  ["lingerie", "Të brendshme dhe pizhame", "Lingerie & pyjamas"],
].map(([slug, nameSq, nameEn]) => ({ slug, nameSq, nameEn }));

const clothingMen: CategoryNode[] = [
  ["t-shirts-men", "T-shirt", "T-shirts"],
  ["shirts-men", "Këmisha", "Shirts"],
  ["polo-shirts", "Polo", "Polo shirts"],
  ["shorts-jorts-men", "Pantallona të shkurtra", "Shorts & jorts"],
  ["trousers-men", "Pantallona", "Trousers"],
  ["jeans-men", "Xhinse", "Jeans"],
  ["matching-sets-men", "Komplete", "Matching sets"],
  ["sweaters-knits-men", "Triko dhe kardiganë", "Sweaters & cardigans"],
  ["suits", "Kostume", "Suits"],
  ["blazers-men", "Sako", "Blazers"],
  ["jackets-overshirts-men", "Xhaketa dhe overshirts", "Jackets & overshirts"],
  ["hoodies-sweatshirts-men", "Duksa dhe trenerka", "Hoodies & sweatshirts"],
  ["swimwear-men", "Rroba banje", "Swimwear"],
  ["underwear-socks-men", "Të brendshme dhe çorape", "Underwear & socks"],
].map(([slug, nameSq, nameEn]) => ({ slug, nameSq, nameEn }));

const kidsProducts = (prefix: string): CategoryNode[] => [
  ["coats-jackets-kids", "Pallto dhe xhaketa", "Coats & jackets"],
  ["dresses-jumpsuits-kids", "Fustane dhe kominoshe", "Dresses & jumpsuits"],
  ["knitwear-kids", "Triko", "Knitwear"],
  ["sweatshirts-kids", "Duksa", "Sweatshirts"],
  ["t-shirts-kids", "T-shirt", "T-shirts"],
  ["shirts-blouses-kids", "Këmisha dhe bluza", "Shirts & blouses"],
  ["trousers-kids", "Pantallona", "Trousers"],
  ["jeans-kids", "Xhinse", "Jeans"],
  ["leggings-kids", "Leggings", "Leggings"],
  ["skirts-shorts-kids", "Funde dhe pantallona të shkurtra", "Skirts & shorts"],
  ["underwear-socks-kids", "Të brendshme dhe çorape", "Underwear & socks"],
  ["shoes-kids", "Këpucë", "Shoes"],
  ["bags-backpacks-kids", "Çanta dhe çanta shpine", "Bags & backpacks"],
  ["accessories-swimwear-kids", "Aksesorë dhe rroba banje", "Accessories & swimwear"],
].map(([slug, nameSq, nameEn]) => ({ slug: `${prefix}-${slug}`, nameSq, nameEn }));

export const categoryTree: CategoryNode[] = [
  {
    slug: "women",
    nameSq: "Femra",
    nameEn: "Women",
    children: [
      { slug: "women-clothing", nameSq: "Veshje", nameEn: "Clothing", children: clothingWomen },
      {
        slug: "women-shoes-accessories",
        nameSq: "Këpucë dhe aksesorë",
        nameEn: "Shoes & accessories",
        children: [
          { slug: "shoes-women", nameSq: "Këpucë", nameEn: "Shoes" },
          { slug: "trainers-women", nameSq: "Atlete", nameEn: "Trainers" },
          { slug: "bags-women", nameSq: "Çanta", nameEn: "Bags" },
          { slug: "accessories-jewellery-women", nameSq: "Aksesorë dhe bizhuteri", nameEn: "Accessories & jewellery" },
          { slug: "sunglasses-women", nameSq: "Syze dielli", nameEn: "Sunglasses" },
        ],
      },
    ],
  },
  {
    slug: "men",
    nameSq: "Meshkuj",
    nameEn: "Men",
    children: [
      { slug: "men-clothing", nameSq: "Veshje", nameEn: "Clothing", children: clothingMen },
      {
        slug: "men-shoes-accessories",
        nameSq: "Këpucë dhe aksesorë",
        nameEn: "Shoes & accessories",
        children: [
          { slug: "shoes-men", nameSq: "Këpucë", nameEn: "Shoes" },
          { slug: "trainers-men", nameSq: "Atlete", nameEn: "Trainers" },
          { slug: "bags-backpacks-men", nameSq: "Çanta dhe çanta shpine", nameEn: "Bags & backpacks" },
          { slug: "accessories-men", nameSq: "Aksesorë", nameEn: "Accessories" },
          { slug: "watches-men", nameSq: "Ora", nameEn: "Watches" },
          { slug: "sunglasses-men", nameSq: "Syze dielli", nameEn: "Sunglasses" },
        ],
      },
    ],
  },
  {
    slug: "kids",
    nameSq: "Fëmijë",
    nameEn: "Kids",
    children: [
      { slug: "girl-6-14", nameSq: "Vajza 6–14 vjeç", nameEn: "Girl 6–14 years", children: kidsProducts("girl-6-14") },
      { slug: "boy-6-14", nameSq: "Djem 6–14 vjeç", nameEn: "Boy 6–14 years", children: kidsProducts("boy-6-14") },
      { slug: "girl-1-6", nameSq: "Vajza 1½–6 vjeç", nameEn: "Girl 1½–6 years", children: kidsProducts("girl-1-6") },
      { slug: "boy-1-6", nameSq: "Djem 1½–6 vjeç", nameEn: "Boy 1½–6 years", children: kidsProducts("boy-1-6") },
      { slug: "baby-0-18", nameSq: "Bebe 0–18 muaj", nameEn: "Baby 0–18 months", children: kidsProducts("baby-0-18") },
    ],
  },
  {
    slug: "beauty",
    nameSq: "Bukuri",
    nameEn: "Beauty",
    children: [
      {
        slug: "beauty-products",
        nameSq: "Parfume dhe kozmetikë",
        nameEn: "Perfumes & cosmetics",
        children: [
          { slug: "perfumes-women", nameSq: "Parfume për femra", nameEn: "Women's perfumes" },
          { slug: "perfumes-men", nameSq: "Parfume për meshkuj", nameEn: "Men's perfumes" },
          { slug: "perfumes-kids", nameSq: "Parfume për fëmijë", nameEn: "Kids' perfumes" },
          { slug: "makeup", nameSq: "Grim", nameEn: "Makeup" },
          { slug: "hair", nameSq: "Kujdes për flokët", nameEn: "Hair" },
          { slug: "cosmetics", nameSq: "Kozmetikë", nameEn: "Cosmetics" },
        ],
      },
    ],
  },
];

export const departments = categoryTree.map(({ slug, nameSq, nameEn }) => ({ slug, nameSq, nameEn }));

export function findCategory(slug: string) {
  for (const department of categoryTree) {
    if (department.slug === slug) return department;
    for (const group of department.children ?? []) {
      if (group.slug === slug) return group;
      const leaf = group.children?.find((item) => item.slug === slug);
      if (leaf) return leaf;
    }
  }
  return undefined;
}

export function departmentGender(slug: string) {
  return slug === "women" ? "Femra" : slug === "men" ? "Meshkuj" : slug === "kids" ? "Fëmijë" : "Unisex";
}
