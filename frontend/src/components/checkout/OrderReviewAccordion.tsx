"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, X, Minus, Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Price } from "@/components/shared/Price";

export function OrderReviewAccordion() {
  const [isOpen, setIsOpen] = useState(true);
  const cartItems = useStore((s) => s.cart.items);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const { subtotal, discountAmount, shippingFee, orderTotal, couponActive } = useStore((s) => s.cart);
  const discount = discountAmount;

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col h-full font-sans">
      <div 
        className="flex items-center justify-between cursor-pointer select-none mb-6"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="font-serif text-2xl">Order Review</h2>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </div>

      {isOpen && (
        <div className="flex flex-col space-y-6 flex-grow">
          {/* Items List */}
          <div className="flex flex-col space-y-4 flex-grow overflow-y-auto pr-2 max-h-[300px]">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center relative gap-4">
                <div className="w-20 h-20 bg-brand-bg-checkout-thumb rounded-xl flex-shrink-0 flex items-center justify-center p-2 relative">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-xl" />
                  )}
                </div>
                
                <div className="flex flex-col flex-grow pr-8">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-2">
                    {item.name}
                  </h3>
                  <Price amount={item.price} className="text-lg font-bold text-black block" />
                </div>

                {/* Quantity Control Pill */}
                <div className="absolute right-8 bottom-0 flex items-center border border-gray-200 rounded-full h-8 px-2 gap-3 text-sm">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="text-gray-500 hover:text-black"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-medium min-w-[12px] text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="text-gray-500 hover:text-black"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete Button */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute right-0 top-0 text-gray-400 hover:text-black p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4">Your cart is empty</div>
            )}
          </div>

          <div className="w-full h-px bg-gray-200 my-4" />

          {/* Calculations Matrix */}
          <div className="flex flex-col space-y-3 text-base text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <Price amount={subtotal} className="text-black font-medium" />
            </div>
            {couponActive && (
              <div className="flex justify-between text-green-600">
                <span>TRYBEAUTY (-20%)</span>
                <span className="font-medium">-<Price amount={discount} /></span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-black font-medium">{shippingFee === 0 ? "FREE" : <Price amount={shippingFee} />}</span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 mb-4" />

          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-black">Total</span>
            <Price amount={orderTotal} className="text-xl font-bold text-black" />
          </div>

          {/* Checkout Button */}
          <Link 
            href="/checkout/payment"
            className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-auto flex items-center justify-center"
          >
            Payments
          </Link>
        </div>
      )}
    </div>
  );
}
