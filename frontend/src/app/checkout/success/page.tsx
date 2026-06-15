"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { OrderConfirmationCard } from "@/components/checkout/OrderConfirmationCard";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { YouMayAlsoLikeSection } from "@/components/shared/YouMayAlsoLikeSection";
import { MOCK_WOOCOMMERCE_PRODUCTS, mapWooCommerceProductToFrontend } from "@/lib/woocommerce";

export default function OrderConfirmationPage() {
  const { cartItems } = useCommerce();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const lastOrder = localStorage.getItem("lilla-last-order");
    if (lastOrder) {
      try {
        setOrder(JSON.parse(lastOrder));
      } catch (e) {
        // ignore
      }
    }
  }, []);
  
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = subtotal * 0.2;
  const deliveryFee = 15.0;
  const cartTotal = subtotal > 0 ? (subtotal - discount + deliveryFee).toFixed(2) : "0.00";

  const total = order ? order.total_price : cartTotal;
  const recommendedProducts = MOCK_WOOCOMMERCE_PRODUCTS.slice(0, 8).map(mapWooCommerceProductToFrontend);

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
