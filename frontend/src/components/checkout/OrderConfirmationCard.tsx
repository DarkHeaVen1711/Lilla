"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";

export function OrderConfirmationCard() {
  const { cartItems } = useCommerce();

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col mt-6">
      {/* Upper Card Component Segment (Order Details) */}
      <h2 className="text-xl font-bold mb-6">Order details</h2>
      
      <div className="flex flex-col space-y-6">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-start relative gap-4">
            <div className="w-24 h-24 bg-brand-bg-checkout-thumb rounded-xl flex-shrink-0 flex items-center justify-center p-2 relative">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-xl" />
              )}
            </div>
            
            <div className="flex flex-col flex-grow pr-8">
              <span className="text-xs text-pink-500 font-bold uppercase tracking-wider mb-1">SKIN1004</span>
              <h3 className="text-sm font-medium text-gray-800 leading-tight mb-1">
                {item.name}
              </h3>
              <span className="text-xs text-gray-500 mb-2">50 ml</span>
              
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-black">${item.price}</span>
                <span className="text-sm text-gray-400 line-through">${(item.price * 1.25).toFixed(0)}</span>
                <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-sm">20% OFF</span>
              </div>
            </div>

            {/* Absolute close icon decoration marker (X) */}
            <button className="absolute right-0 top-0 text-gray-400 hover:text-black p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        {cartItems.length === 0 && (
          <div className="text-gray-500 text-sm py-4">No items found in your order.</div>
        )}
      </div>

      <div className="w-full h-px bg-gray-200 my-8" />

      {/* Lower Card Component Segment (Address Matrix) */}
      <h2 className="text-xl font-bold mb-4">Address</h2>
      <div className="flex flex-col space-y-2 text-gray-800">
        <span className="font-medium text-lg">John Doe</span>
        <span>0018999078</span>
        <span className="max-w-[300px]">55 East 10th Street, New York, NY 10003, United States</span>
      </div>
    </div>
  );
}
