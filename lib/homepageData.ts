import type { StaticImageData } from "next/image";

import type { HeroConfig } from "@/components/home/HeroSwitcher";

import heroPortraitImage from "@/images/hero2_1.png";
import heroProductImage from "@/images/hero2_2.png";
import imgDaily from "@/images/daily.png";
import imgTreatments from "@/images/treatment.png";
import imgMakeup from "@/images/facemakeup.png";
import imgColor from "@/images/colorcosmetics.png";
import imgSerum from "@/images/Radiance Pink Serum.png";
import imgCream from "@/images/vitaminc.png";
import imgLipGloss from "@/images/lip_gloss.png";
import imgFloralBox from "@/images/floralbox.png";
import imgFloralShampoo from "@/images/floralshampoo.png";
import imgFloralSoap from "@/images/floralsoap.png";
import imgBackground from "@/images/background.png";
import imgHydration from "@/images/magnific_create-a-premium-lilaa-hy_2981158217 1.png";
import imgBrightening from "@/images/magnific_create-a-premium-lilaa-br_2981302769 1.png";
import imgComboMakeup from "@/images/ChatGPT Image May 14, 2026, 05_32_30 PM 1.png";
import imgComboBodyCare from "@/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png";
import imgAcne from "@/images/close-up-woman-with-acne-posing 1.png";
import imgPigmentation from "@/images/image 193.png";
import imgAging from "@/images/image 194.png";
import imgDryness from "@/images/close-up-skin-pores-face-care-routine 1.png";
import imgDamaged from "@/images/close-up-beautiful-woman-portrait 1.png";
import imgPhoto from "@/images/Photo.png";

export type ImageSource = StaticImageData | string;

export type CommerceProduct = {
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
  featured?: boolean;
};

export type HomeSectionLink = {
  label: string;
  href: string;
};

export type HomePageData = {
  announcementBarText: string;
  navLinks: HomeSectionLink[];
  heroSlides: HeroConfig[];
  frame19Categories: Array<{
    title: string;
    image: ImageSource;
    alt: string;
    href: string;
  }>;
  bestSellers: CommerceProduct[];
  dealOfTheDay: {
    title: string;
    products: CommerceProduct[];
  };
  discoverCombos: {
    title: string;
    products: CommerceProduct[];
  };
  skinConcerns: Array<{
    label: string;
    image: ImageSource;
    href: string;
  }>;
  trustBadges: Array<{
    line1: string;
    line2: string;
  }>;
  footer: {
    newsletterTitle: string;
    columns: Array<{
      title: string;
      links: HomeSectionLink[];
    }>;
  };
};

