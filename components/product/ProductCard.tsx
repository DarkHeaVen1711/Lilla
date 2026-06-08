"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";
import type { CommerceProduct } from "@/lib/homepageData";
import imgCart from "@/images/cart.png";
import imgWishlist from "@/images/wishlist.png";

const FALLBACK_PRODUCT: CommerceProduct = {
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

type ProductCardProps = {
  product?: CommerceProduct;
};

export function ProductCard({ product = FALLBACK_PRODUCT }: ProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite } = useCommerce();
  const favorite = isFavorite(product.id);

  return (
    <div className="w-[280px] bg-[#FAFAFA] rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col font-sans">
      {/* Product Image Frame wrapped in Link */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full bg-[#f8f7f4] block overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1 font-bold text-xs">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span>{(product.rating || 4.8).toFixed(1)}</span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label="Add to wishlist"
        >
          <Image 
            src={imgWishlist} 
            alt="Wishlist" 
            className={`w-4 h-4 object-contain transition-all ${
              favorite ? "opacity-100 scale-110" : "opacity-60 hover:opacity-100"
            }`} 
          />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 font-medium">
        <div>
          <h3 className="text-base font-bold text-black leading-snug line-clamp-2 min-h-[44px]">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1 mt-1">
            {product.description || "Premium skincare essential"}
          </p>
        </div>
        
        {/* Pricing & Cart Action Row */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-black">${product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">${product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            className="bg-black text-white hover:bg-gray-800 transition-colors text-xs font-bold px-4 py-2 rounded-full uppercase flex items-center gap-1.5 shadow-sm"
          >
            <Image src={imgCart} alt="Cart" className="w-3.5 h-3.5 object-contain invert" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
