import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";

describe("Lilla Store unit tests", () => {
  beforeEach(() => {
    const { clearCart, logoutUser, clearCheckoutForm } = useStore.getState();
    clearCart();
    logoutUser();
    clearCheckoutForm();
    useStore.setState({ frozenIntent: null });
  });

  it("should calculate correct total with TRYBEAUTY coupon applied", () => {
    const { addToCart, applyCoupon } = useStore.getState();
    addToCart({ id: "1", name: "Product 1", slug: "p1", price: 20, image: "" });
    addToCart({ id: "2", name: "Product 2", slug: "p2", price: 30, image: "" });

    let state = useStore.getState();
    expect(state.cart.subtotal).toBe(50);
    expect(state.cart.shippingFee).toBe(15);
    expect(state.cart.orderTotal).toBe(65);

    const result = applyCoupon("TRYBEAUTY");
    expect(result.success).toBe(true);

    state = useStore.getState();
    expect(state.cart.couponActive).toBe(true);
    expect(state.cart.discountAmount).toBe(10);
    expect(state.cart.orderTotal).toBe(55);
  });

  it("should handle frozen intents correctly", () => {
    const { setFrozenIntent, flushFrozenIntent } = useStore.getState();
    let callbackCalled = false;
    const testIntent = {
      actionType: "ADD_TO_CART" as const,
      payload: { id: "3", name: "Product 3", slug: "p3", price: 10, image: "", quantity: 1 },
      successCallback: () => {
        callbackCalled = true;
      },
    };

    setFrozenIntent(testIntent);
    let state = useStore.getState();
    expect(state.frozenIntent).toEqual(testIntent);

    flushFrozenIntent();
    state = useStore.getState();
    expect(state.frozenIntent).toBeNull();
    expect(callbackCalled).toBe(true);
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].id).toBe("3");
  });

  it("should handle cart actions (addToCart, removeFromCart, updateQuantity) correctly", () => {
    const { addToCart, removeFromCart, updateQuantity } = useStore.getState();

    addToCart({ id: "1", name: "Product 1", slug: "p1", price: 20, image: "" });
    let state = useStore.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].quantity).toBe(1);

    addToCart({ id: "1", name: "Product 1", slug: "p1", price: 20, image: "" });
    state = useStore.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].quantity).toBe(2);

    updateQuantity("1", 5);
    state = useStore.getState();
    expect(state.cart.items[0].quantity).toBe(5);

    updateQuantity("1", 0);
    state = useStore.getState();
    expect(state.cart.items).toHaveLength(0);

    addToCart({ id: "2", name: "Product 2", slug: "p2", price: 30, image: "" });
    state = useStore.getState();
    expect(state.cart.items).toHaveLength(1);
    removeFromCart("2");
    state = useStore.getState();
    expect(state.cart.items).toHaveLength(0);
  });
});
