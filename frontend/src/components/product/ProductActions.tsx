"use client";

import { Heart, ShoppingCart } from "lucide-react";

import { useCommerce } from "@/components/providers/CommerceProvider";
import type { CommerceProduct } from "@/lib/homepageData";

type ProductActionsProps = {
  product: CommerceProduct;
};

export function ProductActions({ product }: ProductActionsProps) {
  const { addToCart, toggleFavorite, isFavorite } = useCommerce();
  const favorite = isFavorite(product.id);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => addToCart(product)}
        className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/80"
      >
        <ShoppingCart className="h-4 w-4" />
        Add to cart
      </button>
      <button
        type="button"
        onClick={() => toggleFavorite(product)}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:border-black/25"
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-brand-secondary text-brand-secondary" : ""}`} />
        {favorite ? "Remove from favourites" : "Add to favourites"}
      </button>
    </div>
  );
}
