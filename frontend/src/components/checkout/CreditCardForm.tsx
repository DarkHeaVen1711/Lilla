import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";

export function CreditCardForm() {
  const router = useRouter();
  const { cartItems, clearCart } = useCommerce();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }
    setLoading(true);
    try {
      const billingSaved = localStorage.getItem("lilla-checkout-billing");
      const billing = billingSaved ? JSON.parse(billingSaved) : {};

      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const discount = subtotal * 0.2;
      const deliveryFee = 15.0;
      const total = subtotal - discount + deliveryFee;

      const orderPayload = {
        user_identifier: billing.email || billing.phone || "guest@lilla.com",
        shipping_name: `${billing.firstName || "John"} ${billing.lastName || "Doe"}`.trim(),
        shipping_address: `${billing.address || "123 Main St"}, ${billing.state || "NY"}, ${billing.country || "US"}`.trim(),
        shipping_city: billing.city || "New York",
        shipping_postal_code: billing.zip || "10001",
        total_price: total.toFixed(2),
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price.toFixed(2),
          quantity: item.quantity
        }))
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("lilla-auth-token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Token ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        throw new Error(`Failed to place order: ${res.statusText}`);
      }

      const orderData = await res.json();
      
      // Save order details to local storage including the images from cartItems
      const orderWithImages = {
        ...orderData,
        items: orderData.items.map((item: any) => {
          const cartItem = cartItems.find(ci => ci.id === item.product_id);
          return {
            ...item,
            image: cartItem?.image || null
          };
        })
      };

      localStorage.setItem("lilla-last-order", JSON.stringify(orderWithImages));
      clearCart();
      router.push("/checkout/success");
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm font-sans flex flex-col h-full">
      <h2 className="font-serif text-3xl mb-8">Credit Card Details</h2>
      
      <div className="space-y-6 flex-grow flex flex-col">
        {/* Name on card */}
        <input 
          type="text" 
          placeholder="Name on card" 
          className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
        />

        {/* Card number */}
        <input 
          type="text" 
          placeholder="0000 0000 0000 0000" 
          className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors tracking-widest"
        />

        {/* Expiry Date */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium text-sm ml-1">Expiry date</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <select defaultValue="" className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors appearance-none bg-transparent">
                <option value="" disabled>Month</option>
                <option value="01">01</option>
                <option value="02">02</option>
                <option value="03">03</option>
                <option value="04">04</option>
                <option value="05">05</option>
                <option value="06">06</option>
                <option value="07">07</option>
                <option value="08">08</option>
                <option value="09">09</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            
            <div className="relative">
              <select defaultValue="" className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors appearance-none bg-transparent">
                <option value="" disabled>Year</option>
                <option value="24">2024</option>
                <option value="25">2025</option>
                <option value="26">2026</option>
                <option value="27">2027</option>
                <option value="28">2028</option>
                <option value="29">2029</option>
                <option value="30">2030</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* CVV */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Card security code" 
            maxLength={4}
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-help">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="flex-grow" />

        {/* Place Order Button */}
        <button 
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full h-[56px] bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mt-8 flex items-center justify-center disabled:bg-gray-500"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place order"}
        </button>
      </div>
    </div>
  );
}
