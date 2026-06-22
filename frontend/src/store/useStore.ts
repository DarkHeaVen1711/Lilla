import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaticImageData } from "next/image";
import { apiFetch } from "@/lib/apiClient";

// ─── Type Definitions ────────────────────────────────────────────────────────

export type ImageSource = StaticImageData | string;

export interface LineItem {
  id: string;
  slug: string;
  name: string;
  image: ImageSource;
  price: number;
  originalPrice?: number;
  discount?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  quantity: number;
}

export interface ProfileFields {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface UserState {
  token: string;
  identityString: string;
  isGuest: boolean;
  isStaff: boolean;
  metadata: ProfileFields;
}

export type AuthModalStage = "PHONE_INPUT" | "EMAIL_INPUT" | "OTP_VERIFICATION";
export type IntentActionType = "ADD_TO_CART" | "ADD_TO_FAVORITE" | "PROCEED_TO_CHECKOUT";
export type PaymentMethodType = "COD" | "CARD" | "NETBANKING";

export interface FrozenIntent {
  actionType: IntentActionType;
  payload: LineItem;
  successCallback: () => void;
}

export interface AddressData {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  address: string;
  state: string;
  city: string;
  zip: string;
  phone: string;
}

// ─── Store Shape ─────────────────────────────────────────────────────────────

interface LillaStore {
  // User Session
  user: UserState | null;
  loginUser: (identityString: string, isStaff: boolean, metadata?: ProfileFields) => void;
  updateUserMetadata: (metadata: Partial<ProfileFields>) => void;
  logoutUser: () => void;

  // Auth Modal State Machine
  authModal: {
    isOpen: boolean;
    stage: AuthModalStage;
  };
  openAuthModal: (stage?: AuthModalStage) => void;
  closeAuthModal: () => void;
  setAuthModalStage: (stage: AuthModalStage) => void;

