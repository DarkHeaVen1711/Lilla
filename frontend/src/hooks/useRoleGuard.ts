"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import type { UserRole } from "@/store/useStore";

/**
 * Redirects unauthenticated or unauthorised users away from protected routes.
 *
 * @param requiredRoles  - Array of roles permitted to access the current route.
 *                         Pass an empty array to require any logged-in user.
 * @param redirectTo     - Path to send the user to if they fail the guard.
 */
export function useRoleGuard(
  requiredRoles: UserRole[] = [],
  redirectTo = "/"
) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    // Wait until Zustand has rehydrated from localStorage before checking
    if (!hydrated) return;

    // No user → redirect
    if (!user) {
      router.replace(redirectTo);
      return;
    }

    // Role check (skip if no specific roles are required)
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      router.replace(redirectTo);
    }
  }, [hydrated, user, pathname, router, redirectTo, requiredRoles]);

  return { user, hydrated };
}
