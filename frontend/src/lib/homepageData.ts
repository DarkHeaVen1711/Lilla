import type { StaticImageData } from "next/image";
import type { HeroConfig } from "@/components/home/HeroSwitcher";
import {
  getProducts,
  getProductBySlug as getProductBySlugWc,
  mapDjangoProductToFrontend,
  fetchWithTimeout,
} from "./woocommerce";



export type ImageSource = StaticImageData | string;

export type Testimonial = {
  id: string;
  name: string;
  avatar: ImageSource;
  rating: number;
  text: string;
  productSlug: string;
};

export type NewsPost = {
  id: string;
  category: string;
  title: string;
  image: ImageSource;
  slug: string;
};

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
  expiresOn?: string;
  features?: Array<{
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
  finish?: string;
  applicator?: string;
  shades?: Array<{ name: string; hex: string }>;
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
  featuredProducts: CommerceProduct[];
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
  testimonials: Testimonial[];
  latestNews: NewsPost[];
  footer: {
    newsletterTitle: string;
    columns: Array<{
      title: string;
      links: HomeSectionLink[];
    }>;
  };
};

const LOCAL_HOME_PAGE_DATA = {
  announcementBarText: "Free Delivery on orders above $100!",
  navLinks: [
    { href: "/#home", label: "Home" },
    { href: "/skin", label: "Skin" },
    { href: "/makeup", label: "Makeup" },
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
      backgroundColor: "bg-brand-bg-hero-default",
    },
    {
      id: 2,
      layoutType: "image",
      portraitImage: "/images/hero2_1.png",
      portraitAlt: "Skin care routine close-up",
      productImage: "/images/hero2_2.png",
      productAlt: "Skincare product",
      backgroundColor: "bg-white",
    },
  ],
  frame19Categories: [
    {
      title: "Daily Essentials",
      image: "/images/daily.png",
      alt: "Daily essentials skincare product",
      href: "/shop/daily-essentials",
    },
    {
      title: "Treatments & Mask",
      image: "/images/treatment.png",
      alt: "Skincare treatment dropper bottle",
      href: "/shop/treatments-mask",
    },
    {
      title: "Face Makeup",
      image: "/images/facemakeup.png",
      alt: "Face makeup product",
      href: "/shop/face-makeup",
    },
    {
      title: "Color Cosmetics",
      image: "/images/colorcosmetics.png",
      alt: "Color cosmetics bottle",
      href: "/shop/color-cosmetics",
    },
  ],
  skinConcerns: [
    { label: "Acne", image: "/images/close-up-woman-with-acne-posing 1.png", href: "/shop/acne" },
    {
      label: "Pigmentation",
      image: "/images/image 193.png",
      href: "/shop/pigmentation",
    },
    { label: "Signs of aging", image: "/images/image 194.png", href: "/shop/anti-aging" },
    { label: "Extreme dryness", image: "/images/close-up-skin-pores-face-care-routine 1.png", href: "/shop/dry-skin" },
    {
      label: "Damaged barrier",
      image: "/images/close-up-beautiful-woman-portrait 1.png",
      href: "/shop/barrier-repair",
    },
  ],
  trustBadges: [
    { line1: "Clinically", line2: "Tested" },
    { line1: "Cruelty", line2: "Free" },
    { line1: "Vegan", line2: "Products" },
    { line1: "Clean", line2: "ingredients" },
  ],
  testimonials: [
    {
      id: "t1",
      name: "Liana Jade",
      avatar: "/images/avatar_liana_jade.png",
      rating: 5,
      text: "it works so faster, literally saw difference in a week, Best gel if you have dull skin.",
      productSlug: "ceo-afterglow-vitamin-c-serum"
    },
    {
      id: "t2",
      name: "Sarah Miller",
      avatar: "/images/avatar_sarah_miller.png",
      rating: 5,
      text: "it works so faster, literally saw difference in a week, Best gel if you have dull skin.",
      productSlug: "ceo-afterglow-vitamin-c-serum"
    },
    {
      id: "t3",
      name: "Emily Chen",
      avatar: "/images/avatar_emily_chen.png",
      rating: 5,
      text: "it works so faster, literally saw difference in a week, Best gel if you have dull skin.",
      productSlug: "ceo-afterglow-vitamin-c-serum"
    }
  ],
  latestNews: [
    {
      id: "n1",
      category: "SKIN CARE",
      title: "How to transform your skin from dull to glowing.",
      image: "/images/Latest_News_1.png",
      slug: "transform-dull-skin"
    },
    {
      id: "n2",
      category: "SELF CARE",
      title: "How diet plays a vital role in improving your skin health.",
      image: "/images/Latest_News_2.png",
      slug: "diet-skin-health"
    }
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

export async function getHomePageData(): Promise<HomePageData> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/homepage/`, { cache: "no-store" }, 5000);
    if (!res.ok) {
      throw new Error(`Failed to fetch homepage data: ${res.statusText}`);
    }
    const data = await res.json();
    
    // Map backend products to frontend format
    const bestSellers = (data.bestSellers || []).map(mapDjangoProductToFrontend);
    const dealProducts = (data.dealOfTheDay?.products || []).map(mapDjangoProductToFrontend);
    const comboProducts = (data.discoverCombos?.products || []).map(mapDjangoProductToFrontend);
    
    return {
      ...LOCAL_HOME_PAGE_DATA,
      ...data,
      bestSellers,
      dealOfTheDay: {
        title: data.dealOfTheDay?.title || "Deal Of The day",
        products: dealProducts,
      },
      discoverCombos: {
        title: data.discoverCombos?.title || "Discover Our Combos",
        products: comboProducts,
      },
      featuredProducts: bestSellers.slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching live homepage data, falling back:", error);
    
    // Fallback logic
    const allProducts = await getProducts();
    const bestSellers = allProducts.filter((p) => p.rating >= 4.8).slice(0, 6);
    const dealOfTheDayProducts = allProducts.slice(7, 10);
    const comboProducts = allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes("set") ||
          p.name.toLowerCase().includes("box"),
      )
      .slice(0, 4);

    return {
      ...LOCAL_HOME_PAGE_DATA,
      bestSellers,
      dealOfTheDay: {
        title: "Deal Of The day",
        products:
          dealOfTheDayProducts.length > 0
            ? dealOfTheDayProducts
            : allProducts.slice(0, 3),
      },
      featuredProducts: allProducts.filter(p => p.featured).slice(0, 5),
      discoverCombos: {
        title: "Discover Our Combos",
        products:
          comboProducts.length > 0 ? comboProducts : allProducts.slice(0, 4),
      },
    };
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<CommerceProduct | null> {
  return getProductBySlugWc(slug);
}