  // Cart
  cart: {
    items: LineItem[];
    couponCode: string | null;
    couponActive: boolean;
    couponDiscountPercentage: number;
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    orderTotal: number;
  };
  addToCart: (item: Omit<LineItem, "quantity">, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;

  // Frozen Intent — guest action interceptor cache
  frozenIntent: FrozenIntent | null;
  setFrozenIntent: (intent: FrozenIntent) => void;
  flushFrozenIntent: () => void; // executes the cached action and clears it

  // Checkout Form
  checkoutForm: {
    billingAddress: AddressData;
    sameAsShipping: boolean;
    paymentMethod: PaymentMethodType;
    saveAddress: boolean;
  };
  updateBillingAddress: (data: Partial<AddressData>) => void;
  setSameAsShipping: (value: boolean) => void;
  setPaymentMethod: (method: PaymentMethodType) => void;
  setSaveAddress: (value: boolean) => void;
  clearCheckoutForm: () => void;
  placeOrder: (paymentMethod: PaymentMethodType, apiFetch: any) => Promise<any>;
  finalizeOrder: (orderData: any) => any;

  // Currency Switcher
  currency: string;
  rates: Record<string, number>;
  setCurrency: (currency: string) => void;
  setRates: (rates: Record<string, number>) => void;
  fetchCurrencyRates: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_ADDRESS: AddressData = {
  firstName: "",
  lastName: "",
  email: "",
  country: "US",
  address: "",
  state: "NY",
  city: "",
  zip: "",
  phone: "",
};

const COUPON_TRYBEAUTY_DISCOUNT = 0.20;
const FREE_SHIPPING_THRESHOLD = 51;
const SHIPPING_FEE = 15;

function recalcCart(
  items: LineItem[],
  couponActive: boolean,
  couponDiscountPercentage: number
): { subtotal: number; discountAmount: number; shippingFee: number; orderTotal: number } {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = couponActive ? subtotal * (couponDiscountPercentage / 100) : 0;
  const shippingFee = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const orderTotal = subtotal - discountAmount + shippingFee;
  return { subtotal, discountAmount, shippingFee, orderTotal };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<LillaStore>()(
  persist(
    (set, get) => ({
      // ── User ──────────────────────────────────────────────────────────────
      user: null,

      loginUser: (identityString, isStaff, metadata) => {
        set({
          user: {
            token: "",
            identityString,
            isGuest: false,
            isStaff: !!isStaff,
            metadata: metadata || {},
          },
        });
      },

      updateUserMetadata: (metadata) =>
        set((state) => {
          if (!state.user) return {};
          return {
            user: {
              ...state.user,
              metadata: { ...state.user.metadata, ...metadata },
            },
          };
        }),

      logoutUser: () => set({ user: null }),

      // ── Auth Modal ────────────────────────────────────────────────────────
      authModal: { isOpen: false, stage: "PHONE_INPUT" },

      openAuthModal: (stage = "PHONE_INPUT") =>
        set({ authModal: { isOpen: true, stage } }),

      closeAuthModal: () =>
        set((state) => ({ authModal: { ...state.authModal, isOpen: false } })),

      setAuthModalStage: (stage) =>
        set((state) => ({ authModal: { ...state.authModal, stage } })),

      // ── Cart ──────────────────────────────────────────────────────────────
      cart: {
        items: [],
        couponCode: null,
        couponActive: false,
        couponDiscountPercentage: 0,
        subtotal: 0,
        discountAmount: 0,
        shippingFee: SHIPPING_FEE,
        orderTotal: 0,
      },

      addToCart: (product, qty = 1) =>
        set((state) => {
          const existing = state.cart.items.find((i) => i.id === product.id);
          const items = existing
            ? state.cart.items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
              )
            : [...state.cart.items, { ...product, quantity: qty }];
          const calcs = recalcCart(items, state.cart.couponActive, state.cart.couponDiscountPercentage);
          return { cart: { ...state.cart, items, ...calcs } };
        }),

      removeFromCart: (itemId) =>
        set((state) => {
          const items = state.cart.items.filter((i) => i.id !== itemId);
          const calcs = recalcCart(items, state.cart.couponActive, state.cart.couponDiscountPercentage);
          return { cart: { ...state.cart, items, ...calcs } };
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.cart.items.filter((i) => i.id !== itemId)
              : state.cart.items.map((i) =>
                  i.id === itemId ? { ...i, quantity } : i
                );
          const calcs = recalcCart(items, state.cart.couponActive, state.cart.couponDiscountPercentage);
          return { cart: { ...state.cart, items, ...calcs } };
        }),

      clearCart: () =>
        set((state) => ({
          cart: {
            ...state.cart,
            items: [],
            couponCode: null,
            couponActive: false,
            couponDiscountPercentage: 0,
            subtotal: 0,
            discountAmount: 0,
            shippingFee: SHIPPING_FEE,
            orderTotal: 0,
          },
        })),

      applyCoupon: async (code) => {
        const normalized = code.trim();
        if (!normalized) {
          return { success: false, message: "Coupon code is required." };
        }
        try {
          const res = await apiFetch("/api/coupons/validate/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: normalized }),
          });
          const data = await res.json();
          if (res.ok && data.valid) {
            set((state) => {
              const discountPercent = Number(data.discount_percentage) || 0;
              const calcs = recalcCart(state.cart.items, true, discountPercent);
              return {
                cart: {
                  ...state.cart,
                  couponCode: data.code,
                  couponActive: true,
                  couponDiscountPercentage: discountPercent,
                  ...calcs,
                },
              };
            });
            return { success: true, message: `${data.code} applied! ${data.discount_percentage}% discount activated.` };
          } else {
            return { success: false, message: data.message || "Invalid coupon code." };
          }
        } catch (error) {
          console.error("Coupon validation error:", error);
          return { success: false, message: "Failed to validate coupon code." };
        }
      },

      // ── Frozen Intent ─────────────────────────────────────────────────────
      frozenIntent: null,

      setFrozenIntent: (intent) => set({ frozenIntent: intent }),

      flushFrozenIntent: () => {
        const intent = get().frozenIntent;
        if (!intent) return;
        // Execute the cached action
        if (intent.actionType === "ADD_TO_CART") {
          get().addToCart(intent.payload, intent.payload.quantity);
        }
        intent.successCallback();
        set({ frozenIntent: null });
      },

      // ── Checkout Form ─────────────────────────────────────────────────────
      checkoutForm: {
        billingAddress: EMPTY_ADDRESS,
        sameAsShipping: true,
        paymentMethod: "CARD",
        saveAddress: false,
      },

      updateBillingAddress: (data) =>
        set((state) => ({
          checkoutForm: {
            ...state.checkoutForm,
            billingAddress: { ...state.checkoutForm.billingAddress, ...data },
          },
        })),

      setSameAsShipping: (value) =>
        set((state) => ({
          checkoutForm: { ...state.checkoutForm, sameAsShipping: value },
        })),

      setPaymentMethod: (method) =>
        set((state) => ({
          checkoutForm: { ...state.checkoutForm, paymentMethod: method },
        })),

      setSaveAddress: (value) =>
        set((state) => ({
          checkoutForm: { ...state.checkoutForm, saveAddress: value },
        })),

      clearCheckoutForm: () =>
        set((state) => ({
          checkoutForm: {
            ...state.checkoutForm,
            billingAddress: EMPTY_ADDRESS,
            saveAddress: false,
          },
        })),

      // ── Currency ──────────────────────────────────────────────────────────
      currency: "USD",
      rates: { USD: 1, EUR: 0.92, GBP: 0.78, INR: 83.5 },

      setCurrency: (currency) => set({ currency }),
      setRates: (rates) => set({ rates }),
      fetchCurrencyRates: async () => {
        try {
          const res = await apiFetch("/api/currency-rates");
          if (res.ok) {
            const data = await res.json();
            if (data.rates) {
              set({ rates: data.rates });
            }
          }
        } catch (error) {
          console.error("Failed to fetch exchange rates:", error);
        }
      },

      placeOrder: async (paymentMethod, apiFetch) => {
        const { cart, checkoutForm, currency, rates } = get();
        const { billingAddress } = checkoutForm;
        const rate = rates[currency] || 1.0;
        const convertedTotal = cart.orderTotal * rate;

        const orderPayload = {
          user_identifier: billingAddress.email || billingAddress.phone || "guest@lilla.com",
          shipping_name: `${billingAddress.firstName} ${billingAddress.lastName}`.trim() || "Guest User",
          shipping_address: `${billingAddress.address}, ${billingAddress.state}, ${billingAddress.country}`.trim(),
          shipping_city: billingAddress.city || "New York",
          shipping_postal_code: billingAddress.zip || "10001",
          total_price: convertedTotal.toFixed(2),
          payment_method: paymentMethod,
          coupon_code: cart.couponCode,
          currency: currency || "USD",
          items: cart.items.map(item => ({
            product_id: item.id,
            product_name: item.name,
            price: (item.price * rate).toFixed(2),
            quantity: item.quantity,
          })),
        };

        const res = await apiFetch("/api/orders/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.detail || errorData.error || "Failed to create order");
        }

        return await res.json();
      },

      finalizeOrder: (orderData) => {
        const { cart, clearCart, clearCheckoutForm } = get();
        const orderWithImages = {
          ...orderData,
          items: orderData.items?.map((item: Record<string, unknown>) => ({
            ...item,
            image: cart.items.find((c) => c.id === item.product_id)?.image || null,
          })) ?? [],
        };

        localStorage.setItem("lilla-last-order", JSON.stringify(orderWithImages));
        clearCart();
        clearCheckoutForm();
        return orderWithImages;
      },
    }),
    {
      name: "lilla-store",
      // Only persist cart and user — auth modal & frozen intent are ephemeral
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        currency: state.currency,
        rates: state.rates,
        checkoutForm: {
          billingAddress: state.checkoutForm.billingAddress,
          sameAsShipping: state.checkoutForm.sameAsShipping,
          paymentMethod: state.checkoutForm.paymentMethod,
          saveAddress: state.checkoutForm.saveAddress,
        },
      }),
    }
  )
);
