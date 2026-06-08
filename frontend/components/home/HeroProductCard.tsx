"use client";
 
import Image from "next/image";
import Link from "next/link";
import { useCommerce } from "@/components/providers/CommerceProvider";
import type { CommerceProduct } from "@/lib/homepageData";
import imgCart from "@/images/cart.png";
import imgWishlist from "@/images/wishlist.png";
 
const HERO_PRODUCT: CommerceProduct = {
  id: "lilaa-glowy-cream",
  slug: "lilaa-glowy-cream",
  name: "Lilaa glowy cream (30ml)",
  description: "A lightweight cream for a luminous finish.",
  image:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/magnific_change-the-logo-to-img1-d_2974524054%201-1E5ZDnAdm0KkWgWRhOTOwsLYIsPEGK.png",
  price: 18,
  originalPrice: 20,
  discount: "10% off",
};
 
export function HeroProductCard() {
  const { addToCart, toggleFavorite, isFavorite } = useCommerce();
  const favorite = isFavorite(HERO_PRODUCT.id);
 
  return (
    <div className="flex flex-col items-start gap-2 font-sans">
      {/* Top Buttons - Outside the main card */}
      <div className="flex items-center gap-2 z-10">
        <span className="bg-black/15 text-white text-xl font-medium px-5 py-2 rounded-full">
          Bestseller
        </span>
        <button
          onClick={() => toggleFavorite(HERO_PRODUCT)}
          aria-label="Add to wishlist"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors text-white ${
            favorite ? "bg-[#D46B7A] hover:bg-[#c35b6a]" : "bg-black/15 hover:bg-black/25"
          }`}
        >
          <Image src={imgWishlist} alt="Wishlist" className="w-[18px] h-[18px] object-contain invert" />
        </button>
        <button
          onClick={() => addToCart(HERO_PRODUCT)}
          aria-label="Add to cart"
          className="w-10 h-10 bg-black/15 rounded-full flex items-center justify-center hover:bg-black/25 transition-colors text-white"
        >
          <Image src={imgCart} alt="Cart" className="w-[18px] h-[18px] object-contain invert" />
        </button>
      </div>
 
      {/* Main Product Card - Glassmorphism */}
      <div className="bg-black/15 backdrop-blur-2xl border border-white/20 shadow-xl rounded-2xl p-2 w-[280px]">
        {/* Top Row: Discount tag and Arrow */}
        <div className="flex items-start justify-between mb-1">
          <span className="text-white/90 text-sm font-medium">(10% off)</span>
          <Link
            href={`/products/${HERO_PRODUCT.slug}`}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            aria-label="View product"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 13L13 1M13 1H1M13 1V13"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
 
        {/* Product Info - WHITE text */}
        <div className="mb-1">
          <h3 className="text-white text-2xl font-bold leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            Lilaa glowy cream
            <br />
            (30ml)
          </h3>
          <p className="text-white text-lg font-semibold mt-1">$18</p>
        </div>
 
        {/* Product Image Container - White background */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="relative w-full aspect-[5/3] flex items-center justify-center p-1">
            <Image
              src={HERO_PRODUCT.image}
              alt={HERO_PRODUCT.name}
              width={220}
              height={180}
              className="object-contain scale-125"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
