"use client";
/* eslint-disable @next/next/no-img-element */

import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  Check,
  ChevronDown,
  Eye,
  Pencil,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  Heart,
  Home,
  Fingerprint,
  HelpCircle,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Share2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingDown,
  UploadCloud,
  User,
  Flag,
  TrendingUp,
  WandSparkles,
  X,
} from "lucide-react";
import { ComponentProps, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import {
  createListing,
  getSellerListings,
  getPublicListings,
  updateListing,
  type SellerListing,
  type PublicListing,
} from "../lib/velora/listings";
import {
  categoryTree,
  departmentGender,
  departments,
  findCategory,
} from "../lib/velora/categories";
import { albanianPath, canonicalPath } from "../lib/routes";

function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink href={typeof href === "string" ? albanianPath(href) : href} {...props} />;
}

type ProductId = string | number;

type Product = {
  id: ProductId;
  sellerId?: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  position: string;
  seller: string;
  size: string;
  city: string;
  verified?: boolean;
  label?: string;
  category: string;
  color: string;
  condition: string;
  authLevel?: "none" | "ai" | "expert" | "physical";
  authRisk?: "low" | "medium" | "high";
  material?: string;
  gender?: string;
  shipping?: boolean;
  negotiable?: boolean;
  images?: string[];
  description?: string;
  sellerSlug?: string;
  sellerAvatar?: string | null;
  viewsCount?: number;
  publishedAt?: string | null;
  reference?: string;
  boostTier?: string | null;
};
type CartLine = { id: ProductId; qty: number };
type Note = {
  id: number;
  title: string;
  text: string;
  type: string;
  read: boolean;
  time: string;
};
type Order = {
  id: string;
  total: number;
  items: ProductId[];
  date: string;
  status: string;
  shippingMethod?: string;
  trackingNumber?: string;
};
type ChatMessage = { mine: boolean; text: string; time: string };
type Lang = "sq" | "en";
type AccountProfile = {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  city: string;
  sellerVerified: boolean;
  identityVerified: boolean;
  emailVerified: boolean;
  sellerApplicationStatus: "pending" | "approved" | "rejected" | null;
};
type ListingDraft = {
  id: ProductId;
  title: string;
  brand: string;
  category: string;
  condition: string;
  gender: string;
  size: string;
  retailPrice: number;
  price: number;
  description: string;
  color: string;
  material: string;
  reference: string;
  city: string;
  negotiable: boolean;
  shippingAvailable: boolean;
  image?: string;
  images?: string[];
  publishedAt: string;
};
type AuthenticityResult = {
  detected_brand: string;
  product_category: string;
  detected_model: string;
  visible_serial_number: string;
  authenticity_risk_score: number;
  confidence_score: number;
  classification:
    | "low_risk"
    | "medium_risk"
    | "high_risk"
    | "insufficient_evidence";
  positive_signals: string[];
  warning_signals: string[];
  missing_evidence: string[];
  required_additional_photos: string[];
  short_explanation_albanian: string;
};

const sqText: Record<string, string> = {
  Discover: "Eksploro",
  Sell: "Shit",
  Messages: "Mesazhet",
  Saved: "Të ruajturat",
  Cart: "Shporta",
  Brands: "Brendet",
  Stories: "Histori",
  "Professional sellers": "Shitës profesionalë",
  Notifications: "Njoftimet",
  Orders: "Porositë",
  Profile: "Profili im",
  Settings: "Cilësimet",
  Women: "Femra",
  Bags: "Çanta",
  Sneakers: "Atlete",
  Watches: "Ora",
  Jewelry: "Stoli",
  Accessories: "Aksesorë",
  All: "Të gjitha",
  Authenticated: "I autentikuar",
  "Price drops": "Ulje çmimesh",
  "Search products, brands or sellers": "Kërko produkte, brende ose shitës",
  "Quick view": "Shiko shpejt",
  "CURATED MARKETPLACE": "TREGU I PËRZGJEDHUR",
  "View all": "Shiko të gjitha",
  "THE CONSIDERED MARKETPLACE · 2026": "TREGU I MODËS SË PËRZGJEDHUR · 2026",
  "Remarkable pieces.": "Pjesë të jashtëzakonshme.",
  "Second lives.": "Një jetë e dytë.",
  "Authenticated luxury and modern icons, selected by people with exceptional taste.":
    "Luks i autentikuar dhe ikona moderne, të përzgjedhura nga njerëz me shije të veçantë.",
  "Shop the edit": "Bli përzgjedhjen",
  "Sell a piece": "Shit një produkt",
  "CLOZER AUTHENTICATED": "AUTENTIKUAR NGA CLOZER",
  "Expert reviewed, buyer protected":
    "Kontrolluar nga ekspertët, blerësi i mbrojtur",
  "SHOP BY WORLD": "EKSPLORO SIPAS KATEGORISË",
  "Find your next signature": "Gjej pjesën që të përfaqëson",
  "Curated for you": "Përzgjedhur për ty",
  "THE AUTHENTICATED EDIT": "PËRZGJEDHJA E AUTENTIKUAR",
  "Icons, then": "Ikona, dje",
  "and now.": "dhe sot.",
  "Explore pieces verified by our specialists":
    "Eksploro produkte të verifikuara nga specialistët tanë",
  "“Buy less, choose well, make it last.”":
    "“Bli më pak, zgjidh mirë dhe ruaje gjatë.”",
  "Discover new arrivals": "Shiko produktet e reja",
  "New today": "Të reja sot",
  "YOUR WARDROBE, REVALUED": "GARDEROBA JOTE, ME VLERË TË RE",
  "Give exceptional pieces their next chapter.":
    "Jepu pjesëve të veçanta kapitullin e radhës.",
  "Photograph it, review the smart listing, publish. You remain in control.":
    "Fotografoje, kontrollo shpalljen inteligjente dhe publikoje. Ti e ke kontrollin.",
  "Start selling": "Fillo të shesësh",
  "Smart listing assistant": "Asistenti inteligjent i shpalljes",
  "Bottega Veneta detected": "U identifikua Bottega Veneta",
  "Suggested range €1,180–€1,340": "Çmimi i sugjeruar €1,180–€1,340",
  DISCOVER: "EKSPLORO",
  "Pieces worth finding": "Pjesë që ia vlen t’i zbulosh",
  "Search with CLOZER AI": "Kërko me CLOZER AI",
  "Try “a quiet luxury bag under €800”": "Provo “çantë elegante nën 800€”",
  Filters: "Filtrat",
  Curated: "Të përzgjedhura",
  Newest: "Më të rejat",
  "Price: low to high": "Çmimi: i ulët në të lartë",
  "Price: high to low": "Çmimi: i lartë në të ulët",
  "Biggest price drops": "Uljet më të mëdha",
  "No matching pieces": "Nuk u gjet asnjë produkt",
  "Clear filters or try a broader search.":
    "Pastro filtrat ose provo një kërkim më të gjerë.",
  "Clear all filters": "Pastro të gjithë filtrat",
  "Maximum price": "Çmimi maksimal",
  "Authenticated only": "Vetëm të autentikuara",
  "Expert-inspected pieces": "Produkte të kontrolluara nga ekspertët",
  "Reset filters": "Rivendos filtrat",
  "CLOZER checked": "Kontrolluar nga CLOZER",
  "Buyer protection included": "Mbrojtja e blerësit përfshihet",
  "CLOZER Authentication": "Autentikimi CLOZER",
  "Inspected before it reaches you": "Kontrollohet para se të arrijë te ti",
  "Make an offer": "Bëj ofertë",
  "Add to bag": "Shto në shportë",
  "4 people are considering this piece":
    "4 persona po e shqyrtojnë këtë produkt",
  "Delivery & protection": "Dërgesa dhe mbrojtja",
  "Tracked insured shipping": "Dërgesë e siguruar me gjurmim",
  "Returns accepted within 48 hours of delivery":
    "Kthimi pranohet brenda 48 orëve nga pranimi",
  "You may also like": "Mund të të pëlqejnë edhe",
  "Offer sent": "Oferta u dërgua",
  "The seller has 24 hours to respond.":
    "Shitësi ka 24 orë për t’u përgjigjur.",
  Done: "Përfundo",
  "MAKE AN OFFER": "BËJ NJË OFERTË",
  "What feels fair?": "Cili çmim të duket i drejtë?",
  "The seller usually responds within an hour.":
    "Shitësi zakonisht përgjigjet brenda një ore.",
  "Your offer": "Oferta jote",
  "Message to seller": "Mesazh për shitësin",
  "Optional note": "Shënim opsional",
  "Send binding offer": "Dërgo ofertën",
  "LISTING PUBLISHED": "SHPALLJA U PUBLIKUA",
  "Your piece is live.": "Produkti yt u publikua.",
  "It is now visible in your wardrobe and ready for buyers.":
    "Tani shfaqet në garderobën tënde dhe është gati për blerësit.",
  "View listing": "Shiko shpalljen",
  "Sell another": "Shit një tjetër",
  "Draft saved locally": "Drafti u ruajt në pajisje",
  "Show us the piece.": "Na trego produktin.",
  "Use bright, honest photos. Include labels, serials and any signs of wear.":
    "Përdor fotografi të ndritshme dhe reale. Përfshi etiketat, numrat serikë dhe shenjat e përdorimit.",
  "Upload a product photo": "Ngarko fotografinë e produktit",
  "Photo ready for listing": "Fotografia është gati",
  "Describe your piece.": "Përshkruaje produktin.",
  "Review every detail before publishing.":
    "Kontrollo çdo detaj para publikimit.",
  "Listing title": "Titulli i shpalljes",
  Brand: "Brendi",
  Category: "Kategoria",
  Condition: "Gjendja",
  Description: "Përshkrimi",
  "Price with confidence.": "Vendose çmimin me siguri.",
  "Our suggested range is based on comparable marketplace sales.":
    "Sugjerimi ynë bazohet në shitje të ngjashme në treg.",
  "SUGGESTED RANGE": "ÇMIMI I SUGJERUAR",
  "Demand is high this week": "Kërkesa është e lartë këtë javë",
  "Your price": "Çmimi yt",
  "You receive after 12% fee": "Ti pranon pas tarifës 12%",
  "Ready for its next chapter.": "Gati për kapitullin e radhës.",
  Back: "Prapa",
  Continue: "Vazhdo",
  "Publish listing": "Publiko shpalljen",
  "Active now": "Aktiv tani",
  "View item": "Shiko produktin",
  "Search conversations": "Kërko bisedat",
  "Write a message…": "Shkruaj një mesazh…",
  "Make offer": "Bëj ofertë",
  "YOUR EDIT": "PËRZGJEDHJA JOTE",
  "Saved pieces": "Produktet e ruajtura",
  "Nothing saved yet": "Ende nuk ke ruajtur asgjë",
  "Tap the heart on any piece to keep it here.":
    "Prek zemrën te çdo produkt për ta ruajtur këtu.",
  "Start discovering": "Fillo të eksplorosh",
  "YOUR BAG": "SHPORTA JOTE",
  "Ready when you are": "Gati kur të jesh ti",
  "Order summary": "Përmbledhja e porosisë",
  Subtotal: "Nëntotali",
  "Protected shipping": "Dërgesë e mbrojtur",
  "Calculated next": "Llogaritet në hapin tjetër",
  Authentication: "Autentikimi",
  Included: "Përfshirë",
  Total: "Totali",
  "Secure checkout": "Pagesë e sigurt",
  "Your payment stays protected until delivery.":
    "Pagesa jote mbetet e mbrojtur deri në dorëzim.",
  "Your bag is empty": "Shporta jote është e zbrazët",
  "Exceptional pieces are only a discovery away.":
    "Produktet e veçanta janë vetëm një kërkim larg.",
  "Browse the marketplace": "Eksploro tregun",
  "No items to checkout": "Nuk ka produkte për pagesë",
  "Add a piece to your bag first.": "Së pari shto një produkt në shportë.",
  "Browse pieces": "Shiko produktet",
  "ORDER CONFIRMED": "POROSIA U KONFIRMUA",
  "Thank you, Arnis.": "Faleminderit, Arnis.",
  "Your protected order is confirmed. We’ll notify you at every step.":
    "Porosia jote e mbrojtur u konfirmua. Do të të njoftojmë në çdo hap.",
  "Track my order": "Gjurmo porosinë",
  "SECURE CHECKOUT": "PAGESË E SIGURT",
  "Delivery & payment": "Dërgesa dhe pagesa",
  "Encrypted checkout with buyer protection":
    "Pagesë e enkriptuar me mbrojtje të blerësit",
  "Delivery address": "Adresa e dërgesës",
  "Full name": "Emri i plotë",
  Address: "Adresa",
  "Street and number": "Rruga dhe numri",
  City: "Qyteti",
  "Postal code": "Kodi postar",
  Country: "Shteti",
  Payment: "Pagesa",
  "Card payment": "Pagesë me kartë",
  "Card number": "Numri i kartës",
  "Cash on delivery": "Pagesë gjatë pranimit",
  "Available for eligible local orders":
    "E disponueshme për porosi lokale të pranueshme",
  "Protected total": "Totali i mbrojtur",
  Items: "Produktet",
  Shipping: "Dërgesa",
  "Place protected order": "Konfirmo porosinë e mbrojtur",
  "This is a demo checkout. No real charge is made.":
    "Kjo është pagesë demonstruese. Nuk bëhet pagesë reale.",
  ACTIVITY: "AKTIVITETI",
  "Offers, orders and pieces you follow":
    "Ofertat, porositë dhe produktet që ndjek",
  "Mark all as read": "Shëno të gjitha si të lexuara",
  ACCOUNT: "LLOGARIA",
  "Control your privacy, security and notifications":
    "Menaxho privatësinë, sigurinë dhe njoftimet",
  Account: "Llogaria",
  "Privacy & safety": "Privatësia dhe siguria",
  Payments: "Pagesat",
  "Notification preferences": "Preferencat e njoftimeve",
  "Choose what deserves your attention.":
    "Zgjidh cilat njoftime dëshiron t’i marrësh.",
  Offers: "Ofertat",
  "Price drops": "Uljet e çmimeve",
  "Shipping updates": "Përditësimet e dërgesës",
  "Account protected": "Llogaria është e mbrojtur",
  "Email, phone and two-factor authentication verified":
    "Emaili, telefoni dhe verifikimi me dy hapa janë konfirmuar",
  "Review security": "Kontrollo sigurinë",
  "TRUSTED SELLER · MEMBER SINCE 2024": "SHITËS I BESUAR · ANËTAR QË NGA 2024",
  Rating: "Vlerësimi",
  Sold: "Të shitura",
  Followers: "Ndjekës",
  Following: "Duke ndjekur",
  "Seller studio": "Paneli i shitësit",
  "Identity verified": "Identitet i verifikuar",
  "Trusted seller": "Shitës i besuar",
  "Replies quickly": "Përgjigjet shpejt",
  Wardrobe: "Garderoba",
  Reviews: "Vlerësimet",
  Collections: "Koleksionet",
  "Explore pieces": "Eksploro produktet",
  "SELLER STUDIO": "PANELI I SHITËSIT",
  "Good evening, Arnis.": "Mirëmbrëma, Arnis.",
  "Your wardrobe is performing 18% better this week.":
    "Garderoba jote po performon 18% më mirë këtë javë.",
  "New listing": "Shpallje e re",
  "NET REVENUE · 30 DAYS": "TË HYRAT NETO · 30 DITË",
  "Active listings": "Shpallje aktive",
  "Items sold": "Produkte të shitura",
  Conversion: "Konvertimi",
  "Recent orders": "Porositë e fundit",
  "View all": "Shiko të gjitha",
  "Ready to ship": "Gati për dërgim",
  Delivered: "Dorëzuar",
  "Store health": "Gjendja e dyqanit",
  "Excellent standing": "Gjendje e shkëlqyer",
  "Response time": "Koha e përgjigjes",
  "Ships within": "Dërgon brenda",
  "Buyer rating": "Vlerësimi i blerësve",
  Cancellation: "Anulimet",
  PURCHASES: "BLERJET",
  "Your orders": "Porositë e tua",
  "Track authentication, shipping and delivery":
    "Gjurmo autentikimin, dërgesën dhe dorëzimin",
  "Track order": "Gjurmo porosinë",
  "No orders yet": "Ende nuk ka porosi",
  "Your protected purchases will appear here.":
    "Blerjet e tua të mbrojtura do të shfaqen këtu.",
  "Discover pieces": "Eksploro produktet",
  Home: "Ballina",
  Inbox: "Bisedat",
  Bag: "Shporta",
  "The considered marketplace for authenticated fashion, modern icons and remarkable second lives.":
    "Tregu i përzgjedhur për modë të autentikuar, ikona moderne dhe produkte me një jetë të dytë.",
  "How it works": "Si funksionon",
  "Seller protection": "Mbrojtja e shitësit",
  About: "Rreth nesh",
  "Trust & safety": "Besimi dhe siguria",
  "Help center": "Qendra e ndihmës",
  "The weekly edit": "Përzgjedhja javore",
  "Good taste, delivered.": "Shije e mirë, drejtpërdrejt te ti.",
  "Email address": "Adresa e emailit",
  Privacy: "Privatësia",
  Terms: "Kushtet",
  "Mini Jodie woven bag": "Çantë e endur Mini Jodie",
  "Vintage double-breasted blazer": "Xhaketë vintage me kopsa të dyfishta",
  "High-top heritage sneaker": "Atlete klasike të larta",
  "Oyster-style perpetual 36": "Orë automatike Oyster 36",
  "Triomphe cat-eye sunglasses": "Syze dielli Triomphe cat-eye",
  "Monogram-edge silk scarf": "Shami mëndafshi me monogram",
  "Sculptural leather shoulder bag": "Çantë krahu skulpturore prej lëkure",
  "Love-style bracelet, small model": "Byzylyk Love, modeli i vogël",
  "Slim leather wallet & belt set": "Set kuletë dhe rrip prej lëkure",
  "One size": "Një madhësi",
  Excellent: "Shkëlqyeshëm",
  "Very good": "Shumë mirë",
  Good: "Mirë",
  New: "E re",
  Black: "E zezë",
  Red: "E kuqe",
  Silver: "E argjendtë",
  Cream: "Krem",
  Burgundy: "Bordo",
  Gold: "Ari",
  Olive: "Ulliri",
  "Price drop": "Ulje çmimi",
  "Your offer was accepted": "Oferta jote u pranua",
  "Order authenticated": "Porosia u autentikua",
  Yesterday: "Dje",
  Now: "Tani",
  "New buyer and seller messages": "Mesazhe të reja nga blerësit dhe shitësit",
  "New, accepted and counter offers":
    "Oferta të reja, të pranuara dhe kundëroferta",
  "Changes to your saved pieces": "Ndryshime në produktet e ruajtura",
  "Tracking and authentication milestones": "Gjurmimi dhe fazat e autentikimit",
  "Buy now ·": "Bli tani ·",
  "Estimated 4–7 days · €14.90": "Afati i parashikuar 4–7 ditë · 14.90€",
  "Ships from": "Dërgohet nga",
  "4.9 · 128 sales": "4.9 · 128 shitje",
  "STEP 1 OF 4": "HAPI 1 NGA 4",
  "STEP 2 OF 4 · SMART DETAILS": "HAPI 2 NGA 4 · DETAJET INTELIGJENTE",
  "STEP 3 OF 4 · PRICING": "HAPI 3 NGA 4 · ÇMIMI",
  "STEP 4 OF 4 · REVIEW": "HAPI 4 NGA 4 · KONTROLLI",
  "JPG, PNG or HEIC · up to 15 MB": "JPG, PNG ose HEIC · deri në 15 MB",
  "Mini Jodie bag": "Çanta Mini Jodie",
  "Saint Laurent blazer": "Xhaketa Saint Laurent",
  "Heritage sneaker": "Atlete klasike",
  "I can ship it tomorrow morning.": "Mund ta dërgoj nesër në mëngjes.",
  "Your €580 offer was accepted.": "Oferta jote prej 580€ u pranua.",
  "Yes, they include the original box.": "Po, e kanë edhe kutinë origjinale.",
  "Hi! Yes, this piece is still available.":
    "Përshëndetje! Po, ky produkt është ende në dispozicion.",
  "Perfect. Could you ship this week?":
    "Shkëlqyeshëm. A mund ta dërgosh këtë javë?",
  "Would you accept": "A do ta pranoje",
  Today: "Sot",
  Tue: "Mar",
  "Archive No. 8 accepted your €580 offer.":
    "Archive No. 8 pranoi ofertën tënde prej 580€.",
  "A saved Jordan pair is now €245.":
    "Atletet Jordan që ruajte tani kushtojnë 245€.",
  "Your order VL-8031 passed inspection.":
    "Porosia jote VL-8031 e kaloi kontrollin.",
  Kosovo: "Kosovë",
  "+24.8% vs last month": "+24.8% krahasuar me muajin e kaluar",
  "+3 this week": "+3 këtë javë",
  "Everything moving through your store":
    "Çdo porosi që po kalon nëpër dyqanin tënd",
  "1.2 days": "1.2 ditë",
  Designers: "Dizajnerët",
  "Authenticated luxury": "Luks i autentikuar",
  Subscribe: "Abonohu",
  "Newsletter email": "Emaili për buletin",
  "Personal details connected to your CLOZER profile.":
    "Të dhënat personale të lidhura me profilin tënd CLOZER.",
  "Save changes": "Ruaj ndryshimet",
  "Control visibility and account protection.":
    "Menaxho dukshmërinë dhe mbrojtjen e llogarisë.",
  "Private activity": "Aktivitet privat",
  "Keep saved items and browsing history private":
    "Mbaji private produktet e ruajtura dhe historikun e shfletimit",
  "Two-factor authentication": "Verifikimi me dy hapa",
  "Required when signing in on a new device":
    "Kërkohet kur kyçesh nga një pajisje e re",
  "Cards and wallet used for protected checkout.":
    "Kartat dhe portofoli që përdoren për pagesa të mbrojtura.",
  "Visa ending in 2048": "Visa që përfundon me 2048",
  "Primary payment method": "Mënyra kryesore e pagesës",
  Remove: "Largo",
  "Add payment method": "Shto mënyrë pagese",
  "Saved delivery and return addresses.":
    "Adresat e ruajtura për dërgesa dhe kthime.",
  "Primary delivery address": "Adresa kryesore e dërgesës",
  Edit: "Ndrysho",
  "Add new address": "Shto adresë të re",
  "Order confirmed": "Porosia u konfirmua",
  "Your protected payment was authorized.":
    "Pagesa jote e mbrojtur u autorizua.",
  "Neroli silk fragrance": "Parfum Neroli Silk",
  CONTACT: "KONTAKT",
  "We are here to help.": "Jemi këtu për të të ndihmuar.",
  "Questions about an order, authentication or selling? Our team normally replies within one business day.":
    "Ke pyetje për porosinë, autentikimin ose shitjen? Ekipi ynë zakonisht përgjigjet brenda një dite pune.",
  Subject: "Subjekti",
  Message: "Mesazhi",
  "Send message": "Dërgo mesazhin",
  "Message sent": "Mesazhi u dërgua",
  "Thank you. The CLOZER team will reply to your email shortly.":
    "Faleminderit. Ekipi CLOZER do të përgjigjet së shpejti në emailin tënd.",
  "HELP CENTER": "QENDRA E NDIHMËS",
  "Frequently asked questions": "Pyetjet më të shpeshta",
  "Everything you need to buy and sell with confidence.":
    "Gjithçka që duhet për të blerë dhe shitur me siguri.",
  Contact: "Kontakti",
  FAQ: "Pyetjet e shpeshta",
  "Sign out": "Dil nga llogaria",
  "Sign in": "Kyçu",
  "CLOZER Support": "Mbështetja CLOZER",
  "Monday–Friday · 09:00–18:00 CET": "E hënë–e premte · 09:00–18:00 CET",
  "Order question": "Pyetje për porosinë",
  Selling: "Shitja",
  "How can we help?": "Si mund të të ndihmojmë?",
  "Send another": "Dërgo një mesazh tjetër",
  "How does CLOZER authentication work?":
    "Si funksionon autentikimi në CLOZER?",
  "Eligible luxury products are first sent to our specialists. They inspect identity, materials and condition before forwarding the item to the buyer.":
    "Produktet luksoze të pranueshme dërgohen fillimisht te specialistët tanë. Ata kontrollojnë identitetin, materialet dhe gjendjen para se produkti t’i dërgohet blerësit.",
  "When does the seller receive payment?": "Kur e pranon shitësi pagesën?",
  "Payment remains protected until delivery is confirmed. The seller receives the balance after the buyer-protection window closes.":
    "Pagesa mbetet e mbrojtur deri në konfirmimin e dorëzimit. Shitësi e pranon shumën pasi të përfundojë afati i mbrojtjes së blerësit.",
  "Can I return an item?": "A mund ta kthej një produkt?",
  "Returns are available when an item differs materially from its listing. Eligible purchases show the exact return window before checkout.":
    "Kthimi është i mundur kur produkti dallon ndjeshëm nga shpallja. Afati i saktë i kthimit shfaqet para pagesës për blerjet e pranueshme.",
  "How do I sell an item?": "Si ta shes një produkt?",
  "Upload clear photos, confirm the smart details, set your price and publish. You can edit or pause the listing from Seller Studio.":
    "Ngarko fotografi të qarta, konfirmo detajet inteligjente, cakto çmimin dhe publiko. Shpalljen mund ta ndryshosh ose ta ndalosh nga Paneli i shitësit.",
  "How is shipping tracked?": "Si gjurmohet dërgesa?",
  "Every protected order uses a trackable label. Updates appear in Orders and are also sent as notifications.":
    "Çdo porosi e mbrojtur përdor etiketë të gjurmueshme. Përditësimet shfaqen te Porositë dhe dërgohen edhe si njoftime.",
  "Still need help?": "Ende të duhet ndihmë?",
  "Our support team is one message away.":
    "Ekipi ynë i mbështetjes është vetëm një mesazh larg.",
  Discover: "Eksploro",
  Sell: "Shit",
  "New today": "Të reja sot",
  Designers: "Dizajnerët",
  Authenticated: "I autentikuar",
  "Price drops": "Ulje çmimesh",
  Women: "Femra",
  Bags: "Çanta",
  Sneakers: "Atlete",
  Watches: "Ora",
  Jewelry: "Stoli",
  Accessories: "Aksesorë",
  "One size": "Një madhësi",
  Excellent: "Shkëlqyeshëm",
  "Very good": "Shumë mirë",
  New: "E re",
  "Shop the edit": "Bli përzgjedhjen",
  "Sell a piece": "Shit një produkt",
  "Expert reviewed, buyer protected":
    "Kontrolluar nga ekspertët, blerësi i mbrojtur",
  "CLOZER AUTHENTICATED": "AUTENTIKUAR NGA CLOZER",
  "THE AUTHENTICATED EDIT": "PËRZGJEDHJA E AUTENTIKUAR",
  "Icons, then": "Ikona, dje",
  "and now.": "dhe sot.",
  "Explore pieces verified by our specialists":
    "Eksploro produktet e verifikuara nga specialistët tanë",
  "Discover new arrivals": "Shiko produktet e reja",
  "View all": "Shiko të gjitha",
  "Vintage icons": "Ikona vintage",
  "Quiet luxury, i shpjeguar": "Quiet luxury, i shpjeguar",
  "YOUR WARDROBE, REVALUED": "GARDEROBA JOTE, ME VLERË TË RE",
  "Give exceptional pieces their next chapter.":
    "Jepu pjesëve të veçanta kapitullin e radhës.",
  "Photograph it, review the smart listing, publish. You remain in control.":
    "Fotografoje, kontrollo shpalljen inteligjente dhe publikoje. Ti e ke kontrollin.",
  "Start selling": "Fillo të shesësh",
  "Smart listing assistant": "Asistenti inteligjent i shpalljes",
  "Bottega Veneta detected": "U identifikua Bottega Veneta",
  "Suggested range €1,180–€1,340": "Çmimi i sugjeruar €1,180–€1,340",
};

