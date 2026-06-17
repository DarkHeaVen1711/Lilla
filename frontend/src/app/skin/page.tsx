import { CategoryLayoutClient } from "@/components/shop/CategoryLayoutClient";
import { getProducts } from "@/lib/productAdapter";

export default async function SkincarePage() {
  const products = await getProducts();
  
  // Filter mock products based on the "inheritance class" (category)
  const skinProducts = products.filter(
    (product) => 
      product.category?.toLowerCase().includes("skin") ||
      product.category?.toLowerCase().includes("treatments") ||
      product.category?.toLowerCase().includes("mask") ||
      product.category?.toLowerCase().includes("cleanser")
  );

  return (
    <main className="min-h-screen bg-white">
      <CategoryLayoutClient 
        products={skinProducts}
        categoryName="Skincare"
        breadcrumbPath="Daily Essentials"
        title="Skincare Products"
      />
    </main>
  );
}
