"use client";

import { useStore } from "@/store/useStore";
import type { LineItem } from "@/store/useStore";

/**
 * useAuthGate — returns a withAuthGate interceptor.
 *
 * Usage:
 *   const withAuthGate = useAuthGate();
 *   withAuthGate("ADD_TO_CART", product, () => addToCart(product));
 *
 * Behavior:
 *   - If the user IS logged in: executes successCallback immediately.
 *   - If the user IS NOT logged in: freezes the intent, caches it, opens the auth modal.
 *     The modal will call flushFrozenIntent() after successful OTP verification,
 *     which re-runs the successCallback and dispatches the add-to-cart action.
 */
export function useAuthGate() {
  const user = useStore((s) => s.user);
  const openAuthModal = useStore((s) => s.openAuthModal);
  const setFrozenIntent = useStore((s) => s.setFrozenIntent);

  const withAuthGate = (
    actionType: "ADD_TO_CART" | "ADD_TO_FAVORITE" | "PROCEED_TO_CHECKOUT",
    payload: LineItem,
    successCallback: () => void
  ) => {
    if (user) {
      // Authenticated: run immediately
      successCallback();
    } else {
      // Guest: freeze intent and open auth wall
      setFrozenIntent({ actionType, payload, successCallback });
      openAuthModal("PHONE_INPUT");
    }
  };

  return withAuthGate;
}
