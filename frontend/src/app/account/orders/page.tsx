"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=orders");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
    </div>
  );
}

