import { CategoryLayoutClient } from "@/components/shop/CategoryLayoutClient";
import { getProducts } from "@/lib/productAdapter";

export default async function SkincarePage() {
  const products = await getProducts({ categorySlug: "skin" });

  return (
    <main className="min-h-screen bg-white">
      <CategoryLayoutClient 
        products={products}
        categoryName="Skincare"
        breadcrumbPath="Daily Essentials"
        title="Skincare Products"
      />
    </main>
  );
}
