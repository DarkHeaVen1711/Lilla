"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "../_components/ProductForm";
import { apiFetch } from "@/lib/apiClient";

export default function NewProductPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/categories/?include_concerns=true");
        if (!res.ok) throw new Error("Failed to load form metadata.");
        const data = await res.json();
        setCategories(data.categories || data);
      } catch (e: any) {
        setError(e.message || "Failed to load form metadata.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-400 font-semibold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight font-sans">Add Product</h1>
          <p className="text-zinc-400 mt-1 text-sm">Create a new item in your store</p>
        </div>
        <ProductForm categories={categories} mode="create" />
      </div>
    </div>
  );
}
