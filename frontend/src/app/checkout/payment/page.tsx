"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutBreadcrumbs } from "@/components/checkout/CheckoutBreadcrumbs";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/checkout/PaymentMethodSelector";
import { CreditCardForm } from "@/components/checkout/CreditCardForm";
import { PaymentSummary } from "@/components/checkout/PaymentSummary";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { Loader2 } from "lucide-react";

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("Credit/Debit Card");
  const router = useRouter();
  const { cartItems, clearCart } = useCommerce();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async (e: React.MouseEvent, method: string) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }
    setLoading(true);
    try {
      const billingSaved = localStorage.getItem("lilla-checkout-billing");
      const billing = billingSaved ? JSON.parse(billingSaved) : {};

      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const discount = subtotal * 0.2;
      const deliveryFee = 15.0;
      const total = subtotal - discount + deliveryFee;

      const orderPayload = {
        user_identifier: billing.email || billing.phone || "guest@lilla.com",
        shipping_name: `${billing.firstName || "John"} ${billing.lastName || "Doe"}`.trim(),
        shipping_address: `${billing.address || "123 Main St"}, ${billing.state || "NY"}, ${billing.country || "US"}`.trim(),
        shipping_city: billing.city || "New York",
        shipping_postal_code: billing.zip || "10001",
        total_price: total.toFixed(2),
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price.toFixed(2),
          quantity: item.quantity
        }))
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE_URL}/api/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        throw new Error(`Failed to place order: ${res.statusText}`);
      }

      const orderData = await res.json();
      
      const orderWithImages = {
        ...orderData,
        items: orderData.items.map((item: any) => {
          const cartItem = cartItems.find(ci => ci.id === item.product_id);
          return {
            ...item,
            image: cartItem?.image || null
          };
        })
      };

      localStorage.setItem("lilla-last-order", JSON.stringify(orderWithImages));
      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                <button 
                  onClick={(e) => handlePlaceOrder(e, "Cash On Delivery")}
                  disabled={loading}
                  className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center disabled:bg-gray-500"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place order"}
                </button>
              </div>
            )}

            {selectedMethod === "Net Banking" && (
              <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full min-h-[400px]">
                <h2 className="font-serif text-3xl mb-8">Net Banking</h2>
                <p className="text-gray-600 mb-8 flex-grow">
                  You will be redirected to your bank's secure portal to complete the payment. Make sure you have your banking credentials ready.
                </p>
                <button 
                  onClick={(e) => handlePlaceOrder(e, "Net Banking")}
                  disabled={loading}
                  className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center disabled:bg-gray-500"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Proceed to Bank"}
                </button>
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