function Localize({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === "en" || !ref.current) return;
    const translate = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return value;
      let out = sqText[trimmed];
      if (!out)
        out = trimmed
          .replace(/^Results for /, "Rezultatet për ")
          .replace(
            /^(\d+) curated listings from trusted sellers$/,
            "$1 shpallje të përzgjedhura nga shitës të besuar",
          )
          .replace(/^Show (\d+) results$/, "Shfaq $1 rezultate")
          .replace(/^Listed at /, "Çmimi i publikuar ")
          .replace(/^(\d+) pieces waiting for you$/, "$1 produkte të ruajtura")
          .replace(/^(\d+) selected pieces?$/, "$1 produkte të zgjedhura")
          .replace(/^#(VL-\d+) · (\d+)h ago$/, "#$1 · para $2 orësh");
      if (out === trimmed) return value;
      return value.replace(trimmed, out);
    };
    const scan = () => {
      if (!ref.current) return;
      const walker = document.createTreeWalker(
        ref.current,
        NodeFilter.SHOW_TEXT,
      );
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach((n) => {
        const next = translate(n.nodeValue || "");
        if (next !== n.nodeValue) n.nodeValue = next;
      });
      ref.current
        .querySelectorAll<HTMLElement>("[placeholder],[aria-label]")
        .forEach((el) => {
          ["placeholder", "aria-label"].forEach((a) => {
            const v = el.getAttribute(a);
            if (v) {
              const next = translate(v);
              if (next !== v) el.setAttribute(a, next);
            }
          });
        });
    };
    const frame = requestAnimationFrame(scan);
    const observer = new MutationObserver(scan);
    observer.observe(ref.current, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [lang]);
  return (
    <div ref={ref} className="v2-localized" data-lang={lang}>
      {children}
    </div>
  );
}

const products: Product[] = [
  {
    id: 1,
    name: "Mini Jodie woven bag",
    brand: "BOTTEGA VENETA",
    price: 1280,
    oldPrice: 1690,
    image: "/assets/bag-one.webp",
    position: "center",
    seller: "Maison Edit",
    size: "One size",
    city: "Milan",
    verified: true,
    label: "Authenticated",
    category: "Bags",
    color: "Olive",
    condition: "Excellent",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 2,
    name: "Vintage double-breasted blazer",
    brand: "SAINT LAURENT",
    price: 640,
    image: "/assets/blazer-one.webp",
    position: "center",
    seller: "Archive No. 8",
    size: "EU 38",
    city: "Paris",
    verified: true,
    category: "Women",
    color: "Black",
    condition: "Very good",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 3,
    name: "High-top heritage sneaker",
    brand: "JORDAN",
    price: 245,
    oldPrice: 290,
    image: "/assets/sneaker-one.webp",
    position: "center",
    seller: "Sole Society",
    size: "EU 43",
    city: "Berlin",
    verified: true,
    label: "Price drop",
    category: "Sneakers",
    color: "Red",
    condition: "Excellent",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 4,
    name: "Oyster-style perpetual 36",
    brand: "ROLEX",
    price: 8650,
    image: "/assets/watch-one.webp",
    position: "center",
    seller: "Horology House",
    size: "36 mm",
    city: "Geneva",
    verified: true,
    label: "Authenticated",
    category: "Watches",
    color: "Silver",
    condition: "Excellent",
    authLevel: "physical",
    authRisk: "low",
  },
  {
    id: 5,
    name: "Triomphe cat-eye sunglasses",
    brand: "CELINE",
    price: 230,
    image: "/assets/sunglasses-one.webp",
    position: "center",
    seller: "Lena K.",
    size: "One size",
    city: "Vienna",
    category: "Accessories",
    color: "Black",
    condition: "Very good",
    authLevel: "none",
  },
  {
    id: 6,
    name: "Neroli silk fragrance",
    brand: "GUERLAIN",
    price: 195,
    image: "/assets/perfume-one.webp",
    position: "center",
    seller: "The Curated Room",
    size: "100 ml",
    city: "London",
    verified: true,
    category: "Accessories",
    color: "Cream",
    condition: "New",
    authLevel: "ai",
    authRisk: "medium",
  },
  {
    id: 7,
    name: "Sculptural leather shoulder bag",
    brand: "JACQUEMUS",
    price: 410,
    image: "/assets/bag-two.webp",
    position: "center",
    seller: "Studio 24",
    size: "One size",
    city: "Pristina",
    verified: true,
    category: "Bags",
    color: "Burgundy",
    condition: "New",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 8,
    name: "Love-style bracelet, small model",
    brand: "CARTIER",
    price: 3650,
    image: "/assets/bracelet-one.webp",
    position: "center",
    seller: "Objet Rare",
    size: "17 cm",
    city: "Zurich",
    verified: true,
    label: "Authenticated",
    category: "Jewelry",
    color: "Gold",
    condition: "Excellent",
    authLevel: "physical",
    authRisk: "low",
  },
  {
    id: 9,
    name: "Slim leather wallet & belt set",
    brand: "LOEWE",
    price: 290,
    image: "/assets/bag-one.webp",
    position: "center",
    seller: "North Archive",
    size: "85 cm",
    city: "Copenhagen",
    verified: true,
    category: "Accessories",
    color: "Black",
    condition: "New",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 10,
    name: "Le Pliage leather mini",
    brand: "LONGCHAMP",
    price: 185,
    oldPrice: 245,
    image: "/assets/bag-two.webp",
    position: "center",
    seller: "Mia Archive",
    size: "Një madhësi",
    city: "Tiranë",
    verified: true,
    label: "Ulje çmimi",
    category: "Bags",
    color: "Burgundy",
    condition: "Shumë mirë",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 11,
    name: "Oversized wool coat",
    brand: "MAX MARA",
    price: 720,
    image: "/assets/blazer-one.webp",
    position: "54% center",
    seller: "Alba Studio",
    size: "EU 40",
    city: "Prishtinë",
    verified: true,
    category: "Women",
    color: "Krem",
    condition: "Shkëlqyeshëm",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 12,
    name: "Air Jordan 4 retro",
    brand: "JORDAN",
    price: 310,
    oldPrice: 355,
    image: "/assets/sneaker-one.webp",
    position: "42% center",
    seller: "Kicks Club",
    size: "EU 42",
    city: "Shkup",
    verified: true,
    label: "Ulje çmimi",
    category: "Sneakers",
    color: "E zezë",
    condition: "Shkëlqyeshëm",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 13,
    name: "Tank-style steel watch",
    brand: "CARTIER",
    price: 3420,
    image: "/assets/watch-one.webp",
    position: "58% center",
    seller: "Time Archive",
    size: "Një madhësi",
    city: "Zagreb",
    verified: true,
    category: "Watches",
    color: "Ari",
    condition: "Shumë mirë",
    authLevel: "physical",
    authRisk: "low",
  },
  {
    id: 14,
    name: "Tortoise acetate frames",
    brand: "RAY-BAN",
    price: 135,
    image: "/assets/sunglasses-one.webp",
    position: "42% center",
    seller: "Optic Edit",
    size: "Një madhësi",
    city: "Pejë",
    verified: true,
    category: "Accessories",
    color: "E zezë",
    condition: "E re",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 15,
    name: "Silk carré 90 scarf",
    brand: "HERMÈS",
    price: 285,
    image: "/assets/apparel-triptych.webp",
    position: "15% center",
    seller: "Maison A",
    size: "90 × 90 cm",
    city: "Paris",
    verified: true,
    category: "Accessories",
    color: "Bordo",
    condition: "Shkëlqyeshëm",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 16,
    name: "Quilted chain shoulder bag",
    brand: "CHANEL",
    price: 3950,
    image: "/assets/bags-triptych.webp",
    position: "50% center",
    seller: "Archive Eleven",
    size: "Një madhësi",
    city: "Milano",
    verified: true,
    category: "Bags",
    color: "E zezë",
    condition: "Shumë mirë",
    authLevel: "physical",
    authRisk: "low",
  },
  {
    id: 17,
    name: "Gold signet ring",
    brand: "TIFFANY & CO.",
    price: 410,
    image: "/assets/bracelet-one.webp",
    position: "52% center",
    seller: "Objet Edit",
    size: "EU 54",
    city: "Vjenë",
    verified: true,
    category: "Jewelry",
    color: "Ari",
    condition: "Shkëlqyeshëm",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 18,
    name: "Jet Set leather tote",
    brand: "MICHAEL KORS",
    price: 190,
    oldPrice: 245,
    image: "/assets/bag-one.webp",
    position: "35% center",
    seller: "Second Muse",
    size: "Një madhësi",
    city: "Berlin",
    verified: false,
    label: "Ulje çmimi",
    category: "Bags",
    color: "E zezë",
    condition: "Shkëlqyeshëm",
    authLevel: "none",
    material: "Lëkurë",
    gender: "Femra",
    shipping: true,
    negotiable: true,
  },
  {
    id: 19,
    name: "Leather biker jacket",
    brand: "ACNE STUDIOS",
    price: 480,
    image: "/assets/apparel-triptych.webp",
    position: "78% center",
    seller: "Nordic Wardrobe",
    size: "EU 38",
    city: "Kopenhagë",
    verified: true,
    category: "Women",
    color: "E zezë",
    condition: "Shumë mirë",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 20,
    name: "Limited edition collector figure",
    brand: "MEDICOM TOY",
    price: 690,
    image: "/assets/collectibles-triptych.webp",
    position: "50% center",
    seller: "Rare Form",
    size: "Një madhësi",
    city: "Tokio",
    verified: false,
    category: "Accessories",
    color: "Krem",
    condition: "E re",
    authLevel: "none",
  },
  {
    id: 21,
    name: "Cashmere double-breasted blazer",
    brand: "BURBERRY",
    price: 560,
    image: "/assets/blazer-one.webp",
    position: "68% center",
    seller: "The Tailored Edit",
    size: "EU 42",
    city: "Londër",
    verified: true,
    category: "Women",
    color: "Krem",
    condition: "Shkëlqyeshëm",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 22,
    name: "Moon-phase dress watch",
    brand: "IWC",
    price: 5120,
    image: "/assets/watch-one.webp",
    position: "32% center",
    seller: "Horology North",
    size: "40 mm",
    city: "Gjenevë",
    verified: true,
    category: "Watches",
    color: "Argjendtë",
    condition: "Shkëlqyeshëm",
    authLevel: "physical",
    authRisk: "low",
  },
  {
    id: 23,
    name: "Leather weekend bag",
    brand: "SAINT LAURENT",
    price: 880,
    image: "/assets/bags-triptych.webp",
    position: "18% center",
    seller: "West End Archive",
    size: "Një madhësi",
    city: "Londër",
    verified: true,
    category: "Bags",
    color: "Bordo",
    condition: "Shumë mirë",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 24,
    name: "Crystal drop earrings",
    brand: "SWAROVSKI",
    price: 115,
    image: "/assets/bracelet-one.webp",
    position: "30% center",
    seller: "Lumière",
    size: "Një madhësi",
    city: "Prizren",
    verified: true,
    category: "Jewelry",
    color: "Argjendtë",
    condition: "E re",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 25,
    name: "Suede runner sneaker",
    brand: "NEW BALANCE",
    price: 165,
    image: "/assets/sneaker-one.webp",
    position: "70% center",
    seller: "Sole Archive",
    size: "EU 44",
    city: "Pejë",
    verified: true,
    category: "Sneakers",
    color: "Krem",
    condition: "E re",
    authLevel: "ai",
    authRisk: "low",
  },
  {
    id: 26,
    name: "Signature acetate sunglasses",
    brand: "MIU MIU",
    price: 265,
    image: "/assets/sunglasses-one.webp",
    position: "70% center",
    seller: "Frame Society",
    size: "Një madhësi",
    city: "Prishtinë",
    verified: true,
    category: "Accessories",
    color: "Bordo",
    condition: "Shkëlqyeshëm",
    authLevel: "expert",
    authRisk: "low",
  },
  {
    id: 27,
    name: "Pallto leshi e strukturuar",
    brand: "MAX MARA",
    price: 850,
    image: "/assets/editorial-luxury.webp",
    position: "center",
    seller: "Heritage Room",
    size: "M",
    city: "Milano",
    verified: true,
    category: "Women",
    color: "Krem",
    condition: "Shumë mirë",
    material: "Lesh dhe kashmir",
    gender: "Femra",
    description:
      "Pallto e gjatë me prerje të strukturuar, ngjyrë krem dhe siluetë klasike. Shitësi deklaron përdorim minimal dhe ruajtje profesionale.",
    authLevel: "none",
    authRisk: "low",
  },
];

const categories = ["all", ...departments.map((item) => item.slug)];
const categoryLabel = (slug: string) =>
  slug === "all" ? "Të gjitha" : findCategory(slug)?.nameSq || slug;
const seedNotes: Note[] = [
  {
    id: 1,
    title: "Your offer was accepted",
    text: "Archive No. 8 accepted your €580 offer.",
    type: "offer",
    read: false,
    time: "4 min",
  },
  {
    id: 2,
    title: "Price drop",
    text: "A saved Jordan pair is now €245.",
    type: "drop",
    read: false,
    time: "1 h",
  },
  {
    id: 3,
    title: "Order authenticated",
    text: "Your order VL-8031 passed inspection.",
    type: "order",
    read: true,
    time: "Yesterday",
  },
];

function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // Hydrate the device-local demo state after the first client render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
  }, [key, value, ready]);
  return [value, setValue] as const;
}

