"use client";

import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { useAuthGate } from "@/lib/authGate";
import type { CommerceProduct } from "@/lib/homepageData";
import { ShoppingBag } from "lucide-react";

type HoverAddToCartProps = {
  product: CommerceProduct;
};

export function HoverAddToCart({ product }: HoverAddToCartProps) {
  const addToCart = useStore((s) => s.addToCart);
  const withAuthGate = useAuthGate();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    withAuthGate(
      "ADD_TO_CART",
      { ...product, quantity: 1 },
      () => {
        addToCart(product);
        toast.success(`Added to cart!`, {
          description: product.name,
          icon: <ShoppingBag className="w-4 h-4" />,
          duration: 2500,
        });
      }
    );
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto w-full flex justify-center">
      <button
        onClick={handleAdd}
        className="bg-black text-white px-4 py-2 text-lg md:px-[21px] md:py-[8.5px] rounded-[6px] md:rounded-[8px] md:text-[18px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-gray-800 transition-colors whitespace-nowrap w-fit flex items-center justify-center"
      >
        Add to cart
      </button>
    </div>
  );
}
