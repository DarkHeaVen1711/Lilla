import { type StaticImageData } from "next/image";

// Image Paths (matching local images for mock structure)
const imgSerum = "/images/Radiance Pink Serum.png";
const imgCream = "/images/vitaminc.png";
const imgLipGloss = "/images/lip_gloss.png";
const imgFloralBox = "/images/floralbox.png";
const imgFloralShampoo = "/images/floralshampoo.png";
const imgFloralSoap = "/images/floralsoap.png";
const imgHydration = "/images/magnific_create-a-premium-lilaa-hy_2981158217 1.png";
const imgBrightening = "/images/magnific_create-a-premium-lilaa-br_2981302769 1.png";
const imgComboMakeup = "/images/ChatGPT Image May 14, 2026, 05_32_30 PM 1.png";
const imgComboBodyCare = "/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png";
const imgRedPore = "/images/Red_Pore.png";
const imgCentellaAmpoule = "/images/centella_ampoule.png";
const imgHyaluronicAcidSerum = "/images/hyaluronic_acid_serum.png";
const imgCicaSoothingCream = "/images/cica_soothing_cream.png";
const imgMugwortMask = "/images/mugwort_mask.png";
const imgAhaBhaToner = "/images/aha_bha_toner.png";
const imgGreenTeaOil = "/images/green_tea_oil.png";
const imgSnailMucinEssence = "/images/snail_mucin_essence.png";
const imgMatteLipstick = "/images/matte_lipstick.png";
const imgCushionFoundation = "/images/cushion_foundation.png";
const imgVitaminEMask = "/images/vitamin_e_mask.png";
const imgGlowPrimerSpray = "/images/glow_primer_spray.png";
const imgVelvetLipTint = "/images/velvet_lip_tint.png";
const imgRosewaterMist = "/images/rosewater_mist.png";
const imgClayPoreMask = "/images/clay_pore_mask.png";
const imgYouMightLikeBlush = "/images/youmightlike_blush.png";
const imgMakeupHover5 = "/images/makeup_hover_5.png";

export type ImageSource = StaticImageData | string;

/**
 * Standard WooCommerce Product Schema Interface (Sub-set of official WooCommerce REST API response)
 * @see https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
 */
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  type: "simple" | "variable" | "grouped" | "external";
  status: "publish" | "draft" | "pending" | "private";
  featured: boolean;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  total_sales: number;
  stock_status: "instock" | "outofstock" | "onbackorder";
  average_rating: string;
  rating_count: number;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    src: ImageSource; // Will be WooCommerce URL string in production
    name: string;
    alt: string;
  }>;
  meta_data: Array<{
    id?: number;
    key: string;
    value: any;
  }>;
}

/**
 * Frontend Product format required by existing UI components.
 */
export interface FrontendProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: ImageSource;
  price: number;
  originalPrice?: number;
  discount?: string;
  rating: number;
  reviews: number;
  category: string;
  expiresOn?: string;
  features: Array<{
    badge: string;
    title: string;
    description: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  skinConcerns?: string[];
  keyIngredients?: string[];
  applicator?: string;
  shades?: Array<{ name: string; hex: string }>;
  featured?: boolean;
}

