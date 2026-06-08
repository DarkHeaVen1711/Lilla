import nextDynamic from "next/dynamic";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/navbar";
import { HeroSwitcher } from "@/components/home/HeroSwitcher";
import { getHomePageData } from "@/lib/homepageData";

export const dynamic = "force-dynamic";

const ShopByCategorySection = nextDynamic(() =>
  import("@/components/home/ShopByCategorySection").then((mod) => mod.ShopByCategorySection),
);
const BestSellersSection = nextDynamic(() =>
  import("@/components/home/BestSellersSection").then(
    (mod) => mod.BestSellersSection,
  ),
);
const ShopBySkinConcernSection = nextDynamic(() =>
  import("@/components/home/ShopBySkinConcernSection").then(
    (mod) => mod.ShopBySkinConcernSection,
  ),
);
const DiscoverCombosSection = nextDynamic(() =>
  import("@/components/home/DiscoverCombosSection").then((mod) => mod.DiscoverCombosSection),
);
const DealOfTheDaySection = nextDynamic(() =>
  import("@/components/home/DealOfTheDaySection").then(
    (mod) => mod.DealOfTheDaySection,
  ),
);
const TrustBadgesSection = nextDynamic(() =>
  import("@/components/home/TrustBadgesSection").then((mod) => mod.TrustBadgesSection),
);
const Footer = nextDynamic(() =>
  import("@/components/layout/footer").then((mod) => mod.Footer),
);

export default async function Home() {
  const homePageData = await getHomePageData();

  return (
    <main className="min-h-screen bg-white" id="home">
      <AnnouncementBar text={homePageData.announcementBarText} />
      <Navbar links={homePageData.navLinks} />
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
      />
      <TrustBadgesSection badges={homePageData.trustBadges} />
      <Footer
        newsletterTitle={homePageData.footer.newsletterTitle}
        columns={homePageData.footer.columns}
      />
    </main>
  );
}
