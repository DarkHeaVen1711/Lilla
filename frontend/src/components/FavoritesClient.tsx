"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { CatalogCard } from "@/components/shop/CatalogCard";

export function FavoritesClient() {
  const { favoriteItems, clearFavorites } = useCommerce();

  return (
    <div className="mx-auto max-w-[1440px] px-5 lg:px-12 py-12 md:py-16">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-gray-200/60 pb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">
            My Collection
          </p>
          <h1 className="mt-3 text-5xl font-normal font-serif text-black md:text-7xl">
            Favourites
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500 font-medium">
            Your saved items persist locally and can be easily managed or moved to your shopping cart directly from here.
          </p>
        </div>

        {favoriteItems.length > 0 && (
          <button
            onClick={clearFavorites}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-500 hover:text-black hover:border-black transition-all shadow-sm shrink-0 self-center md:self-end"
          >
            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
            Clear Favourites
          </button>
        )}
      </div>

      {/* Dynamic Content */}
      <div className="mt-12">
        {favoriteItems.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/45 rounded-[32px] border border-dashed border-gray-200/80 max-w-[640px] mx-auto w-full px-6 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm mb-6">
              <Heart className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">No saved items yet</h2>
            <p className="text-gray-400 text-base font-medium max-w-md mb-8">
              Explore our catalogue and click the heart icon on your favorite skincare or makeup products to save them in your list.
            </p>
            <Link
              href="/shop"
              className="rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors uppercase tracking-wider shadow-sm"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteItems.map((item) => (
              <CatalogCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
