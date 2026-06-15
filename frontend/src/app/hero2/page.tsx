import { HeroSwitcher } from "@/components/home/HeroSwitcher";
import { ShopByCategorySection } from "@/components/home/ShopByCategorySection";
import { getHomePageData } from "@/lib/homepageData";

export default async function Hero2Page() {
  const homePageData = await getHomePageData();

  return (
    <main className="min-h-screen bg-white">
      <HeroSwitcher initialSlide={2} slides={homePageData.heroSlides} />
      <ShopByCategorySection categories={homePageData.frame19Categories} />
    </main>
  );
}
