import dynamic from "next/dynamic";
import { HeroSwitcher } from "@/components/home/HeroSwitcher";
import { getHomePageData } from "@/lib/homepageData";
import { getProducts } from "@/lib/woocommerce";

const ShopByCategorySection = dynamic(() =>
  import("@/components/home/ShopByCategorySection").then((mod) => mod.ShopByCategorySection),
);
const BestSellersSection = dynamic(() =>
  import("@/components/home/BestSellersSection").then(
    (mod) => mod.BestSellersSection,
  ),
);
const SkinAndMakeupSwiper = dynamic(() =>
  import("@/components/home/SkinAndMakeupSwiper").then(
    (mod) => mod.SkinAndMakeupSwiper,
  ),
);
const ShopBySkinConcernSection = dynamic(() =>
  import("@/components/home/ShopBySkinConcernSection").then(
    (mod) => mod.ShopBySkinConcernSection,
  ),
);
const DiscoverCombosSection = dynamic(() =>
  import("@/components/home/DiscoverCombosSection").then((mod) => mod.DiscoverCombosSection),
);
const DealOfTheDaySection = dynamic(() =>
  import("@/components/home/DealOfTheDaySection").then(
    (mod) => mod.DealOfTheDaySection,
  ),
);
const FeaturedProductsSection = dynamic(() =>
  import("@/components/home/FeaturedProductsSection").then(
    (mod) => mod.FeaturedProductsSection,
  ),
);
const TrustBadgesSection = dynamic(() =>
  import("@/components/home/TrustBadgesSection").then((mod) => mod.TrustBadgesSection),
);
const HappyClientsSection = dynamic(() =>
  import("@/components/home/HappyClientsSection").then((mod) => mod.HappyClientsSection),
);
const LatestNewsSection = dynamic(() =>
  import("@/components/home/LatestNewsSection").then((mod) => mod.LatestNewsSection),
);

export default async function Home() {
  const homePageData = await getHomePageData();
  const allProducts = await getProducts();

  return (
    <main className="min-h-screen bg-white" id="home">
      <HeroSwitcher initialSlide={1} slides={homePageData.heroSlides} />
      <div id="skin">
        <ShopByCategorySection categories={homePageData.frame19Categories} />
      </div>
      <BestSellersSection products={homePageData.bestSellers} />
      <ShopBySkinConcernSection concerns={homePageData.skinConcerns} />
      <DiscoverCombosSection
        products={homePageData.discoverCombos.products}
        title={homePageData.discoverCombos.title}
      />
      <DealOfTheDaySection
        products={homePageData.dealOfTheDay.products}
        title={homePageData.dealOfTheDay.title}
        expiresAtUtc={homePageData.dealOfTheDay.expiresAtUtc}
      />
      <SkinAndMakeupSwiper />
      <FeaturedProductsSection 
        products={homePageData.featuredProducts} 
      />
      <HappyClientsSection 
        testimonials={homePageData.testimonials} 
        products={allProducts} 
      />
      <LatestNewsSection news={homePageData.latestNews} />
      <TrustBadgesSection badges={homePageData.trustBadges} />
    </main>
  );
}
