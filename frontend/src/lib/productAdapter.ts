import { type StaticImageData } from "next/image";
import { MOCK_WOOCOMMERCE_PRODUCTS, mapWooCommerceProductToFrontend } from "./mockProducts";

export type ImageSource = StaticImageData | string;

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
  finish?: string;
  applicator?: string;
  shades?: Array<{ name: string; hex: string }>;
  featured?: boolean;
}

export function mapDjangoProductToFrontend(dp: any): FrontendProduct {
  const priceNum = parseFloat(dp.price || "0");
  const regularPriceNum = dp.original_price ? parseFloat(dp.original_price) : 0;
  const discountStr = dp.discount || undefined;

  return {
    id: dp.id.toString(),
    slug: dp.slug,
    name: dp.name,
    description: dp.description || "",
    image: dp.image || "/placeholder.jpg",
    price: priceNum,
    originalPrice: regularPriceNum > priceNum ? regularPriceNum : undefined,
    discount: discountStr,
    rating: parseFloat(dp.rating || "4.8"),
    reviews: dp.reviews || 0,
    category: dp.category_name || "General",
    expiresOn: dp.expires_on || "28/12/2027",
    features: dp.features_json || [],
    skinConcerns: dp.skin_concerns || [],
    keyIngredients: dp.key_ingredients || [],
    finish: dp.finish || undefined,
    applicator: dp.applicator || undefined,
    shades: dp.shades || [],
    featured: dp.featured,
  };
}

export function mapDjangoComboToFrontendProduct(combo: any): FrontendProduct {
  const priceNum = parseFloat(combo.bundle_price || "0");
  const originalPriceSum = combo.products?.reduce((sum: number, p: any) => sum + parseFloat(p.price || "0"), 0) || 0;
  const discountStr = originalPriceSum > priceNum 
    ? `-${Math.round(((originalPriceSum - priceNum) / originalPriceSum) * 100)}%` 
    : undefined;
  const image = combo.image || combo.products?.[0]?.image || "/placeholder.jpg";

  return {
    id: `combo-${combo.id}`,
    slug: combo.slug,
    name: combo.name,
    description: combo.description || "",
    image: image,
    price: priceNum,
    originalPrice: originalPriceSum > priceNum ? originalPriceSum : undefined,
    discount: discountStr,
    rating: 5.0,
    reviews: 42,
    category: "Combos",
    features: [],
    skinConcerns: [],
    keyIngredients: [],
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function getProducts(options?: {
  categorySlug?: string;
  categories?: string[];
  concerns?: string[];
  ingredients?: string[];
  sort?: string;
  limit?: number;
  featured?: boolean;
  search?: string;
}): Promise<FrontendProduct[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/products/`);
    if (options?.categorySlug) {
      url.searchParams.append("category", options.categorySlug);
    }
    if (options?.categories && options.categories.length > 0) {
      options.categories.forEach((c) => url.searchParams.append("category", c));
    }
    if (options?.concerns && options.concerns.length > 0) {
      options.concerns.forEach((c) => url.searchParams.append("concern", c));
    }
    if (options?.ingredients && options.ingredients.length > 0) {
      options.ingredients.forEach((i) => url.searchParams.append("ingredient", i));
    }
    if (options?.sort) {
      url.searchParams.append("sort", options.sort);
    }
    if (options?.featured !== undefined) {
      url.searchParams.append("featured", options.featured ? "true" : "false");
    }
    if (options?.search) {
      url.searchParams.append("search", options.search);
    }

    const res = await fetchWithTimeout(url.toString(), { cache: "no-store" }, 5000);
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`);
    }
    const data = await res.json();
    let results = data.map(mapDjangoProductToFrontend);

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return results;
  } catch (error) {
    console.error("Error in getProducts client fetch:", error);
    let results = [...MOCK_WOOCOMMERCE_PRODUCTS];
    if (options?.featured !== undefined) {
      results = results.filter((p) => p.featured === options.featured);
    }
    if (options?.categorySlug) {
      results = results.filter((p) =>
        p.categories.some((c) => c.slug === options.categorySlug)
      );
    }
    if (options?.concerns && options.concerns.length > 0) {
      results = results.filter((p) => {
        const productConcerns = p.skinConcerns || [];
        return options.concerns!.some((c) =>
          productConcerns.some((pc: string) => pc.toLowerCase().includes(c.toLowerCase()))
        );
      });
    }
    if (options?.search) {
      results = results.filter((p) =>
        p.name.toLowerCase().includes(options.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(options.search!.toLowerCase())
      );
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return results.map(mapWooCommerceProductToFrontend);
  }
}

export async function getProductBySlug(slug: string): Promise<FrontendProduct | null> {
  if (slug === "lilaa-glowy-cream") {
    return {
      id: "lilaa-glowy-cream",
      slug: "lilaa-glowy-cream",
      name: "Lilaa glowy cream (30ml)",
      description: "A lightweight cream for a luminous finish.",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/magnific_change-the-logo-to-img1-d_2974524054%201-1E5ZDnAdm0KkWgWRhOTOwsLYIsPEGK.png",
      price: 18,
      originalPrice: 20,
      discount: "10% off",
      rating: 4.8,
      reviews: 108,
      category: "Skin",
      expiresOn: "2028-12-31",
      features: [
        { badge: "Glow", title: "Luminous Finish", description: "Provides a natural healthy glow all day.", x1: 20, y1: 26, x2: 45, y2: 35 },
        { badge: "Hydration", title: "Hydrating Texture", description: "Locks in skin moisture and hydration.", x1: 32, y1: 80, x2: 48, y2: 65 },
        { badge: "Skin Barrier", title: "Barrier Support", description: "Enhances skin natural barrier properties.", x1: 80, y1: 36, x2: 56, y2: 48 }
      ],
      skinConcerns: ["Dryness", "Dullness"],
      keyIngredients: ["Vitamin C", "Hyaluronic Acid"],
    };
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/products/${slug}/`, { cache: "no-store" }, 5000);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch product by slug: ${res.statusText}`);
    }
    const data = await res.json();
    return mapDjangoProductToFrontend(data);
  } catch (error) {
    console.error(`Error in getProductBySlug for ${slug}:`, error);
    const product = MOCK_WOOCOMMERCE_PRODUCTS.find((p) => p.slug === slug);
    if (!product) return null;
    return mapWooCommerceProductToFrontend(product);
  }
}

export async function getCategories() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/categories/`, { cache: "no-store" }, 5000);
    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in getCategories:", error);
    const categoryMap = new Map<string, { id: number; name: string; slug: string }>();
    MOCK_WOOCOMMERCE_PRODUCTS.forEach((p) => {
      p.categories.forEach((cat) => {
        categoryMap.set(cat.slug, cat);
      });
    });
    return Array.from(categoryMap.values());
  }
}
