import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { getHomePageData } from "@/lib/homepageData";

function uniqueById<T extends { id: string }>(items: T[]) {
  return items.filter(
    (item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
  );
}

export default async function ShopPage() {
  const homePageData = await getHomePageData();
  const products = uniqueById([
    ...homePageData.bestSellers,
    ...homePageData.dealOfTheDay.products,
    ...homePageData.discoverCombos.products,
  ]);

  return (
    <main className="min-h-screen bg-white">
      <AnnouncementBar text={homePageData.announcementBarText} />
      <Navbar links={homePageData.navLinks} />
      
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12 py-12 md:py-16 mt-[80px]">
        <div className="mb-10 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#E85A4F]">Lilaa Catalogue</p>
          <h1 className="mt-3 text-5xl font-normal font-serif text-black md:text-7xl">Shop All Products</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500 font-medium">
            Browse our premium luxury beauty skincare and makeup collections. Click on any product image to view its detail features.
          </p>
        </div>

        <ShopCatalogClient initialProducts={products} />
      </div>

      <Footer
        newsletterTitle={homePageData.footer.newsletterTitle}
        columns={homePageData.footer.columns}
      />
    </main>
  );
}
