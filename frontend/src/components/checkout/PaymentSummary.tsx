"use client";

import { useStore } from "@/store/useStore";
import { Price } from "@/components/shared/Price";

export function PaymentSummary() {
  const { subtotal, discountAmount, shippingFee, orderTotal, couponActive, couponCode } = useStore((s) => s.cart);

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col">
      <h2 className="font-serif text-2xl mb-8">Order Summary</h2>

      {/* Calculations Matrix */}
      <div className="flex flex-col space-y-4 text-base text-gray-600 mb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <Price amount={subtotal} className="text-black font-medium" />
        </div>
        {couponActive && (
          <div className="flex justify-between text-green-600">
            <span>{couponCode} (-20%)</span>
            <span className="font-medium">-<Price amount={discountAmount} /></span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span className="text-black font-medium">{shippingFee === 0 ? "FREE" : <Price amount={shippingFee} />}</span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-200 mb-6" />

      <div className="flex justify-between items-center mb-2">
        <span className="text-xl font-bold text-black">Total</span>
        <Price amount={orderTotal} className="text-xl font-bold text-black" />
      </div>
    </div>
  );
}
