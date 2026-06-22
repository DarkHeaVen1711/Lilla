"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

type AnnouncementBarProps = {
  text: string;
};

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
];

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const fetchCurrencyRates = useStore((s) => s.fetchCurrencyRates);

  useEffect(() => {
    // Fetch rates using direct apiFetch proxy
    fetchCurrencyRates();
  }, []);

  return (
    <div className="w-full bg-black py-2.5 px-5 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-white font-sans text-xs md:text-sm font-medium z-[100] relative">
      <div className="hidden sm:block w-24"></div>
      
      <p className="text-center tracking-wide flex-1 text-white/95">
        {text}
      </p>

      <div className="flex items-center gap-2">
        <label htmlFor="currency-select" className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Currency:</label>
        <div className="relative">
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent border border-white/20 hover:border-white/40 transition-colors text-white text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer appearance-none pr-6 select-none"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code} className="bg-black text-white font-bold">
                {c.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 text-[8px]">
            ▼
          </div>
        </div>
      </div>
    </div>
  );
}

