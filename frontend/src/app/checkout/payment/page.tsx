"use client";

import { useRouter } from "next/navigation";
import { CheckoutBreadcrumbs } from "@/components/checkout/CheckoutBreadcrumbs";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { CreditCardForm } from "@/components/checkout/CreditCardForm";
import { PaymentSummary } from "@/components/checkout/PaymentSummary";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51PlaceholderKey");

export default function PaymentPage() {
  const router = useRouter();
  const cartItems = useStore((s) => s.cart.items);
  const orderTotal = useStore((s) => s.cart.orderTotal);
  const billingAddress = useStore((s) => s.checkoutForm.billingAddress);
  const clearCart = useStore((s) => s.clearCart);
  const clearCheckoutForm = useStore((s) => s.clearCheckoutForm);
  const paymentMethod = useStore((s) => s.checkoutForm.paymentMethod);
  const setPaymentMethod = useStore((s) => s.setPaymentMethod);
  const [loading, setLoading] = useState(false);

  // Map Zustand PaymentMethodType to display string
  const methodDisplay = { COD: "Cash On Delivery", CARD: "Credit/Debit Card", NETBANKING: "Net Banking" } as const;
  const displayToType = { "Cash On Delivery": "COD", "Credit/Debit Card": "CARD", "Net Banking": "NETBANKING" } as const;

  const handlePlaceOrder = async (e: React.MouseEvent, method: string) => {
    e.preventDefault();
    if (cartItems.length === 0) { alert("Your cart is empty"); return; }
    setLoading(true);
    try {
      const orderPayload = {
        user_identifier: billingAddress.email || billingAddress.phone || "guest@lilla.com",
        shipping_name: `${billingAddress.firstName} ${billingAddress.lastName}`.trim() || "Guest User",
        shipping_address: `${billingAddress.address}, ${billingAddress.state}, ${billingAddress.country}`.trim(),
        shipping_city: billingAddress.city || "New York",
        shipping_postal_code: billingAddress.zip || "10001",
        total_price: orderTotal.toFixed(2),
        payment_method: method,
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price.toFixed(2),
          quantity: item.quantity,
        })),
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const res = await fetch("/api/orders", { method: "POST", headers, body: JSON.stringify(orderPayload) });
      if (!res.ok) throw new Error(`Failed to place order: ${res.statusText}`);

      const orderData = await res.json();
      const orderWithImages = { ...orderData, items: orderData.items?.map((item: Record<string, unknown>) => ({ ...item, image: cartItems.find(c => c.id === item.product_id)?.image || null })) ?? [] };
      localStorage.setItem("lilla-last-order", JSON.stringify(orderWithImages));
      clearCart();
      clearCheckoutForm();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Error placing order. Please try again.");
    } finally { setLoading(false); }
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
            <PaymentMethodSelector
              selectedMethod={methodDisplay[paymentMethod]}
              onSelectMethod={(m) => setPaymentMethod(displayToType[m])}
            />
          </div>

          {/* Column Block Two (Center Data Collection Canvas) */}
          <div className="w-full lg:w-2/4">
            {paymentMethod === "CARD" && (
              <Elements stripe={stripePromise}>
                <CreditCardForm />
              </Elements>
            )}
            
            {paymentMethod === "COD" && (
              <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full min-h-[400px]">
                <h2 className="font-serif text-3xl mb-8">Cash On Delivery</h2>
                <p className="text-gray-600 mb-8 flex-grow">You can pay in cash to our courier when you receive the goods at your doorstep. Please ensure you have the exact amount ready.</p>
                <button onClick={(e) => handlePlaceOrder(e, "COD")} disabled={loading}
                  className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center disabled:bg-gray-500">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place order"}
                </button>
              </div>
            )}

            {paymentMethod === "NETBANKING" && (
              <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full min-h-[400px]">
                <h2 className="font-serif text-3xl mb-8">Net Banking</h2>
                <p className="text-gray-600 mb-8 flex-grow">You will be redirected to your bank's secure portal to complete the payment. Make sure you have your banking credentials ready.</p>
                <button onClick={(e) => handlePlaceOrder(e, "NETBANKING")} disabled={loading}
                  className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center disabled:bg-gray-500">
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
