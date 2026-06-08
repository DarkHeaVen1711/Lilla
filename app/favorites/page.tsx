import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FavoritesClient } from "@/components/FavoritesClient";
import { getHomePageData } from "@/lib/homepageData";

export default async function FavoritesPage() {
  const homePageData = await getHomePageData();

  return (
    <main className="min-h-screen bg-white">
      <AnnouncementBar text={homePageData.announcementBarText} />
      <Navbar links={homePageData.navLinks} />
      <FavoritesClient />
      <Footer
        newsletterTitle={homePageData.footer.newsletterTitle}
        columns={homePageData.footer.columns}
      />
    </main>
  );
}
