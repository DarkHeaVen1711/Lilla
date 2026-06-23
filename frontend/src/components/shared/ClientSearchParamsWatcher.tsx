"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function SearchParamsWatcherContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("unauthorized") === "true") {
      // Trigger a sleek error/warning toast
      toast.error("Access Denied", {
        description: "You do not have permission to access that area.",
        duration: 5000,
        position: "bottom-right",
      });

      // Remove the unauthorized query parameter from the URL
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete("unauthorized");
      const newQuery = currentParams.toString();
      const cleanUrl = `${pathname}${newQuery ? `?${newQuery}` : ""}`;
      
      // Use router.replace to update URL without refreshing or adding a history entry
      router.replace(cleanUrl);
    }
  }, [searchParams, pathname, router]);

  return null;
}

export function ClientSearchParamsWatcher() {
  return (
    <Suspense fallback={null}>
      <SearchParamsWatcherContent />
    </Suspense>
  );
}
