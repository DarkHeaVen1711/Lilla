"use client";

import { useCommerce } from "@/components/providers/CommerceProvider";

export function PaymentSummary() {
  const { cartItems } = useCommerce();

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = subtotal * 0.2;
  const deliveryFee = 15.0;
  const total = subtotal - discount + deliveryFee;

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col">
      <h2 className="font-serif text-2xl mb-8">Order Summary</h2>

      {/* Calculations Matrix */}
      <div className="flex flex-col space-y-4 text-base text-gray-600 mb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-black font-medium">${subtotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount (-20%)</span>
          <span className="text-brand-accent-red font-medium">-${discount.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span className="text-black font-medium">${deliveryFee.toFixed(0)}</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 mb-6" />

      <div className="flex justify-between items-center mb-2">
        <span className="text-xl font-bold text-black">Total</span>
        <span className="text-xl font-bold text-black">${total.toFixed(0)}</span>
      </div>
    </div>
  );
}
