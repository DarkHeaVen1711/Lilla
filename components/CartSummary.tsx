"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { X, Percent, ChevronLeft, ChevronRight, Star } from "lucide-react";

import { useCommerce } from "@/components/providers/CommerceProvider";
import type { CommerceProduct } from "@/lib/homepageData";

type CartSummaryProps = {
  recommendedProducts: CommerceProduct[];
};

export function CartSummary({ recommendedProducts }: CartSummaryProps) {
  const { cartItems, removeFromCart, updateQuantity } = useCommerce();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Cart Financials Calculation
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * 0.20; // 20% Mock Discount
  const deliveryFee = subtotal > 51 ? 0 : 15;
  const total = subtotal - discount + deliveryFee;
  
  const deliveryThreshold = 51;
  const progress = Math.min((subtotal / deliveryThreshold) * 100, 100);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full pb-24 font-sans">
      {/* 1. Header Breadcrumbs */}
      <div className="flex items-center justify-center pt-8 pb-4 text-[16px] font-medium text-gray-500">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-black">Cart</span>
      </div>

      {/* 2. Top Promotional Coupon Banner */}
      <div className="w-full bg-[#FDE7EA] py-3.5 flex flex-wrap items-center justify-center gap-3 px-4 text-center">
        <span className="text-black font-semibold text-[20px] leading-none">
          For orders above $100 use code :
        </span>
        <div className="bg-white border-[1.5px] border-[#D46B7A] rounded-full px-4 py-1 flex items-center justify-center shadow-sm">
          <span className="text-[#D46B7A] font-extrabold text-[16px] tracking-wide leading-none pt-0.5">TRYBEAUTY</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-5 lg:px-12 mt-10">
        {/* Main Title */}
        <h1 
          className="text-black text-left mb-8 font-serif font-normal text-[clamp(40px,4vw,56px)] leading-[1.1]" 
        >
          Cart Summary
        </h1>
  
        {/* 3. Split Two-Column Master Funnel Grid */}
        <div className="flex flex-col lg:flex-row gap-12 xl:gap-16">
            
            {/* Left Column: Master Product Tracking List (65% Weight) */}
            <div className="w-full lg:w-[65%] flex flex-col">
              <hr className="border-gray-200 mb-2" />
              
              {cartItems.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500 text-[22px] font-medium mb-6">Your cart is empty.</p>
                  <Link href="/shop" className="bg-black text-white px-8 py-3.5 rounded-xl font-bold text-[20px] hover:bg-gray-800 transition-colors">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={item.id}>
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group py-5">
                      <div className="flex w-full sm:w-auto items-start gap-4 sm:gap-6 flex-1">
                        {/* Left Aspect: Image Container */}
                        <Link href={`/products/${item.slug}`} className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] bg-white border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] rounded-xl p-2 flex shrink-0 items-center justify-center relative cursor-pointer hover:opacity-85 transition-opacity">
                          <Image src={item.image} alt={item.name} fill className="object-contain p-3 sm:p-4" />
                        </Link>
    
                        {/* Center Content Column */}
                        <div className="flex-1 flex flex-col justify-center">
                          {/* Brand Label */}
                          <span className="text-[#D46B7A] text-[13px] sm:text-[16px] font-bold uppercase tracking-wider mb-1">
                            {item.category || "SKIN1004"}
                          </span>
                          {/* Product Title */}
                          <Link href={`/products/${item.slug}`}>
                            <h3 className="text-[16px] sm:text-[24px] font-bold text-black leading-tight mb-2 hover:text-[#E85A4F] transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          {/* Pricing Row */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="text-[20px] sm:text-[26px] font-black text-black leading-none">${item.price}</span>
                            {item.originalPrice && (
                              <span className="text-[16px] sm:text-[20px] text-gray-400 font-bold line-through decoration-2 leading-none">
                                ${item.originalPrice}
                              </span>
                            )}
                            {item.discount && (
                              <span className="bg-[#FDE7EA] text-[#D46B7A] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[12px] sm:text-[15px] font-extrabold leading-none mt-1 sm:mt-0">
                                {item.discount}
                              </span>
                            )}
                          </div>
                          <span className="text-green-600 text-xs sm:text-sm font-semibold mt-1.5">In Stock</span>
                        </div>
                      </div>
  
                      {/* Right Aspect / Bottom Actions on Mobile */}
                      <div className="flex items-center gap-3 sm:gap-6 mt-1 sm:mt-0 sm:ml-auto w-full sm:w-auto sm:justify-end pl-[116px] sm:pl-0">
                        {/* Incremental Pill Counter */}
                        <div className="flex items-center bg-white border border-gray-300 rounded-full h-[36px] sm:h-[44px] px-1 shadow-sm shrink-0">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 sm:w-10 flex justify-center items-center text-gray-500 hover:text-black text-[22px] sm:text-[28px] font-medium leading-none pb-[2px]">-</button>
                          <span className="w-6 sm:w-8 text-center text-black font-bold text-[16px] sm:text-[20px] leading-none">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 sm:w-10 flex justify-center items-center text-gray-500 hover:text-black text-[22px] sm:text-[28px] font-medium leading-none pb-[2px]">+</button>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-200 hidden sm:block"></div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[14px] sm:text-[16px] font-semibold text-gray-600 hover:text-red-500 transition-colors bg-white sm:bg-transparent border border-gray-300 sm:border-none rounded-full h-[36px] sm:h-auto px-4 sm:px-0 shadow-sm sm:shadow-none shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                    {idx < cartItems.length - 1 && <hr className="border-gray-100" />}
                  </div>
                ))
              )}
              <hr className="border-gray-200 mt-2" />
            </div>
  
            {/* Right Column: Interactive Billing & Checkout Box (35% Weight) */}
            <div className="w-full lg:w-[35%] flex flex-col">
              {/* Top Shipping Indicator */}
              <div className="mb-6 px-1">
                <p className="text-black font-semibold text-[19px] mb-3">Add item worth $51 to get a free delivery!</p>
                <div className="w-full h-[4px] bg-gray-100 rounded-full relative overflow-visible">
                  <div 
                    className="absolute left-0 top-0 h-full bg-[#D46B7A] rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#D46B7A] border border-white rounded-full translate-x-1/2"></div>
                  </div>
                </div>
              </div>
  
              {/* Core Summary Card Frame */}
              <div className="bg-white rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-50 p-6 lg:p-8 flex flex-col">
                
                {/* Coupon Module */}
                <div className="flex bg-[#F9F9F9] border border-gray-200 rounded-[10px] p-1 sm:p-1.5 h-[50px] sm:h-[56px] focus-within:border-black transition-colors w-full overflow-hidden">
                  <div className="flex items-center px-2 sm:px-3 text-gray-400 shrink-0">
                    <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </div>
                  <input type="text" placeholder="Apply Coupons" className="flex-1 min-w-0 w-full outline-none text-black font-semibold text-sm sm:text-[18px] placeholder:text-gray-400 bg-transparent" />
                  <button className="bg-black text-white px-4 sm:px-6 rounded-md font-bold text-sm sm:text-[18px] hover:bg-gray-800 transition-colors shrink-0">Apply</button>
                </div>
                <Link href="#" className="text-[#D46B7A] text-sm sm:text-[17px] font-semibold mt-3.5 hover:underline">
                  View applicable coupons &gt;
                </Link>
  
                <hr className="border-gray-100 my-7" />
  
                {/* Receipt Matrix */}
                <div className="flex flex-col gap-4 text-[18px] sm:text-[20px] font-semibold">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-black font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Discount (-20%)</span>
                    <span className="text-[#D46B7A] font-extrabold">-${discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Fee</span>
                    <span className="text-black font-bold">${deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
  
                <hr className="border-gray-100 my-7" />
  
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[20px] sm:text-[24px] font-extrabold text-black">Total</span>
                  <span className="text-[28px] sm:text-[36px] font-black text-black leading-none">${total.toFixed(2)}</span>
                </div>
  
                <Link href="/login" className="w-full h-[50px] sm:h-[56px] bg-black text-white rounded-xl text-[20px] sm:text-[24px] font-bold hover:bg-gray-800 transition-colors flex items-center justify-center">
                  Checkout
                </Link>
              </div>
            </div>
          </div>
  
          {/* 4. Bottom Decorative Recommendations Loop Component */}
          <div className="mt-16 sm:mt-24 pt-8 sm:pt-12 border-t border-gray-200 relative">
            <div className="flex justify-between items-end mb-6 sm:mb-10 px-2">
            <h2 className="text-[#111] text-[28px] sm:text-[40px] md:text-[48px] leading-tight sm:leading-none font-serif font-normal">
              You may also like
            </h2>
              <Link href="/shop" className="text-black font-bold text-[16px] sm:text-[20px] underline hover:text-gray-600 transition-colors mb-1 sm:mb-2 whitespace-nowrap shrink-0 ml-4">
                View All
              </Link>
            </div>
  
            <div className="relative group/carousel">
              <button onClick={scrollLeft} className="hidden md:flex absolute -left-4 sm:-left-6 lg:-left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 items-center justify-center text-black hover:scale-105 active:scale-95 transition-all">
                <ChevronLeft strokeWidth={2.5} className="w-6 h-6 -ml-0.5" />
              </button>
  
              <div ref={carouselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth pb-8 pt-4 px-2">
                {recommendedProducts.map((rec) => (
                  <div key={rec.id} className="relative group w-[287px] h-[357px] bg-[#F9F9F9] rounded-[10px] overflow-hidden flex flex-col p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] shrink-0 snap-start cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
                    <div className="relative flex-1 w-full flex items-center justify-center mb-4">
                      <Link href={`/products/${rec.slug}`} className="absolute inset-0 z-0 cursor-pointer block">
                        <Image src={rec.image} alt={rec.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out" />
                      </Link>
                      <div className="absolute bottom-0 right-0 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                        <Star size={12} className="fill-[#F5C518] text-[#F5C518] -mt-0.5" />
                        <span className="text-black font-extrabold text-[14px] leading-none mt-0.5">
                          {rec.rating?.toFixed(1) || "5.0"} | {rec.reviews ? `${(rec.reviews/1000).toFixed(1)}k` : "1.2k"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5 mt-auto">
                      <Link href={`/products/${rec.slug}`}>
                        <h3 className="text-black font-semibold text-[22px] leading-[1.1] line-clamp-2 hover:text-[#E85A4F] transition-colors">{rec.name}</h3>
                      </Link>
                      <div className="flex items-center justify-center gap-2.5 mt-0.5">
                        <span className="text-[22px] font-black text-black leading-none">${rec.price}</span>
                        {rec.originalPrice && <span className="text-[18px] text-gray-400 font-bold line-through decoration-2 leading-none">${rec.originalPrice}</span>}
                        {rec.discount && <span className="bg-[#FDE7EA] text-[#D46B7A] px-2 py-0.5 rounded-md text-[13px] font-extrabold leading-none">{rec.discount}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
  
              <button onClick={scrollRight} className="hidden md:flex absolute -right-4 sm:-right-6 lg:-right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 items-center justify-center text-black hover:scale-105 active:scale-95 transition-all">
                <ChevronRight strokeWidth={2.5} className="w-6 h-6 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}
