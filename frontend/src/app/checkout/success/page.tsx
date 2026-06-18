"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { OrderConfirmationCard } from "@/components/checkout/OrderConfirmationCard";
import { useStore } from "@/store/useStore";
import { YouMayAlsoLikeSection } from "@/components/shared/YouMayAlsoLikeSection";
import { getHomePageData } from "@/lib/homepageData";

export default function OrderConfirmationPage() {
  const cartItems = useStore((s) => s.cart.items);
  const [order, setOrder] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  useEffect(() => {
    const lastOrder = localStorage.getItem("lilla-last-order");
    let orderedProductIds: string[] = [];
    if (lastOrder) {
      try {
        const parsed = JSON.parse(lastOrder);
        setOrder(parsed);
        if (parsed && parsed.items) {
          orderedProductIds = parsed.items.map((item: any) => item.product_id);
        }
      } catch (e) {
        // ignore
      }
    }

    getHomePageData().then((data) => {
      if (data && data.bestSellers) {
        let recommended = data.bestSellers;
        if (orderedProductIds.length > 0) {
          recommended = recommended.filter((p) => !orderedProductIds.includes(p.id));
        }
        setRecommendedProducts(recommended);
      }
    }).catch((err) => {
      console.error("Failed to load recommended products:", err);
    });
  }, []);
  
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = subtotal * 0.2;
  const deliveryFee = 15.0;
  const cartTotal = subtotal > 0 ? (subtotal - discount + deliveryFee).toFixed(2) : "0.00";

  const total = order ? order.total_price : cartTotal;

  return (
    <div className="w-full min-h-screen bg-brand-bg-cream flex flex-col items-center pb-20 pt-16">
      <div className="w-full max-w-[1440px] px-8 lg:px-16 mx-auto min-h-[650px] flex flex-col items-center">
        
        {/* Success Message Header Status Line */}
        <div className="w-full max-w-4xl text-left mb-8">
          <h1 className="font-serif text-5xl mb-3">Order Confirmation</h1>
          <p className="text-xl text-gray-800 font-sans">
            Order Total : ${total}
          </p>
        </div>

        {/* The Transaction Invoice Central Details Card */}
        <div className="w-full max-w-4xl">
          <OrderConfirmationCard />
        </div>

        {/* Route Loop Return Trigger Button */}
        <div className="mt-12">
          <Link href="/">
            <button className="px-12 h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors">
              Continue shopping
            </button>
          </Link>
        </div>

        {/* Cross-Sell Product Carousel Tray Shelf */}
        <div className="w-full mt-32">
          <YouMayAlsoLikeSection products={recommendedProducts} title="You may also like" />
        </div>

      </div>
    </div>
  );
}
