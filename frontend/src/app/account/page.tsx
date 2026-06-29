"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { apiFetch } from "@/lib/apiClient";
import { 
  ShoppingBag, 
  MapPin, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  LogOut, 
  ChevronRight, 
  AlertCircle,
  Truck,
  Clock,
  Home
} from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { m as motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  total_price: string;
  status: string;
  created_at: string;
  currency?: string;
  carrier_name?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  shipment_status?: string;
  items: { product_name: string; price: string; quantity: number }[];
}

const getCurrencySymbol = (currency?: string) => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };
  return symbols[currency || "USD"] || "$";
};

function FulfillmentTimeline({ order }: { order: Order }) {
  const currentStatus = order.shipment_status || "Placed";
  const steps = [
    { status: "Placed", label: "Placed", icon: ShoppingBag },
    { status: "Processed", label: "Processed", icon: Check },
    { status: "Shipped", label: "Shipped", icon: Truck },
    { status: "Out for Delivery", label: "Out for Delivery", icon: Clock },
    { status: "Delivered", label: "Delivered", icon: Home },
  ];
  
  const statusHierarchy: Record<string, number> = {
    Placed: 1,
    Processed: 2,
    Shipped: 3,
    "Out for Delivery": 4,
    Delivered: 5
  };
  
  const currentLevel = statusHierarchy[currentStatus] || 1;
  
  return (
    <div className="mt-6 p-6 rounded-2xl bg-[#FAF8F5]/80 border border-gray-100/80 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B58B5E]">Shipment Details</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
            <p className="text-xs text-gray-500 font-semibold">
              Carrier: <span className="text-gray-900 font-bold">{order.carrier_name || "DHL Express"}</span>
            </p>
            <p className="text-xs text-gray-500 font-semibold">
              Tracking: <span className="text-gray-900 font-mono font-bold">{order.tracking_number || "N/A"}</span>
            </p>
            {order.estimated_delivery_date && (
              <p className="text-xs text-gray-500 font-semibold">
                Est. Delivery: <span className="text-[#B58B5E] font-bold">{new Date(order.estimated_delivery_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline tracker */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-y-8 md:gap-y-0">
        {/* Connection Bar (Horizontal for Desktop, Vertical for Mobile) */}
        <div className="absolute top-[18px] left-[18px] md:top-1/2 md:left-0 right-0 h-[2px] bg-gray-100 -translate-y-1/2 hidden md:block" />
        <div 
          className="absolute top-[18px] left-[18px] md:top-1/2 md:left-0 h-[2px] bg-[#B58B5E] -translate-y-1/2 transition-all duration-500 hidden md:block"
          style={{ width: `${((currentLevel - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {/* Mobile Vertical line */}
        <div className="absolute left-[18px] top-4 bottom-4 w-[2px] bg-gray-100 md:hidden" />
        <div 
          className="absolute left-[18px] top-4 w-[2px] bg-[#B58B5E] md:hidden transition-all duration-500" 
          style={{ height: `${((currentLevel - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const stepLevel = idx + 1;
          const isCompleted = currentLevel >= stepLevel;
          const isActive = currentLevel === stepLevel;
          const StepIcon = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-2 md:flex-1">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                  isActive 
                    ? "bg-[#B58B5E] text-white scale-110 shadow-[0_0_15px_rgba(181,139,94,0.4)]" 
                    : isCompleted 
                      ? "bg-[#B58B5E] text-white shadow-sm" 
                      : "bg-white text-gray-400 border-2 border-gray-200"
                }`}
              >
                {isActive && (
                  <span className="absolute -inset-1 rounded-full border border-[#B58B5E] animate-ping opacity-75" />
                )}
                <StepIcon className="w-4 h-4" />
              </div>
              
              <div className="flex flex-col md:items-center">
                <span className={`text-xs font-bold ${isActive ? "text-[#B58B5E]" : isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-[10px] text-gray-500 font-semibold md:text-center">Active Status</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Address {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  address: string;
  state: string;
  city: string;
  zip: string;
  phone: string;
  is_default: boolean;
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" },
];

const US_STATES = [
  { code: "NY", name: "New York" },
  { code: "CA", name: "California" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "WA", name: "Washington" },
];

export default function AccountDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "profile";

  const user = useStore((s) => s.user);
  const loginUser = useStore((s) => s.loginUser);
  const logoutUser = useStore((s) => s.logoutUser);
  const updateUserMetadata = useStore((s) => s.updateUserMetadata);
  const openAuthModal = useStore((s) => s.openAuthModal);
  const hydrated = useStore((s) => s.hydrated);

  const [activeTab, setActiveTab] = useState<string>(activeTabParam);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Profile Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [signupMethod, setSignupMethod] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [expandedTracking, setExpandedTracking] = useState<Record<string, boolean>>({});

  const toggleTracking = (orderId: string) => {
    setExpandedTracking((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Address Modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrForm, setAddrForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    country: "US",
    address: "",
    state: "NY",
    city: "",
    zip: "",
    phone: "",
    is_default: false,
  });
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState("");

  // Sync tab with URL search parameter
  useEffect(() => {
    if (activeTabParam !== activeTab) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/account?tab=${tab}`, { scroll: false });
  };

  // Fetch initial profile values and other resources
  useEffect(() => {
    if (!user) return;

    // Load initial user details
    apiFetch("/api/auth/profile/")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          updateUserMetadata({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
          });
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setEmail(data.email || "");
          setGender(data.gender || "");
          setSignupMethod(data.signup_method || "phone");
        }
      })
      .catch((err) => console.error("Error loading user profile details:", err));

    // Load Orders
    setLoadingOrders(true);
    apiFetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoadingOrders(false);
      })
      .catch(() => setLoadingOrders(false));

    // Load Addresses
    setLoadingAddresses(true);
    apiFetch("/api/addresses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setAddresses(Array.isArray(data) ? data : []);
        setLoadingAddresses(false);
      })
      .catch(() => setLoadingAddresses(false));
  }, [user]);

  // Load profile values on tab switch or store sync
  useEffect(() => {
    if (user && user.metadata) {
      setFirstName(user.metadata.first_name || "");
      setLastName(user.metadata.last_name || "");
      setEmail(user.metadata.email || "");
    }
  }, [user, activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const res = await apiFetch("/api/auth/profile/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          userprofile: { gender },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.email?.[0] || data.detail || "Failed to update profile info");
      }

      // Sync stores
      updateUserMetadata({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
      });

      // Update locally stored user info just in case
      const localUser = localStorage.getItem("lilla-user");
      if (localUser) {
        const parsed = JSON.parse(localUser);
        parsed.email = data.email;
        parsed.first_name = data.first_name;
        parsed.last_name = data.last_name;
        localStorage.setItem("lilla-user", JSON.stringify(parsed));
      }

      setProfileMessage({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to save profile details." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOpenAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddrForm({
        first_name: address.first_name,
        last_name: address.last_name,
        email: address.email,
        country: address.country,
        address: address.address,
        state: address.state,
        city: address.city,
        zip: address.zip,
        phone: address.phone,
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setAddrForm({
        first_name: "",
        last_name: "",
        email: "",
        country: "US",
        address: "",
        state: "NY",
        city: "",
        zip: "",
        phone: "",
        is_default: false,
      });
    }
    setAddrError("");
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrSaving(true);
    setAddrError("");

    const isEdit = !!editingAddress;
    const url = isEdit ? `/api/addresses/${editingAddress!.id}/` : "/api/addresses/";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addrForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to save address details.");
      }

      // Reload addresses
      const reloadRes = await apiFetch("/api/addresses");
      if (reloadRes.ok) {
        const list = await reloadRes.json();
        setAddresses(list);
      }

      setAddressModalOpen(false);
    } catch (err: any) {
      setAddrError(err.message || "Failed to save address.");
    } finally {
      setAddrSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await apiFetch(`/api/addresses/${id}/`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAddresses(addresses.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete address.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      const res = await apiFetch(`/api/addresses/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });

      if (res.ok) {
        // Optimistic toggle
        setAddresses(
          addresses.map((a) => ({
            ...a,
            is_default: a.id === id,
          })).sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    logoutUser();
    localStorage.removeItem("lilla-auth-token");
    localStorage.removeItem("lilla-user");
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (err) {
      console.error("Error clearing session cookie:", err);
    }
    router.push("/");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader size="md" className="text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-5 bg-gradient-to-tr from-brand-bg-pink/30 via-white to-white">
        <div className="max-w-[480px] p-10 bg-white rounded-3xl border border-gray-100 shadow-[0_15px_45px_rgba(0,0,0,0.03)] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-brand-bg-pink flex items-center justify-center mb-6">
            <UserIcon className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl font-serif text-black mb-4">Account Dashboard</h1>
          <p className="text-gray-500 mb-8 leading-relaxed font-sans font-medium text-sm">
            Sign in to view your order history, manage shipping details, and customize your profile settings.
          </p>
          <button 
            onClick={() => openAuthModal("PHONE_INPUT")} 
            className="w-full bg-black text-white py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] duration-200"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  const userInitial = user.metadata?.first_name?.[0] || user.identityString?.[0] || "?";
  const userFullName = user.metadata?.first_name
    ? `${user.metadata.first_name} ${user.metadata.last_name || ""}`.trim()
    : "Valued Customer";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-white pt-8 pb-24 font-sans text-black">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
        
        {/* Banner Section */}
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-gray-200/50">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-brand-primary">Dashboard</span>
            <h1 className="mt-2 text-4xl font-normal font-serif text-black md:text-5xl lg:text-6xl capitalize">
              Welcome Back
            </h1>
            <p className="mt-3 text-sm text-gray-500 font-medium">
              Manage your personal settings, addresses, and order history from a single place.
            </p>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Section */}
          <div className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <div className="w-20 h-20 rounded-full bg-brand-bg-pink text-brand-primary font-serif text-3xl flex items-center justify-center font-semibold mb-4 capitalize shadow-inner">
                {userInitial}
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-1">{userFullName}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1 truncate w-full px-2">{user.identityString}</p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => handleTabChange("profile")}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-sm font-semibold ${
                  activeTab === "profile" 
                    ? "bg-brand-bg-pink text-brand-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4" />
                  <span>Profile Settings</span>
                </div>
                <ChevronRight className={`w-4 h-4 opacity-50 ${activeTab === "profile" ? "text-brand-primary" : ""}`} />
              </button>

              <button
                onClick={() => handleTabChange("addresses")}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-sm font-semibold ${
                  activeTab === "addresses" 
                    ? "bg-brand-bg-pink text-brand-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" />
                  <span>Address Book</span>
                </div>
                <ChevronRight className={`w-4 h-4 opacity-50 ${activeTab === "addresses" ? "text-brand-primary" : ""}`} />
              </button>

              <button
                onClick={() => handleTabChange("orders")}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-sm font-semibold ${
                  activeTab === "orders" 
                    ? "bg-brand-bg-pink text-brand-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order History</span>
                </div>
                <ChevronRight className={`w-4 h-4 opacity-50 ${activeTab === "orders" ? "text-brand-primary" : ""}`} />
              </button>
            </div>
          </div>

          {/* Right Content Section */}
          <div className="lg:col-span-3 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
                    <h2 className="text-2xl font-serif text-gray-900">Profile Settings</h2>
                    {signupMethod === "email" && (
                      <span className="bg-brand-bg-pink text-brand-primary text-xs font-bold px-3 py-1 rounded-full">
                        Email Account
                      </span>
                    )}
                    {signupMethod === "phone" && (
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                        Phone Account
                      </span>
                    )}
                  </div>
                  
                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
                      profileMessage.type === "success" 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                        : "bg-red-50 text-red-800 border border-red-100"
                    }`}>
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-[52px] px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm font-medium"
                          placeholder="First Name"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-[52px] px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm font-medium"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-[52px] px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm font-medium"
                          placeholder="email@example.com"
                          required={signupMethod === "email"}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="h-[52px] px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm font-medium bg-white"
                          required={signupMethod === "email"}
                        >
                          <option value="">Select Gender (Optional)</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Login Identity</label>
                      <input
                        type="text"
                        value={user.identityString}
                        disabled
                        className="h-[52px] px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-400 cursor-not-allowed text-sm font-medium"
                      />
                      <p className="text-[10px] text-gray-400 font-medium">To protect your account, your primary login identity cannot be changed.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 font-bold uppercase tracking-wider text-xs py-4 px-8 rounded-full transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      {profileSaving && <Loader size="xs" className="text-white" />}
                      Save Profile
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === "addresses" && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-6">
                    <h2 className="text-2xl font-serif text-gray-900">Address Book</h2>
                    <button
                      onClick={() => handleOpenAddressModal()}
                      className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Address
                    </button>
                  </div>

                  {loadingAddresses ? (
                    <div className="py-20 flex justify-center items-center">
                      <Loader size="md" className="text-brand-primary" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl flex flex-col items-center max-w-md mx-auto">
                      <MapPin className="w-12 h-12 text-gray-300 mb-4" />
                      <h4 className="text-lg font-bold mb-2">No Saved Addresses</h4>
                      <p className="text-sm text-gray-400 mb-6 px-6">You haven't saved any shipping addresses yet. Save addresses here for faster checkouts.</p>
                      <button
                        onClick={() => handleOpenAddressModal()}
                        className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider"
                      >
                        Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id} 
                          className={`relative border rounded-2xl p-6 transition-all bg-white flex flex-col justify-between ${
                            addr.is_default 
                              ? "border-brand-primary shadow-[0_5px_20px_rgba(202,138,4,0.02)]" 
                              : "border-gray-200/60 hover:border-gray-300"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-bold text-black">{addr.first_name} {addr.last_name}</span>
                              {addr.is_default && (
                                <span className="bg-brand-bg-pink text-brand-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-primary/20">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-500 font-medium">
                              <p>{addr.address}</p>
                              <p>{addr.city}, {addr.state} {addr.zip}</p>
                              <p>{COUNTRIES.find((c) => c.code === addr.country)?.name || addr.country}</p>
                              <p className="text-xs text-gray-400 mt-2">Ph: {addr.phone}</p>
                              <p className="text-xs text-gray-400">Email: {addr.email}</p>
                            </div>
                          </div>

                          <div className="border-t border-gray-100/80 pt-4 mt-6 flex items-center justify-between gap-4">
                            {!addr.is_default ? (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-brand-primary transition-colors"
                              >
                                Set as Default
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-brand-primary font-bold">
                                <Check className="w-3.5 h-3.5" />
                                Primary Shipping
                              </span>
                            )}
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenAddressModal(addr)}
                                className="p-2 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all rounded-lg text-gray-500 hover:text-black"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-2 border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all rounded-lg text-gray-500 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)]"
                >
                  <h2 className="text-2xl font-serif mb-6 text-gray-900 border-b border-gray-50 pb-4">Order History</h2>

                  {loadingOrders ? (
                    <div className="py-20 flex justify-center items-center">
                      <Loader size="md" className="text-brand-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl flex flex-col items-center max-w-md mx-auto">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
                      <h4 className="text-lg font-bold mb-2">No Orders Placed</h4>
                      <p className="text-sm text-gray-400 mb-6 px-6">You haven't made any purchases yet. Your complete purchase logs will show up here.</p>
                      <Link
                        href="/shop"
                        className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider"
                      >
                        Explore Shop
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6 font-sans">
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="border border-gray-200/60 rounded-2xl p-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.015)] transition-all bg-white"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order ID</p>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">#{order.id.slice(0, 8)}...</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</p>
                              <p className="text-sm font-semibold text-gray-700 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">{getCurrencySymbol(order.currency)}{parseFloat(order.total_price).toFixed(2)}</p>
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                order.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                order.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                order.status === "Shipped" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                order.status === "Delivered" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-gray-50 text-gray-600 border-gray-200"
                              }`}>{order.status}</span>
                            </div>
                          </div>

                          <div className="divide-y divide-gray-100 font-sans">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between py-3.5 first:pt-0 last:pb-0">
                                <div>
                                  <p className="text-sm font-bold text-gray-800 leading-snug">{item.product_name}</p>
                                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Quantity: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{getCurrencySymbol(order.currency)}{parseFloat(item.price).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>

                          {order.status !== "Failed" && order.status !== "Refunded" && (
                            <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col">
                              <button
                                onClick={() => toggleTracking(order.id)}
                                className="self-start text-xs font-bold uppercase tracking-wider text-[#B58B5E] hover:text-[#966d42] transition-all flex items-center gap-1.5"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                {expandedTracking[order.id] ? "Hide Tracking" : "Track Shipment"}
                              </button>
                              {expandedTracking[order.id] && (
                                <FulfillmentTimeline order={order} />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Address Form sliding Modal / Overlay */}
      <AnimatePresence>
        {addressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex justify-center items-center p-4 font-sans"
            onClick={() => setAddressModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-[580px] rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100 overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-serif mb-6 text-gray-900 border-b border-gray-50 pb-4">
                {editingAddress ? "Edit Shipping Address" : "Add Shipping Address"}
              </h3>

              {addrError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{addrError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      placeholder="First Name" 
                      value={addrForm.first_name}
                      onChange={(e) => setAddrForm({ ...addrForm, first_name: e.target.value })} 
                      className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      placeholder="Last Name" 
                      value={addrForm.last_name}
                      onChange={(e) => setAddrForm({ ...addrForm, last_name: e.target.value })} 
                      className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                      required 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={addrForm.email}
                    onChange={(e) => setAddrForm({ ...addrForm, email: e.target.value })} 
                    className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                    required 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Country</label>
                  <select 
                    value={addrForm.country} 
                    onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} 
                    className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                  >
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street Address</label>
                  <input 
                    type="text" 
                    placeholder="Street Address" 
                    value={addrForm.address}
                    onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} 
                    className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">State / Province</label>
                    {addrForm.country === "US" ? (
                      <select 
                        value={addrForm.state} 
                        onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} 
                        className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                      >
                        {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="State" 
                        value={addrForm.state}
                        onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} 
                        className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                        required 
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">City</label>
                    <input 
                      type="text" 
                      placeholder="City" 
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} 
                      className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zip / Postal Code</label>
                    <input 
                      type="text" 
                      placeholder="Zip Code" 
                      value={addrForm.zip}
                      onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })} 
                      className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone</label>
                    <input 
                      type="tel" 
                      placeholder="Phone" 
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} 
                      className="h-[48px] px-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-primary text-sm font-medium"
                      required 
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-3">
                  <input
                    type="checkbox"
                    id="addr-default"
                    checked={addrForm.is_default}
                    onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary accent-black"
                  />
                  <label htmlFor="addr-default" className="text-gray-700 text-sm font-medium select-none cursor-pointer">
                    Set this as my default shipping address
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-6">
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(false)}
                    className="px-6 py-3 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addrSaving}
                    className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 font-bold uppercase tracking-wider text-xs py-3 px-6 rounded-full transition-all flex items-center gap-2"
                  >
                    {addrSaving && <Loader size="xs" className="text-white" />}
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