function ProductImage({
  p,
  className = "",
  priority = false,
}: {
  p: Product;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      className={className}
      src={p.image}
      style={{ objectPosition: p.position }}
      alt={p.name}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

const productSeed = (id: ProductId) => {
  const value = String(id)
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return value % 31;
};

const productReference = (product: Product) =>
  product.reference ||
  `VL-${String(product.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;

const sellerHref = (product: Product) =>
  `/seller/${encodeURIComponent(product.sellerSlug || product.seller.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`;

const publicListingToProduct = (listing: PublicListing): Product => ({
  id: listing.id,
  sellerId: listing.sellerId,
  name: listing.title,
  brand: listing.brand.toUpperCase(),
  price: listing.price,
  image: listing.images[0] || "/assets/bag-one.webp",
  images: listing.images,
  position: "center",
  seller: listing.seller,
  sellerSlug: listing.sellerSlug,
  sellerAvatar: listing.sellerAvatar,
  size: listing.size,
  city: listing.city,
  verified: listing.sellerVerified,
  category: listing.category,
  color: listing.color,
  condition: listing.condition,
  material: listing.material,
  gender: listing.gender,
  shipping: listing.shippingAvailable,
  negotiable: listing.negotiable,
  description: listing.description,
  viewsCount: listing.viewsCount,
  publishedAt: listing.publishedAt,
  reference: listing.reference || `VL-${listing.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
  authLevel: listing.authenticityStatus === "verified" ? "expert" : "none",
  boostTier: listing.boostTier,
});

function AuthBadge({ p, compact = false }: { p: Product; compact?: boolean }) {
  const level = p.authLevel || "none";
  const data = {
    none: ["Pa kontrolluar", "Nuk ka garanci autenticiteti"],
    ai: [
      "Analiza AI u përfundua",
      p.authRisk === "medium"
        ? "Rrezik mesatar falsifikimi"
        : p.authRisk === "high"
          ? "Rrezik i lartë falsifikimi"
          : "Rrezik i ulët falsifikimi",
    ],
    expert: ["Rishikuar nga eksperti", "Kërko raportin e kontrollit"],
    physical: [
      "Kontroll fizik i regjistruar",
      "Shiko statusin dhe provat e disponueshme",
    ],
  }[level];
  return (
    <span className={`v2-auth-badge ${level} ${compact ? "compact" : ""}`}>
      {level === "none" ? <AlertTriangle /> : <ShieldCheck />}
      <span>
        <b>{data[0]}</b>
        {!compact && <small>{data[1]}</small>}
      </span>
    </span>
  );
}

function Brand() {
  return (
    <Link href="/" className="v2-brand" aria-label="CLOZER home">
      CLOZER<span>®</span>
    </Link>
  );
}

function requestAccount(next: string) {
  window.dispatchEvent(
    new CustomEvent("velora:auth-required", { detail: { next } }),
  );
}

function AuthModal({
  close,
  complete,
}: {
  close: () => void;
  complete: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const identity = email.trim().toLowerCase();
    if (
      !identity.includes("@") ||
      password.length < 6 ||
      (mode === "signup" && !name.trim())
    ) {
      setError(
        "Plotëso të dhënat me email të vlefshëm dhe fjalëkalim me së paku 6 karaktere.",
      );
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: identity,
        password,
      });
      setLoading(false);
      if (authError) {
        setError(
          authError.code === "email_not_confirmed"
            ? "Emaili nuk është konfirmuar ende. Kontrollo Inbox ose Spam dhe hape lidhjen e konfirmimit."
            : "Emaili ose fjalëkalimi nuk është i saktë.",
        );
        return;
      }
      complete();
      return;
    }
    const { data, error: authError } = await supabase.auth.signUp({
      email: identity,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/?login=confirmed`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(
        authError.code === "over_email_send_rate_limit"
          ? "Emaili i konfirmimit është dërguar. Prit 60 sekonda para se ta kërkosh përsëri."
          : "Regjistrimi nuk u përfundua. Kontrollo të dhënat dhe provo përsëri.",
      );
      return;
    }
    if (data.session) {
      complete();
      return;
    }
    setNotice(
      `Llogaria u krijua. Dërguam një lidhje konfirmimi te ${identity}. Kontrollo edhe Spam dhe hape lidhjen për t’u kyçur.`,
    );
  };
  return (
    <motion.div
      className="v2-modal-bg v2-auth-modal-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
    >
      <motion.section
        className={`v2-auth-modal${notice ? " is-confirmed" : ""}`}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Kyçu" : "Krijo llogari"}
      >
        <button
          className="v2-icon v2-auth-close"
          onClick={close}
          aria-label="Mbyll"
        >
          <X />
        </button>
        <Brand />
        {!notice ? (
          <>
            <span>CLOZER ACCOUNT</span>
            <h1>
              {mode === "login" ? "Mirë se vjen." : "Krijo llogarinë."}
            </h1>
            <p>
              {mode === "login"
                ? "Kyçu për të ruajtur produktet, për të dërguar oferta dhe për të shitur."
                : "Ruaj produktet, publiko shpallje dhe menaxho shitjet e tua."}
            </p>
            <form onSubmit={submit}>
              {mode === "signup" && (
                <label>
                  Emri i plotë
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Emri dhe mbiemri"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  autoComplete={mode === "login" ? "username" : "email"}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="emri@email.com"
                />
              </label>
              <label>
                Fjalëkalimi
                <input
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 karaktere"
                />
              </label>
              {error && <small className="v2-auth-error">{error}</small>}
              <button disabled={loading} className="v2-pill dark wide">
                {loading
                  ? "Duke u lidhur…"
                  : mode === "login"
                    ? "Kyçu"
                    : "Krijo llogari"}
                <ArrowRight />
              </button>
            </form>
            <div className="v2-auth-switch">
              <span>
                {mode === "login" ? "Nuk ke llogari?" : "Ke tashmë llogari?"}
              </span>
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                  setNotice("");
                }}
              >
                {mode === "login" ? "Regjistrohu" : "Kyçu"}
              </button>
            </div>
            <small className="v2-auth-note">
              Llogaria mbrohet nga Supabase Auth dhe të dhënat kontrollohen me
              RLS.
            </small>
          </>
        ) : (
          <div className="v2-auth-confirmation" role="status">
            <div className="v2-auth-confirmation-icon">
              <Mail />
            </div>
            <span>EMAILI U DËRGUA</span>
            <h1>Kontrollo emailin.</h1>
            <p>{notice}</p>
            <button className="v2-pill dark wide" onClick={close}>
              Në rregull
              <ArrowRight />
            </button>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

const megaMenuVisuals: Record<string, { image: string; eyebrow: string; title: string; text: string }> = {
  women: {
    image: "https://images.pexels.com/photos/13787836/pexels-photo-13787836.jpeg?cs=tinysrgb&dpr=1&w=1000",
    eyebrow: "THE WOMEN'S EDIT",
    title: "Forma që flasin.",
    text: "Pjesë të zgjedhura për çdo moment.",
  },
  men: {
    image: "https://images.pexels.com/photos/6616649/pexels-photo-6616649.jpeg?cs=tinysrgb&dpr=1&w=1000",
    eyebrow: "THE MEN'S EDIT",
    title: "Stil me karakter.",
    text: "Klasike moderne, të zgjedhura mirë.",
  },
  kids: {
    image: "https://images.pexels.com/photos/6349542/pexels-photo-6349542.jpeg?auto=compress&cs=tinysrgb&w=1000",
    eyebrow: "MINI EDIT",
    title: "Të vegjlit, me stil.",
    text: "Për aventura të vogla dhe të mëdha.",
  },
  beauty: {
    image: "https://images.pexels.com/photos/16185701/pexels-photo-16185701/free-photo-of-cosmetics-on-a-table.jpeg?cs=tinysrgb&dpr=1&w=1000",
    eyebrow: "BEAUTY EDIT",
    title: "Rituali yt i bukurisë.",
    text: "Parfume, kujdes dhe detaje që mbeten.",
  },
};

function AppHeader({
  cartCount,
  noteCount,
  notes,
  setNotes,
  lang,
  setLang,
  signedIn,
  onSignIn,
  onSignOut,
  account,
}: {
  cartCount: number;
  noteCount: number;
  notes: Note[];
  setNotes: (v: Note[]) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  signedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  account: AccountProfile | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const wantsAuth = Boolean(params.get("login")) && !signedIn;
  const wantsSellLogin = params.get("login") === "sell" && !signedIn;
  const requestedNext = params.get("next");
  const safeNext =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : null;
  const profileRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState(params.get("q") || "");
  const [menu, setMenu] = useState(false);
  const [profile, setProfile] = useState(false);
  const [auth, setAuth] = useState(wantsAuth);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [afterLogin, setAfterLogin] = useState<string | null>(
    safeNext || (wantsSellLogin ? "/sell" : null),
  );
  const accountName = account?.fullName || account?.email.split("@")[0] || "Përdorues";
  const accountInitials = accountName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const accountHandle = account?.username ? `@${account.username}` : account?.email || "";
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfile(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfile(false);
        setMenu(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (!menu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menu]);
  useEffect(() => {
    const openAuth = (event: Event) => {
      const next = (event as CustomEvent<{ next?: string }>).detail?.next;
      setAfterLogin(
        next?.startsWith("/") && !next.startsWith("//") ? next : null,
      );
      setProfile(false);
      setMenu(false);
      setNotifications(false);
      setAuth(true);
    };
    window.addEventListener("velora:auth-required", openAuth);
    return () => window.removeEventListener("velora:auth-required", openAuth);
  }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(
      `/explore${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`,
    );
  };
  const requestSell = () => {
    if (signedIn) {
      router.push("/sell");
      return;
    }
    setAfterLogin("/sell");
    setAuth(true);
  };
  return (
    <>
      <header className="v2-header">
        <div className="v2-header-inner">
          <button
            className="v2-icon v2-menu-trigger"
            aria-label="Hap menynë"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <Brand />
          <form className="v2-search" onSubmit={submit}>
            <Search />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Kërko produkte, brende ose shitës"
            />
            <button aria-label="Kërko">
              <ArrowRight />
            </button>
          </form>
          <nav className="v2-nav">
            <Link href="/explore">Discover</Link>
            <Link href="/brands">Brands</Link>
            <Link href="/authentication">Authentication</Link>
            <Link href="/stories">Stories</Link>
          </nav>
          <div className="v2-actions">
            <button
              className="v2-icon v2-mobile-search-trigger"
              aria-label="Hap kërkimin"
              onClick={() => setSearchOpen(true)}
            >
              <Search />
            </button>
            {signedIn ? (
              <Link href="/saved" aria-label="Produktet e ruajtura">
                <Heart />
              </Link>
            ) : (
              <button
                className="v2-action-icon"
                aria-label="Kyçu për produktet e ruajtura"
                onClick={() => requestAccount("/saved")}
              >
                <Heart />
              </button>
            )}
            <div className="v2-notification-control">
              <button
                onClick={() => {
                  if (!signedIn) {
                    requestAccount("/notifications");
                    return;
                  }
                  setNotifications((v) => !v);
                  setNotes(notes.map((n) => ({ ...n, read: true })));
                }}
                aria-label="Njoftimet"
                className="v2-count-link"
              >
                <Bell />
                {noteCount > 0 && <b>{noteCount}</b>}
              </button>
              <AnimatePresence>
                {notifications && (
                  <motion.div
                    className="v2-notification-popover"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  >
                    <header>
                      <span>NJOFTIMET</span>
                      <button
                        onClick={() => setNotifications(false)}
                        aria-label="Mbyll"
                      >
                        <X />
                      </button>
                    </header>
                    {notes.slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        className="v2-pop-note"
                        onClick={() => setNotifications(false)}
                      >
                        <span>
                          {n.type === "offer" ? (
                            <Tag />
                          ) : n.type === "drop" ? (
                            <TrendingDown />
                          ) : (
                            <Package />
                          )}
                        </span>
                        <p>
                          <b>{n.title}</b>
                          <small>{n.text}</small>
                          <em>{n.time}</em>
                        </p>
                      </button>
                    ))}
                    <Link
                      href="/notifications"
                      onClick={() => setNotifications(false)}
                    >
                      Shiko të gjitha
                      <ArrowRight />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {signedIn ? (
              <Link href="/cart" aria-label="Shporta" className="v2-count-link">
                <ShoppingBag />
                {cartCount > 0 && <b>{cartCount}</b>}
              </Link>
            ) : (
              <button
                className="v2-action-icon"
                aria-label="Kyçu për shportën"
                onClick={() => requestAccount("/cart")}
              >
                <ShoppingBag />
              </button>
            )}
            {signedIn ? (
              <div className="v2-profile-control" ref={profileRef}>
                <button
                  className={`v2-avatar ${profile ? "active" : ""}`}
                  aria-label={
                    lang === "sq"
                      ? "Hap menynë e profilit"
                      : "Open profile menu"
                  }
                  aria-expanded={profile}
                  onClick={() => setProfile((v) => !v)}
                >
                  {accountInitials}
                </button>
                <AnimatePresence>
                  {profile && (
                    <motion.div
                      className="v2-profile-menu"
                      role="menu"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    >
                      <div>
                        <span className="v2-avatar">{accountInitials}</span>
                        <p>
                          <b>{accountName}</b>
                          <small>{accountHandle}</small>
                        </p>
                      </div>
                      <Link
                        onClick={() => setProfile(false)}
                        role="menuitem"
                        href="/profile"
                      >
                        <span>
                          {lang === "sq" ? "Profili im" : "My profile"}
                        </span>
                        <ChevronRight />
                      </Link>
                      {account?.sellerVerified ? (
                        <Link
                          onClick={() => setProfile(false)}
                          role="menuitem"
                          href="/dashboard"
                        >
                          <span>{lang === "sq" ? "Paneli i shitësit" : "Seller studio"}</span>
                          <ChevronRight />
                        </Link>
                      ) : (
                        <Link onClick={() => setProfile(false)} role="menuitem" href="/sell">
                          <span>{lang === "sq" ? "Fillo të shesësh" : "Start selling"}</span>
                          <ChevronRight />
                        </Link>
                      )}
                      <Link
                        onClick={() => setProfile(false)}
                        role="menuitem"
                        href="/orders"
                      >
                        <span>
                          {lang === "sq" ? "Porositë e mia" : "My orders"}
                        </span>
                        <ChevronRight />
                      </Link>
                      <Link
                        onClick={() => setProfile(false)}
                        role="menuitem"
                        href="/settings"
                      >
                        <span>{lang === "sq" ? "Cilësimet" : "Settings"}</span>
                        <ChevronRight />
                      </Link>
                      <div
                        className="v2-lang-choice"
                        aria-label={
                          lang === "sq" ? "Zgjidh gjuhën" : "Choose language"
                        }
                      >
                        <button
                          className={lang === "sq" ? "active" : ""}
                          onClick={() => setLang("sq")}
                        >
                          SQ
                        </button>
                        <button
                          className={lang === "en" ? "active" : ""}
                          onClick={() => setLang("en")}
                        >
                          EN
                        </button>
                      </div>
                      <button
                        className="v2-logout"
                        onClick={() => {
                          setProfile(false);
                          onSignOut();
                          router.push("/");
                        }}
                      >
                        <LogOut />
                        <span>
                          {lang === "sq" ? "Dil nga llogaria" : "Sign out"}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button className="v2-signin" onClick={() => setAuth(true)}>
                <User />
                <span>{lang === "sq" ? "Kyçu" : "Sign in"}</span>
              </button>
            )}
            <button className="v2-pill v2-header-sell" onClick={requestSell}>
              <span><Plus /></span>
              <b>{lang === "sq" ? "Shit" : "Sell"}</b>
            </button>
          </div>
        </div>
        <div className="v2-catbar">
          <Link href="/explore?sort=new">Të rejat</Link>
          {categoryTree.map((department) => (
            <div className="v2-catmenu" key={department.slug}>
              <Link href={`/explore?department=${department.slug}`}>
                {department.nameSq}
              </Link>
              <div className="v2-megamenu">
                <Link className="v2-mega-feature" href={`/explore?department=${department.slug}`}>
                  <img src={megaMenuVisuals[department.slug]?.image} alt="" />
                  <span>
                    <small>{megaMenuVisuals[department.slug]?.eyebrow}</small>
                    <b>{megaMenuVisuals[department.slug]?.title}</b>
                    <em>{megaMenuVisuals[department.slug]?.text}</em>
                    <strong>Shiko të gjitha <ArrowRight /></strong>
                  </span>
                </Link>
                <div className="v2-mega-groups">
                  {department.children?.map((group) => (
                    <section key={group.slug}>
                      <Link href={`/explore?department=${department.slug}&group=${group.slug}`}>
                        {group.nameSq}
                      </Link>
                      {group.children?.map((subcategory) => (
                        <Link
                          key={subcategory.slug}
                          href={`/explore?department=${department.slug}&category=${subcategory.slug}`}
                        >
                          {subcategory.nameSq}
                        </Link>
                      ))}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="v2-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>
              <button
                className="v2-icon"
                onClick={() => setSearchOpen(false)}
                aria-label="Mbyll kërkimin"
              >
                <X />
              </button>
              <form
                onSubmit={(e) => {
                  submit(e);
                  setSearchOpen(false);
                }}
              >
                <Search />
                <input
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Kërko modë, brende ose shitës"
                />
                <button className="v2-pill dark">
                  Kërko
                  <ArrowRight />
                </button>
              </form>
              <section>
                <span>KËRKIME POPULLORE</span>
                {[
                  "Miu Miu",
                  "Cartier",
                  "Vintage denim",
                  "Nike Dunk",
                  "Ray-Ban",
                ].map((x) => (
                  <button
                    key={x}
                    onClick={() => {
                      router.push(`/explore?q=${encodeURIComponent(x)}`);
                      setSearchOpen(false);
                    }}
                  >
                    {x}
                    <ArrowRight />
                  </button>
                ))}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {menu && (
          <motion.div
            className="v2-drawer-bg v2-menu-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenu(false)}
          >
            <motion.aside
              className="v2-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menuja kryesore"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <Brand />
                <button
                  className="v2-icon"
                  aria-label="Mbyll menynë"
                  onClick={() => setMenu(false)}
                >
                  <X />
                </button>
              </div>
              <span className="v2-mobile-menu-heading">BLEJ SIPAS KATEGORISË</span>
              <div className="v2-mobile-departments">
                {categoryTree.map((department) => (
                  <Link key={department.slug} href={`/explore?department=${department.slug}`} onClick={() => setMenu(false)}>
                    {department.nameSq}
                  </Link>
                ))}
              </div>
              <span className="v2-mobile-menu-heading">ZBULO</span>
              {[
                ["Brendet", "/brands", false],
                ["Editoriale", "/stories", false],
                ["Autentikimi", "/authentication", false],
                ["Shitës profesionalë", "/professional-sellers", false],
              ].map(([label, href, protectedItem]) =>
                protectedItem && !signedIn ? (
                  <button
                    className="v2-mobile-menu-link"
                    onClick={() => requestAccount(String(href))}
                    key={String(href)}
                  >
                    {label}
                    <ChevronRight />
                  </button>
                ) : (
                  <Link
                    onClick={() => setMenu(false)}
                    key={String(href)}
                    href={String(href)}
                  >
                    {label}
                    <ChevronRight />
                  </Link>
                ),
              )}
              {signedIn && (
                <>
                  <span className="v2-mobile-menu-heading">LLOGARIA</span>
                  <Link onClick={() => setMenu(false)} href="/orders">Porositë<ChevronRight /></Link>
                  <Link onClick={() => setMenu(false)} href="/settings">Cilësimet<ChevronRight /></Link>
                </>
              )}
              <span className="v2-mobile-menu-heading">NDIHMË</span>
              {[["FAQ", "/faq"], ["Kontakti", "/contact"]].map(([label, href]) => (
                <Link onClick={() => setMenu(false)} key={href} href={href}>{label}<ChevronRight /></Link>
              ))}
              <div className="v2-mobile-language">
                <span>{lang === "sq" ? "Gjuha" : "Language"}</span>
                <div className="v2-lang-choice">
                  <button
                    className={lang === "sq" ? "active" : ""}
                    onClick={() => setLang("sq")}
                  >
                    Shqip
                  </button>
                  <button
                    className={lang === "en" ? "active" : ""}
                    onClick={() => setLang("en")}
                  >
                    English
                  </button>
                </div>
                {signedIn ? (
                  <div className="v2-mobile-session">
                    <div>
                      <span className="v2-mobile-session-avatar">{accountInitials}</span>
                      <p>
                        <b>{accountName}</b>
                        <small>{accountHandle}</small>
                      </p>
                    </div>
                    <button
                      className="v2-mobile-logout"
                      onClick={() => {
                        setMenu(false);
                        void onSignOut();
                        router.push("/");
                      }}
                    >
                      <span className="v2-mobile-logout-icon"><LogOut /></span>
                      <span>
                        <b>{lang === "sq" ? "Dil nga llogaria" : "Sign out"}</b>
                        <small>{lang === "sq" ? "Përfundo sesionin në këtë pajisje" : "End this session on this device"}</small>
                      </span>
                      <ChevronRight />
                    </button>
                  </div>
                ) : (
                  <button
                    className="v2-mobile-signin"
                    onClick={() => {
                      setMenu(false);
                      setAfterLogin(null);
                      setAuth(true);
                    }}
                  >
                    <User />
                    {lang === "sq" ? "Kyçu në llogari" : "Sign in"}
                    <ChevronRight />
                  </button>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {auth && (
          <AuthModal
            close={() => {
              setAuth(false);
              setAfterLogin(null);
            }}
            complete={() => {
              onSignIn();
              setAuth(false);
              if (afterLogin) router.push(afterLogin);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ProductCard({
  p,
  saved,
  toggle,
  add,
}: {
  p: Product;
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
}) {
  return (
    <article className="v2-product">
      <Link href={`/listing/${p.id}`} className="v2-product-media">
        <ProductImage p={p} />
        {p.boostTier && (
          <span className="v2-boost-badge">
            <TrendingUp /> Promovuar
          </span>
        )}
        <AuthBadge p={p} compact />
        <i>Shiko shpejt</i>
        {p.oldPrice && (
          <strong className="v2-card-value">
            <TrendingDown /> {Math.round((1 - p.price / p.oldPrice) * 100)}% nën
            çmimin e mëparshëm
          </strong>
        )}
      </Link>
      <button
        type="button"
        className={`v2-heart ${saved.includes(p.id) ? "on" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(p.id);
        }}
        aria-pressed={saved.includes(p.id)}
        aria-label={
          saved.includes(p.id) ? "Hiqe nga të ruajturat" : "Ruaje produktin"
        }
      >
        <Heart fill={saved.includes(p.id) ? "currentColor" : "none"} />
      </button>
      <div className="v2-product-info">
        <small>{p.brand}</small>
        <Link href={`/listing/${p.id}`}>{p.name}</Link>
        <p>
          {p.size} · {p.condition}
        </p>
        <div>
          <b>€{p.price.toLocaleString()}</b>
          {p.oldPrice && <del>€{p.oldPrice.toLocaleString()}</del>}
          <button
            onClick={() => add(p.id)}
            aria-label={`Shto ${p.name} në shportë`}
          >
            <Plus />
          </button>
        </div>
        <em>
          {p.seller}
          {p.verified && <BadgeCheck />}
        </em>
        <span className="v2-product-signal">
          <Heart /> {18 + productSeed(p.id) * 3} e kanë ruajtur · {p.city}
        </span>
      </div>
    </article>
  );
}

function Rail({
  title,
  items,
  saved,
  toggle,
  add,
  href = "/explore",
}: {
  title: string;
  items: Product[];
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  href?: string;
}) {
  return (
    <section className="v2-section">
      <div className="v2-section-head">
        <div>
          <span>CURATED MARKETPLACE</span>
          <h2>{title}</h2>
        </div>
        <Link href={href}>
          View all
          <ArrowRight />
        </Link>
      </div>
      <div className="v2-grid">
        {items.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            saved={saved}
            toggle={toggle}
            add={add}
          />
        ))}
      </div>
    </section>
  );
}

function HomePage({
  saved,
  toggle,
  add,
  signedIn,
  boosted,
}: {
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  signedIn: boolean;
  boosted: Product[];
}) {
  const heroVideo = useRef<HTMLVideoElement>(null);
  const [heroReady, setHeroReady] = useState(false);
  const [homeStories, setHomeStories] = useState(storyData.slice(0, 3));
  useEffect(() => {
    const resumeHeroVideo = () => {
      if (document.visibilityState === "visible")
        heroVideo.current?.play().catch(() => undefined);
    };
    heroVideo.current?.play().catch(() => undefined);
    document.addEventListener("visibilitychange", resumeHeroVideo);
    window.addEventListener("focus", resumeHeroVideo);
    return () => {
      document.removeEventListener("visibilitychange", resumeHeroVideo);
      window.removeEventListener("focus", resumeHeroVideo);
    };
  }, []);
  useEffect(() => {
    void createClient().from("blog_posts")
      .select("id,slug,title,excerpt,content,category,cover_image,featured,published_at")
      .eq("status", "published").lte("published_at", new Date().toISOString())
      .order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(3)
      .then(({ data }: { data: Record<string, unknown>[] | null }) => { if (data?.length) setHomeStories(data.map(mapBlogPost)); });
  }, []);

  return (
    <main>
      <section className="v2-hero">
        <video
          ref={heroVideo}
          className={`v2-hero-video ${heroReady ? "ready" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="CLOZER fashion editorial"
          onLoadedData={() => setHeroReady(true)}
          onCanPlay={(event) => {
            setHeroReady(true);
            event.currentTarget.play().catch(() => undefined);
          }}
        >
          <source src="/assets/velora-hero.mp4" type="video/mp4" />
        </video>
        <div className="v2-hero-overlay" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="v2-hero-copy"
        >
          <h1>Gjej tënden.</h1>
          <div>
            <Link href="/explore" className="v2-pill light">
              Shop the edit
              <ArrowRight />
            </Link>
            <Link href="/sell" className="v2-pill glass">
              Sell a piece
            </Link>
          </div>
        </motion.div>
        <div className="v2-trust">
          <ShieldCheck />
          <span>
            <b>CLOZER AUTHENTICATED</b>
            <small>Expert reviewed, buyer protected</small>
          </span>
        </div>
      </section>
      <section className="v2-section v2-home-boost">
        <div className="v2-section-head">
          <div>
            <span>CLOZER BOOST</span>
            <h2>Në fokus tani</h2>
          </div>
          <Link href="/explore">Shiko të gjitha <ArrowRight /></Link>
        </div>
        <div className="v2-boost-grid">
          {boosted.slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} saved={saved} toggle={toggle} add={add} />
          ))}
        </div>
        <p className="v2-boost-note"><TrendingUp /> Pozicionet e promovuara shënohen gjithmonë qartë.</p>
      </section>
      <section className="v2-worlds v2-section">
        <div className="v2-section-head">
          <div>
            <span>EKSPLORO SIPAS STILIT</span>
            <h2>Gjej pjesën që të përfaqëson</h2>
          </div>
        </div>
        <div className="v2-world-grid">
          {[
            ["Women", "/assets/blazer-one.webp"],
            ["Bags", "/assets/bag-one.webp"],
            ["Sneakers", "/assets/sneaker-one.webp"],
            ["Watches", "/assets/watch-one.webp"],
            ["Jewelry", "/assets/bracelet-one.webp"],
          ].map(([c, img]) => (
            <Link key={c} href={`/explore?category=${c}`}>
              <img src={img} alt={c} />
              <span>
                {c}
                <ArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="v2-section v2-curated-grid">
        <div className="v2-section-head">
          <div>
            <span>PËR TY</span>
            <h2>Përzgjedhur për ty</h2>
          </div>
          <Link href="/explore?department=women">
            Shiko të gjitha
            <ArrowRight />
          </Link>
        </div>
        <div>
          {[products[1], products[10], products[18], products[20]].map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              saved={saved}
              toggle={toggle}
              add={add}
            />
          ))}
        </div>
      </section>
      <section className="v2-editorial v2-section">
        <Link href="/explore?verified=1">
          <img src="/assets/blazer-one.webp" alt="Authenticated luxury edit" />
          <div>
            <span>THE AUTHENTICATED EDIT</span>
            <h2>
              Icons, then
              <br />
              and now.
            </h2>
            <p>Explore pieces verified by our specialists</p>
          </div>
        </Link>
        <div>
          <Sparkles />
          <blockquote>“Buy less, choose well, make it last.”</blockquote>
          <span>VIVIENNE WESTWOOD</span>
          <Link href="/explore?sort=new">
            Discover new arrivals
            <ArrowRight />
          </Link>
        </div>
      </section>
      <Rail
        title="Tregu i përzgjedhur · Meshkuj"
        items={[products[2], products[3], products[11], products[21]]}
        saved={saved}
        toggle={toggle}
        add={add}
        href="/explore?department=men"
      />
      <Rail
        title="Produktet në zbritje"
        items={[products[0], products[2], products[9], products[17]]}
        saved={saved}
        toggle={toggle}
        add={add}
        href="/explore?sort=drop"
      />
      <section className="v2-sell-banner v2-section">
        <div>
          <span>GARDEROBA JOTE, ME VLERË TË RE</span>
          <h2>Jepu pjesëve të veçanta kapitullin e radhës.</h2>
          <p>
            Fotografoje, kontrollo shpalljen inteligjente dhe publikoje. Ti e ke
            kontrollin.
          </p>
          <Link href="/sell" className="v2-pill dark">
            Fillo të shesësh
            <ArrowRight />
          </Link>
        </div>
        <div className="v2-sell-preview">
          <ProductImage p={products[0]} />
          <span>
            <WandSparkles />
            Asistenti inteligjent i shpalljes
          </span>
          <b>U identifikua Bottega Veneta</b>
          <small>Çmimi i sugjeruar €1,180–€1,340</small>
        </div>
      </section>
      <section className="v2-story-strip v2-section">
        <div className="v2-section-head">
          <div>
            <span>CLOZER STORIES</span>
            <h2>Moda përtej produktit</h2>
          </div>
          <Link href="/stories">
            Lexo të gjitha
            <ArrowRight />
          </Link>
        </div>
        <div>
          {homeStories.map((story) => (
            <Link href={`/stories/${story.slug}`} key={story.id}>
              <img src={story.image} alt="" />
              <span>{story.tag}</span>
              <h3>{story.title}</h3>
              <p>
                Lexo historinë
                <ArrowRight />
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function ExplorePage({
  saved,
  toggle,
  add,
  catalog,
  signedIn,
}: {
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  catalog: Product[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [filters, setFilters] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [savedSearches, setSavedSearches] = usePersistent<string[]>(
    "velora-saved-searches",
    [],
  );
  const q = (params.get("q") || "").toLowerCase();
  const department = params.get("department") || "all";
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "curated";
  const active = {
    brand: params.get("brand") || "All",
    condition: params.get("condition") || "All",
    city: params.get("city") || "All",
    gender: params.get("gender") || "All",
    size: params.get("size") || "All",
    color: params.get("color") || "All",
    material: params.get("material") || "All",
    min: Number(params.get("min")) || 0,
    max: Number(params.get("max")) || 10000,
    auth: params.get("auth") || "All",
    shipping: params.get("shipping") === "1",
    negotiable: params.get("negotiable") === "1",
  };
  const [draft, setDraft] = useState(active);
  const normalizedValue = (raw: string) => {
    const aliases: Record<string, string> = {
      Pristina: "Prishtinë", Copenhagen: "Kopenhagë", Geneva: "Gjenevë",
      London: "Londër", Milan: "Milano", Vienna: "Vjenë",
      "One size": "Një madhësi", New: "E re", Excellent: "Shkëlqyeshëm",
      "Very good": "Shumë mirë", Black: "E zezë", Gold: "Ari", Cream: "Krem",
    };
    return aliases[raw] || raw;
  };
  const value = (p: Product, key: "gender" | "material") =>
    p[key] ||
    (key === "gender"
      ? p.category === "Women"
        ? "Femra"
        : "Unisex"
      : p.category === "Bags"
        ? "Lëkurë"
        : p.category === "Jewelry"
          ? "Metal"
          : "Tekstil");
  const results = useMemo(
    () =>
      catalog
        .filter(
          (p) =>
            (department === "all" ||
              value(p, "gender") === departmentGender(department)) &&
            (category === "all" ||
              p.category === category ||
              p.category === categoryLabel(category)) &&
            (active.brand === "All" || p.brand === active.brand) &&
            (active.condition === "All" || normalizedValue(p.condition) === active.condition) &&
            (active.city === "All" || normalizedValue(p.city) === active.city) &&
            (active.gender === "All" || value(p, "gender") === active.gender) &&
            (active.size === "All" || normalizedValue(p.size) === active.size) &&
            (active.color === "All" || normalizedValue(p.color) === active.color) &&
            (active.material === "All" ||
              value(p, "material") === active.material) &&
            (!q ||
              `${p.name} ${p.brand} ${p.seller} ${p.category} ${p.color}`
                .toLowerCase()
                .includes(q)) &&
            p.price >= active.min &&
            p.price <= active.max &&
            (active.auth === "All" || p.authLevel === active.auth) &&
            (!active.shipping || p.shipping !== false) &&
            (!active.negotiable || p.negotiable !== false),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : sort === "drop"
                ? (b.oldPrice ? 1 : 0) - (a.oldPrice ? 1 : 0)
                : sort === "popular"
                  ? Number(b.verified) - Number(a.verified)
                  : productSeed(b.id) - productSeed(a.id),
        ),
    [
      catalog,
      department,
      category,
      q,
      sort,
      active.brand,
      active.condition,
      active.city,
      active.gender,
      active.size,
      active.color,
      active.material,
      active.min,
      active.max,
      active.auth,
      active.shipping,
      active.negotiable,
    ],
  );
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "All" || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/explore${next.toString() ? `?${next}` : ""}`);
  };
  const setDepartmentParam = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("category");
    next.delete("group");
    if (value === "all") next.delete("department");
    else next.set("department", value);
    router.push(`/explore${next.toString() ? `?${next}` : ""}`);
    setCategoryOpen(false);
  };
  const activeDepartment = department === "all" ? null : findCategory(department);
  const activeCategoryName = activeDepartment?.children
    ?.flatMap((group) => group.children || [])
    .find((item) => item.slug === category)?.nameSq;
  const applyFilters = () => {
    const next = new URLSearchParams(params.toString());
    Object.entries(draft).forEach(([key, raw]) => {
      const string = String(raw);
      if (
        raw === false ||
        string === "All" ||
        (key === "min" && raw === 0) ||
        (key === "max" && raw === 10000)
      )
        next.delete(key);
      else next.set(key, typeof raw === "boolean" ? "1" : string);
    });
    router.push(`/explore${next.toString() ? `?${next}` : ""}`);
    setFilters(false);
  };
  const clearFilters = () => {
    router.push("/explore");
    setDraft({
      brand: "All",
      condition: "All",
      city: "All",
      gender: "All",
      size: "All",
      color: "All",
      material: "All",
      min: 0,
      max: 10000,
      auth: "All",
      shipping: false,
      negotiable: false,
    });
  };
  const filterCount = Object.entries(active).filter(
    ([key, v]) =>
      v !== "All" &&
      v !== false &&
      !(key === "min" && v === 0) &&
      !(key === "max" && v === 10000),
  ).length;
  const selectOptions = (
    key: "brand" | "condition" | "city" | "size" | "color",
    field: keyof Product,
  ) =>
    [
      ...new Set(catalog.map((p) => normalizedValue(String(p[field] || ""))).filter(Boolean)),
    ].sort();
  const saveSearch = () => {
    if (!signedIn) {
      requestAccount(`/explore${params.toString() ? `?${params}` : ""}`);
      return;
    }
    const key = params.toString() || "Të gjitha produktet";
    if (!savedSearches.includes(key)) setSavedSearches([...savedSearches, key]);
  };
  const runAdvancedSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!advancedQuery.trim()) return;
    router.push(`/explore?q=${encodeURIComponent(advancedQuery.trim())}`);
    setAdvancedSearch(false);
  };
  return (
    <main className="v2-page">
      <div className="v2-explore-head">
        <div>
          <span>EKSPLORO</span>
          <h1>
            {q
              ? `Rezultatet për “${params.get("q")}”`
              : "Pjesë që ia vlen t’i zbulosh"}
          </h1>
          <p>
            {results.length === 1
              ? "1 produkt i përzgjedhur"
              : `${results.length} produkte të përzgjedhura`}
          </p>
        </div>
        <div className="v2-explore-tools">
          <button onClick={() => setAdvancedSearch(true)}>
            <Search />
            <span>
              <b>Kërkim i avancuar</b>
              <small>Kërko me brend, stil, ngjyrë ose buxhet</small>
            </span>
            <ArrowRight />
          </button>
          <button className="v2-save-search" onClick={saveSearch}>
            <Bell />
            {savedSearches.includes(params.toString() || "Të gjitha produktet")
              ? "Kërkimi u ruajt"
              : "Ruaj kërkimin"}
          </button>
        </div>
      </div>
      <div className="v2-filterbar">
        <div>
          {categories.map((c) => (
            <button
              key={c}
              className={department === c ? "active" : ""}
              onClick={() => setDepartmentParam(c)}
            >
              {categoryLabel(c)}
            </button>
          ))}
          {department !== "all" && (
            <div className="v2-category-picker">
              <button type="button" className={`v2-category-trigger ${categoryOpen ? "open" : ""}`} onClick={() => setCategoryOpen((value) => !value)} aria-expanded={categoryOpen} aria-haspopup="listbox">
                <span>{activeCategoryName || "Të gjitha nënkategoritë"}</span><ChevronDown />
              </button>
              <AnimatePresence>
                {categoryOpen && (
                  <motion.div className="v2-category-popover" role="listbox" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}>
                    <button type="button" className={category === "all" ? "selected" : ""} onClick={() => { setParam("category", "all"); setCategoryOpen(false); }}>
                      Të gjitha nënkategoritë {category === "all" && <Check />}
                    </button>
                    {activeDepartment?.children?.map((group) => (
                      <section key={group.slug}><span>{group.nameSq}</span>
                        {group.children?.map((item) => (
                          <button type="button" key={item.slug} className={category === item.slug ? "selected" : ""} onClick={() => { setParam("category", item.slug); setCategoryOpen(false); }}>
                            {item.nameSq} {category === item.slug && <Check />}
                          </button>
                        ))}
                      </section>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={() => {
              setDraft(active);
              setFilters(true);
            }}
          >
            <Filter />
            Filtrat{filterCount > 0 && <b>{filterCount}</b>}
          </button>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            aria-label="Rendit produktet"
          >
            <option value="curated">Të përzgjedhura</option>
            <option value="new">Më të rejat</option>
            <option value="popular">Më të pëlqyerat</option>
            <option value="low">Çmimi: nga i ulëti</option>
            <option value="high">Çmimi: nga i larti</option>
            <option value="drop">Uljet më të mëdha</option>
          </select>
        </div>
      </div>
      {filterCount > 0 && (
        <div className="v2-active-filters">
          {Object.entries(active).map(([key, v]) =>
            v !== "All" &&
            v !== false &&
            !(key === "min" && v === 0) &&
            !(key === "max" && v === 10000) ? (
              <button key={key} onClick={() => setParam(key, "All")}>
                {key === "min"
                  ? `Nga ${v}€`
                  : key === "max"
                    ? `Deri ${v}€`
                    : key === "shipping"
                      ? "Me transport"
                      : key === "negotiable"
                        ? "I negociueshëm"
                        : String(v)}
                <X />
              </button>
            ) : null,
          )}
          <button className="clear" onClick={clearFilters}>
            Pastro të gjitha
          </button>
        </div>
      )}
      {results.length ? (
        <div
          className={`v2-grid v2-results ${results.length === 1 ? "single" : ""}`}
        >
          {results.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              saved={saved}
              toggle={toggle}
              add={add}
            />
          ))}
        </div>
      ) : (
        <div className="v2-empty">
          <Search />
          <h2>Nuk u gjet asnjë produkt</h2>
          <p>Pastro filtrat ose provo një kërkim më të gjerë.</p>
          <button className="v2-pill dark" onClick={clearFilters}>
            Pastro filtrat
          </button>
        </div>
      )}
      <AnimatePresence>
        {filters && (
          <motion.div
            className="v2-drawer-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFilters(false)}
          >
            <motion.aside
              className="v2-filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Filtrat"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="v2-drawer-head">
                <div>
                  <small>PERSONALIZO REZULTATET</small>
                  <h2>Filtrat</h2>
                </div>
                <button
                  className="v2-icon"
                  onClick={() => setFilters(false)}
                  aria-label="Mbyll filtrat"
                >
                  <X />
                </button>
              </div>
              <div className="v2-filter-scroll">
                <div className="v2-filter-grid">
                  <label>
                    Brendi
                    <select
                      value={draft.brand}
                      onChange={(e) =>
                        setDraft({ ...draft, brand: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {selectOptions("brand", "brand").map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Gjendja
                    <select
                      value={draft.condition}
                      onChange={(e) =>
                        setDraft({ ...draft, condition: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {selectOptions("condition", "condition").map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Gjinia
                    <select
                      value={draft.gender}
                      onChange={(e) =>
                        setDraft({ ...draft, gender: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {["Femra", "Meshkuj", "Unisex", "Fëmijë"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Madhësia
                    <select
                      value={draft.size}
                      onChange={(e) =>
                        setDraft({ ...draft, size: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {selectOptions("size", "size").map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ngjyra
                    <select
                      value={draft.color}
                      onChange={(e) =>
                        setDraft({ ...draft, color: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {selectOptions("color", "color").map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Materiali
                    <select
                      value={draft.material}
                      onChange={(e) =>
                        setDraft({ ...draft, material: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {[
                        "Lëkurë",
                        "Tekstil",
                        "Metal",
                        "Mëndafsh",
                        "Lesh",
                        "Acetat",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Lokacioni
                    <select
                      value={draft.city}
                      onChange={(e) =>
                        setDraft({ ...draft, city: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      {selectOptions("city", "city").map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Niveli i kontrollit
                    <select
                      value={draft.auth}
                      onChange={(e) =>
                        setDraft({ ...draft, auth: e.target.value })
                      }
                    >
                      <option value="All">Të gjitha</option>
                      <option value="ai">Analizë AI</option>
                      <option value="expert">Rishikim eksperti</option>
                      <option value="physical">Kontroll fizik</option>
                      <option value="none">Pa kontroll</option>
                    </select>
                  </label>
                </div>
                <fieldset className="v2-price-filter">
                  <legend>Çmimi</legend>
                  <label>
                    <span>Minimumi</span>
                    <div>
                      €
                      <input
                        inputMode="numeric"
                        value={draft.min}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            min: Math.max(
                              0,
                              Number(e.target.value.replace(/\D/g, "")),
                            ),
                          })
                        }
                      />
                    </div>
                  </label>
                  <label>
                    <span>Maksimumi</span>
                    <div>
                      €
                      <input
                        inputMode="numeric"
                        value={draft.max}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            max: Math.max(
                              draft.min,
                              Number(e.target.value.replace(/\D/g, "")),
                            ),
                          })
                        }
                      />
                    </div>
                  </label>
                </fieldset>
                <label className="v2-switch-row">
                  <span>
                    <b>Transport i disponueshëm</b>
                    <small>Vetëm produkte që mund të dërgohen</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.shipping}
                    onChange={(e) =>
                      setDraft({ ...draft, shipping: e.target.checked })
                    }
                  />
                </label>
                <label className="v2-switch-row">
                  <span>
                    <b>Çmim i negociueshëm</b>
                    <small>Shitësi pranon oferta</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.negotiable}
                    onChange={(e) =>
                      setDraft({ ...draft, negotiable: e.target.checked })
                    }
                  />
                </label>
              </div>
              <footer>
                <button className="v2-link-btn" onClick={clearFilters}>
                  Pastro
                </button>
                <button className="v2-pill dark" onClick={applyFilters}>
                  Shfaq rezultatet
                </button>
              </footer>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {advancedSearch && (
          <motion.div
            className="v2-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAdvancedSearch(false)}
          >
            <motion.form
              className="v2-ai-search-modal"
              onSubmit={runAdvancedSearch}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="v2-icon close"
                onClick={() => setAdvancedSearch(false)}
                aria-label="Mbyll"
              >
                <X />
              </button>
              <Search />
              <span>KËRKIM I AVANCUAR</span>
              <h2>Përshkruaje atë që kërkon.</h2>
              <p>Kërko me stil, buxhet, brend, ngjyrë ose rast përdorimi.</p>
              <div>
                <Search />
                <input
                  autoFocus
                  value={advancedQuery}
                  onChange={(e) => setAdvancedQuery(e.target.value)}
                  placeholder="p.sh. çantë e zezë elegante nën 800€"
                />
              </div>
              <section>
                {[
                  "Atlete të reja EU 43",
                  "Orë luksoze nën 2,000€",
                  "Çantë vintage në Prishtinë",
                ].map((x) => (
                  <button type="button" key={x} onClick={() => setAdvancedQuery(x)}>
                    {x}
                  </button>
                ))}
              </section>
              <button className="v2-pill dark wide">
                Kërko tani
                <ArrowRight />
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ListingPage({
  id,
  saved,
  toggle,
  add,
  buy,
  catalog,
  signedIn,
}: {
  id: ProductId;
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  buy: (id: ProductId) => void;
  catalog: Product[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const p = catalog.find((product) => String(product.id) === String(id));
  const [offer, setOffer] = useState(false);
  const [sent, setSent] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [offerConversation, setOfferConversation] = useState("");
  const [question, setQuestion] = useState("");
  const [report, setReport] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [reportReason, setReportReason] = useState("counterfeit");
  const [reportDetails, setReportDetails] = useState("");
  const [gallery, setGallery] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [notice, setNotice] = useState("");
  if (!p)
    return (
      <main className="v2-page">
        <div className="v2-listing-missing">
          <Search />
          <span>404 · PRODUKTI NUK U GJET</span>
          <h1>Kjo shpallje nuk është më e disponueshme.</h1>
          <p>
            Mund të jetë shitur, çaktivizuar ose lidhja mund të jetë e pasaktë.
          </p>
          <Link className="v2-pill dark" href="/explore">
            Eksploro produkte të tjera
            <ArrowRight />
          </Link>
        </div>
      </main>
    );
  const galleryImages = p.images?.length ? p.images : [p.image];
  const currentImage =
    galleryImages[Math.min(gallery, galleryImages.length - 1)];
  const reference = productReference(p);
  const savedCount = 18 + productSeed(p.id) * 3;
  const published = p.publishedAt
    ? new Date(p.publishedAt).toLocaleDateString("sq-AL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Së fundmi";
  const share = async () => {
    const payload = {
      title: `${p.brand} · ${p.name}`,
      text: `Shiko këtë produkt në CLOZER: ${p.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("Lidhja u kopjua.");
      }
    } catch {
      setNotice("Ndarja u anulua.");
    }
  };
  return (
    <main className="v2-page v2-listing">
      <div className="v2-listing-top">
        <div className="v2-breadcrumb">
          <Link href="/explore">Eksploro</Link>
          <ChevronRight />
          <Link href={`/explore?category=${encodeURIComponent(p.category)}`}>
            {p.category}
          </Link>
          <ChevronRight />
          <span>{p.name}</span>
        </div>
        <div>
          <button onClick={() => void share()}>
            <Share2 />
            Ndaje
          </button>
          <button
            onClick={() =>
              signedIn ? setFlagging(true) : requestAccount(`/listing/${p.id}`)
            }
          >
            <Flag />
            Raporto
          </button>
        </div>
      </div>
      {notice && (
        <div className="v2-listing-notice">
          <Check />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Mbyll njoftimin">
            <X />
          </button>
        </div>
      )}
      <div className="v2-listing-layout">
        <section
          className={`v2-gallery-premium ${galleryImages.length === 1 ? "single" : ""}`}
          aria-label="Fotografitë e produktit"
        >
          {galleryImages.length > 1 && (
            <nav>
              {galleryImages.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  className={gallery === index ? "active" : ""}
                  onClick={() => setGallery(index)}
                  aria-label={`Shiko fotografinë ${index + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </nav>
          )}
          <button
            className="v2-gallery-stage"
            onClick={() => setZoom(true)}
            aria-label="Hap fotografinë në ekran të plotë"
          >
            <img
              src={currentImage}
              alt={`${p.brand} ${p.name} — fotografia ${gallery + 1}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <span>
              <Camera />
              {gallery + 1} / {galleryImages.length}
            </span>
            <i>
              <Eye />
              Zmadho fotografinë
            </i>
          </button>
          {galleryImages.length === 1 && (
            <p>
              <Camera />
              Shitësi ka publikuar vetëm një fotografi. Kërko pamje të etiketës,
              brendësisë dhe shenjave të përdorimit para blerjes.
            </p>
          )}
        </section>
        <aside className="v2-buybox">
          <div className="v2-buy-brand">
            <span>{p.brand}</span>
            <div>
              <button onClick={() => void share()} aria-label="Ndaje produktin">
                <Share2 />
              </button>
              <button
                className={saved.includes(p.id) ? "on" : ""}
                onClick={() => toggle(p.id)}
                aria-pressed={saved.includes(p.id)}
                aria-label={
                  saved.includes(p.id)
                    ? "Hiqe nga të ruajturat"
                    : "Ruaje produktin"
                }
              >
                <Heart fill={saved.includes(p.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
          <h1>{p.name}</h1>
          <p>
            {p.size} · {p.condition} · {p.color}
          </p>
          <h2>
            €{p.price.toLocaleString("sq-AL")}
            <small>Mbrojtja e blerësit përfshihet</small>
          </h2>
          <button
            className="v2-auth-report-trigger"
            onClick={() => setReport(true)}
          >
            <AuthBadge p={p} />
            <span>
              Shiko statusin
              <ChevronRight />
            </span>
          </button>
          <button className="v2-pill dark wide" onClick={() => buy(p.id)}>
            Bli tani · €{p.price.toLocaleString("sq-AL")}
          </button>
          {p.negotiable !== false && (
            <button
              className="v2-pill outline wide"
              onClick={() => { if (signedIn) { setOfferAmount(String(Math.round(p.price * .9))); setOfferError(""); setOffer(true); } else requestAccount(`/listing/${p.id}`); }}
            >
              Bëj ofertë
            </button>
          )}
          <button className="v2-pill soft wide" onClick={() => add(p.id)}>
            <ShoppingBag />
            Shto në shportë
          </button>
          <p className="v2-demand">
            <Clock3 />
            {savedCount} persona e kanë ruajtur
          </p>
          <div className="v2-buy-essentials">
            <details open>
              <summary>
                Detajet kryesore
                <Plus />
              </summary>
              <div>
                {[
                  ["Materiali", p.material || "Nuk është specifikuar"],
                  ["Madhësia", p.size],
                  ["Ngjyra", p.color],
                  ["Referenca", reference],
                ].map((item) => (
                  <p key={item[0]}>
                    <span>{item[0]}</span>
                    <b>{item[1]}</b>
                  </p>
                ))}
              </div>
            </details>
            <details>
              <summary>
                Dërgesa dhe kthimi
                <Plus />
              </summary>
              <div>
                <p>
                  <span>Dërgesë e siguruar</span>
                  <b>
                    {p.shipping === false
                      ? "Vetëm marrje personale"
                      : "4–7 ditë"}
                  </b>
                </p>
                <p>
                  <span>Kthimi</span>
                  <b>Brenda 48 orëve</b>
                </p>
                <p>
                  <span>Niset nga</span>
                  <b>{p.city}</b>
                </p>
              </div>
            </details>
            <details>
              <summary>
                Pagesa e mbrojtur
                <Plus />
              </summary>
              <div>
                <p>
                  <span>Pagesa</span>
                  <b>Mbahet deri në dorëzim</b>
                </p>
                <p>
                  <span>Tarifat</span>
                  <b>Shfaqen para konfirmimit</b>
                </p>
              </div>
            </details>
          </div>
          <Link href={sellerHref(p)} className="v2-seller">
            {p.sellerAvatar ? (
              <img src={p.sellerAvatar} alt="" />
            ) : (
              <span className="v2-avatar">
                {p.seller.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span>
              <b>
                {p.seller}
                {p.verified && <BadgeCheck />}
              </b>
              <small>
                <MapPin />
                {p.city} ·{" "}
                {p.verified ? "Shitës i verifikuar" : "Profil publik"}
              </small>
            </span>
            <ChevronRight />
          </Link>
        </aside>
      </div>
      <section className="v2-product-deep">
        <div>
          <span>DETAJET E PRODUKTIT</span>
          <h2>Gjithçka para se të vendosësh.</h2>
          <p>
            Informacioni është dhënë nga shitësi. Statusi i kontrollit tregon
            nivelin e provave të disponueshme, jo garanci absolute.
          </p>
          <div className="v2-detail-grid">
            {[
              ["Brendi", p.brand],
              ["Modeli", p.name],
              ["Gjendja", p.condition],
              ["Materiali", p.material || "Nuk është specifikuar"],
              ["Ngjyra", p.color],
              ["Madhësia", p.size],
              ["Referenca", reference],
              ["Publikuar", published],
            ].map((item) => (
              <article key={item[0]}>
                <small>{item[0]}</small>
                <b>{item[1]}</b>
              </article>
            ))}
          </div>
          <h3>Përshkrimi</h3>
          <p>
            {p.description ||
              "Produkti është paraqitur sipas informacionit të dhënë nga shitësi. Kërko fotografi shtesë për çdo detaj që nuk shihet qartë."}
          </p>
        </div>
        <aside>
          <article>
            <Package />
            <span>
              <b>Dërgesë e siguruar</b>
              <small>Gjurmim nga nisja deri në dorëzim</small>
            </span>
          </article>
          <article>
            <CreditCard />
            <span>
              <b>Kosto transparente</b>
              <small>Totali shfaqet para pagesës</small>
            </span>
          </article>
          <article>
            <LockKeyhole />
            <span>
              <b>Pagesë e mbrojtur</b>
              <small>Shitësi paguhet pas dorëzimit</small>
            </span>
          </article>
          <article>
            <RefreshCcw />
            <span>
              <b>Kthim brenda 48 orëve</b>
              <small>Nëse produkti ndryshon nga shpallja</small>
            </span>
          </article>
          <div className="v2-seller-stats">
            <span>SHITËSI</span>
            <h3>{p.seller}</h3>
            <p>
              {p.verified
                ? "Identiteti i këtij shitësi është verifikuar nga CLOZER."
                : "Shiko profilin, listimet dhe informacionin publik të shitësit para porosisë."}
            </p>
            <Link href={sellerHref(p)}>
              Shiko profilin
              <ArrowRight />
            </Link>
          </div>
        </aside>
      </section>
      <section className="v2-price-transparency">
        <div>
          <TrendingDown />
          <span>
            <small>TRANSPARENCA E ÇMIMIT</small>
            <h2>€{p.price.toLocaleString("sq-AL")}</h2>
          </span>
        </div>
        <p>
          Ky është çmimi i vendosur nga shitësi. CLOZER nuk shfaq histori ose
          krahasime të paverifikuara. Tarifat dhe dërgesa paraqiten qartë para
          pagesës.
        </p>
        {p.negotiable !== false && (
          <button
            onClick={() => { if (signedIn) { setOfferAmount(String(Math.round(p.price * .9))); setOfferError(""); setOffer(true); } else requestAccount(`/listing/${p.id}`); }}
          >
            Propozo një çmim
            <ArrowRight />
          </button>
        )}
      </section>
      <section className="v2-comments">
        <div className="v2-section-head">
          <div>
            <span>PYETJE PËR PRODUKTIN</span>
            <h2>Kontakto shitësin</h2>
          </div>
        </div>
        <p className="v2-question-note">
          Pyet për gjendjen, përmasat, aksesorët ose kërko fotografi shtesë.
        </p>
        <button
          className="v2-pill dark"
          onClick={() =>
            signedIn
              ? router.push(
                  `/messages?listing=${encodeURIComponent(String(p.id))}`,
                )
              : requestAccount(`/listing/${p.id}`)
          }
        >
          Dërgo mesazh
          <Send />
        </button>
      </section>
      <Rail
        title="Mund të të pëlqejnë edhe"
        items={catalog
          .filter((item) => String(item.id) !== String(p.id))
          .slice(0, 4)}
        saved={saved}
        toggle={toggle}
        add={add}
      />
      <div className="v2-mobile-buybar">
        <button
          className={saved.includes(p.id) ? "on" : ""}
          onClick={() => toggle(p.id)}
          aria-label="Ruaje produktin"
        >
          <Heart fill={saved.includes(p.id) ? "currentColor" : "none"} />
        </button>
        <span>
          <small>ÇMIMI</small>
          <b>€{p.price.toLocaleString("sq-AL")}</b>
        </span>
        {p.negotiable !== false && (
          <button
            className="offer"
            onClick={() => { if (signedIn) { setOfferAmount(String(Math.round(p.price * .9))); setOfferError(""); setOffer(true); } else requestAccount(`/listing/${p.id}`); }}
          >
            Ofertë
          </button>
        )}
        <button className="buy" onClick={() => buy(p.id)}>
          Bli tani
        </button>
      </div>
      <AnimatePresence>
        {zoom && (
          <motion.div
            className="v2-gallery-zoom"
            role="dialog"
            aria-modal="true"
            aria-label="Fotografia e produktit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <button
              onClick={() => setZoom(false)}
              aria-label="Mbyll fotografinë"
            >
              <X />
            </button>
            <img src={currentImage} alt={`${p.brand} ${p.name}`} />
            {galleryImages.length > 1 && (
              <nav>
                <button
                  disabled={gallery === 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setGallery((index) => Math.max(0, index - 1));
                  }}
                >
                  <ArrowLeft />
                </button>
                <span>
                  {gallery + 1} / {galleryImages.length}
                </span>
                <button
                  disabled={gallery === galleryImages.length - 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    setGallery((index) =>
                      Math.min(galleryImages.length - 1, index + 1),
                    );
                  }}
                >
                  <ArrowRight />
                </button>
              </nav>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {offer && (
          <motion.div
            className="v2-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOffer(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="offer-title"
              className="v2-offer"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="v2-icon close"
                onClick={() => setOffer(false)}
                aria-label="Mbyll ofertën"
              >
                <X />
              </button>
              {sent ? (
                <div className="v2-success">
                  <Check />
                  <h2>Oferta u dërgua</h2>
                  <p>Shitësi ka 24 orë për t’u përgjigjur.</p>
                  <button
                    className="v2-pill dark"
                    onClick={() => offerConversation ? router.push(`/messages?conversation=${offerConversation}`) : setOffer(false)}
                  >
                    {offerConversation ? "Shiko bisedën" : "Përfundo"}
                  </button>
                </div>
              ) : (
                <>
                  <span>BËJ OFERTË</span>
                  <h2 id="offer-title">Çfarë çmimi propozon?</h2>
                  <p>Oferta jote i dërgohet drejtpërdrejt shitësit.</p>
                  <div className="v2-offer-product">
                    <ProductImage p={p} />
                    <span>
                      <b>{p.brand}</b>
                      <small>
                        Çmimi aktual €{p.price.toLocaleString("sq-AL")}
                      </small>
                    </span>
                  </div>
                  <label>
                    Oferta jote
                    <div>
                      €
                      <input
                        inputMode="numeric"
                        type="text"
                        value={offerAmount}
                        onChange={(event) => setOfferAmount(event.target.value.replace(/[^0-9]/g, ""))}
                      />
                    </div>
                  </label>
                  <label>
                    Mesazh për shitësin
                    <textarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="Shënim opsional"
                    />
                  </label>
                  {offerError && <small className="v2-auth-error">{offerError}</small>}
                  <button
                    className="v2-pill dark wide"
                    disabled={offerBusy}
                    onClick={async () => {
                      const amount = Number(offerAmount);
                      if (!Number.isFinite(amount) || amount <= 0) { setOfferError("Shkruaj një ofertë të vlefshme."); return; }
                      if (typeof p.id !== "string" || !/^[0-9a-f-]{36}$/i.test(p.id) || !p.sellerId) { setOfferError("Ky produkt demonstrues nuk është i lidhur me një shitës real."); return; }
                      setOfferBusy(true); setOfferError("");
                      try {
                        const note = question.trim() ? `\n${question.trim()}` : "";
                        const conversationId = await getOrCreateConversation({ listingId: p.id, sellerId: p.sellerId, firstMessage: `OFERTË · €${amount.toLocaleString("sq-AL")}${note}` });
                        setOfferConversation(conversationId); setSent(true);
                      } catch (sendOfferError) {
                        setOfferError(sendOfferError instanceof Error ? sendOfferError.message : "Oferta nuk mund të dërgohej.");
                      } finally { setOfferBusy(false); }
                    }}
                  >
                    {offerBusy ? "Duke dërguar…" : "Dërgo ofertën"}
                    <Send />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {flagging && (
          <motion.div className="v2-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFlagging(false)}>
            <motion.form
              className="v2-report-listing"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user && typeof p.id === "string" && /^[0-9a-f-]{36}$/i.test(p.id)) {
                    const { error } = await supabase.from("listing_reports").insert({ listing_id: p.id, reporter_id: user.id, reason: reportReason, details: reportDetails.trim() });
                    if (error) throw error;
                  }
                  setFlagging(false);
                  setNotice("Raporti u dërgua në ekipin e sigurisë CLOZER.");
                } catch {
                  setNotice("Raporti nuk u dërgua. Provo përsëri.");
                }
              }}
            >
              <button type="button" className="v2-icon close" onClick={() => setFlagging(false)} aria-label="Mbyll"><X /></button>
              <span>BESIMI DHE SIGURIA</span>
              <h2>Raporto këtë produkt</h2>
              <p>Raporti është konfidencial. Shitësi nuk e sheh identitetin tënd.</p>
              <label>Arsyeja
                <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                  <option value="counterfeit">Dyshim për falsifikim</option>
                  <option value="misleading">Përshkrim ose foto mashtruese</option>
                  <option value="prohibited">Produkt i ndaluar</option>
                  <option value="stolen">Dyshim për produkt të vjedhur</option>
                  <option value="spam">Spam ose shpallje e përsëritur</option>
                  <option value="other">Tjetër</option>
                </select>
              </label>
              <label>Detaje shtesë
                <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={2000} placeholder="Na trego çfarë vure re…" />
              </label>
              <div className="v2-report-assurance"><ShieldCheck /><span><b>Shqyrtim nga ekipi CLOZER</b><small>Produktet me rrezik mund të pezullohen menjëherë.</small></span></div>
              <button className="v2-pill dark wide" type="submit">Dërgo raportin <Flag /></button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {report && (
          <motion.div
            className="v2-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReport(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-report-title"
              className="v2-auth-report"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="v2-icon close"
                onClick={() => setReport(false)}
                aria-label="Mbyll raportin"
              >
                <X />
              </button>
              <span>STATUSI I KONTROLLIT</span>
              <h2 id="auth-report-title">
                Vlerësim transparent, jo garanci absolute.
              </h2>
              <AuthBadge p={p} />
              <p>
                {p.authLevel === "none"
                  ? "Ky produkt nuk ka ende analizë AI ose kontroll manual. Kërko fotografi shtesë dhe prova para blerjes."
                  : "Statusi bazohet në provat e regjistruara. Asnjë analizë nga fotografitë nuk paraqitet si deklaratë 100% autenticiteti."}
              </p>
              <div className="v2-auth-evidence">
                <article>
                  <b>Klasifikimi</b>
                  <span>
                    {p.authLevel === "none"
                      ? "Dëshmi të pamjaftueshme"
                      : p.authRisk === "high"
                        ? "Rrezik i lartë falsifikimi"
                        : p.authRisk === "medium"
                          ? "Rrezik mesatar falsifikimi"
                          : "Rrezik i ulët falsifikimi"}
                  </span>
                </article>
                <article>
                  <b>Rishikimi manual</b>
                  <span>
                    {p.authLevel === "none" || p.authRisk === "high"
                      ? "Kërkohet"
                      : "Sipas nevojës"}
                  </span>
                </article>
              </div>
              <Link className="v2-auth-learn" href="/authentication">
                Si funksionon sistemi CLOZER?
                <ArrowRight />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function SellPage({
  publish,
  signedIn,
}: {
  publish: (p: ListingDraft) => Promise<string>;
  signedIn: boolean;
}) {
  const router = useRouter();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState("");
  const [cover, setCover] = useState("");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("Bottega Veneta");
  const [department, setDepartment] = useState("women");
  const [categoryGroup, setCategoryGroup] = useState("women-clothing");
  const [category, setCategory] = useState("dresses");
  const [condition, setCondition] = useState("Si i ri");
  const [gender, setGender] = useState("Femra");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [reference, setReference] = useState("");
  const [city, setCity] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [retailPrice, setRetailPrice] = useState(1600);
  const [price, setPrice] = useState(0);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [activeShot, setActiveShot] = useState("Përpara");
  const [captured, setCaptured] = useState<string[]>([]);
  const [listingId, setListingId] = useState("");
  const [analysis, setAnalysis] = useState<AuthenticityResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const shots = ["Përpara", "Prapa", "Logoja", "Etiketa"];
  const ratios: Record<string, [number, number]> = {
    "Si i ri": [0.75, 0.8],
    "Shumë mirë": [0.65, 0.7],
    Mirë: [0.6, 0.65],
    "I dëmtuar": [0.45, 0.5],
    "Shumë i përdorur": [0.2, 0.35],
    "I ri": [0.9, 0.95],
  };
  const range = ratios[condition] || ratios["Mirë"];
  const suggested: [number, number] = [
    Math.round(retailPrice * range[0]),
    Math.round(retailPrice * range[1]),
  ];
  const file = (f?: File) => {
    if (!f) return;
    const img = new Image();
    const src = URL.createObjectURL(f);
    img.onload = () => {
      const max = 1600,
        scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext("2d")
        ?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.9);
      URL.revokeObjectURL(src);
      setPreview(data);
      setPhotos((v) => ({ ...v, [activeShot]: data }));
      if (!cover || activeShot === "Përpara") setCover(data);
      setCaptured((v) => (v.includes(activeShot) ? v : [...v, activeShot]));
    };
    img.src = src;
  };
  const runAnalysis = async (id = listingId) => {
    if (!id) return;
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const body = new FormData();
      body.set("listing_id", id);
      for (const [index, dataUrl] of shots
        .map((x) => photos[x])
        .filter(Boolean)
        .entries()) {
        const blob = await (await fetch(dataUrl)).blob();
        body.append(
          "images",
          new File([blob], `evidence-${index + 1}.jpg`, {
            type: blob.type || "image/jpeg",
          }),
        );
      }
      const response = await fetch("/api/ai/authenticity-check", {
        method: "POST",
        body,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analiza AI dështoi.");
      setAnalysis(payload as AuthenticityResult);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Analiza AI dështoi.",
      );
    } finally {
      setAnalyzing(false);
    }
  };
  if (!signedIn)
    return (
      <main className="v2-sell-page">
        <div className="v2-publish-success v2-login-required">
          <LockKeyhole />
          <span>VEPRIM I MBROJTUR</span>
          <h1>Kyçu për të shitur.</h1>
          <p>
            Publikimi, draftet dhe menaxhimi i shpalljeve janë të lidhura vetëm
            me llogarinë tënde.
          </p>
          <Link className="v2-pill dark" href="/">
            Kthehu dhe kyçu
            <ArrowRight />
          </Link>
        </div>
      </main>
    );
  if (published)
    return (
      <main className="v2-sell-page">
        <div className="v2-publish-success v2-ai-result">
          <Clock3 />
          <span>U DËRGUA PËR SHQYRTIM</span>
          <h1>Produkti yt është në pritje.</h1>
          <p>
            Ekipi CLOZER do ta kontrollojë para se të shfaqet publikisht. Do të
            njoftohesh sapo të aprovohet ose nëse kërkohen ndryshime.
          </p>
          {analyzing ? (
            <div className="v2-ai-state">
              <RefreshCcw className="spin" />
              <b>AI analysis in progress</b>
              <small>
                Po analizohen së bashku {Object.keys(photos).length} fotografi…
              </small>
            </div>
          ) : analysis ? (
            <AuthenticityResultCard result={analysis} />
          ) : analysisError ? (
            <div className="v2-ai-state error">
              <AlertTriangle />
              <b>Analiza AI nuk u përfundua</b>
              <small>{analysisError}</small>
              <button
                className="v2-pill outline"
                onClick={() => void runAnalysis()}
              >
                Provo përsëri
                <RefreshCcw />
              </button>
            </div>
          ) : null}
          <div>
            <button
              className="v2-pill dark"
              onClick={() => router.push(`/listing/${listingId}`)}
            >
              Shiko statusin
            </button>
            <button
              className="v2-pill outline"
              onClick={() => {
                setPublished(false);
                setStep(1);
                setPreview("");
                setCover("");
                setPhotos({});
                setCaptured([]);
                setAnalysis(null);
                setListingId("");
              }}
            >
              Shit një tjetër
            </button>
          </div>
        </div>
      </main>
    );
  return (
    <main className="v2-sell-page">
      <div className="v2-sell-top">
        <Link href="/" aria-label="Close selling flow">
          <X />
        </Link>
        <Brand />
        <span>Draft saved locally</span>
      </div>
      <div className="v2-steps">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={step >= n ? "active" : ""}>
            {step > n ? <Check /> : n}
          </span>
        ))}
      </div>
      <motion.section
        key={step}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        className="v2-sell-step"
      >
        {step === 1 && (
          <>
            <span>HAPI 1 NGA 4 · FOTOGRAFITË</span>
            <h1>Fotografoje si një ekspert.</h1>
            <p>
              Zgjidh çdo kënd dhe ndiq kornizën. Të gjitha fotografitë
              analizohen së bashku si i njëjti produkt.
            </p>
            <input
              ref={cameraInput}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => {
                file(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <input
              ref={galleryInput}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                file(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <div className="v2-guided-capture">
              <div
                className="v2-camera-frame"
                style={
                  preview ? { backgroundImage: `url(${preview})` } : undefined
                }
              >
                <span />
                <span />
                <span />
                <span />
                {preview ? (
                  <>
                    <i>{activeShot}</i>
                    <b>
                      <Check />
                      Fotografia u ruajt
                    </b>
                  </>
                ) : (
                  <div className="v2-photo-source-picker">
                    <button type="button" onClick={() => cameraInput.current?.click()}>
                      <Camera />
                      <b>Hap kamerën</b>
                    </button>
                    <button type="button" onClick={() => galleryInput.current?.click()}>
                      <ImagePlus />
                      <b>Zgjidh nga galeria</b>
                    </button>
                    <small>{activeShot} · dritë natyrale · pa filtra</small>
                  </div>
                )}
              </div>
              <aside>
                <div>
                  <b>Fotot e detyrueshme</b>
                  <small>
                    {captured.length} nga {shots.length} të përfunduara
                  </small>
                </div>
                {shots.map((x) => (
                  <button
                    key={x}
                    className={`${activeShot === x ? "active" : ""} ${captured.includes(x) ? "done" : ""}`}
                    onClick={() => {
                      setActiveShot(x);
                      setPreview(photos[x] || "");
                    }}
                  >
                    <span>
                      {captured.includes(x) ? <Check /> : <Camera />}
                      {x}
                    </span>
                    <ChevronRight />
                  </button>
                ))}
                <div className="v2-photo-source-actions">
                  <button type="button" className="v2-capture-action" onClick={() => cameraInput.current?.click()}>
                    <Camera />
                    {captured.includes(activeShot) ? "Ribëje" : "Kamera"}
                  </button>
                  <button type="button" className="v2-gallery-action" onClick={() => galleryInput.current?.click()}>
                    <ImagePlus />
                    Galeria
                  </button>
                </div>
              </aside>
            </div>
            <div className="v2-photo-safety">
              <ShieldCheck />
              <span>
                <b>Kontroll AI i autenticitetit pas publikimit</b>
                <small>
                  Analiza vlerëson rrezikun nga provat e dukshme; produktet me
                  rrezik të lartë ose prova të pamjaftueshme kalojnë në kontroll
                  manual.
                </small>
              </span>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <span>HAPI 2 NGA 4 · DETAJET INTELIGJENTE</span>
            <h1>Përshkruaje produktin.</h1>
            <p>Kontrollo çdo detaj para publikimit.</p>
            <div className="v2-form">
              <label>
                Titulli i shpalljes
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="p.sh. Atlete Air Jordan Retro"
                />
              </label>
              <label>
                Brendi
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </label>
              <div>
                <label>
                  Kategoria
                  <select
                    value={department}
                    onChange={(e) => {
                      const nextDepartment = e.target.value;
                      const nextGroup = findCategory(nextDepartment)?.children?.[0];
                      setDepartment(nextDepartment);
                      setCategoryGroup(nextGroup?.slug || "");
                      setCategory(nextGroup?.children?.[0]?.slug || "");
                      setGender(departmentGender(nextDepartment));
                      setSize("");
                    }}
                  >
                    {departments.map((item) => (
                      <option key={item.slug} value={item.slug}>{item.nameSq}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Grupi
                  <select
                    value={categoryGroup}
                    onChange={(e) => {
                      const nextGroup = e.target.value;
                      setCategoryGroup(nextGroup);
                      setCategory(findCategory(nextGroup)?.children?.[0]?.slug || "");
                      setSize("");
                    }}
                  >
                    {findCategory(department)?.children?.map((item) => (
                      <option key={item.slug} value={item.slug}>{item.nameSq}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Nënkategoria
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setSize(""); }}>
                    {findCategory(categoryGroup)?.children?.map((item) => (
                      <option key={item.slug} value={item.slug}>{item.nameSq}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Gjendja
                  <select value={condition} onChange={(e) => { setCondition(e.target.value); setPrice(0); }}>
                    <option>I ri</option>
                    <option>Si i ri</option>
                    <option>Shumë mirë</option>
                    <option>Mirë</option>
                    <option>I dëmtuar</option>
                    <option>Shumë i përdorur</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Gjinia
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option>Femra</option>
                    <option>Meshkuj</option>
                    <option>Unisex</option>
                    <option>Fëmijë</option>
                  </select>
                </label>
                {category.includes("shoes") || category.includes("trainers") ? (
                  <label>
                    Numri i atleteve
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      <option value="">Zgjidh numrin</option>
                      {Array.from({ length: 25 }, (_, i) => (
                        <option key={35 + i}>EU {35 + i}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    Madhësia
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      <option value="">Zgjidh madhësinë</option>
                      {[
                        "XXS",
                        "XS",
                        "S",
                        "M",
                        "L",
                        "XL",
                        "XXL",
                        "Një madhësi",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <div>
                <label>
                  Ngjyra
                  <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="p.sh. Ulliri" />
                </label>
                <label>
                  Materiali
                  <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="p.sh. Lëkurë" />
                </label>
              </div>
              <div>
                <label>
                  Referenca / kodi i modelit
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="p.sh. VL-1 ose kodi i produktit" />
                </label>
                <label>
                  Qyteti
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="p.sh. Prishtinë" />
                </label>
              </div>
              <label>
                Përshkrimi
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Përshkruaj gjendjen, historinë, defektet dhe çfarë përfshihet." />
              </label>
              <div className="v2-listing-options">
                <label><input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} /> Pranoj oferta për çmimin</label>
                <label><input type="checkbox" checked={shippingAvailable} onChange={(e) => setShippingAvailable(e.target.checked)} /> Dërgesa është në dispozicion</label>
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <span>HAPI 3 NGA 4 · ÇMIMI</span>
            <h1>Vendose çmimin me siguri.</h1>
            <p>
              Vlerësimi lidhet me çmimin e ri, gjendjen e zgjedhur dhe
              kontrollin vizual të fotove.
            </p>
            <label className="v2-retail-price">
              Çmimi i produktit të ri
              <div>
                <span>€</span>
                <input
                  inputMode="numeric"
                  value={retailPrice || ""}
                  onChange={(e) => {
                    setRetailPrice(Number(e.target.value.replace(/\D/g, "")));
                    setPrice(0);
                  }}
                  placeholder="1600"
                />
              </div>
            </label>
            <div className="v2-price-card">
              <WandSparkles />
              <span>ÇMIMI I SUGJERUAR NGA AI</span>
              <b>
                €{suggested[0].toLocaleString()} – €
                {suggested[1].toLocaleString()}
              </b>
              <small>
                {condition} · {Math.round((1 - range[1]) * 100)}–
                {Math.round((1 - range[0]) * 100)}% më lirë se produkti i ri
              </small>
            </div>
            <label className="v2-price-input">
              Çmimi yt
              <div>
                <span>€</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price || ""}
                  onChange={(e) =>
                    setPrice(Number(e.target.value.replace(/\D/g, "")))
                  }
                  placeholder={String(
                    Math.round((suggested[0] + suggested[1]) / 2),
                  )}
                />
              </div>
            </label>
            <div className="v2-earn">
              <span>Ti pranon pas tarifës 5%</span>
              <b>
                €{Math.round((price || suggested[0]) * 0.95).toLocaleString()}
              </b>
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <span>HAPI 4 NGA 4 · KONTROLLI</span>
            <h1>Gati për kapitullin e radhës.</h1>
            <p>
              Pas publikimit produkti shfaqet menjëherë në Eksploro dhe në
              garderobën tënde.
            </p>
            <div className="v2-listing-preview">
              {cover ? (
                <img src={cover} alt="Pamja e shpalljes" />
              ) : (
                <ProductImage p={products[0]} />
              )}
              <div>
                <span>{brand.toUpperCase()}</span>
                <h2>{title || "Produkt i ri"}</h2>
                <p>
                  {condition} · {gender} · {size || "Pa madhësi"}
                </p>
                <b>€{(price || suggested[0]).toLocaleString()}</b>
                <small>
                  <ShieldCheck />
                  Kontrolli i autenticitetit i disponueshëm
                </small>
              </div>
            </div>
          </>
        )}
        {publishError && (
          <small className="v2-auth-error">{publishError}</small>
        )}
        <div className="v2-sell-nav">
          <button
            disabled={step === 1 || publishing}
            onClick={() => setStep(step - 1)}
          >
            Prapa
          </button>
          <button
            disabled={
              publishing ||
              (step === 1 && captured.length < shots.length) ||
              (step === 2 && (!title.trim() || !gender || !size || !description.trim() || !color.trim() || !material.trim())) ||
              (step === 3 && (!retailPrice || !price))
            }
            className="v2-pill dark"
            onClick={async () => {
              if (step < 4) {
                if (step === 2 && !price)
                  setPrice(Math.round((suggested[0] + suggested[1]) / 2));
                setStep(step + 1);
                return;
              }
              setPublishing(true);
              setPublishError("");
              try {
                const imageList = shots.map((x) => photos[x]).filter(Boolean);
                const id = await publish({
                  id: Date.now(),
                  title: title || "Produkt i ri",
                  brand,
                  category,
                  condition,
                  gender,
                  size,
                  retailPrice,
                  price: price || suggested[0],
                  description,
                  color,
                  material,
                  reference,
                  city,
                  negotiable,
                  shippingAvailable,
                  image: cover || preview,
                  images: imageList,
                  publishedAt: new Date().toISOString(),
                });
                setListingId(id);
                setPublished(true);
                void runAnalysis(id);
              } catch (error) {
                setPublishError(
                  error instanceof Error
                    ? error.message
                    : "Publikimi dështoi. Provo përsëri.",
                );
              } finally {
                setPublishing(false);
              }
            }}
          >
            {publishing
              ? "Duke publikuar…"
              : step === 4
                ? "Publiko dhe analizo"
                : "Vazhdo"}
            <ArrowRight />
          </button>
        </div>
      </motion.section>
    </main>
  );
}

function AuthenticityResultCard({ result }: { result: AuthenticityResult }) {
  const labels = {
    low_risk: "Low counterfeit risk",
    medium_risk: "Medium counterfeit risk",
    high_risk: "High counterfeit risk",
    insufficient_evidence: "Insufficient evidence",
  } as const;
  const manual =
    result.classification === "high_risk" ||
    result.classification === "insufficient_evidence";
  return (
    <section
      className={`v2-authenticity-result ${result.classification}`}
      aria-live="polite"
    >
      <header>
        <span>
          <ShieldCheck />
          <b>AI analysis completed</b>
        </span>
        <strong>{labels[result.classification]}</strong>
        {manual && <em>Manual review required</em>}
      </header>
      <div className="v2-ai-scores">
        <span>
          <b>{result.authenticity_risk_score}</b>
          <small>Rreziku / 100</small>
        </span>
        <span>
          <b>{result.confidence_score}</b>
          <small>Besueshmëria / 100</small>
        </span>
      </div>
      <p>{result.short_explanation_albanian}</p>
      <dl>
        <div>
          <dt>Brendi</dt>
          <dd>{result.detected_brand || "Nuk u përcaktua"}</dd>
        </div>
        <div>
          <dt>Kategoria</dt>
          <dd>{result.product_category || "Nuk u përcaktua"}</dd>
        </div>
        <div>
          <dt>Modeli</dt>
          <dd>{result.detected_model || "Nuk u përcaktua"}</dd>
        </div>
        <div>
          <dt>Seria e dukshme</dt>
          <dd>{result.visible_serial_number || "Nuk u pa"}</dd>
        </div>
      </dl>
      {result.warning_signals.length > 0 && (
        <div className="v2-ai-signals">
          <b>Sinjale paralajmëruese</b>
          {result.warning_signals.map((x) => (
            <span key={x}>
              <AlertTriangle />
              {x}
            </span>
          ))}
        </div>
      )}
      {result.required_additional_photos.length > 0 && (
        <div className="v2-ai-signals">
          <b>Fotografi shtesë të kërkuara</b>
          {result.required_additional_photos.map((x) => (
            <span key={x}>
              <Camera />
              {x}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function MessagesPage() {
  const [active, setActive] = useState(0);
  const [mobileChat, setMobileChat] = useState(false);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const chats = [
    {
      name: "Elena Rossi",
      initials: "ER",
      item: "Mini Jodie bag",
      img: products[0],
      seed: "Mund ta dërgoj nesër në mëngjes.",
      online: true,
      time: "Tani",
    },
    {
      name: "Archive No. 8",
      initials: "A8",
      item: "Saint Laurent blazer",
      img: products[1],
      seed: "Oferta jote prej €580 u pranua.",
      online: false,
      time: "1 orë",
    },
    {
      name: "Sole Society",
      initials: "SS",
      item: "Heritage sneaker",
      img: products[2],
      seed: "Po, përfshihet kutia origjinale.",
      online: true,
      time: "Dje",
    },
  ];
  const [messages, setMessages] = usePersistent<Record<number, ChatMessage[]>>(
    "velora-messages",
    {
      0: [
        {
          mine: false,
          text: "Hi! Yes, this piece is still available.",
          time: "14:25",
        },
        {
          mine: true,
          text: "Perfect. Could you ship this week?",
          time: "14:28",
        },
        { mine: false, text: chats[0].seed, time: "14:31" },
      ],
    },
  );
  const current = messages[active] || [
    { mine: false, text: chats[active].seed, time: "Today" },
  ];
  const send = () => {
    if (!text.trim()) return;
    setMessages({
      ...messages,
      [active]: [...current, { mine: true, text: text.trim(), time: "Now" }],
    });
    setText("");
  };
  const visible = chats.filter((c) =>
    `${c.name} ${c.item}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="v2-page v2-messages">
      <div
        className={`v2-inbox v2-inbox-premium ${mobileChat ? "chat-open" : ""}`}
      >
        <aside>
          <header>
            <div>
              <span>INBOX</span>
              <h1>Mesazhet</h1>
            </div>
            <button className="v2-icon" aria-label="Cilësimet e mesazheve">
              <Settings />
            </button>
          </header>
          <label className="v2-inbox-search">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kërko biseda"
            />
          </label>
          <div className="v2-inbox-filter">
            <button className="active">
              Të gjitha <b>{chats.length}</b>
            </button>
            <button>
              Pa lexuar <b>1</b>
            </button>
          </div>
          <div className="v2-conversation-list">
            {visible.map((c) => {
              const i = chats.indexOf(c);
              return (
                <button
                  key={c.name}
                  className={i === active ? "active" : ""}
                  onClick={() => {
                    setActive(i);
                    setMobileChat(true);
                  }}
                >
                  <span className="v2-chat-avatar">
                    {c.initials}
                    <i className={c.online ? "online" : ""} />
                  </span>
                  <span>
                    <b>
                      {c.name}
                      <small>{c.time}</small>
                    </b>
                    <em>{c.item}</em>
                    <p>{messages[i]?.at(-1)?.text || c.seed}</p>
                  </span>
                  {i === 0 && <i className="v2-unread-dot" />}
                </button>
              );
            })}
          </div>
        </aside>
        <section>
          <div className="v2-chat-head">
            <button
              className="v2-icon mobile-back"
              onClick={() => setMobileChat(false)}
              aria-label="Kthehu te bisedat"
            >
              <ArrowLeft />
            </button>
            <span className="v2-chat-avatar">
              {chats[active].initials}
              <i className={chats[active].online ? "online" : ""} />
            </span>
            <span>
              <b>
                {chats[active].name}
                <BadgeCheck />
              </b>
              <small>
                {chats[active].online
                  ? "Aktiv tani"
                  : "Përgjigjet brenda 1 ore"}
              </small>
            </span>
            <Link href="/profile" className="v2-chat-profile">
              Profili
              <ChevronRight />
            </Link>
          </div>
          <div className="v2-chat-product">
            <ProductImage p={chats[active].img} />
            <span>
              <small>PRODUKTI NË DISKUTIM</small>
              <b>{chats[active].item}</b>
              <strong>€{products[active].price.toLocaleString()}</strong>
            </span>
            <button
              className="v2-pill soft"
              onClick={() =>
                setText(
                  `A do ta pranoje €${Math.round(products[active].price * 0.9)}?`,
                )
              }
            >
              <Tag />
              Bëj ofertë
            </button>
          </div>
          <div className="v2-chat-body">
            <span className="v2-chat-day">Sot</span>
            {current.map((m, i) => (
              <div key={i} className={m.mine ? "mine" : ""}>
                {m.text}
                <small>
                  {m.time}
                  {m.mine && " · Lexuar"}
                </small>
              </div>
            ))}
          </div>
          <form
            className="v2-compose"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <button type="button" aria-label="Bashkëngjit foto">
              <ImagePlus />
            </button>
            <button
              type="button"
              aria-label="Shto ofertë"
              onClick={() =>
                setText(
                  `A do ta pranoje €${Math.round(products[active].price * 0.9)}?`,
                )
              }
            >
              <Tag />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Shkruaj një mesazh…"
            />
            <button
              aria-label="Dërgo mesazhin"
              className="send"
              disabled={!text.trim()}
            >
              <Send />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

async function getOrCreateConversation({ listingId, sellerId, firstMessage }: { listingId?: string; sellerId?: string; firstMessage?: string }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Duhet të kyçesh për të dërguar mesazh.");

  let recipientId = sellerId;
  if (listingId && !recipientId) {
    const { data: listing, error } = await supabase.from("listings").select("seller_id").eq("id", listingId).single();
    if (error || !listing?.seller_id) throw new Error("Shitësi i këtij produkti nuk u gjet.");
    recipientId = listing.seller_id;
  }
  if (!recipientId) throw new Error("Shitësi nuk u gjet.");
  if (recipientId === user.id) throw new Error("Nuk mund t’i dërgosh mesazh vetes.");

  let existing = supabase.from("conversations").select("id").eq("buyer_id", user.id).eq("seller_id", recipientId);
  existing = listingId ? existing.eq("listing_id", listingId) : existing.is("listing_id", null);
  const { data: found, error: findError } = await existing.maybeSingle();
  if (findError) throw findError;
  let conversationId = found?.id as string | undefined;

  if (!conversationId) {
    const { data: created, error: createError } = await supabase.from("conversations")
      .insert({ buyer_id: user.id, seller_id: recipientId, listing_id: listingId || null })
      .select("id").single();
    if (createError) {
      if (createError.code !== "23505") throw createError;
      let retry = supabase.from("conversations").select("id").eq("buyer_id", user.id).eq("seller_id", recipientId);
      retry = listingId ? retry.eq("listing_id", listingId) : retry.is("listing_id", null);
      const { data, error } = await retry.single();
      if (error) throw error;
      conversationId = data.id;
    } else conversationId = created.id;
  }

  if (firstMessage?.trim()) {
    if (!conversationId) throw new Error("Biseda nuk mund të krijohej.");
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body: firstMessage.trim() });
    if (error) throw error;
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }
  if (!conversationId) throw new Error("Biseda nuk mund të krijohej.");
  return conversationId;
}

function DatabaseMessagesPage() {
  type ConversationRow = {
    id: string;
    buyer_id: string;
    seller_id: string;
    updated_at: string;
    buyer: { full_name: string | null; username: string | null } | null;
    seller: { full_name: string | null; username: string | null } | null;
    listing: { title: string; price: number } | null;
  };
  type MessageRow = {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
    read_at: string | null;
  };
  const [userId, setUserId] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [active, setActive] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      let requestedConversation = searchParams.get("conversation") || "";
      const listingId = searchParams.get("listing") || "";
      const sellerId = searchParams.get("seller") || "";
      if (!requestedConversation && (listingId || sellerId)) {
        try {
          requestedConversation = await getOrCreateConversation({ listingId: listingId || undefined, sellerId: sellerId || undefined });
        } catch (conversationStartError) {
          setError(conversationStartError instanceof Error ? conversationStartError.message : "Biseda nuk mund të hapej.");
        }
      }
      const { data, error: conversationError } = await supabase
        .from("conversations")
        .select(
          "id,buyer_id,seller_id,updated_at,buyer:profiles!conversations_buyer_id_fkey(full_name,username),seller:profiles!conversations_seller_id_fkey(full_name,username),listing:listings(title,price)",
        )
        .order("updated_at", { ascending: false });
      if (conversationError) {
        setError(conversationError.message);
        setLoading(false);
        return;
      }
      const rows = (data || []) as unknown as ConversationRow[];
      setConversations(rows);
      setActive(rows.some(row => row.id === requestedConversation) ? requestedConversation : rows[0]?.id || "");
      setLoading(false);
    };
    void load();
  }, [searchParams]);
  useEffect(() => {
    if (!active) return;
    const load = async () => {
      const { data, error: messageError } = await createClient()
        .from("messages")
        .select("id,conversation_id,sender_id,body,created_at,read_at")
        .eq("conversation_id", active)
        .order("created_at");
      if (messageError) {
        setError(messageError.message);
        return;
      }
      setMessages((data || []) as MessageRow[]);
    };
    void load();
  }, [active]);
  const send = async () => {
    const body = text.trim();
    if (!body || !active || !userId) return;
    setText("");
    const { data, error: sendError } = await createClient()
      .from("messages")
      .insert({ conversation_id: active, sender_id: userId, body })
      .select("id,conversation_id,sender_id,body,created_at,read_at")
      .single();
    if (sendError) {
      setText(body);
      setError(sendError.message);
      return;
    }
    setMessages((v) => [...v, data as MessageRow]);
    await createClient().from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", active);
    setConversations(current => current.map(conversation => conversation.id === active ? { ...conversation, updated_at: new Date().toISOString() } : conversation));
  };
  if (loading)
    return (
      <main className="v2-page">
        <div className="v2-auth-loading">
          <span>Duke ngarkuar mesazhet…</span>
        </div>
      </main>
    );
  if (!conversations.length)
    return (
      <main className="v2-page">
        <PageTitle
          eyebrow="INBOX"
          title="Mesazhet"
          text="Bisedat me blerës dhe shitës shfaqen këtu"
        />
        {error && <p className="v2-auth-error">{error}</p>}
        <Empty
          icon={<MessageCircle />}
          title="Ende nuk ke mesazhe"
          text="Hap një produkt dhe kontakto shitësin për të nisur bisedën e parë."
          href="/explore"
          action="Eksploro produktet"
        />
      </main>
    );
  const current =
    conversations.find((c) => c.id === active) || conversations[0];
  const other = current.buyer_id === userId ? current.seller : current.buyer;
  const name = other?.full_name || other?.username || "Përdorues CLOZER";
  const initials = name
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <main className="v2-page v2-messages">
      <div className="v2-inbox v2-inbox-premium">
        <aside>
          <header>
            <div>
              <span>INBOX</span>
              <h1>Mesazhet</h1>
            </div>
          </header>
          <div className="v2-conversation-list">
            {conversations.map((c) => {
              const person = c.buyer_id === userId ? c.seller : c.buyer;
              const label =
                person?.full_name || person?.username || "Përdorues CLOZER";
              return (
                <button
                  key={c.id}
                  className={c.id === active ? "active" : ""}
                  onClick={() => setActive(c.id)}
                >
                  <span className="v2-chat-avatar">
                    {label
                      .split(/\s+/)
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span>
                    <b>{label}</b>
                    <em>{c.listing?.title || "Bisedë private"}</em>
                    <p>{new Date(c.updated_at).toLocaleDateString("sq-AL")}</p>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
        <section>
          <div className="v2-chat-head">
            <span className="v2-chat-avatar">{initials}</span>
            <span>
              <b>{name}</b>
              <small>Bisedë e mbrojtur nga CLOZER</small>
            </span>
          </div>
          {current.listing && (
            <div className="v2-chat-product">
              <span>
                <small>PRODUKTI NË DISKUTIM</small>
                <b>{current.listing.title}</b>
                <strong>
                  €{Number(current.listing.price).toLocaleString()}
                </strong>
              </span>
            </div>
          )}
          <div className="v2-chat-body">
            <span className="v2-chat-day">Biseda</span>
            {messages.map((m) => (
              <div key={m.id} className={m.sender_id === userId ? "mine" : ""}>
                {m.body}
                <small>
                  {new Date(m.created_at).toLocaleTimeString("sq-AL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            ))}
            {error && <small className="v2-auth-error">{error}</small>}
          </div>
          <form
            className="v2-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Shkruaj një mesazh…"
            />
            <button
              aria-label="Dërgo mesazhin"
              className="send"
              disabled={!text.trim()}
            >
              <Send />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function SavedPage({
  saved,
  toggle,
  add,
  catalog = products,
}: {
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  catalog?: Product[];
}) {
  const items = catalog.filter((product) =>
    saved.some((id) => String(id) === String(product.id)),
  );
  return (
    <main className="v2-page">
      <PageTitle
        eyebrow="TË RUAJTURAT"
        title="Produktet që të pëlqejnë"
        text={`${items.length} produkte të ruajtura`}
      />
      {items.length ? (
        <div className="v2-grid v2-results">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              p={product}
              saved={saved}
              toggle={toggle}
              add={add}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={<Heart />}
          title="Ende nuk ke ruajtur asgjë"
          text="Prek zemrën në çdo produkt për ta ruajtur këtu."
          href="/explore"
          action="Fillo të eksplorosh"
        />
      )}
    </main>
  );
}

function CartPage({
  cart,
  setCart,
  checkout,
  catalog,
}: {
  cart: CartLine[];
  setCart: (v: CartLine[]) => void;
  checkout: () => void;
  catalog: Product[];
}) {
  const lines = cart
    .map((line) => ({
      line,
      p: catalog.find((product) => String(product.id) === String(line.id))!,
    }))
    .filter((item) => item.p);
  const subtotal = lines.reduce(
    (sum, item) => sum + item.p.price * item.line.qty,
    0,
  );
  return (
    <main className="v2-page">
      <PageTitle
        eyebrow="SHPORTA JOTE"
        title="Gati kur të jesh ti"
        text={`${lines.length} produkte të zgjedhura`}
      />
      {lines.length ? (
        <div className="v2-cart-layout">
          <section>
            {lines.map(({ line, p }) => (
              <article className="v2-cart-line" key={p.id}>
                <ProductImage p={p} />
                <div>
                  <small>{p.brand}</small>
                  <h2>{p.name}</h2>
                  <p>
                    {p.size} · {p.condition}
                  </p>
                  <span>
                    <ShieldCheck />
                    Mbrojtja e blerësit përfshihet
                  </span>
                </div>
                <div className="v2-qty">
                  <button
                    aria-label="Ule sasinë"
                    onClick={() =>
                      setCart(
                        line.qty === 1
                          ? cart.filter(
                              (item) => String(item.id) !== String(p.id),
                            )
                          : cart.map((item) =>
                              String(item.id) === String(p.id)
                                ? { ...item, qty: item.qty - 1 }
                                : item,
                            ),
                      )
                    }
                  >
                    <Minus />
                  </button>
                  <b>{line.qty}</b>
                  <button
                    aria-label="Rrite sasinë"
                    onClick={() =>
                      setCart(
                        cart.map((item) =>
                          String(item.id) === String(p.id)
                            ? { ...item, qty: item.qty + 1 }
                            : item,
                        ),
                      )
                    }
                  >
                    <Plus />
                  </button>
                </div>
                <strong>€{(p.price * line.qty).toLocaleString("sq-AL")}</strong>
                <button
                  className="v2-icon remove"
                  onClick={() =>
                    setCart(
                      cart.filter((item) => String(item.id) !== String(p.id)),
                    )
                  }
                  aria-label="Hiqe nga shporta"
                >
                  <Trash2 />
                </button>
              </article>
            ))}
          </section>
          <aside className="v2-summary">
            <h2>Përmbledhja e porosisë</h2>
            <p>
              <span>Nëntotali</span>
              <b>€{subtotal.toLocaleString("sq-AL")}</b>
            </p>
            <p>
              <span>Dërgesa e siguruar</span>
              <b>Llogaritet në vijim</b>
            </p>
            <p>
              <span>Kontrolli</span>
              <b>Sipas statusit të produktit</b>
            </p>
            <hr />
            <p className="total">
              <span>Totali</span>
              <b>€{subtotal.toLocaleString("sq-AL")}</b>
            </p>
            <button className="v2-pill dark wide" onClick={checkout}>
              Vazhdo në pagesë
              <LockKeyhole />
            </button>
            <small>
              <ShieldCheck />
              Pagesa mbetet e mbrojtur deri në dorëzim.
            </small>
          </aside>
        </div>
      ) : (
        <Empty
          icon={<ShoppingBag />}
          title="Shporta është bosh"
          text="Produkti i radhës është vetëm një zbulim larg."
          href="/explore"
          action="Eksploro tregun"
        />
      )}
    </main>
  );
}

function CheckoutPage({
  cart,
  place,
  catalog,
}: {
  cart: CartLine[];
  place: (address: string, shippingMethod: string, shippingCost: number) => void;
  catalog: Product[];
}) {
  const [done, setDone] = useState(false);
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("courier_standard");
  const shippingOptions = [
    { id: "courier_standard", title: "Korrier standard", detail: "2–4 ditë pune · me tracking", price: 3.9 },
    { id: "courier_express", title: "Korrier express", detail: "Brenda 24 orëve · me tracking", price: 5.9 },
    { id: "personal_pickup", title: "Marrje personale", detail: "Dakordohu në chat · pa transport", price: 0 },
  ];
  const shippingCost = shippingOptions.find((option) => option.id === shippingMethod)?.price || 0;
  const total = cart.reduce(
    (sum, line) =>
      sum +
      (catalog.find((product) => String(product.id) === String(line.id))
        ?.price || 0) *
        line.qty,
    0,
  );
  if (!cart.length && !done)
    return (
      <main className="v2-page">
        <Empty
          icon={<ShoppingBag />}
          title="No items to checkout"
          text="Add a piece to your bag first."
          href="/explore"
          action="Browse pieces"
        />
      </main>
    );
  if (done)
    return (
      <main className="v2-page">
        <div className="v2-order-success">
          <Check />
          <span>ORDER CONFIRMED</span>
          <h1>Thank you, Arnis.</h1>
          <p>
            Your protected order is confirmed. We’ll notify you at every step.
          </p>
          <Link className="v2-pill dark" href="/orders">
            Track my order
          </Link>
        </div>
      </main>
    );
  return (
    <main className="v2-page">
      <PageTitle
        eyebrow="SECURE CHECKOUT"
        title="Delivery & payment"
        text="Encrypted checkout with buyer protection"
      />
      <div className="v2-checkout">
        <section>
          <h2>1. Delivery address</h2>
          <div className="v2-form">
            <label>
              Full name
              <input defaultValue="Arnis Mulliqi" />
            </label>
            <label>
              Address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street and number"
              />
            </label>
            <div>
              <label>
                City
                <input defaultValue="Pejë" />
              </label>
              <label>
                Postal code
                <input defaultValue="30000" />
              </label>
            </div>
            <label>
              Country
              <select defaultValue="Kosovo">
                <option>Kosovo</option>
                <option>Albania</option>
                <option>Germany</option>
                <option>Switzerland</option>
              </select>
            </label>
          </div>
          <h2>2. Transporti</h2>
          <div className="v2-shipping-options">
            {shippingOptions.map((option) => (
              <label key={option.id} className={shippingMethod === option.id ? "active" : ""}>
                <input type="radio" name="shipping" value={option.id} checked={shippingMethod === option.id} onChange={() => setShippingMethod(option.id)} />
                <Package /><span><b>{option.title}</b><small>{option.detail}</small></span><strong>{option.price ? `€${option.price.toFixed(2)}` : "Falas"}</strong>
              </label>
            ))}
          </div>
          <h2>3. Payment</h2>
          <div className="v2-payment">
            <label>
              <input type="radio" name="pay" defaultChecked />
              <CreditCard />
              <span>
                <b>Card payment</b>
                <small>Visa, Mastercard, Apple Pay</small>
              </span>
            </label>
            <div className="v2-card-fields">
              <input placeholder="Card number" inputMode="numeric" />
              <input placeholder="MM / YY" />
              <input placeholder="CVC" />
            </div>
            <label>
              <input type="radio" name="pay" />
              <Package />
              <span>
                <b>Cash on delivery</b>
                <small>Available for eligible local orders</small>
              </span>
            </label>
          </div>
        </section>
        <aside className="v2-summary">
          <h2>Protected total</h2>
          <p>
            <span>Items</span>
            <b>€{total.toLocaleString()}</b>
          </p>
          <p>
            <span>Shipping</span>
            <b>{shippingCost ? `€${shippingCost.toFixed(2)}` : "Falas"}</b>
          </p>
          <hr />
          <p className="total">
            <span>Total</span>
            <b>€{(total + shippingCost).toLocaleString()}</b>
          </p>
          <button
            disabled={!address.trim()}
            className="v2-pill dark wide"
            onClick={() => {
              place(address, shippingMethod, shippingCost);
              setDone(true);
            }}
          >
            Place protected order
            <LockKeyhole />
          </button>
          <small>Pagesa mbahet e mbrojtur deri në konfirmimin e dorëzimit.</small>
        </aside>
      </div>
    </main>
  );
}

function NotificationsPage({
  notes,
  setNotes,
}: {
  notes: Note[];
  setNotes: (n: Note[]) => void;
}) {
  return (
    <main className="v2-page v2-narrow">
      <PageTitle
        eyebrow="ACTIVITY"
        title="Notifications"
        text="Offers, orders and pieces you follow"
      />
      <div className="v2-note-actions">
        <button
          onClick={() => setNotes(notes.map((n) => ({ ...n, read: true })))}
        >
          Mark all as read
        </button>
      </div>
      <div className="v2-notes">
        {notes.map((n) => (
          <button
            key={n.id}
            className={n.read ? "" : "unread"}
            onClick={() =>
              setNotes(
                notes.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
              )
            }
          >
            <span>
              {n.type === "offer" ? (
                <Tag />
              ) : n.type === "drop" ? (
                <TrendingDown />
              ) : (
                <Package />
              )}
            </span>
            <div>
              <b>{n.title}</b>
              <p>{n.text}</p>
              <small>{n.time}</small>
            </div>
            <i />
          </button>
        ))}
      </div>
    </main>
  );
}

function SettingsPage({ account }: { account: AccountProfile | null }) {
  const [prefs, setPrefs] = usePersistent("velora-settings", {
    messages: true,
    offers: true,
    drops: true,
    shipping: true,
    dark: false,
  });
  const [section, setSection] = useState("Njoftimet");
  const [fullName, setFullName] = useState(account?.fullName || "");
  const [saveState, setSaveState] = useState("");
  const toggle = (k: keyof typeof prefs) =>
    setPrefs({ ...prefs, [k]: !prefs[k] });
  const sections = [
    "Llogaria",
    "Njoftimet",
    "Privatësia dhe siguria",
    "Pagesat",
    "Transporti",
  ];
  return (
    <main className="v2-page v2-settings">
      <PageTitle
        eyebrow="LLOGARIA"
        title="Cilësimet"
        text="Menaxho profilin, privatësinë dhe njoftimet"
      />
      <div className="v2-settings-layout">
        <nav>
          {sections.map((x) => (
            <button
              onClick={() => setSection(x)}
              className={section === x ? "active" : ""}
              key={x}
            >
              {x}
              <ChevronRight />
            </button>
          ))}
        </nav>
        <section key={section}>
          {section === "Njoftimet" ? (
            <>
              <h2>Preferencat e njoftimeve</h2>
              <p>Zgjidh njoftimet që dëshiron të marrësh.</p>
              {(
                [
                  ["messages", "Mesazhet", "Mesazhe të reja nga blerësit dhe shitësit"],
                  ["offers", "Ofertat", "Oferta të reja, të pranuara dhe kundëroferta"],
                  ["drops", "Uljet e çmimeve", "Ndryshime në produktet e ruajtura"],
                  [
                    "shipping",
                    "Përditësimet e transportit",
                    "Gjurmimi dhe fazat e autentikimit",
                  ],
                ] as const
              ).map(([k, t, d]) => (
                <label className="v2-setting-row" key={k}>
                  <span>
                    <b>{t}</b>
                    <small>{d}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs[k]}
                    onChange={() => toggle(k)}
                  />
                </label>
              ))}
            </>
          ) : section === "Llogaria" ? (
            <>
              <h2>Llogaria</h2>
              <p>Të dhënat reale të lidhura me profilin tënd CLOZER.</p>
              <div className="v2-setting-card">
                <label>
                  Emri i plotë
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </label>
                <label>
                  Email
                  <input value={account?.email || ""} disabled />
                </label>
                <button className="v2-pill dark" onClick={async () => {
                  if (!account || fullName.trim().length < 2) return;
                  setSaveState("Duke ruajtur…");
                  const { error } = await createClient().from("profiles").update({ full_name: fullName.trim() }).eq("id", account.id);
                  setSaveState(error ? "Ndryshimet nuk u ruajtën." : "Ndryshimet u ruajtën.");
                }}>Ruaj ndryshimet</button>
                {saveState && <small>{saveState}</small>}
              </div>
            </>
          ) : section === "Privatësia dhe siguria" ? (
            <>
              <h2>Privatësia dhe siguria</h2>
              <p>Kontrollo dukshmërinë dhe mbrojtjen e llogarisë.</p>
              <label className="v2-setting-row">
                <span>
                  <b>Aktivitet privat</b>
                  <small>Produktet e ruajtura mbeten private</small>
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="v2-setting-row">
                <span>
                  <b>Autentikimi me dy faktorë</b>
                  <small>Do të aktivizohet së shpejti</small>
                </span>
                <input type="checkbox" disabled />
              </label>
            </>
          ) : section === "Pagesat" ? (
            <>
              <h2>Pagesat</h2>
              <p>Nuk ke ende mënyrë pagese të ruajtur.</p>
            </>
          ) : (
            <>
              <h2>Transporti</h2>
              <p>Nuk ke ende adresë të ruajtur.</p>
            </>
          )}
          <div className="v2-security-card">
            <ShieldCheck />
            <span>
              <b>Llogaria e mbrojtur</b>
              <small>{account?.emailVerified ? "Emaili është verifikuar" : "Verifiko emailin për siguri më të lartë"}</small>
            </span>
            <button onClick={() => setSection("Privatësia dhe siguria")}>Shiko sigurinë</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfilePage({
  listings,
  account,
}: {
  listings: Product[];
  account: AccountProfile | null;
}) {
  const path = canonicalPath(usePathname());
  const [tab, setTab] = useState("Garderoba");
  const [stats, setStats] = useState({ active: listings.length, sold: 0 });
  useEffect(() => {
    if (!account) return;
    void Promise.all([
      createClient().from("listings").select("id", { count: "exact", head: true }).eq("seller_id", account.id).eq("status", "active"),
      createClient().from("listings").select("id", { count: "exact", head: true }).eq("seller_id", account.id).eq("status", "sold"),
    ]).then(([activeResult, soldResult]) => setStats({ active: activeResult.count || 0, sold: soldResult.count || 0 }));
  }, [account, listings.length]);
  if (path === "/dashboard")
    return account?.sellerVerified ? (
      <Dashboard />
    ) : (
      <main className="v2-page">
        <SellerApplicationCard account={account} />
      </main>
    );
  const initials = (account?.fullName || account?.email || "V")
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <main className="v2-page">
      <section className="v2-profile-head">
        <div className="v2-profile-avatar">
          {initials}
          {account?.identityVerified && (
            <span>
              <BadgeCheck />
            </span>
          )}
        </div>
        <div>
          <span>
            {account?.sellerVerified
              ? "SHITËS I VERIFIKUAR"
              : "ANËTAR I CLOZER"}
          </span>
          <h1>{account?.fullName || "Profili im"}</h1>
          <p>
            {account?.username ? `@${account.username}` : account?.email}
            {account?.city ? ` · ${account.city}` : ""}
          </p>
          <div>
            <b>
              {stats.active}
              <small>Shpallje</small>
            </b>
            <b>
              {stats.sold}<small>Shitur</small>
            </b>
            <b>
              0<small>Vlerësime</small>
            </b>
          </div>
        </div>
        <aside>
          {account?.sellerVerified && (
            <Link className="v2-pill dark" href="/dashboard">
              <LayoutDashboard />
              Paneli i shitësit
            </Link>
          )}
          <Link className="v2-pill outline" href="/settings" aria-label="Cilësimet">
            <Settings />
          </Link>
        </aside>
      </section>
      <div className="v2-profile-trust">
        <span>
          <ShieldCheck />
          {account?.identityVerified
            ? "Identitet i verifikuar"
            : account?.emailVerified ? "Email i verifikuar" : "Email i paverifikuar"}
        </span>
        {account?.sellerVerified && (
          <span>
            <BadgeCheck />
            Shitës i verifikuar
          </span>
        )}
      </div>
      {!account?.sellerVerified && <SellerApplicationCard account={account} />}
      <div className="v2-tabs">
        {["Garderoba", "Vlerësimet", "Të shitura", "Koleksionet"].map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === "Garderoba" ? (
        listings.length ? (
          <div className="v2-profile-listings">
            {listings.map((listing) => (
              <article key={listing.id}>
                <img src={listing.image} alt={listing.name} />
                <b>{listing.name}</b>
                <span>€{listing.price.toLocaleString("sq-AL")}</span>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            icon={<Package />}
            title="Ende nuk ke shpallje"
            text="Produktet që publikon shfaqen këtu."
            href="/sell"
            action="Shto produkt"
          />
        )
      ) : tab === "Vlerësimet" ? (
        <Empty icon={<Star />} title="Ende nuk ka vlerësime" text="Vlerësimet nga blerësit do të shfaqen këtu." href="/explore" action="Eksploro produktet" />
      ) : (
        <Empty
          icon={tab === "Të shitura" ? <Package /> : <Heart />}
          title={tab === "Të shitura" ? "Ende nuk ke produkte të shitura" : "Ende nuk ke koleksione"}
          text={tab === "Të shitura" ? "Produktet e shitura do të shfaqen këtu." : "Koleksionet e tua do të shfaqen këtu."}
          href="/explore"
          action="Eksploro produktet"
        />
      )}
    </main>
  );
}

function SellerApplicationCard({
  account,
}: {
  account: AccountProfile | null;
}) {
  const [status, setStatus] = useState(account?.sellerApplicationStatus || null);
  const [name, setName] = useState(account?.fullName || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(account?.city || "");
  const [sellerType, setSellerType] = useState<"individual" | "business">(
    "individual",
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account || !name.trim() || !phone.trim() || !city.trim()) {
      setError("Plotëso emrin, telefonin dhe qytetin.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: requestError } = await createClient()
      .from("seller_applications")
      .upsert(
        {
          user_id: account.id,
          display_name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          seller_type: sellerType,
          note: note.trim() || null,
          status: "pending",
          admin_note: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    setBusy(false);
    if (requestError) {
      setError("Aplikimi nuk u dërgua. Provo përsëri.");
      return;
    }
    setStatus("approved");
    window.setTimeout(() => window.location.assign("/dashboard"), 500);
  };
  if (status === "pending")
    return (
      <section className="v2-seller-application status-card">
        <Clock3 />
        <div>
          <span>APLIKIMI U DËRGUA</span>
          <h2>Po aktivizohet llogaria.</h2>
          <p>Aprovimi në CLOZER është i menjëhershëm. Rifresko faqen nëse paneli nuk hapet automatikisht.</p>
        </div>
      </section>
    );
  return (
    <section className="v2-seller-application">
      <div className="v2-seller-application-copy">
        <span>BËHU SHITËS</span>
        <h2>Fillo të shesësh në CLOZER.</h2>
        <p>Çdo llogari nis si blerës. Plotëso detajet e tua dhe paneli i shitësit aktivizohet menjëherë.</p>
      </div>
      <form onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emri i plotë ose biznesi" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefoni" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Qyteti" />
        <select value={sellerType} onChange={(e) => setSellerType(e.target.value as "individual" | "business")}>
          <option value="individual">Shitës individual</option>
          <option value="business">Biznes</option>
        </select>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Çfarë planifikon të shesësh? (opsionale)" />
        {error && <small className="v2-auth-error">{error}</small>}
        <button disabled={busy} className="v2-pill dark">
          {busy ? "Duke aktivizuar…" : "Bëhu shitës"}
          <ArrowRight />
        </button>
      </form>
    </section>
  );
}

function SellerProfilePage({
  slug,
  saved,
  toggle,
  add,
  signedIn,
}: {
  slug: string;
  saved: ProductId[];
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState("");
  const sellerProducts = products.filter(
    (p) => p.seller.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug,
  );
  const seller =
    sellerProducts[0]?.seller ||
    slug
      .split("-")
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
      .join(" ");
  const initials = seller
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <main className="v2-page">
      <section className="v2-profile-head public">
        <div className="v2-profile-avatar">{initials}</div>
        <div>
          <span>PROFIL PUBLIK I SHITËSIT</span>
          <h1>{seller}</h1>
          <p>Shitës në CLOZER · përgjigjet zakonisht brenda një ore</p>
          <div>
            <b>
              {sellerProducts.length}
              <small>Shpallje</small>
            </b>
            <b>
              4.9<small>Vlerësimi</small>
            </b>
            <b>
              128<small>Shitje</small>
            </b>
          </div>
        </div>
        <aside>
          <button
            className="v2-pill dark"
            disabled={contactBusy}
            onClick={async () => {
              if (!signedIn) { requestAccount(`/seller/${slug}`); return; }
              setContactBusy(true); setContactError("");
              try {
                let sellerId = sellerProducts.find(product => product.sellerId)?.sellerId;
                if (!sellerId) {
                  const { data, error } = await createClient().from("profiles").select("id").eq("username", slug).maybeSingle();
                  if (error) throw error;
                  sellerId = data?.id;
                }
                if (!sellerId) throw new Error("Ky profil demonstrues nuk është ende i lidhur me një biznes real.");
                router.push(`/messages?seller=${encodeURIComponent(sellerId)}`);
              } catch (contactSellerError) {
                setContactError(contactSellerError instanceof Error ? contactSellerError.message : "Biseda nuk mund të hapej.");
              } finally { setContactBusy(false); }
            }}
          >
            <MessageCircle />
            {contactBusy ? "Duke hapur…" : "Kontakto"}
          </button>
          {contactError && <small className="v2-auth-error">{contactError}</small>}
        </aside>
      </section>
      <div className="v2-profile-trust">
        <span>
          <ShieldCheck />
          Pagesat mbrohen nga CLOZER
        </span>
      </div>
      <div className="v2-tabs">
        <button className="active">Garderoba</button>
        <button>Vlerësimet</button>
      </div>
      {sellerProducts.length ? (
        <div className="v2-grid v2-results">
          {sellerProducts.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              saved={saved}
              toggle={toggle}
              add={add}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={<Package />}
          title="Nuk ka shpallje aktive"
          text="Ky shitës nuk ka produkte aktive për momentin."
          href="/explore"
          action="Eksploro produktet"
        />
      )}
    </main>
  );
}

function Reviews() {
  return (
    <div className="v2-reviews">
      {[
        { n: "Sofia M.", t: "Perfect condition and beautifully packed.", r: 5 },
        { n: "Daniel K.", t: "Fast shipping, exactly as described.", r: 5 },
        { n: "Mila A.", t: "Excellent communication throughout.", r: 5 },
      ].map((x) => (
        <article key={x.n}>
          <div className="v2-avatar">{x.n[0]}</div>
          <div>
            <b>{x.n}</b>
            <span>
              {Array.from({ length: x.r }).map((_, i) => (
                <Star key={i} fill="currentColor" />
              ))}
            </span>
            <p>{x.t}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function Dashboard() {
  const [items, setItems] = useState<SellerListing[]>([]);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; total: number; status: string; created_at: string }>>([]);
  const [sellerConversations, setSellerConversations] = useState(0);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [tab, setTab] = useState("Përmbledhje");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<SellerListing | null>(null);
  const [replacementImages, setReplacementImages] = useState<string[]>([]);
  const [boosting, setBoosting] = useState<SellerListing | null>(null);
  const [boostedIds, setBoostedIds] = usePersistent<ProductId[]>("clozer-boosted-listings", []);
  const [notice, setNotice] = useState("");
  const loadItems = async () => {
    setLoadingItems(true);
    setItemsError("");
    try { setItems(await getSellerListings()); }
    catch (error) { setItemsError(error instanceof Error ? error.message : "Shpalljet nuk u ngarkuan."); }
    finally { setLoadingItems(false); }
  };
  useEffect(() => { void loadItems(); }, []);
  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: orders }, { count: conversations }] = await Promise.all([
        supabase.from("orders").select("id,total,status,created_at").eq("seller_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
      ]);
      setRecentOrders((orders || []).map((order) => ({ ...order, total: Number(order.total) || 0 })));
      setSellerConversations(conversations || 0);
    };
    void loadDashboardData();
  }, []);
  const statusLabel = (status: string) => ({ active: "Aktiv", paused: "Pezulluar", draft: "Draft", pending_review: "Në kontroll", changes_requested: "Kërkon ndryshime", rejected: "Refuzuar", sold: "Shitur", reserved: "Rezervuar" }[status] || status);
  const orderStatusLabel = (status: string) => ({ pending: "Në pritje", paid: "Paguar", authentication: "Në verifikim", ready_to_ship: "Për dërgim", shipped: "Dërguar", delivered: "Dorëzuar", cancelled: "Anuluar", refunded: "Rimbursuar", disputed: "Në shqyrtim" }[status] || status);
  const visible = items.filter((x) =>
    `${x.title} ${x.brand}`.toLowerCase().includes(query.toLowerCase()),
  );
  const views = items.reduce((sum, item) => sum + (Number(item.viewsCount) || 0), 0);
  const ordersToShip = recentOrders.filter((order) => order.status === "ready_to_ship").length;
  const deliveredRevenue = recentOrders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + order.total, 0);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateListing(editing, replacementImages);
      setEditing(null); setReplacementImages([]);
      await loadItems();
      setNotice("Ndryshimet u ruajtën në shpallje.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Ndryshimet nuk u ruajtën."); }
  };
  const toggleItem = async (item: SellerListing) => {
    const nextStatus = item.status === "active" ? "paused" : "pending_review";
    const { error } = await createClient().from("listings").update({ status: nextStatus }).eq("id", item.id);
    if (error) { setNotice(error.message); return; }
    await loadItems();
    setNotice(nextStatus === "paused" ? "Shpallja u pezullua." : "Shpallja u dërgua përsëri për kontroll.");
  };
  return (
    <main className="v2-seller-studio">
      <header className="v2-studio-hero">
        <div>
          <span>SELLER STUDIO</span>
          <h1>Dyqani yt, nën kontroll.</h1>
          <p>
            Shiko performancën, menaxho çdo shpallje dhe vepro menjëherë kur hyn
            një porosi ose ofertë.
          </p>
        </div>
        <div>
          <Link className="v2-pill outline" href="/profile">
            <Eye />
            Shiko profilin
          </Link>
          <Link className="v2-pill dark" href="/sell">
            <Plus />
            Shto produkt
          </Link>
        </div>
      </header>
      {notice && (
        <div className="v2-dash-toast">
          <Check />
          {notice}
          <button onClick={() => setNotice("")}>
            <X />
          </button>
        </div>
      )}
      <section className="v2-studio-kpis">
        <article className="main">
          <span>TË HYRAT NETO · 30 DITË</span>
          <b>€{deliveredRevenue.toLocaleString("sq-AL", { minimumFractionDigits: 2 })}</b>
          <small>
            <TrendingUp /> Vetëm nga porositë e dorëzuara
          </small>
          <div>
            {recentOrders.length ? recentOrders.map((order) => (
              <i key={order.id} style={{ height: Math.max(10, Math.min(108, order.total)) }} />
            )) : <small>Ende nuk ka porosi të dorëzuara.</small>}
          </div>
        </article>
        {[
          [
            "Shpallje aktive",
            String(items.filter((x) => x.status === "active").length),
            "Gjithsej në katalog",
          ],
          ["Mesazhe nga blerësit", String(sellerConversations), "Biseda të hapura"],
          ["Porosi për dërgim", String(ordersToShip), ordersToShip ? "Vepro sot" : "Asnjë porosi për dërgim"],
          ["Vizita", views.toLocaleString("sq-AL"), "Nga shpalljet e tua"],
        ].map((x) => (
          <article key={x[0]}>
            <span>{x[0]}</span>
            <b>{x[1]}</b>
            <small>{x[2]}</small>
          </article>
        ))}
      </section>
      <nav className="v2-studio-tabs">
        {["Përmbledhje", "Shpalljet", "Porositë", "Analitika"].map(
          (x) => (
            <button
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
              key={x}
            >
              {x}
              {x === "Porositë" && recentOrders.length > 0 && <b>{recentOrders.length}</b>}
            </button>
          ),
        )}
      </nav>
      {tab === "Shpalljet" ? (
        <section className="v2-inventory">
          <header>
            <div>
              <h2>Inventari</h2>
              <p>{items.length} produkte · çdo ndryshim ruhet menjëherë</p>
            </div>
            <label>
              <Search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kërko në inventar"
              />
            </label>
          </header>
          <div className="v2-inventory-list">
            {loadingItems ? <p className="v2-inventory-empty">Duke ngarkuar shpalljet…</p> : itemsError ? <p className="v2-inventory-empty">{itemsError}</p> : !visible.length ? <p className="v2-inventory-empty">Nuk ke ende shpallje. Shto produktin e parë.</p> : visible.map((x) => (
              <article key={x.id}>
                <img src={x.images[0] || "/assets/bag-one.webp"} alt="" />
                <div>
                  <small>{x.brand}</small>
                  <b>{x.title}</b>
                  <em>
                    {x.condition} ·{" "}
                    <strong className={x.status === "active" ? "active" : ""}>
                      {statusLabel(x.status)}
                    </strong>
                  </em>
                </div>
                <span>
                  <small>ÇMIMI</small>
                  <b>€{x.price.toLocaleString()}</b>
                </span>
                <span>
                  <small>AKTIVITETI</small>
                  <b>
                    {x.viewsCount} shikime
                  </b>
                </span>
                <div className="v2-inventory-actions">
                  <button className="boost" onClick={() => setBoosting(x)}>
                    <TrendingUp />
                    {boostedIds.includes(x.id) ? "Boost aktiv" : "Boost"}
                  </button>
                  <button onClick={() => { setEditing({ ...x }); setReplacementImages([]); }}>
                    <Pencil />
                    Ndrysho
                  </button>
                  <button onClick={() => void toggleItem(x)}>
                    {x.status === "active" ? "Pezullo" : "Dërgo për kontroll"}
                  </button>
                  <Link href={`/listing/${x.id}`}>
                    <Eye />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="v2-studio-grid">
          <section className="v2-studio-panel v2-studio-performance">
            <header>
              <div>
                <span>PERFORMANCA</span>
                <h2>
                  {tab === "Analitika"
                    ? "Ku po krijohet kërkesa"
                    : "Shitjet në kohë reale"}
                </h2>
              </div>
              <button>
                <Filter />
                30 ditët e fundit
              </button>
            </header>
            <div className="v2-studio-chart">
              {recentOrders.length ? recentOrders.map((order) => (
                <i key={order.id} style={{ height: Math.max(12, Math.min(108, order.total)) }}>
                  <small>{new Date(order.created_at).toLocaleDateString("sq-AL", { day: "numeric", month: "short" })}</small>
                </i>
              )) : <p className="v2-inventory-empty">Nuk ka ende të dhëna për analizë.</p>}
            </div>
            <div className="v2-chart-summary">
              <span>
                <b>€{deliveredRevenue.toLocaleString("sq-AL", { minimumFractionDigits: 2 })}</b>
                <small>Vlera e shitur</small>
              </span>
              <span>
                <b>{recentOrders.length}</b>
                <small>Porosi</small>
              </span>
              <span>
                <b>{views.toLocaleString("sq-AL")}</b>
                <small>Shikime</small>
              </span>
            </div>
          </section>
          <aside className="v2-studio-panel v2-studio-actions">
            <span>PËRPARËSI</span>
            <h2>
              {tab === "Porositë" ? "Porositë që presin" : "Veprime të shpejta"}
            </h2>
            {[
              [`${ordersToShip} porosi për dërgim`, ordersToShip ? "Shiko porositë" : "Nuk ke porosi për dërgim", "Porositë"],
              [`${sellerConversations} biseda me blerës`, "Përgjigju mesazheve", "Përmbledhje"],
              [`${items.filter((item) => item.viewsCount === 0).length} shpallje pa vizita`, "Përmirëso prezantimin", "Shpalljet"],
            ].map((x) => (
              <button key={x[0]} onClick={() => setTab(x[2])}>
                <span>
                  <b>{x[0]}</b>
                  <small>{x[1]}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
          </aside>
          <section className="v2-studio-panel v2-studio-orders">
            <header>
              <div>
                <span>POROSITË E FUNDIT</span>
                <h2>Gati për veprim</h2>
              </div>
              <button onClick={() => setTab("Porositë")}>
                Shiko të gjitha
              </button>
            </header>
            {recentOrders.length ? recentOrders.map((order) => (
              <article key={order.id}>
                <div className="v2-order-placeholder"><Package /></div>
                <span>
                  <b>Porosia #{order.id.slice(0, 8).toUpperCase()}</b>
                  <small>{new Date(order.created_at).toLocaleDateString("sq-AL")} · {orderStatusLabel(order.status)}</small>
                </span>
                <strong>€{order.total.toLocaleString("sq-AL")}</strong>
                <button onClick={() => setTab("Porositë")}>
                  {order.status === "ready_to_ship" ? "Dërgo tani" : "Shiko"}
                  <ChevronRight />
                </button>
              </article>
            )) : <p className="v2-inventory-empty">Ende nuk ka porosi për t’u shfaqur.</p>}
          </section>
        </section>
      )}
      <AnimatePresence>
        {boosting && (
          <motion.div className="v2-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBoosting(null)}>
            <motion.div className="v2-boost-modal" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} onClick={(event) => event.stopPropagation()}>
              <button className="v2-icon close" onClick={() => setBoosting(null)} aria-label="Mbyll"><X /></button>
              <span>CLOZER BOOST</span><h2>Jepi më shumë shikime.</h2><p>{boosting.title}</p>
              <div className="v2-boost-plans">
                {[
                  ["top_24h", "Në krye · 24 orë", "Shfaqet para produkteve normale", "1.99"],
                  ["urgent_3d", "Urgjente · 3 ditë", "Badge Urgjente dhe prioritet në kërkim", "3.99"],
                  ["homepage_7d", "Homepage · 7 ditë", "Pozicion premium në ballinë", "7.99"],
                ].map((plan) => (
                  <button key={plan[0]} onClick={async () => {
                    try {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user && typeof boosting.id === "string" && /^[0-9a-f-]{36}$/i.test(boosting.id)) {
                        const { error } = await supabase.from("listing_boosts").insert({ listing_id: boosting.id, seller_id: user.id, tier: plan[0], amount: Number(plan[3]), status: "pending" });
                        if (error) throw error;
                      }
                      setBoostedIds([...new Set([...boostedIds, boosting.id])]); setBoosting(null); setNotice("Boost-i u aktivizua për shpalljen.");
                    } catch { setNotice("Boost-i nuk u aktivizua. Provo përsëri."); }
                  }}>
                    <span><b>{plan[1]}</b><small>{plan[2]}</small></span><strong>€{plan[3]}</strong><ChevronRight />
                  </button>
                ))}
              </div>
              <small>Pagesa finale do të lidhet me checkout-in CLOZER.</small>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editing && (
          <motion.div
            className="v2-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
          >
            <motion.form
              className="v2-edit-listing"
              onSubmit={save}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="v2-icon close"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
              <span>NDRYSHO SHPALLJEN</span>
              <h2>{editing.title}</h2>
              <div className="v2-edit-listing-grid">
                <div className="v2-edit-listing-photo">
                  <img src={replacementImages[0] || editing.images[0] || "/assets/bag-one.webp"} alt="" />
                  <label className="v2-photo-replace">
                    Zëvendëso fotografitë
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      void Promise.all(files.map((file) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Fotografia nuk u lexua.")); reader.readAsDataURL(file); }))).then(setReplacementImages).catch(() => setNotice("Fotografitë nuk u lexuan."));
                    }} />
                  </label>
                  <small>{replacementImages.length ? `${replacementImages.length} fotografi të reja do të zëvendësojnë galerinë.` : "Lëri si janë ose ngarko një galeri të re."}</small>
                </div>
                <div>
                  <label>
                    Titulli
                    <input
                      value={editing.title}
                      onChange={(e) =>
                        setEditing({ ...editing, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Brendi
                    <input
                      value={editing.brand}
                      onChange={(e) =>
                        setEditing({ ...editing, brand: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Çmimi (€)
                    <input
                      inputMode="numeric"
                      value={editing.price}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          price: Number(e.target.value.replace(/\D/g, "")),
                        })
                      }
                    />
                  </label>
                  <label>
                    Çmimi fillestar (€)
                    <input inputMode="numeric" value={editing.retailPrice || ""} onChange={(e) => setEditing({ ...editing, retailPrice: Number(e.target.value.replace(/\D/g, "")) })} />
                  </label>
                  <label>
                    Kategoria
                    <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                  </label>
                  <label>
                    Gjendja
                    <select value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value })}>
                      <option>I ri</option><option>Si i ri</option><option>Shumë mirë</option><option>Mirë</option><option>I dëmtuar</option><option>Shumë i përdorur</option>
                    </select>
                  </label>
                  <label>
                    Gjinia
                    <select value={editing.gender} onChange={(e) => setEditing({ ...editing, gender: e.target.value })}>
                      <option>Femra</option><option>Meshkuj</option><option>Unisex</option><option>Fëmijë</option>
                    </select>
                  </label>
                  <label>
                    Madhësia
                    <input value={editing.size} onChange={(e) => setEditing({ ...editing, size: e.target.value })} />
                  </label>
                  <label>
                    Ngjyra
                    <input value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                  </label>
                  <label>
                    Materiali
                    <input value={editing.material} onChange={(e) => setEditing({ ...editing, material: e.target.value })} />
                  </label>
                  <label>
                    Referenca / kodi
                    <input value={editing.reference} onChange={(e) => setEditing({ ...editing, reference: e.target.value })} />
                  </label>
                  <label>
                    Qyteti
                    <input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
                  </label>
                </div>
              </div>
              <label className="v2-edit-description">
                Përshkrimi
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </label>
              <div className="v2-edit-options">
                <label><input type="checkbox" checked={editing.negotiable} onChange={(e) => setEditing({ ...editing, negotiable: e.target.checked })} /> Pranoj oferta për çmimin</label>
                <label><input type="checkbox" checked={editing.shippingAvailable} onChange={(e) => setEditing({ ...editing, shippingAvailable: e.target.checked })} /> Dërgesa është në dispozicion</label>
              </div>
              <div>
                <button
                  type="button"
                  className="v2-pill outline"
                  onClick={() => setEditing(null)}
                >
                  Anulo
                </button>
                <button className="v2-pill dark">
                  Ruaj ndryshimet
                  <Check />
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function OrdersPage({ orders }: { orders: Order[] }) {
  return (
    <main className="v2-page">
      <PageTitle
        eyebrow="PURCHASES"
        title="Your orders"
        text="Track authentication, shipping and delivery"
      />
      {orders.length ? (
        <div className="v2-orders">
          {orders.map((o) => (
            <article key={o.id}>
              <div>
                <Package />
                <span>
                  <b>{o.id}</b>
                  <small>{o.date}</small>
                </span>
              </div>
              <em>{o.status}</em>
              <strong>€{o.total.toLocaleString()}</strong>
              <button className="v2-pill soft">Gjurmo porosinë</button>
              <div className="v2-order-tracking">
                {["E konfirmuar", "Po përgatitet", "Në transport", "Dorëzuar"].map((step, index) => (
                  <span key={step} className={index < 2 ? "done" : ""}><i>{index < 2 ? <Check /> : index + 1}</i><small>{step}</small></span>
                ))}
                <p><Package /><span><b>{o.shippingMethod === "personal_pickup" ? "Marrje personale" : "Korrier me tracking"}</b><small>{o.trackingNumber || "Tracking krijohet sapo shitësi ta dorëzojë paketën."}</small></span></p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={<Package />}
          title="No orders yet"
          text="Your protected purchases will appear here."
          href="/explore"
          action="Discover pieces"
        />
      )}
    </main>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <main className="v2-page v2-support-page">
      <PageTitle
        eyebrow="CONTACT"
        title="We are here to help."
        text="Questions about an order, authentication or selling? Our team normally replies within one business day."
      />
      <div className="v2-contact-layout">
        <aside>
          <Mail />
          <h2>CLOZER Support</h2>
          <a href="mailto:support@clozer.shop">support@clozer.shop</a>
          <p>Monday–Friday · 09:00–18:00 CET</p>
          <Link href="/faq">
            Frequently asked questions
            <ArrowRight />
          </Link>
        </aside>
        {sent ? (
          <section className="v2-contact-success">
            <Check />
            <h2>Message sent</h2>
            <p>Thank you. The CLOZER team will reply to your email shortly.</p>
            <button className="v2-pill outline" onClick={() => setSent(false)}>
              Send another
            </button>
          </section>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label>
              Full name
              <input required defaultValue="Arnis Mulliqi" />
            </label>
            <label>
              Email address
              <input
                required
                type="email"
                defaultValue="partners@nautillus.co"
              />
            </label>
            <label>
              Subject
              <select required defaultValue="Order question">
                <option>Order question</option>
                <option>Selling</option>
                <option>Authentication</option>
                <option>Account</option>
              </select>
            </label>
            <label>
              Message
              <textarea
                required
                minLength={10}
                placeholder="How can we help?"
              />
            </label>
            <button className="v2-pill dark" type="submit">
              Send message
              <Send />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function FaqPage() {
  const [open, setOpen] = useState(0);
  const items = [
    [
      "How does CLOZER authentication work?",
      "Eligible luxury products are first sent to our specialists. They inspect identity, materials and condition before forwarding the item to the buyer.",
    ],
    [
      "When does the seller receive payment?",
      "Payment remains protected until delivery is confirmed. The seller receives the balance after the buyer-protection window closes.",
    ],
    [
      "Can I return an item?",
      "Returns are available when an item differs materially from its listing. Eligible purchases show the exact return window before checkout.",
    ],
    [
      "How do I sell an item?",
      "Upload clear photos, confirm the smart details, set your price and publish. You can edit or pause the listing from Seller Studio.",
    ],
    [
      "How is shipping tracked?",
      "Every protected order uses a trackable label. Updates appear in Orders and Notifications from dispatch through delivery.",
    ],
  ];
  return (
    <main className="v2-page v2-support-page">
      <PageTitle
        eyebrow="HELP CENTER"
        title="Frequently asked questions"
        text="Everything you need to buy and sell with confidence."
      />
      <div className="v2-faq">
        {items.map(([q, a], i) => (
          <article key={q}>
            <button
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <span>{q}</span>
              <Plus />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {a}
                </motion.p>
              )}
            </AnimatePresence>
          </article>
        ))}
      </div>
      <div className="v2-faq-contact">
        <HelpCircle />
        <span>
          <b>Still need help?</b>
          <small>Our support team is ready.</small>
        </span>
        <Link className="v2-pill dark" href="/contact">
          Contact
          <ArrowRight />
        </Link>
      </div>
    </main>
  );
}

const brandDirectory = [
  "Adidas",
  "Balenciaga",
  "Bottega Veneta",
  "Burberry",
  "Canada Goose",
  "Cartier",
  "Celine",
  "Chanel",
  "Chrome Hearts",
  "Dior",
  "Gucci",
  "Hermès",
  "Jacquemus",
  "Jordan",
  "Louis Vuitton",
  "Moncler",
  "New Balance",
  "Nike",
  "Off-White",
  "Omega",
  "Prada",
  "Ray-Ban",
  "Rolex",
  "Saint Laurent",
  "Stone Island",
  "Supreme",
  "Tom Ford",
  "Valentino",
  "Versace",
  "Zegna",
];
function BrandsPage({ lang }: { lang: Lang }) {
  const sq = lang === "sq";
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState("All");
  const shown = brandDirectory.filter(
    (x) =>
      (letter === "All" || x[0] === letter) &&
      x.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="v2-page v2-brands-page">
      <PageTitle
        eyebrow="DESIGNER DIRECTORY"
        title={
          sq ? "Brendet që përcaktojnë stilin." : "Brands that define style."
        }
        text={
          sq
            ? "Zbulo koleksione të kuruara, ndiq brendet dhe aktivizo njoftimet për produktet e reja."
            : "Explore curated collections, follow brands and enable new-item alerts."
        }
      />
      <label className="v2-brand-search">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={sq ? "Kërko një brend" : "Search a brand"}
        />
      </label>
      <section className="v2-featured-brands">
        {["CHANEL", "HERMÈS", "ROLEX", "LOUIS VUITTON"].map((x, i) => (
          <Link href={`/explore?brand=${encodeURIComponent(x)}`} key={x}>
            <img src={products[[1, 0, 3, 7][i]].image} alt="" />
            <span>{x}</span>
            <small>{sq ? "Shiko koleksionin" : "View collection"}</small>
          </Link>
        ))}
      </section>
      <nav className="v2-alphabet">
        {["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((x) => (
          <button
            className={letter === x ? "active" : ""}
            onClick={() => setLetter(x)}
            key={x}
          >
            {x === "All" ? (sq ? "Të gjitha" : "All") : x}
          </button>
        ))}
      </nav>
      <section className="v2-brand-list">
        {shown.map((x) => (
          <article key={x}>
            <Link
              href={`/explore?brand=${encodeURIComponent(x.toUpperCase())}`}
            >
              {x}
              <ArrowRight />
            </Link>
            <button aria-label={sq ? `Ndiq ${x}` : `Follow ${x}`}>
              <Plus />
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

type StoryItem = { id: string; slug: string; tag: string; title: string; text: string; image: string; content: string; featured?: boolean };
const fallbackStoryContent = "Në tregun e modës së përdorur, detajet krijojnë besimin. Një produkt nuk vlerësohet vetëm nga emri i brendit, por nga materiali, ndërtimi, gjendja dhe historia e tij.\n\nShiko provat, jo vetëm përshtypjen. Fotografitë e qarta, dokumentet dhe raporti i gjendjes ndërtojnë një pamje më të plotë.\n\nNjë blerje e mirë fillon me informacion të qartë dhe pritshmëri reale.";
const storyData: StoryItem[] = [
  {
    id: "1",
    slug: "1",
    tag: "UDHËZUES",
    title: "Si ta vlerësosh një çantë vintage",
    text: "Nga qepjet dhe hardueri te seria dhe historia e pronësisë.",
    image: "/assets/bag-one.webp",
    content: fallbackStoryContent,
  },
  {
    id: "2",
    slug: "2",
    tag: "KOLEKSIONE",
    title: "Pse orët e mira mbajnë vlerën",
    text: "Modeli, gjendja, dokumentet dhe rrallësia ndikojnë në çmim.",
    image: "/assets/watch-one.webp",
    content: fallbackStoryContent,
  },
  {
    id: "3",
    slug: "3",
    tag: "EDITORIAL",
    title: "Quiet luxury, i shpjeguar",
    text: "Materialet dhe prerja flasin më shumë se logoja.",
    image: "/assets/blazer-one.webp",
    content: fallbackStoryContent,
  },
  {
    id: "4",
    slug: "4",
    tag: "AUTENTIKIM",
    title: "Çfarë kontrollon një ekspert",
    text: "Një vështrim transparent brenda procesit të autentikimit.",
    image: "/assets/bracelet-one.webp",
    content: fallbackStoryContent,
  },
  {
    id: "5",
    slug: "5",
    tag: "STIL",
    title: "Atletet që kalojnë sezonet",
    text: "Silueta ikonike që mbeten relevante.",
    image: "/assets/sneaker-one.webp",
    content: fallbackStoryContent,
  },
  {
    id: "6",
    slug: "6",
    tag: "KULTURË",
    title: "Jeta e dytë e një ikone",
    text: "Pse moda e përdorur po riformëson luksin.",
    image: "/assets/bag-two.webp",
    content: fallbackStoryContent,
  },
];
const mapBlogPost = (row: Record<string, unknown>): StoryItem => ({
  id: String(row.id), slug: String(row.slug), tag: String(row.category || "EDITORIAL"),
  title: String(row.title), text: String(row.excerpt || ""), image: String(row.cover_image || "/assets/blazer-one.webp"),
  content: String(row.content || fallbackStoryContent), featured: Boolean(row.featured),
});
function StoriesPage() {
  const [stories, setStories] = useState(storyData);
  useEffect(() => {
    void createClient().from("blog_posts")
      .select("id,slug,title,excerpt,content,category,cover_image,featured,published_at")
      .eq("status", "published").lte("published_at", new Date().toISOString())
      .order("featured", { ascending: false }).order("published_at", { ascending: false })
      .then(({ data }: { data: Record<string, unknown>[] | null }) => { if (data?.length) setStories(data.map(mapBlogPost)); });
  }, []);
  const lead = stories[0];
  return (
    <main className="v2-page v2-stories-page">
      <PageTitle
        eyebrow="CLOZER STORIES"
        title="Moda përtej produktit."
        text="Histori, udhëzues dhe këndvështrime nga bota e modës së kuruar."
      />
      <section className="v2-story-lead">
        <img src={lead.image} alt="" />
        <div>
          <span>{lead.tag}</span>
          <h2>{lead.title}</h2>
          <p>{lead.text}</p>
          <Link className="v2-pill light" href={`/stories/${lead.slug}`}>
            Lexo historinë
            <ArrowRight />
          </Link>
        </div>
      </section>
      <section className="v2-story-grid">
        {stories.slice(1).map((x) => (
          <Link href={`/stories/${x.slug}`} key={x.id}>
            <img src={x.image} alt="" />
            <span>{x.tag}</span>
            <h2>{x.title}</h2>
            <p>{x.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
function StoryPage({ id }: { id: string }) {
  const [story, setStory] = useState(storyData.find((x) => x.slug === id) || storyData[0]);
  useEffect(() => {
    void createClient().from("blog_posts")
      .select("id,slug,title,excerpt,content,category,cover_image,featured,published_at")
      .eq("slug", id).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle()
      .then(({ data }: { data: Record<string, unknown> | null }) => { if (data) setStory(mapBlogPost(data)); });
  }, [id]);
  const readingMinutes = Math.max(2, Math.ceil(story.content.split(/\s+/).length / 200));
  return (
    <main className="v2-story-article">
      <header>
        <span>{story.tag} · {readingMinutes} MIN LEXIM</span>
        <h1>{story.title}</h1>
        <p>{story.text}</p>
      </header>
      <img className="v2-story-cover" src={story.image} alt={story.title} />
      <article>
        {story.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </article>
      <Rail
        title="Pjesë të lidhura me historinë"
        items={products.slice(0, 4)}
        saved={[]}
        toggle={() => {}}
        add={() => {}}
      />
    </main>
  );
}

function ProfessionalSellersPage() {
  const [sent, setSent] = useState(false);
  return (
    <main className="v2-pro-page">
      <section className="v2-pro-hero">
        <div>
          <span>CLOZER FOR BUSINESS</span>
          <h1>
            Dyqani yt.
            <br />
            Një treg ndërkombëtar.
          </h1>
          <p>
            Menaxho inventarin, ekipin, marketingun dhe performancën nga një
            hapësirë e vetme premium.
          </p>
          <button
            className="v2-pill light"
            onClick={() =>
              document.getElementById("pro-apply")?.scrollIntoView()
            }
          >
            Apliko si dyqan
            <ArrowRight />
          </button>
        </div>
        <aside>
          <b>STORE MODE</b>
          <span>Inventar pa limit</span>
          <span>Bulk upload</span>
          <span>Role për ekipin</span>
          <span>Analytics dhe kampanja</span>
        </aside>
      </section>
      <section className="v2-pro-benefits">
        {[
          [
            "Komisione profesionale",
            "Tarifa të përshtatura sipas volumit dhe performancës.",
          ],
          [
            "Transport pa komplikime",
            "Etiketa të integruara dhe menaxhim dërgesash.",
          ],
          [
            "Inventar në shkallë",
            "CSV, bulk edit dhe arkitekturë për API sync.",
          ],
          ["Rritje e kontrolluar", "Fushata, kupona, promovime dhe analytics."],
          ["Ekip dhe role", "Pronar, menaxher, inventar, shitje dhe support."],
          [
            "Mbështetje e dedikuar",
            "Onboarding dhe account manager për dyqanet e mëdha.",
          ],
        ].map((x) => (
          <article key={x[0]}>
            <Sparkles />
            <h2>{x[0]}</h2>
            <p>{x[1]}</p>
          </article>
        ))}
      </section>
      <section id="pro-apply" className="v2-pro-apply">
        <div>
          <span>APLIKIMI</span>
          <h2>Gati për Store Mode?</h2>
          <p>
            Ky formular demonstron rrjedhën. Verifikimi real i biznesit lidhet
            gjatë fazës production.
          </p>
        </div>
        {sent ? (
          <div className="v2-contact-success">
            <Check />
            <h2>Aplikimi u pranua</h2>
            <p>Ekipi CLOZER do të kontaktojë biznesin pas shqyrtimit.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label>
              Emri i biznesit
              <input required />
            </label>
            <label>
              Numri i regjistrimit
              <input required />
            </label>
            <label>
              Emaili i biznesit
              <input type="email" required />
            </label>
            <label>
              Inventari mesatar
              <select>
                <option>1–100 produkte</option>
                <option>101–1,000 produkte</option>
                <option>1,000+ produkte</option>
              </select>
            </label>
            <button className="v2-pill dark">
              Dërgo aplikimin
              <ArrowRight />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const policies: Record<string, [string, string, string[]]> = {
  "/terms": [
    "KUSHTET",
    "Kushtet e përdorimit",
    "Rregullat që udhëheqin përdorimin e CLOZER-s.",
    [
      "Llogaria dhe përgjegjësia",
      "Blerjet dhe pagesat",
      "Shitjet dhe tarifat",
      "Përmbajtja dhe sjellja",
      "Kufizimi i përgjegjësisë",
    ],
  ],
  "/privacy": [
    "PRIVATËSIA",
    "Privatësia dhe të dhënat",
    "Si i mbledhim, përdorim dhe mbrojmë të dhënat.",
    [
      "Të dhënat që mbledhim",
      "Përdorimi i të dhënave",
      "Ruajtja dhe siguria",
      "Të drejtat e përdoruesit",
      "Cookies dhe preferencat",
    ],
  ],
  "/returns": [
    "KTHIMET",
    "Politika e kthimit",
    "Mbrojtje e qartë kur produkti nuk përputhet me shpalljen.",
    [
      "Afati i raportimit",
      "Produktet e pranueshme",
      "Provat e kërkuara",
      "Rimbursimi",
      "Produktet e papranueshme",
    ],
  ],
  "/buyer-protection": [
    "MBROJTJA",
    "Mbrojtja e blerësit",
    "Pagesa e sigurt, autentikim proporcional dhe zgjidhje mosmarrëveshjesh.",
    [
      "Pagesa e mbrojtur",
      "Kontrolli i produktit",
      "Dërgesa dhe gjurmimi",
      "Raportimi i problemit",
      "Rimbursimi",
    ],
  ],
  "/prohibited-items": [
    "SIGURIA",
    "Produktet e ndaluara",
    "Çfarë nuk mund të shitet në CLOZER.",
    [
      "Falsifikimet",
      "Produktet e vjedhura",
      "Materialet e ndaluara",
      "Produktet e rrezikshme",
      "Shkeljet e pronësisë intelektuale",
    ],
  ],
  "/shipping-policy": [
    "DËRGESA",
    "Politika e transportit",
    "Standardet për etiketa, gjurmim, sigurim dhe afate.",
    [
      "Etiketat",
      "Afatet e dërgimit",
      "Gjurmimi",
      "Dërgesa ndërkombëtare",
      "Humbja ose dëmtimi",
    ],
  ],
};
function PolicyPage({ path }: { path: string }) {
  const p = policies[path] || policies["/terms"];
  return (
    <main className="v2-page v2-policy">
      <PageTitle eyebrow={p[0]} title={p[1]} text={p[2]} />
      <p className="v2-policy-note">
        <AlertTriangle />
        Dokument demonstrues për UI/UX. Para lançimit duhet shqyrtuar dhe
        miratuar nga juristët e platformës.
      </p>
      {p[3].map((x, i) => (
        <section key={x}>
          <span>0{i + 1}</span>
          <div>
            <h2>{x}</h2>
            <p>
              CLOZER zbaton rregulla të qarta, transparente dhe të barabarta për
              blerësit, shitësit dhe dyqanet. Detajet përfundimtare përshtaten
              me juridiksionin, shërbimet e pagesës dhe partnerët logjistikë.
            </p>
          </div>
        </section>
      ))}
    </main>
  );
}

function AuthenticationPage({ lang }: { lang: Lang }) {
  const sq = lang === "sq";
  const levels = sq
    ? [
        [
          "Pa kontrolluar",
          "Nuk ka kaluar asnjë inspektim dhe nuk shfaqet garanci autenticiteti.",
        ],
        [
          "Kontrolluar paraprakisht nga AI",
          "Fotot, seria, çmimi dhe sinjalet e rrezikut janë analizuar. Ky nuk është konfirmim përfundimtar.",
        ],
        [
          "Kontrolluar nga eksperti",
          "Eksperti ka shqyrtuar fotografitë, dokumentet dhe të dhënat e produktit.",
        ],
        [
          "Autentifikuar fizikisht",
          "Produkti është inspektuar në qendër dhe merr certifikatë e etiketë kundër manipulimit.",
        ],
      ]
    : [
        [
          "Not checked",
          "No inspection has been completed and no authenticity guarantee is displayed.",
        ],
        [
          "AI pre-checked",
          "Photos, identifiers, price and risk signals were screened. This is not a final confirmation.",
        ],
        [
          "Expert digitally reviewed",
          "An expert reviewed required photos, documents and available product data.",
        ],
        [
          "Physically authenticated",
          "The item was inspected at a center and receives a certificate and tamper-proof tag.",
        ],
      ];
  const journey = sq
    ? [
        "Pagesa mbahet në escrow",
        "Produkti shkon në qendrën CLOZER",
        "Eksperti kontrollon identitetin dhe gjendjen",
        "Vendoset etiketa e sigurisë",
        "Produkti dërgohet; pagesa lirohet",
      ]
    : [
        "Payment is held in escrow",
        "Item ships to a CLOZER center",
        "Expert checks identity and condition",
        "Security tag is attached",
        "Item ships; payment is released",
      ];
  return (
    <main className="v2-page v2-auth-page">
      <section className="v2-auth-hero">
        <div>
          <span>CLOZER TRUST SYSTEM</span>
          <h1>
            {sq
              ? "Besimi ndërtohet me prova."
              : "Trust is built with evidence."}
          </h1>
          <p>
            {sq
              ? "AI zbulon rrezikun; ekspertët dhe inspektimi fizik japin sigurinë më të fortë. Fotografitë e zakonshme nuk trajtohen kurrë si provë absolute."
              : "AI screens risk; experts and physical inspection provide the strongest assurance. Ordinary photos are never treated as absolute proof."}
          </p>
          <div>
            <Link className="v2-pill light" href="/explore?verified=1">
              {sq ? "Eksploro të kontrolluarat" : "Explore checked pieces"}
              <ArrowRight />
            </Link>
            <Link className="v2-pill glass" href="/verify/VL-4824">
              {sq ? "Verifiko certifikatë" : "Verify certificate"}
            </Link>
          </div>
        </div>
        <aside>
          <ShieldCheck />
          <b>{sq ? "4 nivele kontrolli" : "4 review levels"}</b>
          <span>
            {sq
              ? "Nga analiza paraprake te inspektimi fizik"
              : "From preliminary screening to physical inspection"}
          </span>
        </aside>
      </section>
      <section className="v2-auth-levels">
        <div className="v2-section-head">
          <div>
            <span>{sq ? "NIVELE TË QARTA" : "CLEAR LEVELS"}</span>
            <h2>
              {sq
                ? "Gjithmonë e di çfarë është kontrolluar."
                : "Always know what was checked."}
            </h2>
          </div>
        </div>
        <div>
          {levels.map((x, i) => (
            <article key={x[0]}>
              <i>0{i + 1}</i>
              <span className={`v2-level-icon l${i}`}>
                <ShieldCheck />
              </span>
              <h3>{x[0]}</h3>
              <p>{x[1]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="v2-auth-analysis">
        <div>
          <span>
            {sq ? "ANALIZË E BAZUAR NË PROVA" : "EVIDENCE-BASED ANALYSIS"}
          </span>
          <h2>
            {sq
              ? "Çdo markë ka rregullat e veta."
              : "Every brand has its own rules."}
          </h2>
          <p>
            {sq
              ? "Logoja, tipografia, qepjet, materialet, gravurat, etiketat, seria dhe paketimi krahasohen me referenca të verifikuara dhe variante historike."
              : "Logos, typography, stitching, materials, engravings, labels, identifiers and packaging are compared with verified references and historical variations."}
          </p>
          <div className="v2-brand-cloud">
            {[
              "Louis Vuitton",
              "Gucci",
              "Chanel",
              "Hermès",
              "Nike",
              "Jordan",
              "Rolex",
              "Cartier",
              "Ray-Ban",
              "Dior",
            ].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
        <aside>
          {[
            [
              Fingerprint,
              sq ? "Seri e maskuar" : "Masked serial",
              "AB12••••89",
            ],
            [
              ImagePlus,
              sq ? "Foto të kopjuara" : "Duplicate photos",
              sq ? "Hash + ngjashmëri" : "Hash + similarity",
            ],
            [
              TrendingDown,
              sq ? "Anomali çmimi" : "Price anomaly",
              sq ? "Sinjal, jo vendim" : "Signal, not verdict",
            ],
            [
              ShieldCheck,
              sq ? "Rreziku i shitësit" : "Seller risk",
              sq ? "Privat dhe i mbrojtur" : "Private and protected",
            ],
          ].map(([Icon, title, text]) => (
            <article key={String(title)}>
              {typeof Icon !== "string" && <Icon />}
              <span>
                <b>{String(title)}</b>
                <small>{String(text)}</small>
              </span>
            </article>
          ))}
        </aside>
      </section>
      <section className="v2-auth-journey">
        <div className="v2-section-head">
          <div>
            <span>
              {sq ? "PRODUKTE ME VLERË TË LARTË" : "HIGH-VALUE PRODUCTS"}
            </span>
            <h2>
              {sq
                ? "Nga shitësi, te qendra, pastaj te ti."
                : "Seller to center to you."}
            </h2>
          </div>
        </div>
        <div>
          {journey.map((x, i) => (
            <article key={x}>
              <b>{i + 1}</b>
              <span>{x}</span>
              {i < journey.length - 1 && <ArrowRight />}
            </article>
          ))}
        </div>
        <p>
          <LockKeyhole />
          {sq
            ? "Nëse produkti refuzohet, blerësi rimbursohet plotësisht."
            : "If the item is rejected, the buyer receives a full refund."}
        </p>
      </section>
      <section className="v2-auth-thresholds">
        <h2>
          {sq
            ? "Kontroll proporcional me rrezikun"
            : "Review proportional to risk"}
        </h2>
        {[
          ["< €100", sq ? "Kontroll AI" : "AI screening"],
          ["€100–€500", sq ? "AI + ekspert opsional" : "AI + optional expert"],
          ["€500–€1,500", sq ? "Ekspert i detyrueshëm" : "Mandatory expert"],
          ["> €1,500", sq ? "Autentifikim fizik" : "Physical authentication"],
        ].map((x) => (
          <article key={x[0]}>
            <b>{x[0]}</b>
            <span>{x[1]}</span>
          </article>
        ))}
      </section>
    </main>
  );
}

function CertificatePage({ lang }: { lang: Lang }) {
  const sq = lang === "sq";
  const [query, setQuery] = useState("VL-4824");
  const [checked, setChecked] = useState(true);
  return (
    <main className="v2-page v2-certificate-page">
      <PageTitle
        eyebrow="CLOZER CERTIFICATE"
        title={sq ? "Verifiko certifikatën" : "Verify certificate"}
        text={
          sq
            ? "Kontrollo lidhjen me produktin, shpalljen dhe etiketën e sigurisë."
            : "Confirm the link to the item, listing and security tag."
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
        }}
      >
        <Fingerprint />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setChecked(false);
          }}
        />
        <button className="v2-pill dark">{sq ? "Verifiko" : "Verify"}</button>
      </form>
      {checked && (
        <section className="v2-certificate">
          <div className="v2-certificate-seal">
            <ShieldCheck />
            <span>{sq ? "E VERIFIKUAR" : "VERIFIED"}</span>
          </div>
          <div>
            <span>CERTIFICATE ID · {query}</span>
            <h1>ROLEX Oyster-style perpetual 36</h1>
            <p>
              {sq
                ? "Autentifikuar fizikisht më 28 korrik 2026 në Qendrën CLOZER Milano."
                : "Physically authenticated on 28 July 2026 at CLOZER Milan Center."}
            </p>
            <div className="v2-certificate-data">
              {[
                [sq ? "Seria" : "Serial", "AB12••••84"],
                [
                  sq ? "Gjendja" : "Condition",
                  sq ? "Shkëlqyeshëm" : "Excellent",
                ],
                [sq ? "Etiketa" : "Security tag", "VT-90••24"],
                [sq ? "Shpallja" : "Listing", "VL-LST-000004"],
              ].map((x) => (
                <article key={x[0]}>
                  <small>{x[0]}</small>
                  <b>{x[1]}</b>
                </article>
              ))}
            </div>
          </div>
          <div className="v2-qr-demo">
            <span />
            <span />
            <span />
            <span />
            <i />
          </div>
          <footer>
            <Fingerprint />
            {sq
              ? "Gjurma fotografike përputhet me regjistrin e mbrojtur. Kopjimi i faqes nuk transferon certifikatën."
              : "The photographic fingerprint matches the protected record. Copying this page does not transfer the certificate."}
          </footer>
        </section>
      )}
    </main>
  );
}

function AuthCenterPage({ lang }: { lang: Lang }) {
  const sq = lang === "sq";
  const [tab, setTab] = useState(0);
  const tabs = sq
    ? [
        "Shqyrtime eksperti",
        "Inspektime fizike",
        "Rrezik i lartë",
        "Konflikte serie",
      ]
    : [
        "Expert reviews",
        "Physical inspections",
        "High risk",
        "Serial conflicts",
      ];
  const rows = [
    [
      "VL-90841",
      "CHANEL",
      "Classic flap medium",
      sq ? "Dëshmi shtesë" : "More evidence",
      "68%",
    ],
    [
      "VL-90837",
      "ROLEX",
      "Datejust 36",
      sq ? "Inspektim fizik" : "Physical inspection",
      "42%",
    ],
    [
      "VL-90822",
      "JORDAN",
      "Jordan 1 Retro High",
      sq ? "Foto duplikate" : "Duplicate photo",
      "81%",
    ],
    [
      "VL-90811",
      "CARTIER",
      "Love bracelet",
      sq ? "Shqyrtim eksperti" : "Expert review",
      "37%",
    ],
  ];
  return (
    <main className="v2-auth-center">
      <header>
        <div>
          <span>CLOZER AUTHENTICATION CENTER</span>
          <h1>{sq ? "Qendra e kontrollit" : "Review command center"}</h1>
          <p>
            {sq
              ? "Vendime të dokumentuara, prova të strukturuara dhe audit i pandryshueshëm."
              : "Documented decisions, structured evidence and immutable audit."}
          </p>
        </div>
        <Link className="v2-pill dark" href="/authentication">
          <ShieldCheck />
          {sq ? "Sistemi publik" : "Public trust system"}
        </Link>
      </header>
      <section className="v2-auth-kpis">
        {[
          [sq ? "Në pritje" : "Pending", "24"],
          [sq ? "Rrezik i lartë" : "High risk", "7"],
          [sq ? "Konflikte serie" : "Serial conflicts", "3"],
          [sq ? "Saktësia 30 ditë" : "30-day accuracy", "98.6%"],
        ].map((x) => (
          <article key={x[0]}>
            <span>{x[0]}</span>
            <b>{x[1]}</b>
          </article>
        ))}
      </section>
      <div className="v2-auth-workspace">
        <aside>
          {tabs.map((x, i) => (
            <button
              className={tab === i ? "active" : ""}
              onClick={() => setTab(i)}
              key={x}
            >
              <span>{x}</span>
              <b>{[12, 5, 7, 3][i]}</b>
            </button>
          ))}
        </aside>
        <section>
          <div className="v2-auth-table-head">
            <div>
              <h2>{tabs[tab]}</h2>
              <span>
                {sq
                  ? "Renditur sipas rrezikut dhe vlerës"
                  : "Prioritized by risk and value"}
              </span>
            </div>
            <button>
              <Filter />
              {sq ? "Filtro" : "Filter"}
            </button>
          </div>
          <div className="v2-auth-table">
            {rows.map((r, i) => (
              <article key={r[0]}>
                <span className="v2-auth-thumb">
                  <ProductImage p={products[(i + 3) % products.length]} />
                </span>
                <span>
                  <small>{r[0]}</small>
                  <b>{r[1]}</b>
                  <em>{r[2]}</em>
                </span>
                <span>
                  <small>{sq ? "Veprimi" : "Action"}</small>
                  <b>{r[3]}</b>
                </span>
                <span>
                  <small>{sq ? "Rrezik" : "Risk"}</small>
                  <b
                    className={
                      Number(r[4].replace("%", "")) > 60 ? "danger" : ""
                    }
                  >
                    {r[4]}
                  </b>
                </span>
                <button>
                  <ChevronRight />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function PageTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="v2-page-title">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
function Empty({
  icon,
  title,
  text,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="v2-empty">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="v2-pill dark" href={href}>
        {action}
        <ArrowRight />
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <footer className="v2-footer">
      <div>
        <section>
          <Brand />
          <p>
            Tregu i përzgjedhur për modë të autentikuar, ikona moderne dhe pjesë
            me një jetë të dytë.
          </p>
          <span className="v2-footer-locale">Kosovë · EUR · Shqip</span>
        </section>
        {[
          ["Bli", "Të reja", "Brendet", "Autentikimi", "Mbrojtja e blerësit"],
          [
            "Shit",
            "Si të shesësh",
            "Shitës profesionalë",
            "Paneli i shitësit",
            "Produktet e ndaluara",
          ],
          ["Ndihmë", "FAQ", "Kontakt", "Kthimet", "Dërgesa"],
          ["CLOZER", "Histori", "Rreth nesh", "Privatësia", "Kushtet"],
        ].map((col) => (
          <section key={col[0]}>
            <b>{col[0]}</b>
            {col.slice(1).map((x) => (
              <Link
                key={x}
                href={
                  x === "Të reja"
                    ? "/explore?sort=new"
                    : x === "Brendet"
                      ? "/brands"
                      : x === "Autentikimi"
                        ? "/authentication"
                        : x === "Mbrojtja e blerësit"
                          ? "/buyer-protection"
                          : x === "Si të shesësh"
                            ? "/sell"
                            : x === "Shitës profesionalë"
                              ? "/professional-sellers"
                              : x === "Paneli i shitësit"
                                ? "/dashboard"
                                : x === "Produktet e ndaluara"
                                  ? "/prohibited-items"
                                  : x === "FAQ"
                                    ? "/faq"
                                    : x === "Kontakt"
                                      ? "/contact"
                                      : x === "Kthimet"
                                        ? "/returns"
                                        : x === "Dërgesa"
                                          ? "/shipping-policy"
                                          : x === "Histori"
                                            ? "/stories"
                                            : x === "Privatësia"
                                              ? "/privacy"
                                              : x === "Kushtet"
                                                ? "/terms"
                                                : "/"
                }
              >
                {x}
              </Link>
            ))}
          </section>
        ))}
      </div>
      <div>
        <span>© 2026 CLOZER Marketplace</span>
        <nav>
          <Link href="/privacy">Privatësia</Link>
          <Link href="/terms">Kushtet</Link>
          <Link href="/buyer-protection">Mbrojtja</Link>
          <Link href="/contact">Kontakt</Link>
        </nav>
      </div>
    </footer>
  );
}

function MobileNav({ cart: _, signedIn }: { cart: number; signedIn: boolean }) {
  const p = canonicalPath(usePathname());
  const items = [
    { Icon: Home, label: "Kreu", href: "/", protected: false },
    { Icon: Search, label: "Eksploro", href: "/explore", protected: false },
    { Icon: Plus, label: "Shit", href: "/sell", protected: true },
    {
      Icon: MessageCircle,
      label: "Mesazhe",
      href: "/messages",
      protected: true,
    },
    { Icon: User, label: "Profili", href: "/profile", protected: true },
  ];
  return (
    <nav className="v2-mobile-nav" aria-label="Navigimi kryesor">
      {items.map(({ Icon, label, href, protected: needsAccount }) => {
        const content = (
          <>
            <span className={label === "Shit" ? "sell" : ""}>
              <Icon />
            </span>
            <small>{label}</small>
          </>
        );
        const active = p === href || (href !== "/" && p.startsWith(href));
        return needsAccount && !signedIn ? (
          <button
            type="button"
            key={label}
            className={active ? "active" : ""}
            onClick={() => requestAccount(href)}
            aria-label={`Kyçu për ${label.toLowerCase()}`}
          >
            {content}
          </button>
        ) : (
          <Link key={label} href={href} className={active ? "active" : ""}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Marketplace() {
  const path = canonicalPath(usePathname());
  const router = useRouter();
  const [lang, setLang] = usePersistent<Lang>("velora-language", "sq");
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [saved, setSaved] = usePersistent<ProductId[]>("velora-saved", [4]);
  const [cart, setCart] = usePersistent<CartLine[]>("velora-cart", []);
  const [notes, setNotes] = usePersistent<Note[]>("velora-notes", seedNotes);
  const [orders, setOrders] = usePersistent<Order[]>("velora-orders", []);
  const [listings, setListings] = usePersistent<ListingDraft[]>(
    "velora-listings",
    [],
  );
  const [publicListings, setPublicListings] = useState<PublicListing[]>([]);
  const listingCatalog = useMemo<Product[]>(() => {
    const local = listings.map(
      (listing, index): Product => ({
        id: listing.id || `local-${90000 + index}`,
        sellerId: account?.id,
        name: listing.title,
        brand: (listing.brand || "PA BREND").toUpperCase(),
        price: listing.price,
        image: listing.image || "/assets/bag-one.webp",
        images: listing.images,
        position: "center",
        seller: account?.fullName || "Shitës CLOZER",
        sellerSlug: account?.username || undefined,
        sellerAvatar: account?.avatarUrl || null,
        size: listing.size || "Një madhësi",
        city: listing.city || account?.city || "Kosovë",
        verified: Boolean(account?.sellerVerified),
        label: "E re",
        category: listing.category || "Modë",
        color: listing.color || "Nuk është specifikuar",
        condition: listing.condition || "Mirë",
        gender: listing.gender,
        authLevel: "none",
        material: listing.material || "Nuk është specifikuar",
        reference: listing.reference || undefined,
        description: listing.description || "Produkt i publikuar nga shitësi. Fotografitë paraqesin gjendjen aktuale.",
        publishedAt: listing.publishedAt,
        negotiable: listing.negotiable ?? true,
        shipping: listing.shippingAvailable ?? true,
      }),
    );
    const remote = publicListings.map(publicListingToProduct);
    const seen = new Set(local.map((product) => String(product.id)));
    return [
      ...local,
      ...remote.filter((product) => !seen.has(String(product.id))),
      ...products,
    ];
  }, [listings, publicListings, account]);
  const marketplaceCatalog = useMemo(() => {
    const realListings = listingCatalog.filter((product) => {
      const id = String(product.id);
      return id.startsWith("local-") || /^[0-9a-f-]{36}$/i.test(id);
    });
    return realListings.length ? realListings : products;
  }, [listingCatalog]);
  const ownListings = useMemo(
    () => account ? marketplaceCatalog.filter((product) => product.sellerId === account.id || String(product.id).startsWith("local-")) : [],
    [account, marketplaceCatalog],
  );
  const homepageBoosted = useMemo(() => {
    const priority: Record<string, number> = { homepage_7d: 0, urgent_3d: 1, top_24h: 2 };
    const active = listingCatalog
      .filter((product) => product.boostTier)
      .sort((a, b) => (priority[a.boostTier || ""] ?? 9) - (priority[b.boostTier || ""] ?? 9));
    if (active.length) return active;
    return [products[0], products[11], products[12], products[15]].map((product, index) => ({
      ...product,
      boostTier: index === 0 ? "homepage_7d" : "top_24h",
    }));
  }, [listingCatalog]);
  useEffect(() => {
    void getPublicListings()
      .then(setPublicListings)
      .catch(() => setPublicListings([]));
  }, []);
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session?.user));
      if (!data.session?.user) setAccount(null);
      setAuthReady(true);
    });
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        setSignedIn(Boolean(data.user));
        if (!data.user) setAccount(null);
      })
      .catch(() => {
        setSignedIn(false);
        setAccount(null);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      if (!session?.user) setAccount(null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profile }, { data: sellerApplication }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id,full_name,username,avatar_url,city,seller_verified,identity_verified",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("seller_applications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setAccount({
        id: user.id,
        email: user.email || "",
        fullName:
          profile?.full_name ||
          String(
            user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Përdorues",
          ),
        username: profile?.username || "",
        avatarUrl: profile?.avatar_url || null,
        city: profile?.city || "",
        sellerVerified: Boolean(profile?.seller_verified),
        identityVerified: Boolean(profile?.identity_verified),
        emailVerified: Boolean(user.email_confirmed_at),
        sellerApplicationStatus:
          (sellerApplication?.status as AccountProfile["sellerApplicationStatus"]) ||
          null,
      });
    };
    void load();
  }, [signedIn]);
  const clearPrivate = () => {
    setSaved([]);
    setCart([]);
    setNotes([]);
  };
  const signIn = () => setSignedIn(true);
  const signOut = async () => {
    await createClient().auth.signOut();
    clearPrivate();
    setAccount(null);
    setSignedIn(false);
  };
  const privateSaved = signedIn ? saved : [];
  const privateCart = signedIn ? cart : [];
  const privateNotes = signedIn ? notes : [];
  const requestLogin = (next = path) =>
    router.push(`/?login=account&next=${encodeURIComponent(next)}`);
  const toggle = (id: ProductId) => {
    if (!signedIn) {
      requestLogin();
      return;
    }
    setSaved(
      saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id],
    );
  };
  const add = (id: ProductId) => {
    if (!signedIn) {
      requestLogin();
      return;
    }
    setCart(
      cart.some((item) => item.id === id)
        ? cart.map((item) =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [...cart, { id, qty: 1 }],
    );
  };
  const buy = (id: ProductId) => {
    if (!signedIn) {
      sessionStorage.setItem("velora-pending-buy", String(id));
      requestLogin(`/listing/${id}`);
      return;
    }
    setCart(
      cart.some((item) => item.id === id)
        ? cart.map((item) =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [...cart, { id, qty: 1 }],
    );
    router.push("/checkout");
  };
  useEffect(() => {
    if (!signedIn) return;
    const pending = sessionStorage.getItem("velora-pending-buy");
    if (!pending) return;
    sessionStorage.removeItem("velora-pending-buy");
    setCart((current) =>
      current.some((item) => String(item.id) === pending)
        ? current
        : [...current, { id: pending, qty: 1 }],
    );
    router.push("/checkout");
  }, [signedIn, router, setCart]);
  const place = (_address: string, shippingMethod: string, shippingCost: number) => {
    const total = cart.reduce(
      (sum, line) =>
        (listingCatalog.find(
          (product) => String(product.id) === String(line.id),
        )?.price || 0) *
          line.qty +
        sum,
      0,
    );
    setOrders([
      {
        id: `VL-${9000 + orders.length}`,
        total: total + shippingCost,
        items: cart.map((item) => item.id),
        date: new Date().toLocaleDateString("sq-AL"),
        status: "Porosia u konfirmua",
        shippingMethod,
        trackingNumber: shippingMethod === "personal_pickup" ? "Takimi caktohet në chat" : undefined,
      },
      ...orders,
    ]);
    setCart([]);
    setNotes([
      {
        id: Date.now(),
        title: "Porosia u konfirmua",
        text: "Pagesa jote e mbrojtur u autorizua.",
        type: "order",
        read: false,
        time: "Tani",
      },
      ...notes,
    ]);
  };
  const id = decodeURIComponent(path.split("/").pop() || "");
  const hideShell = path === "/sell" && Boolean(account?.sellerVerified);
  let content: React.ReactNode;
  if (path === "/explore" || path === "/search")
    content = (
      <ExplorePage
        saved={privateSaved}
        toggle={toggle}
        add={add}
        catalog={marketplaceCatalog}
        signedIn={signedIn}
      />
    );
  else if (path.startsWith("/listing"))
    content = (
      <ListingPage
        id={id}
        saved={privateSaved}
        toggle={toggle}
        add={add}
        buy={buy}
        catalog={listingCatalog}
        signedIn={signedIn}
      />
    );
  else if (path === "/sell")
    content = signedIn && !account?.sellerVerified ? (
      <main className="v2-page">
        <SellerApplicationCard account={account} />
      </main>
    ) : (
      <SellPage
        signedIn={signedIn}
        publish={async (p) => {
          const id = await createListing(p);
          setListings([{ ...p, id }, ...listings]);
          return id;
        }}
      />
    );
  else if (path === "/messages") content = <DatabaseMessagesPage />;
  else if (path === "/saved")
    content = (
      <SavedPage
        saved={privateSaved}
        toggle={toggle}
        add={add}
        catalog={listingCatalog}
      />
    );
  else if (path === "/cart")
    content = (
      <CartPage
        cart={privateCart}
        setCart={setCart}
        checkout={() => router.push("/checkout")}
        catalog={listingCatalog}
      />
    );
  else if (path === "/checkout")
    content = (
      <CheckoutPage cart={privateCart} place={place} catalog={listingCatalog} />
    );
  else if (path === "/notifications")
    content = <NotificationsPage notes={privateNotes} setNotes={setNotes} />;
  else if (path === "/settings") content = <SettingsPage account={account} />;
  else if (path === "/orders") content = <OrdersPage orders={orders} />;
  else if (path === "/contact") content = <ContactPage />;
  else if (path === "/faq") content = <FaqPage />;
  else if (path === "/authentication")
    content = <AuthenticationPage lang={lang} />;
  else if (path === "/authentication-center")
    content = <AuthCenterPage lang={lang} />;
  else if (path.startsWith("/verify/"))
    content = <CertificatePage lang={lang} />;
  else if (path === "/brands") content = <BrandsPage lang={lang} />;
  else if (path === "/stories") content = <StoriesPage />;
  else if (path.startsWith("/stories/"))
    content = <StoryPage id={path.split("/").pop() || "1"} />;
  else if (path === "/professional-sellers")
    content = <ProfessionalSellersPage />;
  else if (policies[path]) content = <PolicyPage path={path} />;
  else if (path.startsWith("/seller/"))
    content = (
      <SellerProfilePage
        slug={path.split("/").pop() || ""}
        saved={privateSaved}
        toggle={toggle}
        add={add}
        signedIn={signedIn}
      />
    );
  else if (path === "/profile" || path === "/dashboard")
    content = (
      <ProfilePage listings={signedIn ? ownListings : []} account={account} />
    );
  else
    content = (
      <HomePage
        saved={privateSaved}
        toggle={toggle}
        add={add}
        signedIn={signedIn}
        boosted={homepageBoosted}
      />
    );
  if (!authReady)
    return (
      <main className="v2-auth-loading" aria-live="polite">
        <Brand />
        <span>Duke kontrolluar llogarinë…</span>
      </main>
    );
  return (
    <Localize lang={lang}>
      <div className="v2-app" key={lang}>
        {!hideShell && (
          <AppHeader
            cartCount={privateCart.reduce((s, x) => s + x.qty, 0)}
            noteCount={privateNotes.filter((n) => !n.read).length}
            notes={privateNotes}
            setNotes={setNotes}
            lang={lang}
            setLang={setLang}
            signedIn={signedIn}
            onSignIn={signIn}
            onSignOut={signOut}
            account={account}
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${path}-${lang}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
        {!hideShell && <Footer />}
        <MobileNav
          cart={privateCart.reduce((s, x) => s + x.qty, 0)}
          signedIn={signedIn}
        />
      </div>
    </Localize>
  );
}
