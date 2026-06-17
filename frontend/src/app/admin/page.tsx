"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users } from "lucide-react";

export default function AdminDashboard() {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "users">("overview");

  useEffect(() => {
    if (!user || !user.isStaff) {
      router.push("/");
    }
  }, [user, router]);

  if (!user || !user.isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Access Denied. Redirecting...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col lg:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col p-6 pt-28 lg:pt-32">
        <div className="flex items-center gap-2 mb-8 px-2">
          <LayoutDashboard className="w-5 h-5 text-gray-900" />
          <h2 className="font-bold text-gray-900 text-lg">Admin Panel</h2>
        </div>
        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {(["overview", "products", "orders", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              {tab === "overview" && <LayoutDashboard className="w-4 h-4" />}
              {tab === "products" && <ShoppingBag className="w-4 h-4" />}
              {tab === "orders" && <ShoppingCart className="w-4 h-4" />}
              {tab === "users" && <Users className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 pt-6 lg:pt-32 max-w-[1200px]">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            <h1 className="font-serif text-3xl text-black">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Catalog Items", val: "Loading...", icon: <ShoppingBag /> },
                { title: "Low Stock Items", val: "Loading...", icon: <ShoppingBag className="text-amber-500" /> },
                { title: "Customer Orders", val: "Loading...", icon: <ShoppingCart /> },
                { title: "Registered Users", val: "Loading...", icon: <Users /> }
              ].map((c, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900">{c.icon}</div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{c.title}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
