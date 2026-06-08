"use client";

import Link from "next/link";
import { useCommerce } from "@/components/providers/CommerceProvider";

export function FavoritesClient() {
  const { favoriteItems } = useCommerce();

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-12 md:py-16 mt-[80px]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#E85A4F]">Commerce</p>
      <h1 className="mt-3 text-5xl font-normal font-serif text-black md:text-7xl">Favourites</h1>
      <p className="mt-4 text-lg text-gray-500 font-medium">Saved products persist locally and can be moved to cart from the product cards.</p>

      <div className="mt-12 space-y-4">
        {favoriteItems.length === 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            No favourites yet.
            <div className="mt-6">
              <Link href="/shop" className="rounded-full bg-black px-8 py-3 text-base font-bold text-white hover:bg-gray-800 transition-colors uppercase tracking-wider">
                Browse products
              </Link>
            </div>
          </div>
        ) : (
          favoriteItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black">{item.name}</h2>
                <p className="text-gray-500 mt-1 font-semibold">{item.description}</p>
              </div>
              <p className="text-2xl font-black text-black">${item.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
