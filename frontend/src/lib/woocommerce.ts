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