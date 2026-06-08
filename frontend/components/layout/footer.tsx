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
      className="w-full bg-[#FAFAFA] font-sans py-16 md:py-20 lg:py-24 transform-gpu"
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
        className="flex flex-row justify-between max-w-[1440px] mx-auto pt-10 md:pt-20 pb-8 md:pb-16 px-5 gap-x-2 md:gap-x-10 lg:gap-x-20 gap-y-10"
      >
        {/* Left Column (Brand Identity & Socials) */}
        <motion.div
          variants={itemVariants}
          className="w-[35%] md:w-[30%] lg:w-[33%] flex flex-col shrink-0"
        >
          <Image
            src={logo}
            alt="LILAA"
            width={140}
            height={46}
            className="h-auto w-[80px] sm:w-[100px] md:w-[140px]"
          />
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

        {/* Right Columns (Navigation Directories) */}
        <div className="w-[60%] md:flex-1 grid grid-cols-2 md:grid-cols-3 justify-items-start gap-x-2 md:gap-x-8 gap-y-6 md:gap-y-8">
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
        </div>
      </motion.div>

      {/* Bottom Sub-Footer Strip */}
      <div className="border-t border-gray-200 mt-12 md:mt-16 pt-8 pb-4">
        <div className="max-w-[1440px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright and Legal Links */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <p className="text-gray-500 text-xs md:text-sm">
              © {new Date().getFullYear()} LILAA. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-gray-500 hover:text-black text-xs md:text-sm transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="text-gray-500 hover:text-black text-xs md:text-sm transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-2">
            {/* Visa */}
            <svg className="h-6 w-9 rounded bg-[#1A1A1A] px-1.5 py-1 text-white border border-gray-200/10" viewBox="0 0 36 24" fill="currentColor">
              <path d="M15.3 16.2L17.0 7.4H19.6L17.9 16.2H15.3ZM25.7 7.6C25.2 7.4 24.3 7.2 23.4 7.2C20.8 7.2 19.0 8.4 19.0 10.2C19.0 11.5 20.3 12.2 21.3 12.7C22.4 13.2 22.7 13.5 22.7 13.9C22.7 14.6 21.8 14.9 21.1 14.9C19.9 14.9 19.2 14.6 18.7 14.4L18.3 16.1C18.9 16.3 20.0 16.5 21.0 16.5C23.7 16.5 25.4 15.3 25.5 13.5C25.5 12.0 24.5 11.2 22.9 10.5C21.9 10.0 21.6 9.8 21.6 9.4C21.6 9.0 22.1 8.6 23.1 8.6C23.9 8.6 24.6 8.8 25.0 9.0L25.7 7.6ZM30.5 7.4H28.5C27.9 7.4 27.4 7.7 27.2 8.2L23.6 16.2H26.3L26.8 14.8H30.1L30.4 16.2H32.8L30.5 7.4ZM27.6 12.8L28.5 9.9L29.0 12.8H27.6ZM13.9 7.4H11.3C10.7 7.4 10.2 7.7 10.0 8.2L6.4 16.2H9.1L9.6 14.8H12.9L13.2 16.2H15.6L13.9 7.4ZM11.0 12.8L11.9 9.9L12.4 12.8H11.0Z" />
            </svg>

            {/* Mastercard */}
            <svg className="h-6 w-9 rounded bg-[#1A1A1A] p-1 border border-gray-200/10" viewBox="0 0 36 24" fill="none">
              <circle cx="14.5" cy="12" r="7" fill="#EB001B"/>
              <circle cx="21.5" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8"/>
            </svg>

            {/* PayPal */}
            <svg className="h-6 w-9 rounded bg-[#1A1A1A] p-1 border border-gray-200/10 text-white" viewBox="0 0 36 24" fill="currentColor">
              <path d="M12.1 6.1H15.9C18.6 6.1 20.4 7.3 20.4 9.8C20.4 12.6 18.2 14.2 15.4 14.2H13.6L12.9 17.9H10.1L12.1 6.1Z" opacity="0.6"/>
              <path d="M14.1 8.1H17.9C20.6 8.1 22.4 9.3 22.4 11.8C22.4 14.6 20.2 16.2 17.4 16.2H15.6L14.9 19.9H12.1L14.1 8.1Z"/>
            </svg>

            {/* Apple Pay */}
            <svg className="h-6 w-9 rounded bg-[#1A1A1A] p-1 text-white border border-gray-200/10" viewBox="0 0 36 24" fill="currentColor">
              <path d="M13.2 11.4C13.2 9.6 14.7 8.7 14.8 8.6C13.9 7.4 12.7 7.2 12.3 7.2C11.3 7.1 10.3 7.8 9.8 7.8C9.2 7.8 8.5 7.2 7.7 7.2C6.6 7.2 5.6 7.8 5.1 8.7C3.9 10.7 4.8 13.7 5.9 15.3C6.5 16.1 7.1 16.9 8.0 16.9C8.8 16.9 9.1 16.4 10.1 16.4C11.1 16.4 11.4 16.9 12.3 16.9C13.2 16.9 13.7 16.2 14.3 15.4C15.0 14.4 15.2 13.5 15.3 13.4C15.2 13.4 13.2 12.6 13.2 11.4Z" />
              <path d="M11.7 5.7C12.1 5.2 12.4 4.5 12.4 3.8C12.4 3.7 12.3 3.6 12.3 3.5C11.6 3.5 10.8 3.9 10.3 4.5C9.9 5.0 9.6 5.7 9.6 6.4C9.6 6.5 9.7 6.6 9.7 6.7C10.5 6.7 11.2 6.2 11.7 5.7Z" />
              <text x="17" y="15.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" fontWeight="bold">Pay</text>
            </svg>

            {/* Google Pay */}
            <svg className="h-6 w-9 rounded bg-[#1A1A1A] p-1 text-white border border-gray-200/10" viewBox="0 0 36 24" fill="currentColor">
              <path d="M12.4 11.8C12.4 11.2 12.3 10.7 12.2 10.2H8.3V11.8H10.6C10.5 12.4 10.1 12.9 9.6 13.2V14.3H11.2C12.2 13.4 12.4 12.7 12.4 11.8Z" fill="#4285F4"/>
              <path d="M8.3 16.0C9.4 16.0 10.3 15.6 11.0 15.0L9.4 13.9C9.0 14.1 8.5 14.3 8.3 14.3C7.2 14.3 6.3 13.6 6.0 12.6H4.3V13.9C5.1 15.5 6.6 16.0 8.3 16.0Z" fill="#34A853"/>
              <path d="M6.0 12.6C5.9 12.3 5.8 11.9 5.8 11.5C5.8 11.1 5.9 10.7 6.0 10.4V9.1H4.3C3.9 9.8 3.7 10.6 3.7 11.5C3.7 12.4 3.9 13.2 4.3 13.9L6.0 12.6Z" fill="#FBBC05"/>
              <path d="M8.3 7.0C9.0 7.0 9.5 7.2 10.0 7.6L11.2 6.4C10.5 5.8 9.5 5.4 8.3 5.4C6.6 5.4 5.1 6.5 4.3 8.1L6.0 9.4C6.3 8.4 7.2 7.0 8.3 7.0Z" fill="#EA4335"/>
              <text x="14" y="15.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" fontWeight="bold">Pay</text>
            </svg>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
