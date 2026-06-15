"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { Heart } from "lucide-react";

import { useCommerce } from "@/components/providers/CommerceProvider";
import type { CommerceProduct } from "@/lib/homepageData";

type DealOfTheDaySectionProps = {
  title: string;
  products: CommerceProduct[];
};

export function DealOfTheDaySection({
  title,
  products,
}: DealOfTheDaySectionProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 15,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { addToCart, toggleFavorite, isFavorite } = useCommerce();

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="relative w-full bg-white overflow-hidden font-sans py-10 md:py-[60px] transform-gpu"
    >
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-[60px]">
        {/* Page Title Configuration */}
        <h2
          className="text-black text-center text-4xl md:text-[56px] font-serif font-normal leading-tight md:leading-none mt-10 md:mt-[60px] mx-auto"
        >
          {title}
        </h2>

        {/* Functional Countdown Clock Timer Row */}
        <div className="flex items-center justify-center gap-2 md:gap-3 mt-6 md:mt-8">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-[91px] md:h-[91px] bg-brand-bg-gray-light rounded-[14px] flex flex-col items-center justify-center"
          >
            <span className="text-2xl md:text-[36px] font-bold text-black leading-none tracking-wide">
              {timeLeft.days.toString().padStart(2, "0")}
            </span>
            <span className="text-sm md:text-[18px] text-gray-500 font-medium mt-1 leading-none">
              Days
            </span>
          </div>
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-[91px] md:h-[91px] bg-brand-bg-gray-light rounded-[14px] flex flex-col items-center justify-center"
          >
            <span className="text-2xl md:text-[36px] font-bold text-black leading-none tracking-wide">
              {timeLeft.hours.toString().padStart(2, "0")}
            </span>
            <span className="text-sm md:text-[18px] text-gray-500 font-medium mt-1 leading-none">
              Hours
            </span>
          </div>
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-[91px] md:h-[91px] bg-brand-bg-gray-light rounded-[14px] flex flex-col items-center justify-center"
          >
            <span className="text-2xl md:text-[36px] font-bold text-black leading-none tracking-wide">
              {timeLeft.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-sm md:text-[18px] text-gray-500 font-medium mt-1 leading-none">
              Mins
            </span>
          </div>
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-[91px] md:h-[91px] bg-brand-bg-gray-light rounded-[14px] flex flex-col items-center justify-center"
          >
            <span className="text-2xl md:text-[36px] font-bold text-black leading-none tracking-wide">
              {timeLeft.seconds.toString().padStart(2, "0")}
            </span>
            <span className="text-sm md:text-[18px] text-gray-500 font-medium mt-1 leading-none">
              Secs
            </span>
          </div>
        </div>

        {/* 3-Product Horizontal Gallery Grid */}
        <div className="flex flex-col lg:flex-row gap-6 mt-16 max-w-[1200px] mx-auto">
          {products.map((product) => (
            <div
              key={product.id}
            className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 flex flex-col gap-6 w-full lg:w-[calc(33.333%-16px)] border border-gray-50 transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] group"
            >
              {/* Inner Top-Row Metadata Layout */}
              <div className="flex gap-5">
                {/* Left-Side Thumbnail Box */}
                <div className="relative w-[130px] h-[130px] bg-brand-bg-light rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                  <Link href={`/products/${product.slug}`} className="absolute inset-0 block cursor-pointer">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                </div>

                {/* Right-Side Description Block */}
                <div className="flex flex-col justify-center gap-2">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-xl md:text-[24px] font-bold leading-[1.1] text-black pr-2 hover:text-brand-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2.5 flex-wrap mt-1">
                    <span className="text-2xl md:text-[26px] font-black text-black leading-none">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg md:text-[20px] text-gray-400 font-bold line-through decoration-2 leading-none">
                        ${product.originalPrice}
                      </span>
                    )}
                    {product.discount && (
                      <span className="bg-brand-primary-light text-brand-secondary px-2.5 py-1 rounded-md text-sm md:text-[15px] font-extrabold leading-none">
                        {product.discount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Interactive Bottom Row */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => toggleFavorite(product)}
                  className="w-[50px] h-[50px] rounded-[10px] bg-brand-bg-light flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    className={`w-[22px] h-[22px] ${
                      isFavorite(product.id) ? "text-brand-secondary fill-brand-secondary" : "text-black"
                    }`}
                    strokeWidth={1.5}
                  />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => addToCart(product)}
                  className="bg-black text-white px-4 py-2 md:px-[21px] md:py-[8.5px] rounded-[6px] md:rounded-[8px] font-medium text-lg md:text-[26px] leading-[120%] tracking-normal hover:bg-gray-800 transition-colors w-full ml-4 flex items-center justify-center h-auto min-h-[40px] md:min-h-[50px]"
                  
                >
                  Add to cart
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
