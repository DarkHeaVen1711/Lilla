"use client";

import { useStore } from "@/store/useStore";

interface PriceProps {
  amount: number | string;
  className?: string;
}

export function Price({ amount, className }: PriceProps) {
  const currency = useStore((s) => s.currency) || "USD";
  const rates = useStore((s) => s.rates) || { USD: 1, EUR: 0.92, GBP: 0.78, INR: 83.5 };

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) {
    return <span className={className}>${amount}</span>;
  }

  const rate = rates[currency] || 1.0;
  const converted = numAmount * rate;

  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };
  const symbol = symbols[currency] || "$";

  return <span className={className}>{symbol}{converted.toFixed(2)}</span>;
}
