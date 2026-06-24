"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { apiFetch } from "@/lib/apiClient";
import { Loader } from "@/components/ui/Loader";

function statusColor(stock: number, threshold: number) {
  if (stock === 0) return { bg: "#2a1a1a", text: "#d9534f", label: "OUT OF STOCK" };
  if (stock < threshold) return { bg: "#2a2010", text: "#e8a84b", label: "LOW" };
  return { bg: "#1a2a1a", text: "#5fa85f", label: "OK" };
}

export default function AdminStockPage() {
  useRoleGuard(["admin"], "/");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/products/");
        if (!res.ok) throw new Error("Failed to load stock data.");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.results ?? []);
      } catch (e: any) {
        setError(e.message || "Failed to load stock data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#c9a96e", marginBottom: 8 }}>
        Stock Adjustments
      </h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Inventory overview. Real stock-adjustment data loaded directly from the database.
      </p>

      {error && (
        <div style={{ color: "#d9534f", background: "#2a1a1a", border: "1px solid #5a2020", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader size="md" className="text-zinc-500" />
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #1e1e2e",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr 80px 110px",
              padding: "10px 20px",
              background: "#0f0f1a",
              color: "#555",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderBottom: "1px solid #1e1e2e",
            }}
          >
            <span>ID / Slug</span>
            <span>Product</span>
            <span>Stock</span>
            <span>Status</span>
          </div>

          {products.map((item) => {
            const threshold = 20; // Default threshold for low stock
            const s = statusColor(item.stock, threshold);
            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr 80px 110px",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: "1px solid #1a1a2e",
                  color: "#888",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ fontFamily: "monospace", color: "#c9a96e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 10 }}>{item.slug || item.id}</span>
                <span style={{ color: "#ccc" }}>{item.name}</span>
                <span style={{ color: item.stock < threshold ? "#e8a84b" : "#aaa" }}>{item.stock}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: s.bg,
                    color: s.text,
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    width: "fit-content",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}

          {products.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: "#666", fontSize: "0.875rem" }}>
              No products found in the system.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
