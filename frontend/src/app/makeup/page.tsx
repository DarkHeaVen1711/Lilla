import { CategoryLayoutClient } from "@/components/shop/CategoryLayoutClient";
import { getProducts } from "@/lib/productAdapter";

export default async function MakeupPage() {
  const products = await getProducts({ categorySlug: "makeup" });

  return (
    <main className="min-h-screen bg-white">
      <CategoryLayoutClient 
        products={products}
        categoryName="Makeup"
        breadcrumbPath="Makeup & Cosmetics"
        title="Makeup Products"
      />
    </main>
  );
}
