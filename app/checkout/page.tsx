"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { cartItems } = useCommerce();
  const router = useRouter();

  // Cart Financials
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * 0.20; // 20% mock discount
  const deliveryFee = subtotal > 51 || subtotal === 0 ? 0 : 15;
  const total = subtotal - discount + deliveryFee;

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("auth_redirect", "/checkout");
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (isAuthenticated && cartItems.length === 0) {
      router.push("/shop");
    }
  }, [cartItems, isAuthenticated, router]);

  if (!isAuthenticated || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF7F7]">
        <Loader2 className="w-10 h-10 animate-spin text-[#B55B52]" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <main className="min-h-screen bg-[#FCFAF8] pt-12 pb-24 font-sans text-foreground">
      <div className="max-w-[1200px] mx-auto px-5">
        {/* Breadcrumb */}
        <div className="flex items-center justify-start mb-6 text-sm font-semibold text-gray-400">
          <Link href="/cart" className="hover:text-black transition-colors">Cart</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-black">Checkout</span>
        </div>

        <h1 className="text-black font-serif text-[40px] md:text-[48px] leading-tight mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form Column (Left) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <h2 className="text-xl font-bold font-serif mb-6 text-black border-b border-gray-100 pb-3">1. Shipping & Payment</h2>
              <p className="text-gray-400 text-sm">Form details loading...</p>
            </div>
            <button
              type="submit"
              className="w-full h-[56px] bg-black text-white rounded-xl text-lg font-bold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Place Order
            </button>
          </form>

          {/* Order Summary Column (Right) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-border shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col gap-6">
            <h3 className="text-xl font-bold font-serif border-b border-gray-100 pb-3 text-black">Order Summary</h3>

            {/* Items List */}
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-bold shrink-0">{item.quantity}x</span>
                    <span className="text-[15px] font-semibold text-black line-clamp-1">{item.name}</span>
                  </div>
                  <span className="text-[15px] font-bold text-black shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="border-gray-100" />

            {/* Price Calculations */}
            <div className="flex flex-col gap-3.5 text-sm font-semibold">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-black font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Discount (-20%)</span>
                <span className="text-[#B55B52] font-bold">-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Fee</span>
                <span className="text-black font-bold">
                  {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center mt-1">
              <span className="text-base font-bold text-black">Total Charge</span>
              <span className="text-2xl font-black text-black">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
