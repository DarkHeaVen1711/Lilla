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