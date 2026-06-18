import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["", "/shop", "/favorites", "/cart", "/login"];
  
  const staticSitemaps = routes.map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const res = await fetch(`${API_URL}/api/products/`);
    const products = res.ok ? await res.json() : [];
    
    const productSitemaps = Array.isArray(products) ? products.map((p: any) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })) : [];

    return [...staticSitemaps, ...productSitemaps];
  } catch {
    return staticSitemaps;
  }
}
