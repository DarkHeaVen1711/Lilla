"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";

/**
 * AuthProvider — mounts at root layout level.
 * On every route change it checks the hydrated Zustand store and,
 * if a staff/admin user navigates to a customer page, does nothing.
 * If a customer somehow lands on a protected staff route they are
 * bounced to "/" (secondary guard; primary guards are per-layout).
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const isAdminRoute = pathname.startsWith("/admin");
    const isManagerRoute = pathname.startsWith("/manager");

    if (isAdminRoute && user?.role !== "admin") {
      router.replace("/");
      return;
    }

    if (isManagerRoute && user?.role !== "manager" && user?.role !== "admin") {
      router.replace("/");
    }
  }, [hydrated, user, pathname, router]);

  return <>{children}</>;
}
