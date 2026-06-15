"use client";

import { useState } from "react";

export type PaymentMethod = "Cash On Delivery" | "Credit/Debit Card" | "Net Banking";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) {
  const methods: PaymentMethod[] = ["Cash On Delivery", "Credit/Debit Card", "Net Banking"];

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm font-sans flex flex-col gap-4">
      {methods.map((method) => {
        const isSelected = selectedMethod === method;
        return (
          <div 
            key={method}
            className="flex items-center gap-3 cursor-pointer py-2"
            onClick={() => onSelectMethod(method)}
          >
            {/* Radio Bubble */}
            <div 
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected ? "border-brand-accent-red" : "border-gray-300"
              }`}
            >
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-brand-accent-red" />
              )}
            </div>
            
            {/* Label */}
            <span 
              className={`text-base font-medium transition-colors ${
                isSelected ? "text-brand-accent-red" : "text-gray-700"
              }`}
            >
              {method}
            </span>
          </div>
        );
      })}
    </div>
  );
}
