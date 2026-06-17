"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { toast } from "sonner";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { useStore } from "@/store/useStore";
import { useAuthGate } from "@/lib/authGate";
import type { CommerceProduct } from "@/lib/homepageData";
import imgCart from "@/images/cart.png";

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
  priority?: boolean;
};

export function ProductCard({ product = FALLBACK_PRODUCT, priority = false }: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const addToCart = useStore((s) => s.addToCart);
  const withAuthGate = useAuthGate();
  const favorite = isFavorite(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    withAuthGate(
      "ADD_TO_CART",
      { ...product, quantity: 1 },
      () => {
        addToCart(product);
        toast.success("Added to cart!", { description: product.name, duration: 2000 });
      }
    );
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    withAuthGate(
      "ADD_TO_FAVORITE",
      { ...product, quantity: 1 },
      () => {
        toggleFavorite(product);
        toast.success(favorite ? "Removed from favourites" : "Saved!", {
          description: product.name,
          duration: 1800,
        });
      }
    );
  };

  return (
    <div className="w-[280px] bg-brand-bg-gray rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col font-sans">
      {/* Product Image Frame wrapped in Link */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full bg-brand-bg-image block overflow-hidden mix-blend-multiply">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4="
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1 font-bold text-xs">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span>{(product.rating || 4.8).toFixed(1)}</span>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/95 text-black flex items-center justify-center shadow-sm hover:scale-110 transition-transform backdrop-blur"
          aria-label="Add to favourites"
        >
          <Heart className={`h-4 w-4 transition-colors ${
            favorite ? "fill-brand-secondary text-brand-secondary" : "text-black/60 hover:text-black"
          }`} />
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
            onClick={handleAddToCart}
            className="bg-black text-white hover:bg-gray-800 active:scale-95 transition-all text-xs font-bold px-4 py-2 rounded-full uppercase flex items-center gap-1.5 shadow-sm"
          >
            <Image src={imgCart} alt="Cart" className="w-3.5 h-3.5 object-contain invert" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
