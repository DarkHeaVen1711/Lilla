"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";

export function CreditCardForm() {
  const router = useRouter();
  const cartItems = useStore((s) => s.cart.items);
  const { subtotal, discountAmount, shippingFee, orderTotal } = useStore((s) => s.cart);
  const billingAddress = useStore((s) => s.checkoutForm.billingAddress);
  const clearCart = useStore((s) => s.clearCart);
  const clearCheckoutForm = useStore((s) => s.clearCheckoutForm);
  const updateCardDetails = useStore((s) => s.updateCardDetails);
  const cardDetails = useStore((s) => s.checkoutForm.cardDetails);

  const [loading, setLoading] = useState(false);

  const cardNum = cardDetails?.cardNumber || "";
  const formatCardNumber = (raw: string) =>
    raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const handlePlaceOrder = async (e: React.MouseEvent) => {
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
        payment_method: "CARD",
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price.toFixed(2),
          quantity: item.quantity,
        })),
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("lilla-auth-token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Token ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/orders/`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) throw new Error(`Failed to place order: ${res.statusText}`);

      const orderData = await res.json();
      const orderWithImages = {
        ...orderData,
        items: orderData.items?.map((item: Record<string, unknown>) => {
          const ci = cartItems.find(c => c.id === item.product_id);
          return { ...item, image: ci?.image || null };
        }) ?? [],
      };

      localStorage.setItem("lilla-last-order", JSON.stringify(orderWithImages));
      clearCart();
      clearCheckoutForm();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full">
      <h2 className="font-serif text-3xl mb-8">Credit Card Details</h2>

      <div className="space-y-6 flex-grow flex flex-col">
        {/* Name on Card */}
        <input
          type="text"
          placeholder="Name on card"
          value={cardDetails?.nameOnCard || ""}
          onChange={(e) => updateCardDetails({ nameOnCard: e.target.value })}
          className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
        />

        {/* Card Number with chunking delimiters */}
        <input
          type="text"
          placeholder="0000 0000 0000 0000"
          value={formatCardNumber(cardNum)}
          onChange={(e) => updateCardDetails({ cardNumber: e.target.value.replace(/\D/g, "") })}
          className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors tracking-widest font-mono"
          maxLength={19}
        />

        {/* Expiry Date */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium text-sm ml-1">Expiry date</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <select
                value={cardDetails?.expiryMonth || ""}
                onChange={(e) => updateCardDetails({ expiryMonth: e.target.value })}
                className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors appearance-none bg-transparent"
              >
                <option value="" disabled>Month</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            <div className="relative">
              <select
                value={cardDetails?.expiryYear || ""}
                onChange={(e) => updateCardDetails({ expiryYear: e.target.value })}
                className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors appearance-none bg-transparent"
              >
                <option value="" disabled>Year</option>
                {Array.from({ length: 8 }, (_, i) => String(2025 + i)).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* CVV */}
        <div className="relative">
          <input
            type="password"
            placeholder="Card security code (CVV)"
            maxLength={4}
            value={cardDetails?.cvv || ""}
            onChange={(e) => updateCardDetails({ cvv: e.target.value })}
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-help">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Order Summary Mini */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-black">${subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span className="font-semibold text-black">{shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}</span></div>
          <div className="border-t border-gray-200 pt-1.5 flex justify-between text-base font-black text-black"><span>Total</span><span>${orderTotal.toFixed(2)}</span></div>
        </div>

        <div className="flex-grow" />

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-4 flex items-center justify-center disabled:bg-gray-500"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place order"}
        </button>
      </div>
    </div>
  );
}