const LOCAL_HOME_PAGE_DATA: HomePageData = {
  announcementBarText: "Free Delivery on orders above $100!",
  navLinks: [
    { href: "/#home", label: "Home" },
    { href: "/#skin", label: "Skin" },
    { href: "/#makeup", label: "Makeup" },
    { href: "/#about", label: "About Us" },
  ],
  heroSlides: [
    {
      id: 1,
      layoutType: "text",
      titleLines: ["Because every skin", "deserves care."],
      description: "Explore lush formulas designed for every tone and texture.",
      backgroundImage:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/women-posing-with-self-love-her-body%201-y6SDjvPIomR8ekAwIR7vUaFNOexzZ2.png",
      backgroundAlt: "Two women embracing natural beauty",
      backgroundColor: "bg-[#D3D3D3]",
    },
    {
      id: 2,
      layoutType: "image",
      portraitImage: heroPortraitImage,
      portraitAlt: "Skin care routine close-up",
      productImage: heroProductImage,
      productAlt: "Skincare product",
      backgroundColor: "bg-white",
    },
  ],
  frame19Categories: [
    {
      title: "Daily Essentials",
      image: imgDaily,
      alt: "Daily essentials skincare product",
      href: "/shop/daily-essentials",
    },
    {
      title: "Treatments & Mask",
      image: imgTreatments,
      alt: "Skincare treatment dropper bottle",
      href: "/shop/treatments-mask",
    },
    {
      title: "Face Makeup",
      image: imgMakeup,
      alt: "Face makeup product",
      href: "/shop/face-makeup",
    },
    {
      title: "Color Cosmetics",
      image: imgColor,
      alt: "Color cosmetics bottle",
      href: "/shop/color-cosmetics",
    },
  ],
  bestSellers: [
    {
      id: "radiance-pink-serum",
      slug: "radiance-pink-serum",
      name: "Radiance Pink Serum",
      description: "Hydrating serum for a glowing complexion.",
      image: imgSerum,
      price: 120,
      originalPrice: 150,
      discount: "-30%",
      rating: 5.0,
      reviews: 124,
      featured: true,
    },
    {
      id: "vitamin-c-cream",
      slug: "vitamin-c-cream",
      name: "Vitamin C",
      description: "Brightening vitamin C cream for daily glow.",
      image: imgCream,
      price: 85,
      rating: 4.8,
      reviews: 89,
      featured: true,
    },
    {
      id: "lip-gloss",
      slug: "lip-gloss",
      name: "Lip Gloss",
      description: "High-shine lip gloss with metallic tint.",
      image: imgLipGloss,
      price: 45,
      originalPrice: 50,
      discount: "-10%",
      rating: 4.9,
      reviews: 210,
      featured: true,
    },
    {
      id: "floral-box",
      slug: "floral-box",
      name: "Floral Box",
      description: "Exclusive floral packaging for luxury skincare.",
      image: imgFloralBox,
      price: 200,
      rating: 5.0,
      reviews: 56,
    },
    {
      id: "floral-shampoo",
      slug: "floral-shampoo",
      name: "Floral Shampoo",
      description: "Nourishing floral shampoo for silky hair.",
      image: imgFloralShampoo,
      price: 180,
      originalPrice: 200,
      discount: "-10%",
      rating: 4.7,
      reviews: 42,
    },
    {
      id: "floral-soap",
      slug: "floral-soap",
      name: "Floral Soap",
      description: "Gentle cleansing floral soap for soft skin.",
      image: imgFloralSoap,
      price: 90,
      rating: 4.9,
      reviews: 150,
    },
  ],
  dealOfTheDay: {
    title: "Deal Of The day",
    products: [
      {
        id: "ceo-afterglow-vitamin-c-serum",
        slug: "ceo-afterglow-vitamin-c-serum",
        name: "Ceo afterglow brightening vitamin C Serum",
        description: "Limited-time brightening serum with vitamin C.",
        image: imgComboMakeup,
        price: 120,
        originalPrice: 150,
        discount: "-30%",
      },
      {
        id: "radiance-pink-daily-serum",
        slug: "radiance-pink-daily-serum",
        name: "Radiance Pink Hydrating Daily Serum",
        description: "Hydration-focused daily serum for luminous skin.",
        image: imgComboBodyCare,
        price: 85,
        originalPrice: 100,
        discount: "-15%",
      },
      {
        id: "soft-glam-facial-oil",
        slug: "soft-glam-facial-oil",
        name: "Soft Glam Nourishing Facial Oil",
        description: "Nourishing facial oil for a smooth finish.",
        image: imgHydration,
        price: 90,
        originalPrice: 120,
        discount: "-25%",
      },
    ],
  },
  discoverCombos: {
    title: "Discover Our Combos",
    products: [
      {
        id: "hydration-ritual-set",
        slug: "hydration-ritual-set",
        name: "Hydration Ritual Set",
        description: "A full hydration routine built for dry skin.",
        image: imgHydration,
        price: 120,
        originalPrice: 150,
        discount: "-30%",
        rating: 5.0,
        reviews: 124,
      },
      {
        id: "brightening-glow-set",
        slug: "brightening-glow-set",
        name: "Brightening & Glow Set",
        description: "A complete brightening routine for radiant skin.",
        image: imgBrightening,
        price: 85,
        rating: 4.8,
        reviews: 89,
      },
      {
        id: "soft-glam-makeup-set",
        slug: "soft-glam-makeup-set",
        name: "Soft Glam Makeup Set",
        description: "Soft-focus makeup essentials for everyday wear.",
        image: imgComboMakeup,
        price: 45,
        rating: 4.9,
        reviews: 210,
      },
      {
        id: "body-care-set",
        slug: "body-care-set",
        name: "Body Care Set",
        description: "Body care products for a calm skin ritual.",
        image: imgComboBodyCare,
        price: 200,
        rating: 5.0,
        reviews: 56,
      },
    ],
  },
  skinConcerns: [
    { label: "Acne", image: imgAcne, href: "/shop/acne" },
    { label: "Pigmentation", image: imgPigmentation, href: "/shop/pigmentation" },
    { label: "Signs of aging", image: imgAging, href: "/shop/anti-aging" },
    { label: "Extreme dryness", image: imgDryness, href: "/shop/dry-skin" },
    { label: "Damaged barrier", image: imgDamaged, href: "/shop/barrier-repair" },
  ],
  trustBadges: [
    { line1: "Clinically", line2: "Tested" },
    { line1: "Cruelty", line2: "Free" },
    { line1: "Vegan", line2: "Products" },
    { line1: "Clean", line2: "ingredients" },
  ],
  footer: {
    newsletterTitle: "Be the first one to know about the updates!",
    columns: [
      {
        title: "Shop by category",
        links: [
          { label: "Daily Essentials", href: "/shop/daily-essentials" },
          { label: "Treatments & Mask", href: "/shop/treatments-mask" },
          { label: "Face Makeup", href: "/shop/face-makeup" },
          { label: "Color cosmetics", href: "/shop/color-cosmetics" },
        ],
      },
      {
        title: "Shop",
        links: [
          { label: "Shop All", href: "/shop" },
          { label: "Bestsellers", href: "/shop/bestsellers" },
          { label: "Face", href: "/shop/face" },
          { label: "Eyes", href: "/shop/eyes" },
          { label: "Lips", href: "/shop/lips" },
        ],
      },
      {
        title: "Customer Care",
        links: [
          { label: "About Us", href: "/about" },
          { label: "Contact Us", href: "/contact" },
          { label: "FAQs", href: "/faqs" },
          { label: "Shipping Policy", href: "/shipping-policy" },
          { label: "Return & Refund Policy", href: "/returns" },
          { label: "Terms & Conditions", href: "/terms" },
        ],
      },
    ],
  },
};

