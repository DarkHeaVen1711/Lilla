"use client";

import { Heart, ShoppingCart, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { useStore } from "@/store/useStore";
import { useAuthGate } from "@/lib/authGate";
import type { CommerceProduct } from "@/lib/homepageData";

type ProductActionsProps = {
  product: CommerceProduct;
};

export function ProductActions({ product }: ProductActionsProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const addToCart = useStore((s) => s.addToCart);
  const withAuthGate = useAuthGate();
  const favorite = isFavorite(product.id);

  const handleAddToCart = () => {
    withAuthGate(
      "ADD_TO_CART",
      { ...product, quantity: 1 },
      () => {
        addToCart(product);
        toast.success("Added to cart!", {
          description: product.name,
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          duration: 2500,
        });
      }
    );
  };

  const handleToggleFavorite = () => {
    withAuthGate(
      "ADD_TO_FAVORITE",
      { ...product, quantity: 1 },
      () => {
        toggleFavorite(product);
        toast.success(
          favorite ? "Removed from favourites" : "Added to favourites!",
          { description: product.name, duration: 2000 }
        );
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        id="pdp-add-to-cart"
        onClick={handleAddToCart}
        className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-black/80 hover:scale-[1.02] active:scale-95"
      >
        <ShoppingCart className="h-4 w-4" />
        Add to cart
      </button>
      <button
        type="button"
        id="pdp-toggle-favorite"
        onClick={handleToggleFavorite}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:border-black/25 hover:scale-[1.02] active:scale-95"
      >
        <Heart className={`h-4 w-4 transition-colors ${favorite ? "fill-brand-secondary text-brand-secondary" : ""}`} />
        {favorite ? "Remove from favourites" : "Add to favourites"}
      </button>
    </div>
  );
}
