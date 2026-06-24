"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import type { StaticImageData } from "next/image";
import { HeroSection } from "@/components/home/HeroSection";

export interface HeroConfig {
  id: 1 | 2;
  layoutType: "text" | "image";
  titleLines?: [string, string];
  description?: string;
  backgroundImage?: StaticImageData | string;
  backgroundAlt?: string;
  portraitImage?: StaticImageData | string;
  portraitAlt?: string;
  productImage?: StaticImageData | string;
  productAlt?: string;
  backgroundColor?: string;
}

interface HeroSwitcherProps {
  slides: HeroConfig[];
  initialSlide?: 1 | 2;
}

export function HeroSwitcher({ slides, initialSlide = 1 }: HeroSwitcherProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!slides || slides.length === 0) {
    return null;
  }

  const handlePageChange = (index: number) => {
    swiperInstance?.slideTo(index);
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-5 md:px-10 lg:px-[60px] pt-0 sm:pt-4 lg:pt-5 pb-16 lg:pb-[60px] font-sans relative z-10">
      <div className="w-full mx-auto relative">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          speed={700}
          grabCursor={true}
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          className="w-full"
        >
          {slides.map((slide) => (
            <SwiperSlide key={`slide-${slide.id}`}>
              <HeroSection
                layoutType={slide.layoutType}
                titleLines={slide.titleLines}
                description={slide.description}
                backgroundImage={slide.backgroundImage}
                backgroundAlt={slide.backgroundAlt}
                portraitImage={slide.portraitImage}
                portraitAlt={slide.portraitAlt}
                productImage={slide.productImage}
                productAlt={slide.productAlt}
                backgroundColor={slide.backgroundColor}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div
          className="flex items-center justify-center gap-3 mt-6"
        >
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.button
                key={slide.id}
                onClick={() => handlePageChange(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePageChange(index);
                  }
                }}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={isActive ? "true" : "false"}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  width: isActive ? "24px" : "12px",
                  backgroundColor: isActive ? "var(--color-brand-switcher-active)" : "var(--color-brand-switcher-inactive)",
                }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center justify-center h-3 rounded-full cursor-pointer transform-gpu will-change-transform-width-bg"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
