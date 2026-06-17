import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { getProducts } from "@/lib/productAdapter";

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12 py-12 md:py-16 mt-[80px]">
        <div className="mb-10 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">Lilaa Catalogue</p>
          <h1 className="mt-3 text-5xl font-normal font-serif text-black md:text-7xl">Shop All Products</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500 font-medium">
            Browse our premium luxury beauty skincare and makeup collections. Click on any product image to view its detail features.
          </p>
        </div>

        <ShopCatalogClient initialProducts={products} />
      </div>
    </main>
  );
}
