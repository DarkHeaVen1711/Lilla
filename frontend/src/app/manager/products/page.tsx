"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { m as motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/apiClient";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  deletion_status: "active" | "pending_deletion" | "archived";
  image?: string;
  category?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
  pending_deletion: { label: "Pending Deletion", color: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
  archived: { label: "Archived", color: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30" },
};

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/products/");
      const data = await res.json();
      // API returns paginated or plain list
      setProducts(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Request deletion of "${product.name}"?`)) return;
    setActionLoading(product.id);
    try {
      const res = await apiFetch(`/api/products/${product.slug}/`, { method: "DELETE" });
      if (res.status === 202) {
        showToast("Deletion request submitted — awaiting admin approval.");
        fetchProducts();
      } else if (res.ok) {
        showToast("Product archived.");
        fetchProducts();
      } else {
        const d = await res.json();
        showToast(d.detail || "Failed to delete.", false);
      }
    } catch {
      showToast("Network error.", false);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
            <p className="text-zinc-400 mt-1 text-sm">Manage your product listings</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/manager/products/bulk-upload"
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm border border-zinc-700 transition-colors"
            >
              ↑ Bulk Upload
            </Link>
            <Link
              href="/manager/products/new"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors"
            >
              + Add Product
            </Link>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 mb-6"
        />

        {error && (
          <div className="text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Stock</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <AnimatePresence>
                  {filtered.map((product) => {
                    const cfg = STATUS_CONFIG[product.deletion_status];
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover border border-zinc-700"
                              />
                            )}
                            <div>
                              <p className="font-medium text-white">{product.name}</p>
                              <p className="text-zinc-500 text-xs">{product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300">${product.price}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-medium ${product.stock < 10 ? "text-amber-400" : "text-white"}`}>
                            {product.stock}
                            {product.stock < 10 && (
                              <span className="ml-1 text-xs text-amber-500">low</span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/manager/products/${product.slug}/edit`}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white transition-colors border border-zinc-700"
                            >
                              Edit
                            </Link>
                            {product.deletion_status === "active" && (
                              <button
                                onClick={() => handleDelete(product)}
                                disabled={actionLoading === product.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-xs text-rose-400 border border-rose-800/40 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === product.id ? "…" : "Request Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-zinc-500">No products found.</div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 ${
              toast.ok
                ? "bg-emerald-900/90 text-emerald-300 border border-emerald-500/30"
                : "bg-red-900/90 text-red-300 border border-red-500/30"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
