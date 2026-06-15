import type { Metadata } from "next";
import { Darker_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { CommerceProvider } from "@/components/providers/CommerceProvider";
import { AnimationProvider } from "@/components/providers/AnimationProvider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthModal } from "@/components/auth/AuthModal";
import { ScrollToTopFAB } from "@/components/shared/ScrollToTopFAB";
import { getHomePageData } from "@/lib/homepageData";
// Century Commit: 100th commit of the day! 🚀
import "./globals.css";

const darkerGrotesque = Darker_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-darker-grotesque",
});

export const metadata: Metadata = {
  title: "LILAA | Premium Skincare",
  description:
    "Because every skin deserves care. Shop our premium skincare collection.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const homePageData = await getHomePageData();

  return (
    <html lang="en" className={darkerGrotesque.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AnimationProvider>
          <CommerceProvider>
            <AnnouncementBar text={homePageData.announcementBarText} />
            <Navbar links={homePageData.navLinks} />
            {children}
            <Footer
              newsletterTitle={homePageData.footer.newsletterTitle}
              columns={homePageData.footer.columns}
            />
            <AuthModal />
            <ScrollToTopFAB />
            <Toaster position="bottom-right" richColors closeButton />
          </CommerceProvider>
        </AnimationProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
