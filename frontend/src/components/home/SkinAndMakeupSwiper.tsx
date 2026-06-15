"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Mousewheel, EffectFade, Pagination } from "swiper/modules";

// Swiper core styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

// Local image assets
import imgBestSkincare from "@/images/best_skincare_image.png";
import imgColorThatSpeaks from "@/images/color_that_speaks_image.png";

export function SkinAndMakeupSwiper() {
  return (
    <section className="w-full flex justify-center py-10 md:py-[60px] bg-white">
      <div className="relative overflow-hidden w-full max-w-[1440px] mx-auto min-h-[650px] xl:h-[650px]">
        <Swiper
          modules={[Mousewheel, EffectFade]}
          effect="fade"
          loop={false}
          allowTouchMove={true}
          mousewheel={{ forceToAxis: true }}
          speed={800}
          className="w-full h-full"
        >
          {/* Slide Component 1: Best Skincare Page */}
          <SwiperSlide>
            <div className="w-full h-full bg-brand-bg-pink relative flex flex-col xl:block pb-10 xl:pb-0">
              {/* Left Column Layout Block */}
              <div className="relative xl:absolute flex flex-col items-center xl:items-start z-10 w-full xl:max-w-[400px] px-6 xl:px-0 xl:left-[100px] xl:top-[220px] pt-12 xl:pt-0 text-center xl:text-left">
                <h2 className="font-serif font-normal text-[40px] xl:text-[56px] text-brand-text-dark leading-none mb-4 xl:mb-6">
                  Best Skincare
                </h2>
                <p className="font-sans font-medium text-gray-700 text-lg xl:text-xl leading-tight mb-6 xl:mb-8 whitespace-pre-wrap">
                  Products that are actually good for your skin.
                </p>
                <Link 
                  href="/skin" 
                  className="bg-black text-white px-8 py-3 rounded-md font-sans font-semibold hover:bg-neutral-800 transition-all text-[26px]"
                >
                  Shop Collection
                </Link>
              </div>

              {/* Right Column Image Positioning */}
              <div 
                className="relative xl:absolute z-0 overflow-hidden mx-auto mt-8 xl:mt-0 w-[280px] h-[322px] md:w-[400px] md:h-[460px] xl:w-[516px] xl:h-[593px] rounded-[160px] xl:rounded-[296.5px] xl:left-[667px] xl:top-[28.5px] opacity-100 rotate-0" 
              >
                <Image
                  src={imgBestSkincare}
                  alt="Best Skincare"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </SwiperSlide>

          {/* Slide Component 2: Color That Speaks Page */}
          <SwiperSlide>
            <div className="w-full h-full bg-brand-bg-cool-gray relative flex flex-col xl:block pb-10 xl:pb-0">
              {/* Left Column Layout Block */}
              <div className="relative xl:absolute flex flex-col items-center xl:items-start z-10 w-full xl:max-w-[400px] px-6 xl:px-0 xl:left-[100px] xl:top-[220px] pt-12 xl:pt-0 text-center xl:text-left">
                <h2 className="font-serif font-normal text-[40px] xl:text-[56px] text-brand-text-dark leading-none mb-4 xl:mb-6">
                  Color That Speaks
                </h2>
                <p className="font-sans font-medium text-gray-700 text-lg xl:text-xl leading-tight mb-6 xl:mb-8 text-center xl:text-left">
                  Premium pigments designed for every skin tone and style starting from $20.
                </p>
                <Link 
                  href="/makeup" 
                  className="bg-black text-white px-8 py-3 rounded-md font-sans font-semibold hover:bg-neutral-800 transition-all text-[26px]"
                >
                  Shop Collection
                </Link>
              </div>

              {/* Right Column Image Positioning */}
              <div 
                className="relative xl:absolute z-0 overflow-hidden mx-auto mt-8 xl:mt-0 w-[300px] h-[295px] md:w-[400px] md:h-[394px] xl:w-[469px] xl:h-[462px] xl:left-[623px] xl:top-[126px] rounded-none opacity-100 rotate-0" 
              >
                <Image
                  src={imgColorThatSpeaks}
                  alt="Color That Speaks"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  );
}
