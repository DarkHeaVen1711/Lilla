import type { Metadata } from "next";
import { Darker_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CommerceProvider } from "@/components/providers/CommerceProvider";
import { AnimationProvider } from "@/components/providers/AnimationProvider";
import { AuthProvider } from "@/components/AuthProvider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={darkerGrotesque.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AnimationProvider>
          <AuthProvider>
            <CommerceProvider>{children}</CommerceProvider>
          </AuthProvider>
        </AnimationProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
