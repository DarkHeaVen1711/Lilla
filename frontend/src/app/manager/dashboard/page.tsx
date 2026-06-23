"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Package, 
  Layers, 
  AlertCircle, 
  Star, 
  ArrowRight, 
  PlusCircle, 
  Upload, 
  TrendingUp, 
  Loader2 
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

interface CategoryDistribution {
  category_name: string;
  product_count: number;
}

interface DashboardInsights {
  total_products: number;
  active_products: number;
  pending_deletion_products: number;
  archived_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  average_rating: number;
  category_distribution: CategoryDistribution[];
}

export default function ManagerDashboard() {
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/manager/insights/");
      if (!res.ok) {
        throw new Error("Failed to fetch catalog insights.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        <p className="text-zinc-400 text-sm animate-pulse">Loading manager insights dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-900/30 flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Failed to load Dashboard</h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-md">{error}</p>
        <button
          onClick={fetchInsights}
          className="mt-6 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activePct = data ? Math.round((data.active_products / (data.total_products || 1)) * 100) : 0;
  const pendingPct = data ? Math.round((data.pending_deletion_products / (data.total_products || 1)) * 100) : 0;
  const archivedPct = data ? Math.round((data.archived_products / (data.total_products || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans selection:bg-rose-500/35">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Manager Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Real-time catalog distribution and inventory health metrics</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/manager/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20"
            >
              <PlusCircle className="w-4 h-4" /> Add Product
            </Link>
            <Link
              href="/manager/products/bulk-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-sm transition-all"
            >
              <Upload className="w-4 h-4" /> Bulk Upload
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Catalog */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-850 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Products</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold tracking-tight">{data?.total_products}</span>
              <div className="flex gap-2 items-center mt-2 text-xs text-zinc-500">
                <span>{data?.active_products} Active</span>
                <span>•</span>
                <span>{data?.pending_deletion_products} Pending</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Total Stock */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-850 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Stock</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold tracking-tight">{data?.total_stock}</span>
              <div className="mt-2 text-xs text-zinc-500">
                Units stored in active catalog
              </div>
            </div>
          </motion.div>

          {/* Card 3: Stock Status Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-zinc-900/60 backdrop-blur-md rounded-2xl border p-6 flex flex-col justify-between ${
              (data?.out_of_stock_count ?? 0) > 0 || (data?.low_stock_count ?? 0) > 0
                ? "border-rose-950/80 bg-gradient-to-b from-zinc-900/60 to-rose-950/10"
                : "border-zinc-850"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
              <div className={`p-2 rounded-lg ${
                (data?.out_of_stock_count ?? 0) > 0
                  ? "bg-rose-950/50 text-rose-400 border border-rose-900/30"
                  : "bg-zinc-800 text-zinc-300"
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{data?.out_of_stock_count}</span>
                <span className="text-xs text-rose-400 font-semibold uppercase">Out of Stock</span>
              </div>
              <div className="flex gap-2 items-center mt-2 text-xs text-zinc-500">
                <span className={data?.low_stock_count ? "text-amber-400" : ""}>{data?.low_stock_count} items are low stock</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Catalog Rating */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-850 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Avg Rating</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
                <Star className="w-4 h-4 fill-emerald-400/20" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold tracking-tight">{data?.average_rating}</span>
              <div className="mt-2 text-xs text-zinc-500">
                Based on active public reviews
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Category Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-850 p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Category Distribution</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Active product counts categorized by type</p>
              </div>
              <TrendingUp className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="space-y-4">
              {data?.category_distribution.map((cat, idx) => {
                // Find maximum product count in list to draw relative percentages
                const maxVal = Math.max(...data.category_distribution.map(c => c.product_count), 1);
                const percent = Math.round((cat.product_count / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-zinc-300">{cat.category_name}</span>
                      <span className="font-mono text-zinc-400">{cat.product_count} products</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                      />
                    </div>
                  </div>
                );
              })}
              {data?.category_distribution.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-sm">No category distribution data.</div>
              )}
            </div>
          </motion.div>

          {/* Catalog Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-850 p-6 flex flex-col justify-between gap-6"
          >
            <div>
              <h3 className="text-lg font-bold tracking-tight">Catalog Status</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Composition of listings by soft-deletion flow</p>
            </div>

            <div className="space-y-6">
              {/* Active */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Active Listings
                  </span>
                  <span className="font-mono text-zinc-400">{data?.active_products} ({activePct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activePct}%` }}
                    className="h-full rounded-full bg-emerald-500/80"
                  />
                </div>
              </div>

              {/* Pending Deletion */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" /> Pending Deletion Approval
                  </span>
                  <span className="font-mono text-zinc-400">{data?.pending_deletion_products} ({pendingPct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pendingPct}%` }}
                    className="h-full rounded-full bg-amber-500/80"
                  />
                </div>
              </div>

              {/* Archived */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 block" /> Archived (Soft-Deleted)
                  </span>
                  <span className="font-mono text-zinc-400">{data?.archived_products} ({archivedPct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${archivedPct}%` }}
                    className="h-full rounded-full bg-zinc-500/80"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500">
              <span>* Manager requests require Admin approval to archive</span>
            </div>
          </motion.div>

        </div>

        {/* Quick Actions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-850 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        >
          <div className="space-y-1">
            <h4 className="font-bold tracking-tight">Need to make adjustments to your listings?</h4>
            <p className="text-xs text-zinc-400">Head over to the product catalog list to edit details, add tags, or delete products.</p>
          </div>
          <div>
            <Link
              href="/manager/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all border border-zinc-750"
            >
              Go to Product Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
