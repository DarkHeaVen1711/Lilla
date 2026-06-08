"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

function formatCardNumber(value: string) {
  return value.replace(/\s?/g, "").replace(/(\d{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  return value.replace(/^(\d{2})\/?\s*(\d{0,2})/, "$1/$2");
}

function formatCvc(value: string) {
  return value.replace(/\D/g, "");
}

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const { cartItems } = useCommerce();
  const router = useRouter();

  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cart Financials
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * 0.20; // 20% mock discount
  const deliveryFee = subtotal > 51 || subtotal === 0 ? 0 : 15;
  const total = subtotal - discount + deliveryFee;

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("auth_redirect", "/checkout");
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (isAuthenticated && cartItems.length === 0) {
      router.push("/shop");
    }
  }, [cartItems, isAuthenticated, router]);

  if (!isAuthenticated || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF7F7]">
        <Loader2 className="w-10 h-10 animate-spin text-[#B55B52]" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName || !shippingAddress || !shippingCity || !shippingPostalCode || !cardNumber || !cardExpiry || !cardCvc) {
      setErrorMsg("Please fill out all shipping and billing fields.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
      
      const payload = {
        user_identifier: user?.auth_method || "guest_checkout",
        shipping_name: shippingName,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode,
        total_price: Number(total.toFixed(2)),
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          price: Number(item.price.toFixed(2)),
          quantity: item.quantity
        }))
      };

      const res = await fetch(`${backendUrl}/api/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("lilla_token") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const orderData = await res.json();
        // Redirect to order confirmation page
        router.push(`/order-confirmation/${orderData.id}`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Order creation failed. Please check details.");
        setIsProcessing(false);
      }
    } catch {
      setErrorMsg("Checkout failed. Could not communicate with Django API server.");
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FCFAF8] pt-12 pb-24 font-sans text-foreground">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <div className="bg-[#FCFAF8] p-8 rounded-2xl flex flex-col items-center text-black border border-black/5 shadow-2xl max-w-sm text-center">
            <Loader2 className="w-14 h-14 animate-spin text-[#B55B52] mb-6" />
            <h3 className="text-xl font-bold font-serif mb-2">Processing secure payment</h3>
            <p className="text-gray-500 text-sm">Please do not close or refresh this page. We are finalizing your cosmetics order.</p>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-5">
        {/* Breadcrumb */}
        <div className="flex items-center justify-start mb-6 text-sm font-semibold text-gray-400">
          <Link href="/cart" className="hover:text-black transition-colors">Cart</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-black">Checkout</span>
        </div>

        <h1 className="text-black font-serif text-[40px] md:text-[48px] leading-tight mb-8">Checkout</h1>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 font-semibold border border-red-200 rounded-xl p-4 mb-8">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form Column (Left) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col gap-8">
            {/* 1. Shipping Details */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <h2 className="text-xl font-bold font-serif mb-6 text-black border-b border-gray-100 pb-3">1. Shipping Details</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full h-[50px] border border-border rounded-lg px-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="123 Beauty Lane, Apt 4B"
                    className="w-full border border-border rounded-lg p-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                    <input
                      type="text"
                      required
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="New York"
                      className="w-full h-[50px] border border-border rounded-lg px-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Postal Code</label>
                    <input
                      type="text"
                      required
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      placeholder="10001"
                      className="w-full h-[50px] border border-border rounded-lg px-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Mock Payment Details */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                <h2 className="text-xl font-bold font-serif text-black">2. Payment Method</h2>
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded">
                  <ShieldCheck size={14} className="-mt-0.5" />
                  Secure
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 border border-border rounded-xl p-4 flex items-center gap-3.5 mb-2">
                  <CreditCard className="text-[#B55B52] w-6 h-6" />
                  <div>
                    <h4 className="text-[15px] font-bold text-black">Credit / Debit Card</h4>
                    <p className="text-xs text-gray-400">Mock payment processing enabled</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4000 1234 5678 9010"
                    className="w-full h-[50px] border border-border rounded-lg px-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expiry Date</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full h-[50px] border border-border rounded-lg px-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CVC</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(formatCvc(e.target.value))}
                      placeholder="123"
                      className="w-full h-[50px] border border-border rounded-lg px-4 text-black bg-white text-[15px] focus:border-primary outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-[56px] bg-black text-white rounded-xl text-lg font-bold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Pay ${total.toFixed(2)} & Place Order
            </button>
          </form>

          {/* Order Summary Column (Right) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-border shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col gap-6">
            <h3 className="text-xl font-bold font-serif border-b border-gray-100 pb-3 text-black">Order Summary</h3>

            {/* Items List */}
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-bold shrink-0">{item.quantity}x</span>
                    <span className="text-[15px] font-semibold text-black line-clamp-1">{item.name}</span>
                  </div>
                  <span className="text-[15px] font-bold text-black shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="border-gray-100" />

            {/* Price Calculations */}
            <div className="flex flex-col gap-3.5 text-sm font-semibold">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-black font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Discount (-20%)</span>
                <span className="text-[#B55B52] font-bold">-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Fee</span>
                <span className="text-black font-bold">
                  {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center mt-1">
              <span className="text-base font-bold text-black">Total Charge</span>
              <span className="text-2xl font-black text-black">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
