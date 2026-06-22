"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiClient";
import { Price } from "@/components/shared/Price";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#000000",
      fontFamily: "sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

export function CreditCardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const cartItems = useStore((s) => s.cart.items);
  const { subtotal, discountAmount, shippingFee, orderTotal } = useStore((s) => s.cart);
  const billingAddress = useStore((s) => s.checkoutForm.billingAddress);
  const user = useStore((s) => s.user);
  const saveAddress = useStore((s) => s.checkoutForm.saveAddress);
  const placeOrder = useStore((s) => s.placeOrder);
  const finalizeOrder = useStore((s) => s.finalizeOrder);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlaceOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      alert("Stripe has not loaded yet. Please try again.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      alert("Please enter card details.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Step 1: Create the Pending Order in Django backend (locks stock & verifies pricing)
      const orderData = await placeOrder("CARD", apiFetch);
      const orderId = orderData.id;

      // Step 2: Request Stripe PaymentIntent client_secret
      const intentRes = await apiFetch("/api/payments/create-intent/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!intentRes.ok) {
        const errorData = await intentRes.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const { client_secret } = await intentRes.json();

      // Step 3: Confirm Card Payment via Stripe SDK (loads in secure iframe)
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${billingAddress.firstName} ${billingAddress.lastName}`.trim(),
            email: billingAddress.email,
            phone: billingAddress.phone,
            address: {
              line1: billingAddress.address,
              city: billingAddress.city,
              state: billingAddress.state,
              postal_code: billingAddress.zip,
              country: billingAddress.country || "US",
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Payment confirmation failed");
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        if (user && saveAddress) {
          try {
            await apiFetch("/api/addresses/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                first_name: billingAddress.firstName,
                last_name: billingAddress.lastName,
                email: billingAddress.email,
                country: billingAddress.country,
                address: billingAddress.address,
                state: billingAddress.state,
                city: billingAddress.city,
                zip: billingAddress.zip,
                phone: billingAddress.phone,
                is_default: true,
              }),
            });
          } catch (addrErr) {
            console.error("Failed to save address:", addrErr);
          }
        }

        // Step 4: Clear cart and redirect to success
        finalizeOrder(orderData);
        router.push("/checkout/success");
      } else {
        throw new Error("Payment is processing or in unexpected state.");
      }

    } catch (error: any) {
      console.error("Payment flow checkout error:", error);
      setErrorMessage(error.message || "An error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full">
      <h2 className="font-serif text-3xl mb-8">Credit Card Details</h2>

      <div className="space-y-6 flex-grow flex flex-col">
        {/* Card Elements Input Container */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium text-sm ml-1">Card Information</label>
          <div className="p-4 border border-gray-300 rounded-xl bg-gray-50 focus-within:border-black focus-within:bg-white transition-colors">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* Order Summary Mini */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1.5 mt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <Price amount={subtotal} className="font-semibold text-black" />
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>-<Price amount={discountAmount} /></span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-black">
              {shippingFee === 0 ? "FREE" : <Price amount={shippingFee} />}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-1.5 flex justify-between text-base font-black text-black">
            <span>Total</span>
            <span><Price amount={orderTotal} /></span>
          </div>
        </div>

        <div className="flex-grow" />

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading || !stripe || !elements}
          className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-4 flex items-center justify-center disabled:bg-gray-500"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place order"}
        </button>
      </div>
    </div>
  );
}
