"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { Star, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import type { Swiper as SwiperType } from "swiper";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { HoverAddToCart } from "@/components/ui/HoverAddToCart";
import { Price } from "@/components/shared/Price";
import type { CommerceProduct } from "@/lib/homepageData";

import imgSmudge from "@/images/smudge_featured_products.png";

interface FeaturedProductsSectionProps {
  products: CommerceProduct[];
}

export function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="w-full bg-brand-bg-cream py-10 md:py-[60px] relative overflow-hidden font-sans transform-gpu"
    >
      
      {/* 1. BACKGROUND ACCENT SMUDGE (Snapped to bottom right grid bounds) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-full pointer-events-none z-0 hidden lg:block">
        <div 
          className="absolute mix-blend-multiply"
          style={{
            width: "287px",
            height: "108px",
            bottom: "0px",
            right: "0px",
            opacity: 1,
          }}
        >
          <Image 
            src={imgSmudge} 
            alt="Decorative smudge" 
            fill 
            className="object-contain" 
          />
        </div>
      </div>

      {/* 2. MAIN VIEW CONTENT (Lifted to z-20 to sit on top of the smudge background) */}
      <div className="relative w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center px-5 md:px-10 lg:px-[60px] z-20">
        {/* Left Sidebar Column Block (25%) */}
        <div className="w-full lg:w-[25%] flex flex-col items-center text-center lg:items-start lg:text-left z-10 shrink-0">
          <h2 className="text-black font-serif font-normal text-4xl md:text-[48px] leading-tight md:leading-[1.1]">
            Featured <br className="hidden lg:block" /> Products
          </h2>
          <p className="text-black font-medium text-lg md:text-[20px] leading-[1.4] w-full md:w-[244px] mt-2 md:mt-4">
            Shop Our Bestseller Products.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-black text-white hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center px-4 py-2 md:px-[21px] md:py-[8.5px] rounded-[6px] md:rounded-[8px] mt-4 md:mt-8 transform-gpu"
          >
            <Link href="/shop" className="font-medium text-lg md:text-[26px] leading-[120%] tracking-normal flex items-center justify-center whitespace-nowrap">
              View All
            </Link>
          </motion.button>
        </div>

        {/* Right Carousel Track Column Block (75%) */}
        <div className="w-full lg:w-[75%] relative z-10 mt-12 lg:mt-0">
          {/* Custom Navigation Arrows */}
          <button
            ref={prevRef}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-[-24px] z-20 w-12 h-12 bg-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-50 items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-black -ml-0.5" strokeWidth={1.5} />
          </button>
          
          <button
            ref={nextRef}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-[-24px] z-20 w-12 h-12 bg-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-50 items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-black ml-0.5" strokeWidth={1.5} />
          </button>

          <Swiper
            modules={[Navigation, FreeMode]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper: SwiperType) => {
              if (typeof swiper.params.navigation !== "boolean" && swiper.params.navigation) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }
            }}
            freeMode={true}
            loop={true}
            spaceBetween={24}
            slidesPerView={1}
            grabCursor={true}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="w-full px-2 py-4"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <div className="flex flex-col gap-4 group cursor-pointer">
                  {/* Image Container */}
                  <div className="relative w-full aspect-square bg-brand-bg-image rounded-[24px] overflow-hidden flex items-center justify-center p-6 transition-colors duration-300">
                    {/* Discount Badge inside top-left */}
                    {product.discount && (
                      <div className="absolute top-4 left-4 z-10 bg-brand-primary-light text-brand-secondary px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {product.discount}
                      </div>
                    )}
                    
                    {/* Like Button inside top-right */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
                      className="absolute top-4 right-4 z-20 w-[34px] h-[34px] bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                      aria-label="Like product"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-black'}`} />
                    </button>

                    <Link href={`/products/${product.slug}`} className="absolute inset-0 m-auto w-full h-full cursor-pointer mix-blend-multiply">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </Link>
                    
                    {/* Star Rating Badge inside bottom-right (Default) */}
                    <div className="absolute bottom-4 right-4 z-10 bg-white shadow-sm px-2.5 py-1 rounded-md flex items-center gap-1 transition-opacity duration-300 group-hover:opacity-0">
                      <Star className="w-3.5 h-3.5 fill-brand-rating-star text-brand-rating-star" />
                      <span className="text-black font-bold text-[12px] leading-none">
                        {(product.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-gray-500 font-medium text-[12px] leading-none ml-0.5">
                        {(product.reviews || 0) >= 1000 ? ((product.reviews || 0) / 1000).toFixed(1) + 'k' : (product.reviews || 0)}
                      </span>
                    </div>

                    {/* Global Add to Cart Button (Hover - Centered) */}
                    <HoverAddToCart product={product} />
                  </div>

                  {/* Typography below image */}
                  <div className="flex flex-col gap-1 px-1">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-[16px] font-medium text-black leading-tight hover:text-brand-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Price amount={product.price} className="text-[18px] font-bold text-black" />
                      {product.originalPrice && (
                        <Price amount={product.originalPrice} className="text-[16px] text-gray-400 font-medium line-through decoration-1" />
                      )}
                      {product.discount && (
                        <span className="bg-brand-primary-light text-brand-secondary px-2.5 py-0.5 rounded-full text-[13px] font-bold">
                          {product.discount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </motion.section>
  );
}