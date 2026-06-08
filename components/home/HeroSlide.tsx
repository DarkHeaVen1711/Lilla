"use client";

import Image from "next/image";
import { m as motion } from "framer-motion";
import { HeroProductCard } from "@/components/home/HeroProductCard";
import { ShopCollectionButton } from "@/components/ui/ShopCollectionButton";
import type { StaticImageData } from "next/image";

interface HeroSlideProps {
  layoutType: "text" | "image";
  titleLines?: [string, string];
  description?: string;
  backgroundImage?: StaticImageData | string;
  backgroundAlt?: string;
  portraitImage?: StaticImageData | string;
  portraitAlt?: string;
  productImage?: StaticImageData | string;
  productAlt?: string;
}

export function HeroSlide({
  layoutType,
  titleLines,
  description,
  backgroundImage,
  backgroundAlt = "",
  portraitImage,
  portraitAlt = "",
  productImage,
  productAlt = "",
}: HeroSlideProps) {
  if (layoutType === "text") {
    return (
      <>
        {backgroundImage && (
          <div className="absolute inset-0">
            <Image
              src={backgroundImage}
              alt={backgroundAlt}
              fill
              className="object-contain mix-blend-multiply"
              priority
            />
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between h-full min-h-[500px] sm:min-h-125 md:min-h-150 p-5 sm:p-8 md:p-12">
          <div className="flex flex-col h-full w-full max-w-[717px]">
            <div className="mt-4 md:mt-0 flex flex-col justify-center">
              <h1 className="text-white font-sans font-semibold text-4xl sm:text-5xl lg:text-[94px] leading-tight lg:leading-[72px] tracking-[0%]">
                <span className="block">{titleLines?.[0]}</span>
                <span className="block">{titleLines?.[1]}</span>
              </h1>
              <p className="mt-4 sm:mt-6 max-w-lg text-white/85 text-base sm:text-lg md:text-xl leading-relaxed sm:leading-8">
                {description}
              </p>
            </div>
            <div className="absolute bottom-4 left-0 w-full flex justify-center md:relative md:bottom-auto md:left-auto md:w-auto md:justify-start md:mt-8">
              <ShopCollectionButton className="bg-white text-black hover:bg-gray-100" />
            </div>
          </div>

          <div className="hidden md:block absolute right-4 lg:right-6 bottom-4 lg:bottom-6">
            <HeroProductCard />
          </div>
        </div>
      </>
    );
  }

  // Image layout
  if (!portraitImage || !productImage) {
    return <div className="min-h-[400px] sm:min-h-125 md:min-h-150 bg-gray-100" />;
  }

  return (
    <div className="relative z-10 flex flex-col md:flex-row items-stretch justify-between h-full min-h-[400px] sm:min-h-125 md:min-h-150">
      {/* Left - Portrait Image */}
      <div className="w-full h-[300px] sm:h-[400px] md:h-auto md:w-1/2 relative overflow-hidden">
        <Image
          src={portraitImage}
          alt={portraitAlt}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right - Product and Button */}
      <div className="w-full h-[300px] sm:h-[400px] md:h-auto md:w-1/2 bg-white relative overflow-hidden flex items-end justify-center">
        <Image
          src={productImage}
          alt={productAlt}
          fill
          className="object-cover"
        />
        <div className="absolute z-10 bottom-4 md:bottom-6">
          <ShopCollectionButton />
        </div>
      </div>
    </div>
  );
}
