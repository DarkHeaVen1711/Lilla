"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Product PDP routing error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <h2 className="text-xl font-semibold text-red-600">Failed to load product!</h2>
      <p className="text-sm text-gray-500 max-w-md">
        We could not load this product's details. It might not exist or there is a temporary network problem.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/shop"
          className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
