"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/Loader";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=orders");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader size="md" className="text-brand-primary" />
    </div>
  );
}

