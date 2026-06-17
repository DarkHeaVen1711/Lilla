"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { ShoppingBag, Loader2 } from "lucide-react";

interface Order {
  id: number;
  total_price: string;
  status: string;
  created_at: string;
  items: { product_name: string; price: string; quantity: number }[];
}

export default function OrdersPage() {
  const user = useStore((s) => s.user), openAuthModal = useStore((s) => s.openAuthModal);
  const [orders, setOrders] = useState<Order[]>([]), [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/orders").then(r => r.ok ? r.json() : []).then(d => {
      setOrders(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-5">
      <h1 className="text-4xl font-serif mb-4">Please Log In</h1>
      <p className="text-gray-500 mb-6">You must be logged in to view your purchase history.</p>
      <button onClick={() => openAuthModal("PHONE_INPUT")} className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
        Log In / Sign Up
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-5 lg:px-12 py-32 min-h-screen bg-white">
      <div className="mb-10 border-b border-gray-200/60 pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">Account</p>
        <h1 className="mt-3 text-5xl font-normal font-serif text-black md:text-7xl">My Orders</h1>
      </div>
      {orders.length === 0 ? (
        <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 max-w-[640px] mx-auto w-full px-6 flex flex-col items-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">No orders placed yet</h2>
          <p className="text-gray-400 mb-6">Explore our curated collections and start shopping.</p>
          <Link href="/shop" className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">Go to Shop</Link>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {orders.map((o) => (
            <div key={o.id} className="border border-gray-200/60 rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div><p className="text-xs text-gray-400 uppercase">Order ID</p><p className="text-sm font-semibold">#{o.id}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Date</p><p className="text-sm font-semibold">{new Date(o.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Total</p><p className="text-sm font-semibold">${parseFloat(o.total_price).toFixed(2)}</p></div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    o.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    o.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    "bg-gray-50 text-gray-700 border border-gray-200"
                  }`}>{o.status}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {o.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-3 first:pt-0 last:pb-0">
                    <div><p className="text-sm font-medium text-gray-900">{item.product_name}</p><p className="text-xs text-gray-500">Qty: {item.quantity}</p></div>
                    <p className="text-sm font-semibold text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