// Mock database simulating WooCommerce REST API response
export const MOCK_WOOCOMMERCE_PRODUCTS: WooCommerceProduct[] = [
  {
    id: 101,
    name: "Red Bean Refreshing pore mask",
    slug: "red-bean-refreshing-pore-mask",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Beauty of Joseon Red Bean Mask with 30% red bean and kaolin washes away excess sebum. exfoliates for bright, clean, and refreshed skin.",
    short_description: "Refreshing pore mask with red bean and kaolin clay.",
    price: "120",
    regular_price: "150",
    sale_price: "120",
    on_sale: true,
    total_sales: 320,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 108,
    categories: [{ id: 10, name: "Treatments & Mask", slug: "treatments-mask" }],
    images: [{ id: 1, src: imgRedPore, name: "Red Bean Refreshing pore mask", alt: "Red Bean Refreshing pore mask" }],
    meta_data: [
      { key: "expiresOn", value: "28/12/2027" },
      { key: "skinConcerns", value: ["Pore tightening", "Sebum control"] },
      { key: "keyIngredients", value: ["Red Bean Extract 30%", "Kaolin Clay"] },
      {
        key: "features",
        value: [
          { badge: "Pores", title: "Sebum Absorption", description: "Kaolin clay draws out deep-rooted impurities and oil.", x1: 20, y1: 26, x2: 45, y2: 35 },
          { badge: "Exfoliation", title: "Red Bean Scrub", description: "Mild red bean powder particles gently buff away dead cells.", x1: 32, y1: 80, x2: 48, y2: 65 },
          { badge: "Soothing", title: "Cooling Texture", description: "Soft clay formula provides refreshing hydration to skin.", x1: 80, y1: 36, x2: 56, y2: 48 }
        ]
      }
    ]
  },
  {
    id: 102,
    name: "Radiance Pink Serum",
    slug: "radiance-pink-serum",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Hydrating serum for a glowing, luminous complexion.",
    short_description: "Glowing, luminous complexion pink serum.",
    price: "120",
    regular_price: "150",
    sale_price: "120",
    on_sale: true,
    total_sales: 450,
    stock_status: "instock",
    average_rating: "5.0",
    rating_count: 124,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 2, src: imgSerum, name: "Radiance Pink Serum", alt: "Radiance Pink Serum" }],
    meta_data: [
      { key: "expiresOn", value: "15/09/2027" },
      { key: "skinConcerns", value: ["Dullness", "Dryness"] },
      { key: "keyIngredients", value: ["Pink Pearl Extract", "Niacinamide"] },
      {
        key: "features",
        value: [
          { badge: "Glow", title: "Radiant Finish", description: "Leaves a soft pink pearl glow on the skin immediately.", x1: 20, y1: 26, x2: 45, y2: 35 },
          { badge: "Moisture", title: "Deep Hydration", description: "Infuses multi-weight hyaluronic acid into dry cells.", x1: 32, y1: 80, x2: 48, y2: 65 },
          { badge: "Barrier", title: "Niacinamide Boost", description: "Strengthens skin structure to resist pigmentation.", x1: 80, y1: 36, x2: 56, y2: 48 }
        ]
      }
    ]
  },
  {
    id: 103,
    name: "Vitamin C",
    slug: "vitamin-c-cream",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Brightening vitamin C cream for daily skin glow and protection.",
    short_description: "Daily brightening skin glow cream.",
    price: "85",
    regular_price: "85",
    sale_price: "",
    on_sale: false,
    total_sales: 190,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 89,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 3, src: imgCream, name: "Vitamin C", alt: "Vitamin C" }],
    meta_data: [
      { key: "skinConcerns", value: ["Brightening", "Anti-aging"] },
      { key: "keyIngredients", value: ["Pure Vitamin C", "Adenosine"] }
    ]
  },
  {
    id: 104,
    name: "Lip Gloss",
    slug: "lip-gloss",
    type: "simple",
    status: "publish",
    featured: true,
    description: "High-shine lip gloss with metallic tint and hydration.",
    short_description: "High-shine hydrating lip gloss.",
    price: "45",
    regular_price: "50",
    sale_price: "45",
    on_sale: true,
    total_sales: 510,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 210,
    categories: [{ id: 12, name: "Color Cosmetics", slug: "color-cosmetics" }],
    images: [{ id: 4, src: imgLipGloss, name: "Lip Gloss", alt: "Lip Gloss" }],
    meta_data: [
      { key: "finish", value: "High Gloss" },
      { key: "applicator", value: "Flocked Doe-foot" },
      {
        key: "shades",
        value: [
          { name: "Ruby Glow", hex: "#9B2226" },
          { name: "Pink Shimmer", hex: "#D46B7A" },
          { name: "Clear Glass", hex: "#E9C46A" }
        ]
      }
    ]
  },
  {
    id: 105,
    name: "Floral Box",
    slug: "floral-box",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Exclusive floral packaging set containing lip tint and primer.",
    short_description: "Exclusive floral beauty package.",
    price: "200",
    regular_price: "200",
    sale_price: "",
    on_sale: false,
    total_sales: 80,
    stock_status: "instock",
    average_rating: "5.0",
    rating_count: 56,
    categories: [{ id: 13, name: "Face Makeup", slug: "face-makeup" }],
    images: [{ id: 5, src: imgFloralBox, name: "Floral Box", alt: "Floral Box" }],
    meta_data: []
  },
  {
    id: 106,
    name: "Floral Shampoo",
    slug: "floral-shampoo",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Nourishing floral shampoo for shiny, healthy hair.",
    short_description: "Nourishing hair care shampoo.",
    price: "180",
    regular_price: "200",
    sale_price: "180",
    on_sale: true,
    total_sales: 150,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 42,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 6, src: imgFloralShampoo, name: "Floral Shampoo", alt: "Floral Shampoo" }],
    meta_data: []
  },
  {
    id: 107,
    name: "Floral Soap",
    slug: "floral-soap",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Gentle cleansing soap with calming floral botanicals.",
    short_description: "Calming floral cleansing soap.",
    price: "90",
    regular_price: "90",
    sale_price: "",
    on_sale: false,
    total_sales: 230,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 150,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 7, src: imgFloralSoap, name: "Floral Soap", alt: "Floral Soap" }],
    meta_data: []
  },
  {
    id: 108,
    name: "Ceo afterglow brightening vitamin C Serum",
    slug: "ceo-afterglow-vitamin-c-serum",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Limited-time brightening serum with vitamin C and anti-oxidants.",
    short_description: "Limited-time brightening vitamin C serum.",
    price: "120",
    regular_price: "150",
    sale_price: "120",
    on_sale: true,
    total_sales: 340,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 112,
    categories: [{ id: 10, name: "Treatments & Mask", slug: "treatments-mask" }],
    images: [{ id: 8, src: imgComboMakeup, name: "Ceo afterglow brightening vitamin C Serum", alt: "Ceo afterglow brightening vitamin C Serum" }],
    meta_data: [
      { key: "skinConcerns", value: ["Acne scars", "Brightening"] },
      { key: "keyIngredients", value: ["THD Ascorbate", "Turmeric Extract"] }
    ]
  },
  {
    id: 109,
    name: "Radiance Pink Hydrating Daily Serum",
    slug: "radiance-pink-daily-serum",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Hydration-focused daily serum for radiant skin.",
    short_description: "Hydrating daily serum.",
    price: "85",
    regular_price: "100",
    sale_price: "85",
    on_sale: true,
    total_sales: 120,
    stock_status: "instock",
    average_rating: "4.6",
    rating_count: 94,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 9, src: imgComboBodyCare, name: "Radiance Pink Hydrating Daily Serum", alt: "Radiance Pink Hydrating Daily Serum" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dryness", "Dehydration"] }
    ]
  },
  {
    id: 110,
    name: "Soft Glam Nourishing Facial Oil",
    slug: "soft-glam-facial-oil",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Nourishing facial oil for a smooth, glowing finish.",
    short_description: "Nourishing facial oil.",
    price: "90",
    regular_price: "120",
    sale_price: "90",
    on_sale: true,
    total_sales: 98,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 67,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 10, src: imgHydration, name: "Soft Glam Nourishing Facial Oil", alt: "Soft Glam Nourishing Facial Oil" }],
    meta_data: []
  },
  {
    id: 111,
    name: "Hydration Ritual Set",
    slug: "hydration-ritual-set",
    type: "simple",
    status: "publish",
    featured: false,
    description: "A full hydration routine set built for dry skin barriers.",
    short_description: "Full hydration skincare routine set.",
    price: "120",
    regular_price: "150",
    sale_price: "120",
    on_sale: true,
    total_sales: 180,
    stock_status: "instock",
    average_rating: "5.0",
    rating_count: 124,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 11, src: imgHydration, name: "Hydration Ritual Set", alt: "Hydration Ritual Set" }],
    meta_data: []
  },
  {
    id: 112,
    name: "Brightening & Glow Set",
    slug: "brightening-glow-set",
    type: "simple",
    status: "publish",
    featured: false,
    description: "A complete brightening routine set for luminous tone.",
    short_description: "Complete brightening routine set.",
    price: "85",
    regular_price: "85",
    sale_price: "",
    on_sale: false,
    total_sales: 110,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 89,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 12, src: imgBrightening, name: "Brightening & Glow Set", alt: "Brightening & Glow Set" }],
    meta_data: []
  },
  {
    id: 113,
    name: "Soft Glam Makeup Set",
    slug: "soft-glam-makeup-set",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Soft-focus makeup essentials including concealer and blush.",
    short_description: "Soft-focus makeup essentials set.",
    price: "45",
    regular_price: "45",
    sale_price: "",
    on_sale: false,
    total_sales: 240,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 210,
    categories: [{ id: 13, name: "Face Makeup", slug: "face-makeup" }],
    images: [{ id: 13, src: imgComboMakeup, name: "Soft Glam Makeup Set", alt: "Soft Glam Makeup Set" }],
    meta_data: []
  },
  {
    id: 114,
    name: "Body Care Set",
    slug: "body-care-set",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Body care wash and body lotion set for a calming ritual.",
    short_description: "Nourishing body care ritual set.",
    price: "200",
    regular_price: "200",
    sale_price: "",
    on_sale: false,
    total_sales: 65,
    stock_status: "instock",
    average_rating: "5.0",
    rating_count: 56,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 14, src: imgComboBodyCare, name: "Body Care Set", alt: "Body Care Set" }],
    meta_data: []
  },
  {
    id: 115,
    name: "Centella Ampoule",
    slug: "centella-ampoule",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Soothing centella ampoule to calm sensitive skin barrier and hydrate skin cells.",
    short_description: "Calming centella ampoule for sensitive skin.",
    price: "75",
    regular_price: "90",
    sale_price: "75",
    on_sale: true,
    total_sales: 310,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 142,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 15, src: imgCentellaAmpoule, name: "Centella Ampoule", alt: "Centella Ampoule" }],
    meta_data: [
      { key: "skinConcerns", value: ["Irritation", "Redness"] },
      { key: "keyIngredients", value: ["Centella Asiatica Extract 100%"] }
    ]
  },
  {
    id: 116,
    name: "Hyaluronic Acid Serum",
    slug: "hyaluronic-acid-serum",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Ultra-hydrating hyaluronic acid serum for deep cellular moisture replenishment.",
    short_description: "Cellular moisture replenishing serum.",
    price: "65",
    regular_price: "65",
    sale_price: "",
    on_sale: false,
    total_sales: 220,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 98,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 16, src: imgHyaluronicAcidSerum, name: "Hyaluronic Acid Serum", alt: "Hyaluronic Acid Serum" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dehydration", "Dryness"] },
      { key: "keyIngredients", value: ["Hyaluronic Acid Complex"] }
    ]
  },
  {
    id: 117,
    name: "Cica Soothing Cream",
    slug: "cica-soothing-cream",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Calming cica cream to soothe dry irritated skin and strengthen moisture barrier.",
    short_description: "Barrier strengthening calming cream.",
    price: "80",
    regular_price: "95",
    sale_price: "80",
    on_sale: true,
    total_sales: 145,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 62,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 17, src: imgCicaSoothingCream, name: "Cica Soothing Cream", alt: "Cica Soothing Cream" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dryness", "Barrier repair"] },
      { key: "keyIngredients", value: ["Cica Extract", "Ceramides"] }
    ]
  },
  {
    id: 118,
    name: "Mugwort Wash Off Pack",
    slug: "mugwort-wash-off-pack",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Wash-off mask packed with real mugwort powder to soothe and clear skin complexion.",
    short_description: "Soothing wash-off mask with mugwort.",
    price: "110",
    regular_price: "130",
    sale_price: "110",
    on_sale: true,
    total_sales: 175,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 85,
    categories: [{ id: 10, name: "Treatments & Mask", slug: "treatments-mask" }],
    images: [{ id: 18, src: imgMugwortMask, name: "Mugwort Wash Off Pack", alt: "Mugwort Wash Off Pack" }],
    meta_data: [
      { key: "skinConcerns", value: ["Acne", "Redness"] },
      { key: "keyIngredients", value: ["Mugwort Powder", "Kaolin"] }
    ]
  },
  {
    id: 119,
    name: "AHA BHA Exfoliating Toner",
    slug: "aha-bha-exfoliating-toner",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Exfoliating toner formulated with AHA and BHA to smooth skin texture and clear pores.",
    short_description: "Pore clearing exfoliating toner.",
    price: "70",
    regular_price: "70",
    sale_price: "",
    on_sale: false,
    total_sales: 190,
    stock_status: "instock",
    average_rating: "4.6",
    rating_count: 73,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 19, src: imgAhaBhaToner, name: "AHA BHA Exfoliating Toner", alt: "AHA BHA Exfoliating Toner" }],
    meta_data: [
      { key: "skinConcerns", value: ["Textures", "Pores"] },
      { key: "keyIngredients", value: ["Glycolic Acid", "Salicylic Acid"] }
    ]
  },
  {
    id: 120,
    name: "Green Tea Seed Oil",
    slug: "green-tea-seed-oil",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Lightweight green tea seed oil providing deep nourishment and antioxidant care.",
    short_description: "Nourishing antioxidant facial oil.",
    price: "95",
    regular_price: "115",
    sale_price: "95",
    on_sale: true,
    total_sales: 92,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 51,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 20, src: imgGreenTeaOil, name: "Green Tea Seed Oil", alt: "Green Tea Seed Oil" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dullness", "Dryness"] },
      { key: "keyIngredients", value: ["Green Tea Seed Extract", "Tocopherol"] }
    ]
  },
  {
    id: 121,
    name: "Snail Mucin Essence",
    slug: "snail-mucin-essence",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Snail mucin power essence to hydrate, soothe, and repair damaged skin barrier.",
    short_description: "Hydrating and barrier repair essence.",
    price: "88",
    regular_price: "88",
    sale_price: "",
    on_sale: false,
    total_sales: 420,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 245,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 21, src: imgSnailMucinEssence, name: "Snail Mucin Essence", alt: "Snail Mucin Essence" }],
    meta_data: [
      { key: "skinConcerns", value: ["Barrier repair", "Acne scars"] },
      { key: "keyIngredients", value: ["Snail Secretion Filtrate 96%"] }
    ]
  },
  {
    id: 122,
    name: "Matte Liquid Lipstick",
    slug: "matte-liquid-lipstick",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Highly pigmented matte liquid lipstick for all-day smudge-proof coverage.",
    short_description: "Highly pigmented matte lip color.",
    price: "38",
    regular_price: "45",
    sale_price: "38",
    on_sale: true,
    total_sales: 380,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 168,
    categories: [{ id: 12, name: "Color Cosmetics", slug: "color-cosmetics" }],
    images: [{ id: 22, src: imgMatteLipstick, name: "Matte Liquid Lipstick", alt: "Matte Liquid Lipstick" }],
    meta_data: [
      { key: "finish", value: "Matte" },
      { key: "shades", value: [{ name: "Crimson Red", hex: "#8B0000" }, { name: "Nude Velvet", hex: "#BC8F8F" }] }
    ]
  },
  {
    id: 123,
    name: "Dewy Cushion Foundation",
    slug: "dewy-cushion-foundation",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Dewy cushion foundation that offers buildable light-to-medium coverage for a glassy finish.",
    short_description: "Glassy dewy cushion foundation.",
    price: "115",
    regular_price: "115",
    sale_price: "",
    on_sale: false,
    total_sales: 125,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 76,
    categories: [{ id: 13, name: "Face Makeup", slug: "face-makeup" }],
    images: [{ id: 23, src: imgCushionFoundation, name: "Dewy Cushion Foundation", alt: "Dewy Cushion Foundation" }],
    meta_data: [
      { key: "finish", value: "Dewy" }
    ]
  },
  {
    id: 124,
    name: "Vitamin E Nourishing Mask",
    slug: "vitamin-e-nourishing-mask",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Nourishing sheet mask infused with vitamin E to revitalize tired dull skin.",
    short_description: "Revitalizing vitamin E nourishing mask.",
    price: "90",
    regular_price: "110",
    sale_price: "90",
    on_sale: true,
    total_sales: 115,
    stock_status: "instock",
    average_rating: "4.6",
    rating_count: 54,
    categories: [{ id: 10, name: "Treatments & Mask", slug: "treatments-mask" }],
    images: [{ id: 24, src: imgVitaminEMask, name: "Vitamin E Nourishing Mask", alt: "Vitamin E Nourishing Mask" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dullness", "Anti-aging"] },
      { key: "keyIngredients", value: ["Vitamin E", "Ceramides"] }
    ]
  },
  {
    id: 125,
    name: "Glow Primer Spray",
    slug: "glow-primer-spray",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Preps the skin with a luminous base spray to extend makeup wear time.",
    short_description: "Luminous base makeup primer spray.",
    price: "55",
    regular_price: "55",
    sale_price: "",
    on_sale: false,
    total_sales: 210,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 92,
    categories: [{ id: 13, name: "Face Makeup", slug: "face-makeup" }],
    images: [{ id: 25, src: imgGlowPrimerSpray, name: "Glow Primer Spray", alt: "Glow Primer Spray" }],
    meta_data: [
      { key: "finish", value: "Luminous" }
    ]
  },
  {
    id: 126,
    name: "Velvet Lip Tint",
    slug: "velvet-lip-tint",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Soft velvet lip tint with airy texture and blur finish for daily wear.",
    short_description: "Airy texture velvet lip tint.",
    price: "35",
    regular_price: "40",
    sale_price: "35",
    on_sale: true,
    total_sales: 470,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 184,
    categories: [{ id: 12, name: "Color Cosmetics", slug: "color-cosmetics" }],
    images: [{ id: 26, src: imgVelvetLipTint, name: "Velvet Lip Tint", alt: "Velvet Lip Tint" }],
    meta_data: [
      { key: "finish", value: "Velvet" },
      { key: "shades", value: [{ name: "Peach Coral", hex: "#FF7F50" }, { name: "Rose Wood", hex: "#CD5C5C" }] }
    ]
  },
  {
    id: 127,
    name: "Rosewater Hydration Mist",
    slug: "rosewater-hydration-mist",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Soothing rosewater mist providing instant hydration and refreshment for dry skin.",
    short_description: "Soothing hydrating rosewater mist.",
    price: "40",
    regular_price: "40",
    sale_price: "",
    on_sale: false,
    total_sales: 165,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 82,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 27, src: imgRosewaterMist, name: "Rosewater Hydration Mist", alt: "Rosewater Hydration Mist" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dryness", "Dullness"] },
      { key: "keyIngredients", value: ["Organic Rosewater", "Glycerin"] }
    ]
  },
  {
    id: 128,
    name: "Clay Pore Purifying Mask",
    slug: "clay-pore-purifying-mask",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Deep cleansing clay mask designed to remove oil and purify clogged pore channels.",
    short_description: "Deep cleansing pore purifying clay mask.",
    price: "100",
    regular_price: "120",
    sale_price: "100",
    on_sale: true,
    total_sales: 180,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 94,
    categories: [{ id: 10, name: "Treatments & Mask", slug: "treatments-mask" }],
    images: [{ id: 28, src: imgClayPoreMask, name: "Clay Pore Purifying Mask", alt: "Clay Pore Purifying Mask" }],
    meta_data: [
      { key: "skinConcerns", value: ["Pores", "Sebum control"] },
      { key: "keyIngredients", value: ["Bentonite Clay", "Charcoal Powder"] }
    ]
  },
  {
    id: 129,
    name: "Retinol Night Cream",
    slug: "retinol-night-cream",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Anti-aging retinol night cream to reduce wrinkles, boost collagen, and smooth skin texture.",
    short_description: "Anti-aging night cream with retinol.",
    price: "135",
    regular_price: "160",
    sale_price: "135",
    on_sale: true,
    total_sales: 290,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 118,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 29, src: imgCream, name: "Retinol Night Cream", alt: "Retinol Night Cream" }],
    meta_data: [
      { key: "skinConcerns", value: ["Anti-aging", "Textures"] },
      { key: "keyIngredients", value: ["Retinol 0.1%", "Adenosine"] }
    ]
  },
  {
    id: 130,
    name: "Nourishing Body Wash",
    slug: "nourishing-body-wash",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Calming body wash with botanical extracts for deep hydration and clean feeling skin.",
    short_description: "Calming botanical body wash.",
    price: "60",
    regular_price: "60",
    sale_price: "",
    on_sale: false,
    total_sales: 120,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 48,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 30, src: imgComboBodyCare, name: "Nourishing Body Wash", alt: "Nourishing Body Wash" }],
    meta_data: []
  },
  {
    id: 131,
    name: "Revitalizing Body Lotion",
    slug: "revitalizing-body-lotion",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Moisture locking body lotion with nourishing lipids for sensitive skin barriers.",
    short_description: "Moisture locking revitalizing body lotion.",
    price: "70",
    regular_price: "85",
    sale_price: "70",
    on_sale: true,
    total_sales: 140,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 53,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 31, src: imgComboBodyCare, name: "Revitalizing Body Lotion", alt: "Revitalizing Body Lotion" }],
    meta_data: []
  },
  {
    id: 132,
    name: "Satin Finish Blush",
    slug: "satin-finish-blush",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Weightless powder blush that delivers a natural flush with a soft satin finish.",
    short_description: "Weightless satin powder blush.",
    price: "48",
    regular_price: "48",
    sale_price: "",
    on_sale: false,
    total_sales: 195,
    stock_status: "instock",
    average_rating: "4.8",
    rating_count: 86,
    categories: [{ id: 12, name: "Color Cosmetics", slug: "color-cosmetics" }],
    images: [{ id: 32, src: imgYouMightLikeBlush, name: "Satin Finish Blush", alt: "Satin Finish Blush" }],
    meta_data: [
      { key: "finish", value: "Satin" }
    ]
  },
  {
    id: 133,
    name: "Waterproof Mascara",
    slug: "waterproof-mascara",
    type: "simple",
    status: "publish",
    featured: false,
    description: "Volumizing waterproof mascara that lasts all day without flaking or smudging.",
    short_description: "Volumizing waterproof mascara.",
    price: "32",
    regular_price: "40",
    sale_price: "32",
    on_sale: true,
    total_sales: 320,
    stock_status: "instock",
    average_rating: "4.7",
    rating_count: 104,
    categories: [{ id: 12, name: "Color Cosmetics", slug: "color-cosmetics" }],
    images: [{ id: 33, src: imgMakeupHover5, name: "Waterproof Mascara", alt: "Waterproof Mascara" }],
    meta_data: [
      { key: "finish", value: "Waterproof" }
    ]
  },
  {
    id: 134,
    name: "Under-eye Brightening Cream",
    slug: "under-eye-brightening-cream",
    type: "simple",
    status: "publish",
    featured: true,
    description: "Nourishing eye cream to reduce dark circles, smooth fine lines, and puffiness.",
    short_description: "Nourishing under-eye brightening cream.",
    price: "68",
    regular_price: "68",
    sale_price: "",
    on_sale: false,
    total_sales: 235,
    stock_status: "instock",
    average_rating: "4.9",
    rating_count: 112,
    categories: [{ id: 11, name: "Daily Essentials", slug: "daily-essentials" }],
    images: [{ id: 34, src: imgCream, name: "Under-eye Brightening Cream", alt: "Under-eye Brightening Cream" }],
    meta_data: [
      { key: "skinConcerns", value: ["Dullness", "Anti-aging"] },
      { key: "keyIngredients", value: ["Caffeine", "Peptides"] }
    ]
  }
];

/**
 * Maps a WooCommerce API product response to the format expected by the frontend UI.
 */
export function mapWooCommerceProductToFrontend(wpProduct: WooCommerceProduct): FrontendProduct {
  const meta = (key: string) => wpProduct.meta_data.find((m) => m.key === key)?.value;

  const priceNum = parseFloat(wpProduct.price || "0");
  const regularPriceNum = parseFloat(wpProduct.regular_price || "0");
  const discountStr = wpProduct.on_sale && regularPriceNum > priceNum
    ? `-${Math.round(((regularPriceNum - priceNum) / regularPriceNum) * 100)}%`
    : undefined;
