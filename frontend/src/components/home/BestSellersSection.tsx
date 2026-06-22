"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { useAuthGate } from "@/lib/authGate";
import { useStore } from "@/store/useStore";
import { HoverAddToCart } from "@/components/ui/HoverAddToCart";
import { Price } from "@/components/shared/Price";
import type { CommerceProduct } from "@/lib/homepageData";
import imgBackground from "../../images/background.png";

type BestSellersSectionProps = {
  products: CommerceProduct[];
};

export function BestSellersSection({ products }: BestSellersSectionProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const withAuthGate = useAuthGate();
  const zustandAddToCart = useStore((s) => s.addToCart);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);


  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="relative w-full bg-white overflow-hidden font-sans py-10 md:py-[60px] transform-gpu"
    >
      {/* Foreground Decorative Accent - Fixed 1440px Coordinate System */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-full pointer-events-none z-0 hidden lg:block">
        <div 
          className="absolute mix-blend-multiply"
          style={{ 
            width: "240px", 
            height: "185px", 
            bottom: "0px", 
            right: "0px",
            opacity: 1 
          }}
        >
          <Image
            src={imgBackground}
            alt="Cosmetic Smudge Accent"
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="relative w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center px-5 md:px-10 lg:px-[60px]">
        {/* Left-Side Static Copy Block */}
        <div className="w-full lg:w-[25%] flex flex-col items-center text-center lg:items-start lg:text-left z-10 shrink-0">
          <h2 className="text-black font-serif font-normal text-4xl md:text-[48px] leading-tight md:leading-none">
            Best Sellers
          </h2>
          <p className="text-black font-medium text-lg md:text-[20px] leading-[1.4] w-full md:w-[244px] mt-2 md:mt-4">
            Shop Our Bestseller Products.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-black text-white hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center px-4 py-2 md:px-[21px] md:py-[8.5px] rounded-[6px] md:rounded-[8px] mt-4 md:mt-8 transform-gpu"
            
          >
            <span className="font-medium text-lg md:text-[26px] leading-[120%] tracking-normal flex items-center justify-center whitespace-nowrap">
              View All
            </span>
          </motion.button>
        </div>

        {/* Right-Side Sliding Gallery with Swiper */}
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
            modules={[Navigation, Autoplay]}
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
            spaceBetween={24}
            slidesPerView={1}
            grabCursor={true}
            loop={true}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="w-full px-2"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        withAuthGate(
                          "ADD_TO_FAVORITE",
                          { ...product, quantity: 1 },
                          () => toggleFavorite(product)
                        );
                      }}
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
