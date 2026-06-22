"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, ShoppingBag } from "lucide-react";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { useStore } from "@/store/useStore";
import { useAuthGate } from "@/lib/authGate";
import { toast } from "sonner";
import { Price } from "@/components/shared/Price";
import type { CommerceProduct } from "@/lib/homepageData";

type CatalogCardProps = {
  product: CommerceProduct;
};

export function CatalogCard({ product }: CatalogCardProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const addToCart = useStore((s) => s.addToCart);
  const withAuthGate = useAuthGate();
  const favorite = isFavorite(product.id);

  return (
    <article className="group rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-brand-bg-image">
        <Link href={`/products/${product.slug}`} className="cursor-pointer mix-blend-multiply">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <button
          type="button"
          aria-label="Add to favourites"
          onClick={() => toggleFavorite(product)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition-transform hover:scale-105"
        >
          <Heart className={`h-5 w-5 ${favorite ? "fill-brand-secondary text-brand-secondary" : ""}`} />
        </button>
        <button
          type="button"
          aria-label="Add to cart"
          onClick={() => {
            withAuthGate(
              "ADD_TO_CART",
              { ...product, quantity: 1 },
              () => {
                addToCart(product);
                toast.success("Added to cart!", {
                  description: product.name,
                  icon: <ShoppingBag className="w-4 h-4" />,
                  duration: 2500,
                });
              }
            );
          }}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to cart
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-black">{product.name}</h3>
          <p className="mt-1 text-sm text-black/65">{product.description}</p>
        </div>
        <div className="text-right">
          <Price amount={product.price} className="text-xl font-bold text-black" />
          {product.originalPrice ? (
            <Price amount={product.originalPrice} className="text-sm text-black/45 line-through block" />
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-semibold text-brand-secondary hover:text-black"
        >
          View details
        </Link>
        {product.discount ? (
          <span className="rounded-full bg-brand-primary-light px-3 py-1 text-xs font-semibold text-brand-secondary">
            {product.discount}
          </span>
        ) : null}
      </div>
    </article>
  );
}