function getWordPressApiUrl(path: string) {
  const baseUrl = process.env.WORDPRESS_API_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return new URL(path.replace(/^\//, ""), normalizedBaseUrl);
}

async function fetchWordPressJson<T>(path: string): Promise<T | null> {
  const url = getWordPressApiUrl(path);

  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type WordPressProduct = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  discount?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  featured?: boolean;
};

type WordPressHomepagePayload = {
  announcementBarText?: string;
  navLinks?: HomeSectionLink[];
  heroSlides?: HeroConfig[];
  frame19Categories?: HomePageData["frame19Categories"];
  bestSellers?: WordPressProduct[];
  dealOfTheDay?: {
    title?: string;
    products?: WordPressProduct[];
  };
  discoverCombos?: {
    title?: string;
    products?: WordPressProduct[];
  };
  skinConcerns?: HomePageData["skinConcerns"];
  trustBadges?: HomePageData["trustBadges"];
  footer?: HomePageData["footer"];
};

function toProduct(product: WordPressProduct, fallback: CommerceProduct): CommerceProduct {
  return {
    ...fallback,
    id: product.id ?? fallback.id,
    slug: product.slug ?? fallback.slug,
    name: product.name ?? fallback.name,
    description: product.description ?? fallback.description,
    image: product.image ?? fallback.image,
    price: product.price ?? fallback.price,
    originalPrice: product.originalPrice ?? fallback.originalPrice,
    discount: product.discount ?? fallback.discount,
    rating: product.rating ?? fallback.rating,
    reviews: product.reviews ?? fallback.reviews,
    category: product.category ?? fallback.category,
    featured: product.featured ?? fallback.featured,
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/api/homepage/`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as HomePageData;
      return data;
    }
  } catch (err) {
    console.error("Failed to fetch homepage data from Django, using local fallback:", err);
  }

  return LOCAL_HOME_PAGE_DATA;
}

import { getProductBySlugOOP } from "./products";

export async function getProductBySlug(slug: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/api/products/${slug}/`, {
      cache: "no-store",
    });
    if (res.ok) {
      const product = await res.json();
      return {
        ...product,
        features: product.features_json || []
      } as unknown as CommerceProduct;
    }
  } catch (err) {
    console.error("Failed to fetch product by slug from Django:", err);
  }

  const oopProduct = getProductBySlugOOP(slug);
  if (oopProduct) {
    return oopProduct;
  }

  return null;
}
