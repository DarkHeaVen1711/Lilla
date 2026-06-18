"use client";

import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { HoverAddToCart } from "@/components/ui/HoverAddToCart";

import "swiper/css";

import type { CommerceProduct } from "@/lib/homepageData";

type DiscoverCombosProps = {
  products: CommerceProduct[];
  title: string;
};

export function DiscoverCombosSection({ products, title }: DiscoverCombosProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="relative w-full bg-brand-bg-gray overflow-hidden font-sans py-10 md:py-[60px] transform-gpu"
    >
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-[60px] flex flex-col">
        
        {/* Title Area */}
        <div className="flex justify-center mb-8 md:mb-12">
          <h2 className="text-brand-text-dark text-center text-4xl md:text-[56px] font-serif font-normal leading-tight md:leading-none">
            {title}
          </h2>
        </div>

        {/* Infinite Carousel Area */}
        <div className="relative w-full z-0 py-6 md:py-12 -mb-6 md:-mb-12">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: "auto", spaceBetween: 0 }
            }}
            loop={true}
            speed={800}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
          >
            {/* Duplicating the array enables seamless looping when moving to exactly -50% */}
              {[...products, ...products].map((product, index) => {
                return (
                  <SwiperSlide key={`${product.id}-${index}`} className="md:!w-auto flex justify-center">
                    <div className="relative flex flex-col items-center group cursor-pointer px-0 md:px-4 shrink-0 w-full md:w-auto">
                      {/* Square Image Container */}
                      <div className="relative bg-brand-bg-light rounded-[24px] overflow-hidden mb-4 w-full aspect-square md:w-[287px] md:h-[287px] max-w-[400px]">
                        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0 block">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        </Link>
                        
                        {/* Like Button inside top-right */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
                          className="absolute top-4 right-4 z-20 w-[34px] h-[34px] bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                          aria-label="Like product"
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-black'}`} />
                        </button>

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

                      {/* Title Only */}
                      <Link href={`/products/${product.slug}`} className="hover:text-brand-primary transition-colors">
                        <span className="font-medium text-[18px] leading-snug tracking-normal text-center max-w-[280px] block">
                          {product.name}
                        </span>
                      </Link>
                    </div>
                  </SwiperSlide>
                );
              })}
          </Swiper>
        </div>
      </div>
    </motion.section>
  );
}
