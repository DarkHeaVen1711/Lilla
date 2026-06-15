"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { m as motion, useScroll, useTransform } from "framer-motion";

import type { HomePageData } from "@/lib/homepageData";

import bgImage from "../../images/image_124.png";
import logo from "../../images/logo.png";
import social1 from "../../images/twitter.png";
import social2 from "../../images/facebook.png";
import social3 from "../../images/insta.png";
import social4 from "../../images/github.png";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type FooterProps = HomePageData["footer"];

export function Footer({ newsletterTitle, columns }: FooterProps) {
  const footerRef = useRef(null);

  // Smooth parallax velocity mapping
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-80, 20]);

  return (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="w-full bg-brand-bg-pink font-sans pt-16 md:pt-20 lg:pt-24 pb-4 transform-gpu"
    >
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Newsletter Banner */}
        <motion.div
          style={{ y: parallaxY, willChange: "transform" }}
          className="relative py-12 md:py-20 lg:py-24 w-full h-auto min-h-[320px] rounded-[40px] md:rounded-[100px] overflow-hidden flex flex-col items-center justify-center gap-6 md:gap-10 shadow-lg transform-gpu"
        >
          <Image
            src={bgImage}
            alt="Newsletter Background"
            fill
            className="object-cover object-center z-0 pointer-events-none"
          />

          <h2 className="relative z-10 text-black text-[32px] md:text-[40px] lg:text-[48px] font-serif font-normal leading-[1.1] text-center px-4">
            {newsletterTitle}
          </h2>

          <form
            className="relative z-10 flex flex-row items-center gap-2 md:gap-4 px-4 w-full max-w-[95%] sm:max-w-[80%] md:max-w-[640px] justify-center mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Drop your email address"
              className="bg-white flex-1 min-w-0 h-[48px] md:h-[56px] rounded-lg px-3 md:px-5 text-sm md:text-lg border-none focus:outline-none placeholder:text-gray-500 shadow-sm"
              required
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-black text-white w-[100px] md:w-[140px] h-[48px] md:h-[56px] rounded-lg text-sm md:text-lg font-medium hover:bg-gray-800 transition-colors shrink-0 shadow-md"
            >
              Subscribe
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Main Site Footer Block */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 justify-items-start max-w-[1440px] mx-auto pt-10 md:pt-16 pb-12 px-5 gap-x-8 lg:gap-x-12 gap-y-12"
      >
        {/* Brand Identity & Socials */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col w-full"
        >
          <Image
            src={logo}
            alt="LILAA"
            width={140}
            height={46}
            className="h-auto w-[80px] sm:w-[100px] md:w-[140px] mb-4"
          />
          <a 
            href="mailto:lilaacosmetics@gmail.com" 
            className="text-black hover:opacity-80 transition-opacity"
            style={{
              fontFamily: "'Darker Grotesque', sans-serif",
              fontWeight: 400,
              fontSize: "26px",
              lineHeight: "32px",
              letterSpacing: "0",
            }}
          >
            lilaacosmetics@gmail.com
          </a>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-6 md:mt-8">
            <motion.a
              href="#"
              aria-label="Twitter"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              <Image src={social1} alt="Twitter" width={14} height={14} className="object-contain md:w-[18px] md:h-[18px]" />
            </motion.a>
            <motion.a
              href="#"
              aria-label="Facebook"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              <Image src={social2} alt="Facebook" width={14} height={14} className="object-contain md:w-[18px] md:h-[18px]" />
            </motion.a>
            <motion.a
              href="#"
              aria-label="Instagram"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              <Image src={social3} alt="Instagram" width={14} height={14} className="object-contain md:w-[18px] md:h-[18px]" />
            </motion.a>
            <motion.a
              href="#"
              aria-label="GitHub"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              <Image src={social4} alt="GitHub" width={14} height={14} className="object-contain md:w-[18px] md:h-[18px]" />
            </motion.a>
          </div>
        </motion.div>

        {/* Navigation Directories */}
        {columns.map((column) => (
          <motion.div key={column.title} variants={itemVariants} className="flex flex-col items-start text-left gap-2 md:gap-4 w-full">
            <h3 className="text-black font-bold text-sm md:text-[22px] leading-tight mb-1 md:mb-2 tracking-wide text-left">
              {column.title}
            </h3>
            {column.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-gray-600 text-xs md:text-[19px] hover:text-black hover:translate-x-2 transition-all duration-300 text-left w-full"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom Sub-Footer Strip */}
      <div className="max-w-[1440px] mx-auto px-5 pb-0 flex flex-col items-start justify-start">
        <p className="text-gray-600 font-light text-xs md:text-sm">
          Copyright - {new Date().getFullYear()} © Lilaa themes. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
