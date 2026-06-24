"use client";

import { useState } from "react";
import Image from "next/image";
import { GitCompare, X, ShoppingCart, Star, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Price } from "@/components/shared/Price";
import { m as motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function ComparisonTray() {
  const compareProducts = useStore((s) => s.compareProducts);
  const removeFromCompare = useStore((s) => s.removeFromCompare);
  const clearCompare = useStore((s) => s.clearCompare);
  const addToCart = useStore((s) => s.addToCart);

  const [isOpen, setIsOpen] = useState(false);

  if (compareProducts.length === 0) return null;

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart!`, {
      icon: <ShoppingCart className="w-4 h-4 text-pink-500" />,
    });
  };

  // Helper to extract nested JSON values safely
  const getSkinConcerns = (p: any) => {
    if (Array.isArray(p.skin_concerns)) return p.skin_concerns.join(", ");
    if (p.skin_concerns) return String(p.skin_concerns);
    return "All Skin Types";
  };

  const getKeyIngredients = (p: any) => {
    if (Array.isArray(p.key_ingredients)) return p.key_ingredients.join(", ");
    if (p.key_ingredients) return String(p.key_ingredients);
    return "Natural extracts";
  };

  const getSkinTypes = (p: any) => {
    if (Array.isArray(p.skin_types)) return p.skin_types.join(", ");
    if (p.skin_types) return String(p.skin_types);
    return "All skin types";
  };

  return (
    <>
      {/* Sticky Bottom Bar Tray */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[92%] max-w-[800px] font-sans">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 180 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_15px_50px_rgba(0,0,0,0.1)] rounded-3xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          {/* Left section: Product Previews */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-2 mr-2">
              <div className="w-9 h-9 rounded-full bg-[#B58B5E]/10 flex items-center justify-center text-[#B58B5E]">
                <GitCompare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 hidden sm:inline">Compare</span>
            </div>

            <div className="flex items-center gap-3">
              {compareProducts.map((prod) => (
                <div key={prod.id} className="relative group flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5 relative overflow-hidden shadow-inner">
                    <Image
                      src={prod.image}
                      alt={prod.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={() => removeFromCompare(prod.id)}
                    className="absolute -top-1.5 -right-1.5 bg-black text-white hover:bg-red-600 rounded-full w-5 h-5 flex items-center justify-center border border-white transition-all shadow-md"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, 3 - compareProducts.length) }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300"
                  title="Add more products to compare"
                >
                  <Plus className="w-4 h-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={clearCompare}
              className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-full"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
            >
              Compare Now ({compareProducts.length})
            </button>
          </div>
        </motion.div>
      </div>

      {/* Comparison Grid Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 font-sans"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-[1100px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 md:px-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#FAF8F5] to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#B58B5E]/10 flex items-center justify-center text-[#B58B5E]">
                    <GitCompare className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-black">Product Comparison Matrix</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500 hover:text-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Compare Table */}
              <div className="flex-1 overflow-auto p-6 md:p-8">
                <div className="min-w-[650px] w-full grid grid-cols-4 gap-4 border-collapse">
                  {/* Column 1: Feature Labels */}
                  <div className="space-y-4 pt-[180px]">
                    <div className="h-[50px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Category</div>
                    <div className="h-[50px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Price</div>
                    <div className="h-[60px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Rating</div>
                    <div className="h-[70px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Skin Concerns</div>
                    <div className="h-[70px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Key Actives</div>
                    <div className="h-[60px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Skin Types</div>
                    <div className="h-[50px] flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Fulfillment</div>
                  </div>

                  {/* Product Columns (up to 3) */}
                  {compareProducts.map((prod) => (
                    <div key={prod.id} className="col-span-1 flex flex-col items-center text-center space-y-4 bg-gradient-to-b from-[#FAF8F5]/30 to-white border border-gray-100 rounded-2xl p-4 relative group">
                      
                      {/* Product Header Info */}
                      <div className="h-[180px] flex flex-col items-center justify-between w-full pb-4 border-b border-gray-100">
                        <div className="relative w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-gray-100">
                          <Image
                            src={prod.image}
                            alt={prod.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mt-2 px-1">
                          {prod.name}
                        </h4>
                      </div>

                      {/* Row: Category */}
                      <div className="h-[50px] flex items-center justify-center text-sm font-bold text-gray-500 capitalize w-full border-b border-gray-100/50">
                        {prod.category || "Skincare"}
                      </div>

                      {/* Row: Price */}
                      <div className="h-[50px] flex items-center justify-center text-base font-extrabold text-black w-full border-b border-gray-100/50">
                        <Price amount={parseFloat(prod.price)} />
                      </div>

                      {/* Row: Rating */}
                      <div className="h-[60px] flex flex-col items-center justify-center gap-1 w-full border-b border-gray-100/50">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-3.5 h-3.5 ${
                                idx < Math.floor(prod.rating || 4.8) 
                                  ? "fill-current" 
                                  : "text-gray-200"
                              }`} 
                            />
                          ))}
                          <span className="text-xs font-bold text-gray-900 ml-1.5">
                            {parseFloat(prod.rating || 4.8).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          ({prod.reviews || 108} reviews)
                        </span>
                      </div>

                      {/* Row: Skin Concerns */}
                      <div className="h-[70px] flex items-center justify-center text-xs font-medium text-gray-600 w-full px-2 border-b border-gray-100/50 line-clamp-3">
                        {getSkinConcerns(prod)}
                      </div>

                      {/* Row: Key Ingredients */}
                      <div className="h-[70px] flex items-center justify-center text-xs font-semibold text-gray-700 w-full px-2 border-b border-gray-100/50 line-clamp-3">
                        {getKeyIngredients(prod)}
                      </div>

                      {/* Row: Skin Types */}
                      <div className="h-[60px] flex items-center justify-center text-xs font-medium text-gray-600 w-full px-2 border-b border-gray-100/50">
                        {getSkinTypes(prod)}
                      </div>

                      {/* Row: Stock */}
                      <div className="h-[50px] flex items-center justify-center text-xs font-bold w-full border-b border-gray-100/50">
                        {prod.stock > 0 ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            In Stock ({prod.stock})
                          </span>
                        ) : (
                          <span className="text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Purchase Actions */}
                      <div className="w-full pt-4 flex flex-col gap-2">
                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={prod.stock <= 0}
                          className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromCompare(prod.id)}
                          className="w-full border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty Columns placeholders if less than 3 */}
                  {Array.from({ length: Math.max(0, 3 - compareProducts.length) }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className="col-span-1 border-2 border-dashed border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-300 min-h-[500px]"
                    >
                      <Plus className="w-8 h-8 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Add Product</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
