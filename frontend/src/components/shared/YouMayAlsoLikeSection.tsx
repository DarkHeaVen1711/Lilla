"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { HoverAddToCart } from "@/components/ui/HoverAddToCart";
import { Price } from "@/components/shared/Price";
import type { CommerceProduct } from "@/lib/homepageData";
import imgYoumightlikeBlush from "@/images/youmightlike_blush.png";

type YouMayAlsoLikeSectionProps = {
  products: CommerceProduct[];
  title?: string;
};

export function YouMayAlsoLikeSection({ products, title = "You may also like" }: YouMayAlsoLikeSectionProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-5 py-16 overflow-hidden relative font-sans">
      {/* Blush Smudge Decoration */}
      <div className="absolute w-[439.86px] h-[321.76px] left-1/2 top-[150px] rotate-[50.73deg] opacity-100 pointer-events-none z-0">
        <Image src={imgYoumightlikeBlush} alt="Blush Smudge" className="object-contain" fill />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-3xl md:text-5xl font-normal font-serif">{title}</h2>
        <div className="flex items-center gap-4">
          <Link href="/shop" className="text-sm font-bold text-black border-b-2 border-black hover:opacity-75 transition-opacity">
            View All
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <button
              ref={prevRef}
              className="w-10 h-10 rounded-full border border-gray-200 hover:border-black flex items-center justify-center transition-colors bg-white shadow-sm cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
              ref={nextRef}
              className="w-10 h-10 rounded-full border border-gray-200 hover:border-black flex items-center justify-center transition-colors bg-white shadow-sm cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Outer Wrapper */}
      <div className="relative w-full z-10">
        <Swiper
          modules={[Navigation]}
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
          slidesPerView={1.2}
          grabCursor={true}
          loop={products.length > 4}
          breakpoints={{
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="w-full"
        >
          {products.map((prod) => (
            <SwiperSlide key={prod.id}>
              <div className="flex flex-col gap-4 group cursor-pointer">
                {/* Image Container */}
                <div className="relative w-full aspect-square bg-brand-bg-image rounded-[24px] overflow-hidden flex items-center justify-center p-6 transition-colors duration-300">
                  {/* Discount Badge inside top-left */}
                  {prod.discount && (
                    <div className="absolute top-4 left-4 z-10 bg-brand-primary-light text-brand-secondary px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {prod.discount}
                    </div>
                  )}
                  
                  {/* Like Button inside top-right */}
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(prod); }}
                    className="absolute top-4 right-4 z-20 w-[34px] h-[34px] bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    aria-label="Like product"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(prod.id) ? 'fill-red-500 text-red-500' : 'text-black'}`} />
                  </button>

                  <Link href={`/products/${prod.slug}`} className="absolute inset-0 m-auto w-full h-full cursor-pointer mix-blend-multiply">
                    <Image
                      src={prod.image}
                      alt={prod.name}
                      fill
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </Link>
                  
                  {/* Star Rating Badge inside bottom-right */}
                  <div className="absolute bottom-4 right-4 z-10 bg-white shadow-sm px-2.5 py-1 rounded-md flex items-center gap-1 transition-opacity duration-300 group-hover:opacity-0">
                    <Star className="w-3.5 h-3.5 fill-brand-rating-star text-brand-rating-star" />
                    <span className="text-black font-bold text-[12px] leading-none font-sans">
                      {(prod.rating || 4.8).toFixed(1)}
                    </span>
                    <span className="text-gray-500 font-medium text-[12px] leading-none ml-0.5 font-sans">
                      {prod.reviews || 108}
                    </span>
                  </div>

                  {/* Global Add to Cart Button (Hover - Centered) */}
                  <HoverAddToCart product={prod} />
                </div>

                {/* Typography below image */}
                <div className="flex flex-col gap-1 px-1">
                  <Link href={`/products/${prod.slug}`}>
                    <h3 className="text-[16px] font-medium text-black leading-tight hover:text-brand-primary transition-colors line-clamp-2 min-h-[44px]">
                      {prod.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Price amount={prod.price} className="text-[18px] font-bold text-black" />
                    {prod.originalPrice && (
                      <Price amount={prod.originalPrice} className="text-[16px] text-gray-400 font-medium line-through decoration-1" />
                    )}
                    {prod.discount && (
                      <span className="bg-brand-primary-light text-brand-secondary px-2.5 py-0.5 rounded-full text-[13px] font-bold">
                        {prod.discount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
