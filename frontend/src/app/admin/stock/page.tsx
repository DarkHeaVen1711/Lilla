"use client";

import { useRoleGuard } from "@/hooks/useRoleGuard";

const STOCK_ITEMS = [
  { sku: "SKN-001", name: "Hydra Glow Serum 30ml", stock: 82, threshold: 20 },
  { sku: "SKN-002", name: "Vitamin C Brightening Toner", stock: 14, threshold: 20 },
  { sku: "SKN-003", name: "Peptide Night Cream", stock: 0, threshold: 10 },
  { sku: "MKP-001", name: "Velvet Matte Lipstick — Rose Nude", stock: 43, threshold: 15 },
];

function statusColor(stock: number, threshold: number) {
  if (stock === 0) return { bg: "#2a1a1a", text: "#d9534f", label: "OUT OF STOCK" };
  if (stock < threshold) return { bg: "#2a2010", text: "#e8a84b", label: "LOW" };
  return { bg: "#1a2a1a", text: "#5fa85f", label: "OK" };
}

export default function AdminStockPage() {
  useRoleGuard(["admin"], "/");

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#c9a96e", marginBottom: 8 }}>
        Stock Adjustments
      </h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Inventory overview. Full stock-adjustment UI coming soon. Backend endpoint:{" "}
        <code>/api/products/</code>
      </p>

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
            gridTemplateColumns: "120px 1fr 80px 100px",
            padding: "10px 20px",
            background: "#0f0f1a",
            color: "#555",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            borderBottom: "1px solid #1e1e2e",
          }}
        >
          <span>SKU</span>
          <span>Product</span>
          <span>Stock</span>
          <span>Status</span>
        </div>

        {STOCK_ITEMS.map((item) => {
          const s = statusColor(item.stock, item.threshold);
          return (
            <div
              key={item.sku}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 80px 100px",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid #1a1a2e",
                color: "#888",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ fontFamily: "monospace", color: "#c9a96e" }}>{item.sku}</span>
              <span style={{ color: "#ccc" }}>{item.name}</span>
              <span>{item.stock}</span>
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
      </div>
    </div>
  );
}
