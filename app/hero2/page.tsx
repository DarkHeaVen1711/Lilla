import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
export const dynamic = "force-dynamic";

import { Navbar } from "@/components/layout/navbar";
import { HeroSwitcher } from "@/components/home/HeroSwitcher";
import { ShopByCategorySection } from "@/components/home/ShopByCategorySection";
import { Footer } from "@/components/layout/footer";
import { getHomePageData } from "@/lib/homepageData";

export default async function Hero2Page() {
  const homePageData = await getHomePageData();

  return (
    <main className="min-h-screen bg-white">
      <AnnouncementBar text={homePageData.announcementBarText} />
      <Navbar links={homePageData.navLinks} />
      <HeroSwitcher initialSlide={2} slides={homePageData.heroSlides} />
      <ShopByCategorySection categories={homePageData.frame19Categories} />
      <Footer {...homePageData.footer} />
    </main>
  );
}
