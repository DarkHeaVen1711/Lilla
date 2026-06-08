import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductDetailPDP } from "@/components/product/ProductDetailPDP";
import { getProductBySlug, getHomePageData } from "@/lib/homepageData";
import { Product } from "@/lib/products";

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
  // Filter out the current product from recommendations if present
  const recommendedProducts = homePageData.bestSellers.filter((p) => p.slug !== slug);

  return (
    <main className="min-h-screen bg-white">
      <AnnouncementBar text={homePageData.announcementBarText} />
      <Navbar links={homePageData.navLinks} />
      <ProductDetailPDP product={plainProduct as any} recommendedProducts={recommendedProducts} />
      <Footer
        newsletterTitle={homePageData.footer.newsletterTitle}
        columns={homePageData.footer.columns}
      />
    </main>
  );
}
