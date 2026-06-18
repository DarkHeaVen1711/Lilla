"use client";

import { useEffect } from "react";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop routing error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong in the Shop!</h2>
      <p className="text-sm text-gray-500 max-w-md">
        We encountered an issue loading the store items. Please try reloading or trying again.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
