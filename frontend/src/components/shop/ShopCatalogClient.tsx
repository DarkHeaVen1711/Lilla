"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CatalogCard } from "@/components/shop/CatalogCard";
import type { CommerceProduct } from "@/lib/homepageData";

type ShopCatalogClientProps = {
  initialProducts: CommerceProduct[];
};

export function ShopCatalogClient({ initialProducts }: ShopCatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Dynamic filter lists
  const categories = [
    { id: "all", label: "Shop All" },
    { id: "skin", label: "Skin Care" },
    { id: "makeup", label: "Makeup" },
    { id: "essentials", label: "Daily Essentials" }
  ];

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        activeCategory === "all" ||
        (activeCategory === "skin" && (product.category?.toLowerCase().includes("skin") || product.category?.toLowerCase().includes("treatments") || product.category?.toLowerCase().includes("mask"))) ||
        (activeCategory === "makeup" && (product.category?.toLowerCase().includes("makeup") || product.category?.toLowerCase().includes("cosmetics"))) ||
        (activeCategory === "essentials" && product.category?.toLowerCase().includes("essentials"));

      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col gap-8">
      {/* Search Input Box */}
      <div className="relative flex bg-white border border-gray-200 rounded-full h-[64px] items-center px-6 shadow-sm focus-within:border-black focus-within:ring-2 focus-within:ring-black/5 transition-all max-w-[720px] w-full mx-auto">
        <Search className="w-6 h-6 text-gray-400 shrink-0 mr-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for skincare, makeup, ingredients, or brand..."
          className="flex-1 bg-transparent border-none outline-none font-semibold text-lg text-black placeholder:text-gray-400 w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors ml-2"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2.5 rounded-full text-base font-bold transition-all border ${
              activeCategory === cat.id
                ? "bg-black border-black text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Results Header */}
      <div className="flex items-center justify-between border-b border-gray-200/60 pb-4 mt-6">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-black" />
          <span>Results count: {filteredProducts.length} Items</span>
        </div>
        
        {searchQuery && (
          <p className="text-sm text-gray-500 font-medium">
            Search results for: <span className="text-black font-extrabold">"{searchQuery}"</span>
          </p>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <CatalogCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 max-w-[640px] mx-auto w-full px-6 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-gray-500 mb-2">No matching products found</p>
          <p className="text-gray-400 text-base font-medium mb-6">
            We couldn't find anything matching your query. Try searching for "serum", "mask", "cream", or reset your filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="bg-black text-white px-6 py-3 rounded-full text-base font-bold hover:bg-gray-800 transition-colors shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
