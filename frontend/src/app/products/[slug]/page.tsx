import { notFound } from "next/navigation";
import { ProductDetailPDP } from "@/components/product/ProductDetailPDP";
import { getProductBySlug, getHomePageData } from "@/lib/homepageData";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | LILAA`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: typeof product.image === "string" ? product.image : (product.image as any).src }],
    },
  };
}

export default async function ProductPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  let product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Convert OOP product to plain object for Next.js serialization compatibility
  const plainProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    image: typeof product.image === "string" ? product.image : {
      src: (product.image as any).src,
      width: (product.image as any).width,
      height: (product.image as any).height,
      blurDataURL: (product.image as any).blurDataURL,
      blurWidth: (product.image as any).blurWidth,
      blurHeight: (product.image as any).blurHeight,
    },
    price: product.price,
    originalPrice: product.originalPrice || null,
    discount: product.discount || null,
    rating: product.rating,
    reviews: product.reviews,
    category: product.category,
    expiresOn: product.expiresOn,
    features: product.features || null,
    skinConcerns: (product as any).skinConcerns || null,
    keyIngredients: (product as any).keyIngredients || null,
    finish: (product as any).finish || null,
    applicator: (product as any).applicator || null,
    shades: (product as any).shades || null,
  };

  const homePageData = await getHomePageData();
  const recommendedProducts = homePageData.bestSellers.filter((p) => p.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": plainProduct.name,
    "image": typeof plainProduct.image === "string" ? plainProduct.image : plainProduct.image.src,
    "description": plainProduct.description,
    "offers": {
      "@type": "Offer",
      "price": plainProduct.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
    },
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailPDP product={plainProduct as any} recommendedProducts={recommendedProducts} />
    </main>
  );
}
