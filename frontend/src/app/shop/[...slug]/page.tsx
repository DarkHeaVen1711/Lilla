import { CatalogCard } from "@/components/shop/CatalogCard";
import { getProducts, type FrontendProduct } from "@/lib/productAdapter";

const CONCERN_MAPPING: Record<string, string> = {
  "acne": "acne",
  "pigmentation": "pigmentation",
  "anti-aging": "aging",
  "dry-skin": "dry",
  "barrier-repair": "barrier"
};

export default async function ShopCollectionPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string[] }>;
}>) {
  const { slug } = await params;
  const collectionSlug = slug[0];
  const collectionName = slug.join(" ").replace(/-/g, " ");
  
  const queryConcern = CONCERN_MAPPING[collectionSlug];
  let products: FrontendProduct[] = [];
  
  if (queryConcern) {
    products = await getProducts({ concerns: [queryConcern] });
  } else {
    products = await getProducts({ categorySlug: collectionSlug });
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12 py-12 md:py-16 mt-[80px]">
        <div className="mb-10 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">Collection</p>
          <h1 className="mt-3 text-5xl font-normal font-serif text-black md:text-7xl capitalize">{collectionName || "Collection"}</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500 font-medium">
            Browse our premium curated selection. Click on any product image to see full description and specs.
          </p>
        </div>
        
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <CatalogCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
