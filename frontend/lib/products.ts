import type { StaticImageData } from "next/image";

// Image Imports
import imgSerum from "@/images/Radiance Pink Serum.png";
import imgCream from "@/images/vitaminc.png";
import imgLipGloss from "@/images/lip_gloss.png";
import imgFloralBox from "@/images/floralbox.png";
import imgFloralShampoo from "@/images/floralshampoo.png";
import imgFloralSoap from "@/images/floralsoap.png";
import imgHydration from "@/images/magnific_create-a-premium-lilaa-hy_2981158217 1.png";
import imgBrightening from "@/images/magnific_create-a-premium-lilaa-br_2981302769 1.png";
import imgComboMakeup from "@/images/ChatGPT Image May 14, 2026, 05_32_30 PM 1.png";
import imgComboBodyCare from "@/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png";
import imgPhoto from "@/images/Photo.png";

export type ImageSource = StaticImageData | string;

export class Product {
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
  expiresOn: string;
  
  // Callout features for the "About the Product" section
  features: Array<{
    badge: string;
    title: string;
    description: string;
    // relative SVG coordinates (0-100)
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;

  constructor(data: {
    id: string;
    slug: string;
    name: string;
    description: string;
    image: ImageSource;
    price: number;
    originalPrice?: number;
    discount?: string;
    rating?: number;
    reviews?: number;
    category?: string;
    expiresOn?: string;
    features?: Product["features"];
  }) {
    this.id = data.id;
    this.slug = data.slug;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this.price = data.price;
    this.originalPrice = data.originalPrice;
    this.discount = data.discount;
    this.rating = data.rating ?? 4.8;
    this.reviews = data.reviews ?? 108;
    this.category = data.category ?? "General";
    this.expiresOn = data.expiresOn ?? "28/12/2027";
    this.features = data.features ?? [];
  }
}

export class SkincareProduct extends Product {
  skinConcerns: string[];
  keyIngredients: string[];

  constructor(data: {
    id: string;
    slug: string;
    name: string;
    description: string;
    image: ImageSource;
    price: number;
    originalPrice?: number;
    discount?: string;
    rating?: number;
    reviews?: number;
    category?: string;
    expiresOn?: string;
    features?: Product["features"];
    skinConcerns?: string[];
    keyIngredients?: string[];
  }) {
    super(data);
    this.skinConcerns = data.skinConcerns ?? ["General glow"];
    this.keyIngredients = data.keyIngredients ?? ["Water", "Glycerin"];
    this.category = data.category ?? "Skin";

    // Set dynamic default skincare features if not provided
    if (this.features.length === 0) {
      this.features = [
        {
          badge: "Hydration",
          title: "Moisture Barrier",
          description: "Strengthens and locks in natural hydration throughout the day.",
          x1: 20, y1: 26, x2: 45, y2: 35
        },
        {
          badge: "Formula",
          title: "Lush Essence",
          description: "Packed with active botanical extracts to brighten and restore.",
          x1: 32, y1: 80, x2: 48, y2: 65
        },
        {
          badge: "Testing",
          title: "Dermatologist Tested",
          description: "Non-comedogenic formulation suitable for even sensitive skin.",
          x1: 80, y1: 36, x2: 56, y2: 48
        }
      ];
    }
  }
}

export class MakeupProduct extends Product {
  finish: string;
  applicator: string;
  shades: Array<{ name: string; hex: string }>;

