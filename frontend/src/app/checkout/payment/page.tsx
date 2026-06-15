"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckoutBreadcrumbs } from "@/components/checkout/CheckoutBreadcrumbs";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/checkout/PaymentMethodSelector";
import { CreditCardForm } from "@/components/checkout/CreditCardForm";
import { PaymentSummary } from "@/components/checkout/PaymentSummary";

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Credit/Debit Card");
  return (
    <div className="w-full min-h-screen bg-brand-bg-cream flex justify-center pb-20 pt-10">
      <div className="w-full max-w-[1440px] px-8 lg:px-16 mx-auto min-h-[650px] flex flex-col">
        <CheckoutBreadcrumbs currentStep="payment" />
        
        <h1 className="font-serif text-4xl mb-8">Payment</h1>

        {/* Three-Column Segmented Interface Panels System */}
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
          
          {/* Column Block One (Left Options Navigation Selector) */}
          <div className="w-full lg:w-1/4">
            <PaymentMethodSelector selectedMethod={selectedMethod} onSelectMethod={setSelectedMethod} />
          </div>

          {/* Column Block Two (Center Data Collection Canvas) */}
          <div className="w-full lg:w-2/4">
            {selectedMethod === "Credit/Debit Card" && <CreditCardForm />}
            
            {selectedMethod === "Cash On Delivery" && (
              <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full min-h-[400px]">
                <h2 className="font-serif text-3xl mb-8">Cash On Delivery</h2>
                <p className="text-gray-600 mb-8 flex-grow">
                  You can pay in cash to our courier when you receive the goods at your doorstep. Please ensure you have the exact amount ready.
                </p>
                <Link 
                  href="/checkout/success"
                  className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center"
                >
                  Place order
                </Link>
              </div>
            )}

            {selectedMethod === "Net Banking" && (
              <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full min-h-[400px]">
                <h2 className="font-serif text-3xl mb-8">Net Banking</h2>
                <p className="text-gray-600 mb-8 flex-grow">
                  You will be redirected to your bank's secure portal to complete the payment. Make sure you have your banking credentials ready.
                </p>
                <Link 
                  href="/checkout/success"
                  className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center"
                >
                  Proceed to Bank
                </Link>
              </div>
            )}
          </div>

          {/* Column Block Three (Right Fixed Calculations Box) */}
          <div className="w-full lg:w-1/4">
            <PaymentSummary />
          </div>

        </div>
      </div>
    </div>
  );
}
