"use client";

import type { StaticImageData } from "next/image";
import { HeroSlide } from "@/components/home/HeroSlide";

interface HeroSectionProps {
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

export function HeroSection({
  layoutType,
  titleLines,
  description,
  backgroundImage,
  backgroundAlt,
  portraitImage,
  portraitAlt,
  productImage,
  productAlt,
  backgroundColor = "bg-brand-bg-hero-default",
}: HeroSectionProps) {
  return (
    <div
      className={`relative ${backgroundColor} rounded-[40px] overflow-hidden min-h-[500px] md:min-h-[600px] !my-0`}
    >
      <HeroSlide
        layoutType={layoutType}
        titleLines={titleLines}
        description={description}
        backgroundImage={backgroundImage}
        backgroundAlt={backgroundAlt}
        portraitImage={portraitImage}
        portraitAlt={portraitAlt}
        productImage={productImage}
        productAlt={productAlt}
      />
    </div>
  );
}
