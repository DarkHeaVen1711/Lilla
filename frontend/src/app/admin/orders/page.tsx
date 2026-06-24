"use client";

import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function AdminOrdersPage() {
  useRoleGuard(["admin"], "/");

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#c9a96e", marginBottom: 8 }}>
        Orders
      </h1>
      <p style={{ color: "#666" }}>
        Full order management coming soon. Backend endpoint: <code>/api/orders/</code>
      </p>

      {/* Placeholder table skeleton */}
      <div
        style={{
          marginTop: 24,
          border: "1px solid #1e1e2e",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {["ORDER-001", "ORDER-002", "ORDER-003"].map((id) => (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 20px",
              borderBottom: "1px solid #1a1a2e",
              color: "#888",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "#c9a96e", fontFamily: "monospace" }}>{id}</span>
            <span style={{ flex: 1 }}>Customer placeholder</span>
            <span
              style={{
                background: "#1a2a1a",
                color: "#5fa85f",
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: "0.75rem",
              }}
            >
              PENDING
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
