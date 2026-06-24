"use client";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Loader2 } from "lucide-react";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated, user } = useRoleGuard(["admin", "manager"], "/");

  if (!hydrated || (user?.role !== "manager" && user?.role !== "admin")) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a0f",
          color: "#888",
          gap: "12px",
        }}
      >
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span>Authorising…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
