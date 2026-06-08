"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { Loader2, CheckCircle2, ShoppingBag } from "lucide-react";

type OrderDetail = {
  id: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  total_price: string;
  status: string;
  created_at: string;
  items: Array<{
    product_id: string;
    product_name: string;
    price: string;
    quantity: number;
  }>;
};

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { clearCart } = useCommerce();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Clear cart upon arriving at confirmation page
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Fetch order details from Django
  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/orders/${id}/`);
        
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setErrorMsg("Could not locate the requested order details.");
        }
      } catch {
        setErrorMsg("Failed to query order status from Django.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FCFAF8]">
        <Loader2 className="w-10 h-10 animate-spin text-[#B55B52]" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FCFAF8] px-5 text-center">
        <h2 className="text-2xl font-serif text-black font-semibold mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-500 max-w-md mb-8">{errorMsg || "We couldn't retrieve your order details."}</p>
        <Link href="/" className="bg-black text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors">
          Go back Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCFAF8] pt-16 pb-28 font-sans text-foreground">
      <div className="max-w-[700px] mx-auto px-5 flex flex-col items-center">
        {/* Checkmark Animation & Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <CheckCircle2 className="w-20 h-20 text-green-600 mb-4 animate-bounce" />
          <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full mb-3">
            Payment Success
          </span>
          <h1 className="text-black font-serif text-[36px] sm:text-[48px] font-normal leading-tight">
            Order Confirmed!
          </h1>
          <p className="text-gray-400 text-[16px] max-w-sm mt-3">
            Thank you for shopping at Lilla. Your payment has been processed and your cosmetics are being packaged.
          </p>
        </div>

        {/* Invoice Summary Frame */}
        <div className="w-full bg-white rounded-3xl border border-border shadow-[0_15px_40px_rgba(0,0,0,0.03)] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
              <p className="text-sm font-bold text-black font-mono mt-0.5">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</p>
              <p className="text-sm font-semibold text-black mt-0.5">
                {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </p>
            </div>
          </div>

          {/* Shipping Summary */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipping To</h4>
            <div className="text-[15px] text-black font-semibold">
              <p>{order.shipping_name}</p>
              <p className="text-gray-500 font-medium mt-0.5">{order.shipping_address}</p>
              <p className="text-gray-500 font-medium">{order.shipping_city}, {order.shipping_postal_code}</p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Items Summary */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items Purchased</h4>
            <div className="flex flex-col gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center gap-4 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold shrink-0">{item.quantity}x</span>
                    <span className="text-black line-clamp-1">{item.product_name}</span>
                  </div>
                  <span className="text-black font-bold shrink-0">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Total Row */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-bold text-black">Total Paid</span>
            <span className="text-2xl font-black text-[#B55B52]">${Number(order.total_price).toFixed(2)}</span>
          </div>
        </div>

        {/* Shopping Action */}
        <div className="mt-12 w-full flex flex-col sm:flex-row gap-4">
          <Link href="/shop" className="flex-1 h-[56px] border border-black text-black rounded-xl text-base font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
          <Link href="/" className="flex-1 h-[56px] bg-black text-white rounded-xl text-base font-bold hover:bg-gray-800 transition-colors flex items-center justify-center">
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
