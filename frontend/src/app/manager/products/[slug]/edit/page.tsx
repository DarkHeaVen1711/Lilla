"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "../../_components/ProductForm";
import { apiFetch } from "@/lib/apiClient";

interface EditProductPageProps {
  params: {
    slug: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch("/api/categories/?include_concerns=true"),
          apiFetch(`/api/products/${params.slug}/`),
        ]);

        if (!catRes.ok || !prodRes.ok) {
          throw new Error("Failed to load product form data.");
        }

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        setCategories(catData.categories || catData);
        
        // Map backend product structure to ProductFormData shape
        setProduct({
          id: prodData.id,
          slug: prodData.slug,
          name: prodData.name,
          price: String(prodData.price),
          stock: String(prodData.stock),
          category: prodData.category ? String(prodData.category) : "",
          image: prodData.image || "",
          description: prodData.description || "",
          concern: prodData.skin_concerns?.[0] || "",
          type: prodData.finish || "",
        });
      } catch (e: any) {
        setError(e.message || "Failed to load product data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

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
          <h1 className="text-3xl font-bold tracking-tight font-sans">Edit Product</h1>
          <p className="text-zinc-400 mt-1 text-sm">Update product details and specifications</p>
        </div>
        <ProductForm categories={categories} initial={product} mode="edit" />
      </div>
    </div>
  );
}
