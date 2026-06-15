"use client";

import Image from "next/image";
import { m as motion } from "framer-motion";
import type { ImageSource } from "@/lib/homepageData";

type ShopByCategory = {
  title: string;
  image: ImageSource;
  alt: string;
  href: string;
};

type ShopByCategorySectionProps = {
  categories: ShopByCategory[];
};

export function ShopByCategorySection({ categories = [] }: ShopByCategorySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="bg-brand-bg-pink py-10 md:py-[60px] transform-gpu"
    >
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-[60px]">
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="mx-auto text-brand-text-dark text-4xl md:text-[56px] font-serif font-normal leading-none"
          >
            Shop by category
          </h2>
        </div>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-10 xl:gap-12"
        >
        {categories?.map((item) => (
            <motion.a
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={item.title}
              href={item.href}
              className="group flex flex-col items-center text-center transform-gpu"
              style={{ willChange: "transform" }}
            >
            <div className="relative w-36 h-36 sm:w-[190px] sm:h-[190px] md:w-[220px] md:h-[220px] rounded-full bg-white shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-black/5 overflow-hidden flex items-center justify-center">
                <Image
                  src={item.image}
                alt={item.alt || item.title}
                  fill
                unoptimized
                sizes="(max-width: 768px) 144px, (max-width: 1200px) 190px, 220px"
                className="object-contain p-4 sm:p-6"
                />
              </div>
              <span className="mt-4 sm:mt-7 text-lg sm:text-[26px] font-sans font-semibold leading-[120%] tracking-[0%] text-brand-text-dark">
                {item.title}
              </span>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
