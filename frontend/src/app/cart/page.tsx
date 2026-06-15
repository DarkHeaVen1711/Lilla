import dynamic from "next/dynamic";
import { getHomePageData } from "@/lib/homepageData";

const CartSummary = dynamic(() =>
  import("@/components/CartSummary").then((mod) => mod.CartSummary),
);

export default async function CartPage() {
  const homePageData = await getHomePageData();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-12 md:py-16 mt-[80px]">
        <CartSummary recommendedProducts={homePageData.bestSellers} />
      </div>
    </main>
  );
}
