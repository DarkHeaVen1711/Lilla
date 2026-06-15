"use client";

import Image from "next/image";
import type { ImageSource } from "@/lib/homepageData";
import { m as motion } from "framer-motion";
import imgDroplet from "../../images/Droplet.png";

type SkinConcern = {
  label: string;
  image: ImageSource;
  href: string;
};

type ShopBySkinConcernProps = {
  concerns: SkinConcern[];
};

export function ShopBySkinConcernSection({ concerns }: ShopBySkinConcernProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="relative w-full bg-white overflow-hidden font-sans py-10 md:py-[60px] transform-gpu"
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 lg:px-[120px] relative">
        {/* Title Area */}
        <div className="relative flex justify-center items-center lg:h-[150px] mb-8 lg:mb-[50px] lg:pt-[60px]">
          {/* Decorative Droplet Accent */}
          <div 
            className="absolute pointer-events-none z-0 w-[215px] h-[185px] lg:-top-[35px] lg:-left-[45px] -top-8 -left-8 opacity-100"
          >
            <Image src={imgDroplet} alt="" fill className="object-contain" />
          </div>
          <h2 className="text-black font-serif font-normal text-4xl md:text-[42px] lg:text-[56px] leading-tight md:leading-none text-center relative z-10">
            Shop by your skin concern
          </h2>
        </div>

        {/* Product Gallery Row */}
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap lg:flex-nowrap justify-center gap-4 sm:gap-6 lg:gap-[25px] z-10 w-full mx-auto relative"
        >
          {concerns.map((item) => (
            <motion.a
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.04 }}
              key={item.label}
              href={item.href}
              className="flex flex-col items-center group cursor-pointer transform-gpu"
              style={{ willChange: "transform" }}
            >
              {/* Rounded Square Image Card: Strictly 220x220 on Desktop */}
              <div
                className="relative overflow-hidden mb-3 md:mb-5 w-36 h-36 sm:w-44 sm:h-44 lg:w-[220px] lg:h-[220px] rounded-[12px]"
              >
                <Image
                  src={item.image}
                  alt={`Shop products for ${item.label}`}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* Label */}
              <span className="text-black font-medium text-lg md:text-[20px] leading-none tracking-normal align-middle">
                {item.label}
              </span>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
