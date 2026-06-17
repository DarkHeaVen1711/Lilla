import { CategoryLayoutClient } from "@/components/shop/CategoryLayoutClient";
import { getProducts } from "@/lib/productAdapter";

export default async function MakeupPage() {
  const products = await getProducts();
  
  // Filter mock products based on the "inheritance class" (category)
  const makeupProducts = products.filter(
    (product) => 
      product.category?.toLowerCase().includes("makeup") ||
      product.category?.toLowerCase().includes("cosmetics") ||
      product.category?.toLowerCase().includes("color") ||
      product.category?.toLowerCase().includes("lip") ||
      product.category?.toLowerCase().includes("blush")
  );

  return (
    <main className="min-h-screen bg-white">
      <CategoryLayoutClient 
        products={makeupProducts.length > 0 ? makeupProducts : products.slice(0, 3)}
        categoryName="Makeup"
        breadcrumbPath="Makeup & Cosmetics"
        title="Makeup Products"
      />
    </main>
  );
}
