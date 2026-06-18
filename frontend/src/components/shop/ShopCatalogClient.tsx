"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, X, ArrowUpDown, Filter } from "lucide-react";
import { CatalogCard } from "@/components/shop/CatalogCard";
import type { CommerceProduct } from "@/lib/homepageData";
import { getProducts } from "@/lib/productAdapter";

type ShopCatalogClientProps = {
  initialProducts: CommerceProduct[];
};

export function ShopCatalogClient({ initialProducts }: ShopCatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<CommerceProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active filters & sorting states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState("");

  // Filter definitions
  const allCategories = [
    { slug: "treatments-mask", label: "Treatments & Mask" },
    { slug: "daily-essentials", label: "Daily Essentials" },
    { slug: "color-cosmetics", label: "Color Cosmetics" },
    { slug: "face-makeup", label: "Face Makeup" },
  ];

  const allConcerns = useMemo(() => {
    const concernsSet = new Set<string>();
    initialProducts.forEach((p) => {
      p.skinConcerns?.forEach((c) => concernsSet.add(c));
    });
    return Array.from(concernsSet).sort();
  }, [initialProducts]);

  const allIngredients = useMemo(() => {
    const ingredientsSet = new Set<string>();
    initialProducts.forEach((p) => {
      p.keyIngredients?.forEach((i) => ingredientsSet.add(i));
    });
    return Array.from(ingredientsSet).sort();
  }, [initialProducts]);

  // Dynamic products fetching matching active filter lists & sort criteria
  useEffect(() => {
    let isMounted = true;
    const loadFilteredProducts = async () => {
      setLoading(true);
      try {
        const results = await getProducts({
          categories: selectedCategories,
          concerns: selectedConcerns,
          ingredients: selectedIngredients,
          sort: activeSort || undefined,
        });
        if (isMounted) {
          let filtered = results;
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = results.filter((p) =>
              p.name.toLowerCase().includes(query) ||
              p.description.toLowerCase().includes(query) ||
              p.category?.toLowerCase().includes(query)
            );
          }
          setProducts(filtered);
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFilteredProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedCategories, selectedConcerns, selectedIngredients, activeSort, searchQuery, initialProducts]);

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
        <button
          onClick={() => setSelectedCategories([])}
          className={`px-6 py-2.5 rounded-full text-base font-bold transition-all border ${
            selectedCategories.length === 0
              ? "bg-black border-black text-white shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
          }`}
        >
          Shop All
        </button>
        {allCategories.map((cat) => {
          const isActive = selectedCategories.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              onClick={() => {
                if (isActive) {
                  setSelectedCategories(selectedCategories.filter((slug) => slug !== cat.slug));
                } else {
                  setSelectedCategories([...selectedCategories, cat.slug]);
                }
              }}
              className={`px-6 py-2.5 rounded-full text-base font-bold transition-all border ${
                isActive
                  ? "bg-black border-black text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Products Results Header */}
      <div className="flex items-center justify-between border-b border-gray-200/60 pb-4 mt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 bg-brand-bg-gray border border-gray-200 hover:border-black rounded-full px-5 py-2.5 text-sm font-bold text-black transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters & Sorting
            {(selectedCategories.length > 0 || selectedConcerns.length > 0 || selectedIngredients.length > 0 || activeSort) && (
              <span className="bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-extrabold ml-1">
                {(selectedCategories.length > 0 ? 1 : 0) + (selectedConcerns.length > 0 ? 1 : 0) + (selectedIngredients.length > 0 ? 1 : 0) + (activeSort ? 1 : 0)}
              </span>
            )}
          </button>
          <span className="text-gray-500 font-bold text-sm uppercase tracking-wider hidden sm:inline-block">
            Results count: {products.length} Items
          </span>
        </div>
        
        {searchQuery && (
          <p className="text-sm text-gray-500 font-medium">
            Search results for: <span className="text-black font-extrabold">"{searchQuery}"</span>
          </p>
        )}
      </div>

      {/* Products Grid / Skeletons */}
      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4 border border-gray-100 rounded-3xl p-5 animate-pulse bg-white">
              <div className="aspect-square w-full rounded-2xl bg-gray-100"></div>
              <div className="h-4 w-1/3 bg-gray-100 rounded-full mt-2"></div>
              <div className="h-6 w-3/4 bg-gray-100 rounded-full"></div>
              <div className="h-5 w-1/2 bg-gray-100 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <CatalogCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 max-w-[640px] mx-auto w-full px-6 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-gray-500 mb-2">No matching products found</p>
          <p className="text-gray-400 text-base font-medium mb-6">
            We couldn't find anything matching your filters or query. Try refining your selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategories([]);
              setSelectedConcerns([]);
              setSelectedIngredients([]);
              setActiveSort("");
            }}
            className="bg-black text-white px-6 py-3 rounded-full text-base font-bold hover:bg-gray-800 transition-colors shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      )}
      {/* Sliding Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[400px] h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-2xl font-bold font-serif text-black">Filter & Sort</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-black" />
              </button>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
              {/* Sorting Section */}
              <div className="space-y-3">
                <h4 className="text-base font-extrabold uppercase tracking-wider text-gray-400">Sort By</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "", label: "Featured" },
                    { id: "price_asc", label: "Price: Low to High" },
                    { id: "price_desc", label: "Price: High to Low" },
                    { id: "rating", label: "Top Rated" },
                    { id: "newest", label: "Newest Arrivals" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setActiveSort(option.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold text-left transition-all border ${
                        activeSort === option.id
                          ? "bg-black border-black text-white shadow-sm"
                          : "bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedConcerns([]);
                  setSelectedIngredients([]);
                  setActiveSort("");
                }}
                className="flex-1 py-3.5 border border-gray-300 hover:border-black rounded-xl text-sm font-bold text-black bg-white transition-all"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="flex-1 py-3.5 bg-black hover:bg-gray-800 rounded-xl text-sm font-bold text-white transition-all shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