  constructor(data: {
    id: string;
    slug: string;
    name: string;
    description: string;
    image: ImageSource;
    price: number;
    originalPrice?: number;
    discount?: string;
    rating?: number;
    reviews?: number;
    category?: string;
    expiresOn?: string;
    features?: Product["features"];
    finish?: string;
    applicator?: string;
    shades?: Array<{ name: string; hex: string }>;
  }) {
    super(data);
    this.finish = data.finish ?? "Natural Dewy";
    this.applicator = data.applicator ?? "Precision applicator";
    this.shades = data.shades ?? [
      { name: "Rose", hex: "#E85A4F" },
      { name: "Peach", hex: "#F4A261" },
      { name: "Nude", hex: "#E9C46A" },
      { name: "Coral", hex: "#D46B7A" },
    ];
    this.category = data.category ?? "Makeup";

    // Set dynamic default makeup features if not provided
    if (this.features.length === 0) {
      this.features = [
        {
          badge: "Applicator",
          title: "Doe foot applicator",
          description: "Precise shape makes it easy to apply on cheeks or lips.",
          x1: 20, y1: 26, x2: 45, y2: 35
        },
        {
          badge: "Texture",
          title: "Buildable Finish",
          description: "Sheer buildable coverage that layers beautifully without smudging.",
          x1: 32, y1: 80, x2: 48, y2: 65
        },
        {
          badge: "Testing",
          title: "Smudge Proof",
          description: "Won't smudge or transfer, no matter what it comes up against.",
          x1: 80, y1: 36, x2: 56, y2: 48
        }
      ];
    }
  }
}

// Instantiate All Products
export const UNIVERSAL_PRODUCTS: Product[] = [
  new SkincareProduct({
    id: "red-bean-refreshing-pore-mask",
    slug: "red-bean-refreshing-pore-mask",
    name: "Red Bean Refreshing pore mask",
    description: "Beauty of Joseon Red Bean Mask with 30% red bean and kaolin washes away excess sebum. exfoliates for bright, clean, and refreshed skin.",
    image: imgPhoto,
    price: 120,
    originalPrice: 150,
    rating: 4.8,
    reviews: 108,
    category: "Treatments & Mask",
    skinConcerns: ["Pore tightening", "Sebum control"],
    keyIngredients: ["Red Bean Extract 30%", "Kaolin Clay"],
    features: [
      {
        badge: "Pores",
        title: "Sebum Absorption",
        description: "Kaolin clay draws out deep-rooted impurities and oil.",
        x1: 20, y1: 26, x2: 45, y2: 35
      },
      {
        badge: "Exfoliation",
        title: "Red Bean Scrub",
        description: "Mild red bean powder particles gently buff away dead cells.",
        x1: 32, y1: 80, x2: 48, y2: 65
      },
      {
        badge: "Soothing",
        title: "Cooling Texture",
        description: "Soft clay formula provides refreshing hydration to skin.",
        x1: 80, y1: 36, x2: 56, y2: 48
      }
    ]
  }),
  new SkincareProduct({
    id: "radiance-pink-serum",
    slug: "radiance-pink-serum",
    name: "Radiance Pink Serum",
    description: "Hydrating serum for a glowing, luminous complexion.",
    image: imgSerum,
    price: 120,
    originalPrice: 150,
    discount: "-30%",
    rating: 5.0,
    reviews: 124,
    category: "Daily Essentials",
    skinConcerns: ["Dullness", "Dryness"],
    keyIngredients: ["Pink Pearl Extract", "Niacinamide"],
    features: [
      {
        badge: "Glow",
        title: "Radiant Finish",
        description: "Leaves a soft pink pearl glow on the skin immediately.",
        x1: 20, y1: 26, x2: 45, y2: 35
      },
      {
        badge: "Moisture",
        title: "Deep Hydration",
        description: "Infuses multi-weight hyaluronic acid into dry cells.",
        x1: 32, y1: 80, x2: 48, y2: 65
      },
      {
        badge: "Barrier",
        title: "Niacinamide Boost",
        description: "Strengthens skin structure to resist pigmentation.",
        x1: 80, y1: 36, x2: 56, y2: 48
      }
    ]
  }),
  new SkincareProduct({
    id: "vitamin-c-cream",
    slug: "vitamin-c-cream",
    name: "Vitamin C",
    description: "Brightening vitamin C cream for daily skin glow and protection.",
    image: imgCream,
    price: 85,
    rating: 4.8,
    reviews: 89,
    category: "Daily Essentials",
    skinConcerns: ["Brightening", "Anti-aging"],
    keyIngredients: ["Pure Vitamin C", "Adenosine"],
  }),
  new MakeupProduct({
    id: "lip-gloss",
    slug: "lip-gloss",
    name: "Lip Gloss",
    description: "High-shine lip gloss with metallic tint and hydration.",
    image: imgLipGloss,
    price: 45,
    originalPrice: 50,
    discount: "-10%",
    rating: 4.9,
    reviews: 210,
    category: "Color Cosmetics",
    finish: "High Gloss",
    applicator: "Flocked Doe-foot",
    shades: [
      { name: "Ruby Glow", hex: "#9B2226" },
      { name: "Pink Shimmer", hex: "#D46B7A" },
      { name: "Clear Glass", hex: "#E9C46A" }
    ]
  }),
  new MakeupProduct({
    id: "floral-box",
    slug: "floral-box",
    name: "Floral Box",
    description: "Exclusive floral packaging set containing lip tint and primer.",
    image: imgFloralBox,
    price: 200,
    rating: 5.0,
    reviews: 56,
    category: "Face Makeup"
  }),
  new SkincareProduct({
    id: "floral-shampoo",
    slug: "floral-shampoo",
    name: "Floral Shampoo",
    description: "Nourishing floral shampoo for shiny, healthy hair.",
    image: imgFloralShampoo,
    price: 180,
    originalPrice: 200,
    discount: "-10%",
    rating: 4.7,
    reviews: 42,
    category: "Daily Essentials"
  }),
  new SkincareProduct({
    id: "floral-soap",
    slug: "floral-soap",
    name: "Floral Soap",
    description: "Gentle cleansing soap with calming floral botanicals.",
    image: imgFloralSoap,
    price: 90,
    rating: 4.9,
    reviews: 150,
    category: "Daily Essentials"
  }),
  new SkincareProduct({
    id: "ceo-afterglow-vitamin-c-serum",
    slug: "ceo-afterglow-vitamin-c-serum",
    name: "Ceo afterglow brightening vitamin C Serum",
    description: "Limited-time brightening serum with vitamin C and anti-oxidants.",
    image: imgComboMakeup,
    price: 120,
    originalPrice: 150,
    discount: "-30%",
    skinConcerns: ["Acne scars", "Brightening"],
    keyIngredients: ["THD Ascorbate", "Turmeric Extract"]
  }),
  new SkincareProduct({
    id: "radiance-pink-daily-serum",
    slug: "radiance-pink-daily-serum",
    name: "Radiance Pink Hydrating Daily Serum",
    description: "Hydration-focused daily serum for radiant skin.",
    image: imgComboBodyCare,
    price: 85,
    originalPrice: 100,
    discount: "-15%",
    skinConcerns: ["Dryness", "Dehydration"]
  }),
  new SkincareProduct({
    id: "soft-glam-facial-oil",
    slug: "soft-glam-facial-oil",
    name: "Soft Glam Nourishing Facial Oil",
    description: "Nourishing facial oil for a smooth, glowing finish.",
    image: imgHydration,
    price: 90,
    originalPrice: 120,
    discount: "-25%",
  }),
  new SkincareProduct({
    id: "hydration-ritual-set",
    slug: "hydration-ritual-set",
    name: "Hydration Ritual Set",
    description: "A full hydration routine set built for dry skin barriers.",
    image: imgHydration,
    price: 120,
    originalPrice: 150,
    discount: "-30%",
    rating: 5.0,
    reviews: 124,
    category: "Daily Essentials"
  }),
  new SkincareProduct({
    id: "brightening-glow-set",
    slug: "brightening-glow-set",
    name: "Brightening & Glow Set",
    description: "A complete brightening routine set for luminous tone.",
    image: imgBrightening,
    price: 85,
    rating: 4.8,
    reviews: 89,
    category: "Daily Essentials"
  }),
  new MakeupProduct({
    id: "soft-glam-makeup-set",
    slug: "soft-glam-makeup-set",
    name: "Soft Glam Makeup Set",
    description: "Soft-focus makeup essentials including concealer and blush.",
    image: imgComboMakeup,
    price: 45,
    rating: 4.9,
    reviews: 210,
    category: "Face Makeup"
  }),
  new SkincareProduct({
    id: "body-care-set",
    slug: "body-care-set",
    name: "Body Care Set",
    description: "Body care wash and body lotion set for a calming ritual.",
    image: imgComboBodyCare,
    price: 200,
    rating: 5.0,
    reviews: 56,
    category: "Daily Essentials"
  })
];

export function getProductBySlugOOP(slug: string): Product | null {
  return UNIVERSAL_PRODUCTS.find((p) => p.slug === slug) ?? null;
}
