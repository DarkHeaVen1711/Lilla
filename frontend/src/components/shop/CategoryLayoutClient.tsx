"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, Heart, Star } from "lucide-react";
import Image from "next/image";
import { HoverAddToCart } from "@/components/ui/HoverAddToCart";
import { useCommerce } from "@/components/providers/CommerceProvider";
import type { FrontendProduct } from "@/lib/woocommerce";

type CategoryLayoutClientProps = {
  products: FrontendProduct[];
  categoryName: string;
  breadcrumbPath: string;
  title: string;
};

export function CategoryLayoutClient({
  products,
  categoryName,
  breadcrumbPath,
  title,
}: CategoryLayoutClientProps) {
  const { toggleFavorite, isFavorite } = useCommerce();
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>("Lip Balm");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Accordion states
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isBrandsOpen, setIsBrandsOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isConcernOpen, setIsConcernOpen] = useState(false);
  const [isSkinTypeOpen, setIsSkinTypeOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  // Sort state
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  const sortOptions = [
    { id: "rating", label: "5 Star Rating" },
    { id: "price_low", label: "Price: Low to High" },
    { id: "price_high", label: "Price: High to Low" },
    { id: "name_az", label: "Alphabetical: A-Z" },
  ];

  const subcategories = [
    "Lip Balm",
    "Eye Cream",
    "Moisturizer",
    "Cleansers",
    "Serums",
    "Masks",
    "Scrubs",
  ];

  // In a real app, this would filter by activeSubcategory and searchQuery
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (searchQuery) {
        return p.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true; // For mock, just return all category products
    });

    // Apply Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "name_az":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, activeSubcategory, sortBy]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-10 mt-[80px]">
      {/* Breadcrumbs */}
      <div className="flex justify-center items-center text-xs font-semibold text-gray-400 mb-8 tracking-wider">
        <Link href="/" className="hover:text-black transition-colors">Homepage</Link>
        <span className="mx-2">&gt;</span>
        <span className="hover:text-black cursor-pointer transition-colors">Category</span>
        <span className="mx-2">&gt;</span>
        <span className="text-black">{breadcrumbPath}</span>
      </div>

      {/* Title */}
      <div className="mb-12">
        <h1 className="text-[40px] font-serif font-normal text-black text-left">
          {title} <span className="text-2xl text-gray-400 font-sans tracking-tight">({filteredProducts.length} items)</span>
        </h1>
        
        {/* Sort Bar */}
        <div className="flex items-center mt-6">
          <span className="text-sm font-semibold text-gray-700 mr-3">Sort by :</span>
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              onBlur={() => setTimeout(() => setIsSortOpen(false), 200)}
              className="flex items-center justify-between border border-gray-200 bg-white rounded-md px-4 py-2 text-sm font-semibold w-[190px] hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              {sortOptions.find((opt) => opt.id === sortBy)?.label || "Select..."}
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isSortOpen && (
              <div className="absolute top-full left-0 mt-1 w-[190px] bg-white border border-gray-100 shadow-[0_10px_20px_rgba(0,0,0,0.08)] rounded-md overflow-hidden z-50 py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === option.id 
                        ? "bg-gray-50 text-brand-primary font-bold" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-black font-medium"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-[260px] shrink-0">
          <div className="border border-gray-100 rounded-xl p-5 shadow-sm bg-white">
            <h2 className="text-xl font-bold font-sans text-black mb-6">Filters</h2>
            
            {/* Category Accordion */}
            <div className="border-b border-gray-100 pb-4 mb-4">
              <button 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm mb-4"
              >
                Category
                {isCategoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {isCategoryOpen && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </div>
                  
                  {/* Subcategories */}
                  <ul className="space-y-3 pl-1">
                    {subcategories.map((sub) => (
                      <li key={sub}>
                        <button 
                          onClick={() => setActiveSubcategory(sub)}
                          className={`text-sm font-medium transition-colors ${
                            activeSubcategory === sub ? "text-brand-primary" : "text-gray-500 hover:text-black"
                          }`}
                        >
                          {sub}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Brands */}
            <div className="border-b border-gray-100 pb-4 mb-4">
              <button 
                onClick={() => setIsBrandsOpen(!isBrandsOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm"
              >
                Brands
                {isBrandsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Price */}
            <div className="border-b border-gray-100 pb-4 mb-4">
              <button 
                onClick={() => setIsPriceOpen(!isPriceOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm mb-4"
              >
                Price
                {isPriceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {isPriceOpen && (
                <div className="px-2">
                  <div className="relative w-full h-1 bg-gray-200 rounded-full mt-4 mb-3">
                    {/* Mock Range Track */}
                    <div className="absolute left-0 right-[20%] h-full bg-black rounded-full"></div>
                    {/* Mock Handles */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-pointer"></div>
                    <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-pointer"></div>
                  </div>
                  <div className="text-sm font-bold text-black mt-3">
                    $50-$550
                  </div>
                </div>
              )}
            </div>

            {/* Shop By Concern */}
            <div className="border-b border-gray-100 pb-4 mb-4">
              <button 
                onClick={() => setIsConcernOpen(!isConcernOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm"
              >
                Shop By Concern
                {isConcernOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Skin Type */}
            <div className="border-b border-gray-100 pb-4 mb-4">
              <button 
                onClick={() => setIsSkinTypeOpen(!isSkinTypeOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm"
              >
                Skin Type
                {isSkinTypeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Discount */}
            <div className="pb-2">
              <button 
                onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm"
              >
                Discount
                {isDiscountOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="flex flex-col gap-4 group cursor-pointer font-sans">
                  {/* Image Container */}
                  <div className="relative w-full aspect-[4/5] bg-brand-bg-image rounded-[24px] overflow-hidden flex items-center justify-center p-6 transition-colors duration-300">
                    {/* Discount Badge inside top-left */}
                    {prod.discount && (
                      <div className="absolute top-4 left-4 z-10 bg-brand-primary-light text-brand-secondary px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {prod.discount}
                      </div>
                    )}
                    
                    {/* Like Button inside top-right */}
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(prod as any); }}
                      className="absolute top-4 right-4 z-20 w-[34px] h-[34px] bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                      aria-label="Like product"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(prod.id) ? 'fill-brand-primary text-brand-primary' : 'text-black'}`} />
                    </button>

                    <Link href={`/products/${prod.slug}`} className="absolute inset-0 m-auto w-full h-full cursor-pointer mix-blend-multiply">
                      <Image
                        src={prod.image}
                        alt={prod.name}
                        fill
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </Link>
                    
                    {/* Star Rating Badge inside bottom-right */}
                    <div className="absolute bottom-4 right-4 z-10 bg-white shadow-sm px-2.5 py-1 rounded-md flex items-center gap-1 transition-opacity duration-300 group-hover:opacity-0">
                      <Star className="w-3.5 h-3.5 fill-brand-rating-star text-brand-rating-star" />
                      <span className="text-black font-bold text-[12px] leading-none font-sans">
                        {(prod.rating || 4.8).toFixed(1)}
                      </span>
                      <span className="text-gray-500 font-medium text-[12px] leading-none ml-0.5 font-sans border-l border-gray-200 pl-1">
                        {prod.reviews || "1.2k"}
                      </span>
                    </div>

                    {/* Global Add to Cart Button (Hover - Centered) */}
                    <HoverAddToCart product={prod as any} />
                  </div>

                  {/* Typography below image */}
                  <div className="flex flex-col gap-1 px-1">
                    <Link href={`/products/${prod.slug}`}>
                      <h3 className="text-[16px] font-medium text-black leading-tight hover:text-brand-primary transition-colors line-clamp-2 min-h-[44px]">
                        {prod.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[18px] font-bold text-black">
                        ${prod.price}
                      </span>
                      {prod.originalPrice && (
                        <span className="text-[16px] text-gray-400 font-medium line-through decoration-1">
                          ${prod.originalPrice}
                        </span>
                      )}
                      {prod.discount && (
                        <span className="bg-brand-primary-light text-brand-secondary px-2.5 py-0.5 rounded-full text-[13px] font-bold">
                          {prod.discount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-semibold">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
