"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";

const COUNTRIES = [
  { code: "US", name: "United States" }, { code: "IN", name: "India" },
  { code: "UK", name: "United Kingdom" }, { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" }, { code: "DE", name: "Germany" },
  { code: "FR", name: "France" }, { code: "JP", name: "Japan" },
  { code: "AE", name: "UAE" }, { code: "SG", name: "Singapore" },
];

const US_STATES = [
  { code: "NY", name: "New York" }, { code: "CA", name: "California" },
  { code: "TX", name: "Texas" }, { code: "FL", name: "Florida" },
  { code: "WA", name: "Washington" },
];

export function BillingForm() {
  const billingAddress = useStore((s) => s.checkoutForm.billingAddress);
  const sameAsShipping = useStore((s) => s.checkoutForm.sameAsShipping);
  const updateBillingAddress = useStore((s) => s.updateBillingAddress);
  const setSameAsShipping = useStore((s) => s.setSameAsShipping);

  // Seed from legacy localStorage if Zustand is empty (migration support)
  useEffect(() => {
    if (!billingAddress.firstName && !billingAddress.email) {
      try {
        const saved = localStorage.getItem("lilla-checkout-billing");
        if (saved) updateBillingAddress(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const handle = (field: keyof typeof billingAddress, value: string) => {
    updateBillingAddress({ [field]: value });
  };

  const inputClass = "w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors";
  const selectClass = `${inputClass} appearance-none bg-transparent`;

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
      <h2 className="font-serif text-3xl mb-6">Billing Address</h2>

      <form className="space-y-4 font-sans text-gray-800" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="First Name" value={billingAddress.firstName}
            onChange={(e) => handle("firstName", e.target.value)} className={inputClass} />
          <input type="text" placeholder="Last Name" value={billingAddress.lastName}
            onChange={(e) => handle("lastName", e.target.value)} className={inputClass} />
        </div>

        <div className="relative">
          <input type="email" placeholder="Email Address" value={billingAddress.email}
            onChange={(e) => handle("email", e.target.value)} className={`${inputClass} pr-12`} />
          {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingAddress.email) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
              <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            </div>
          )}
        </div>

        <div className="relative">
          <select value={billingAddress.country} onChange={(e) => handle("country", e.target.value)} className={selectClass}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        <input type="text" placeholder="Street Address" value={billingAddress.address}
          onChange={(e) => handle("address", e.target.value)} className={inputClass} />

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <select value={billingAddress.state} onChange={(e) => handle("state", e.target.value)} className={selectClass}>
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
          <input type="text" placeholder="City" value={billingAddress.city}
            onChange={(e) => handle("city", e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Zip/Postal Code" value={billingAddress.zip}
            onChange={(e) => handle("zip", e.target.value)} className={inputClass} />
          <input type="tel" placeholder="Phone" value={billingAddress.phone}
            onChange={(e) => handle("phone", e.target.value)} className={inputClass} />
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <input
            type="checkbox"
            id="same-address"
            checked={sameAsShipping}
            onChange={(e) => setSameAsShipping(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black accent-black"
          />
          <label htmlFor="same-address" className="text-gray-700 select-none">
            My billing and shipping address are the same
          </label>
        </div>
      </form>
    </div>
  );
}
