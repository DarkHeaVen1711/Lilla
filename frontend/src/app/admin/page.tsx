"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Search,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from "recharts";

const ListInput = ({
  label,
  items = [],
  onChange,
  isColor = false
}: {
  label: string;
  items: string[];
  onChange: (newItems: string[]) => void;
  isColor?: boolean;
}) => {
  const [inputValue, setInputValue] = useState("");
  const safeItems = items || [];
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        {isColor && (
          <input
            type="color"
            value={inputValue.startsWith("#") && inputValue.length === 7 ? inputValue : "#000000"}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-10 h-9 p-0 border border-gray-200 rounded-xl cursor-pointer bg-white overflow-hidden shrink-0"
          />
        )}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isColor ? "#ffffff or color picker" : `Add ${label.toLowerCase()}`}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
        />
        <button
          type="button"
          onClick={() => {
            let val = inputValue.trim();
            if (isColor && val && !val.startsWith("#")) {
              val = "#" + val;
            }
            if (val && !safeItems.includes(val)) {
              onChange([...safeItems, val]);
              setInputValue("");
            }
          }}
          className="bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {safeItems.map((item, idx) => (
          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-gray-200/50 shadow-sm">
            {isColor && (
              <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: item }} />
            )}
            <span className="font-mono">{item}</span>
            <button
              type="button"
              onClick={() => onChange(safeItems.filter((_, i) => i !== idx))}
              className="text-gray-400 hover:text-red-500 font-bold ml-0.5 text-sm leading-none"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};


export default function AdminDashboard() {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "users">("overview");

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getInitialProductState = () => ({
    id: "",
    name: "",
    slug: "",
    price: "",
    stock: "100",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pink-serum.png",
    is_active: true,
    category: "",
    description: "",
    ingredients: "",
    skin_concerns: [] as string[],
    key_ingredients: [] as string[],
    skin_types: [] as string[],
    application_steps: [] as string[],
    finish: "",
    applicator: "",
    shades: [] as string[],
    is_deal_of_the_day: false,
    deal_expires_at: ""
  });

  const [newProduct, setNewProduct] = useState(getInitialProductState());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const formatDatetimeLocal = (dateStr: any) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const tzoffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct({
      ...product,
      category: product.category ? String(product.category) : "",
      description: product.description || "",
      ingredients: product.ingredients || "",
      skin_concerns: product.skin_concerns || [],
      key_ingredients: product.key_ingredients || [],
      skin_types: product.skin_types || [],
      application_steps: product.application_steps || [],
      finish: product.finish || "",
      applicator: product.applicator || "",
      shades: product.shades || [],
      is_deal_of_the_day: product.is_deal_of_the_day || false,
      deal_expires_at: product.deal_expires_at ? formatDatetimeLocal(product.deal_expires_at) : ""
    });
  };

  const handleDeleteProduct = async (slug: string) => {
    toast("Delete this product?", {
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
            const res = await fetch(`${apiBase}/api/products/${slug}/`, {
              method: "DELETE",
            });
            if (res.ok) {
              toast.success("Product deleted successfully!");
              fetchData();
            } else {
              toast.error("Failed to delete product.");
            }
          } catch (err) {
            console.error(err);
            toast.error("An error occurred while deleting.");
          }
        },
      },
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/api/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          category: newProduct.category ? parseInt(newProduct.category) : null,
          deal_expires_at: newProduct.deal_expires_at ? new Date(newProduct.deal_expires_at).toISOString() : null
        }),
      });
      if (res.ok) {
        toast.success("Product added successfully!");
        setIsAddModalOpen(false);
        setNewProduct(getInitialProductState());
        fetchData();
      } else {
        const errors = await res.json();
        toast.error("Failed to add product: " + JSON.stringify(errors));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/api/products/${editingProduct.slug}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          price: parseFloat(editingProduct.price),
          stock: parseInt(editingProduct.stock),
          category: editingProduct.category ? parseInt(editingProduct.category) : null,
          deal_expires_at: editingProduct.deal_expires_at ? new Date(editingProduct.deal_expires_at).toISOString() : null
        }),
      });
      if (res.ok) {
        toast.success("Product updated successfully!");
        setIsEditModalOpen(false);
        setEditingProduct(null);
        fetchData();
      } else {
        toast.error("Failed to update product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        alert("Order status updated successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to update status: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleUserRole = async (userId: number, currentStaffStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_staff: !currentStaffStatus }),
      });
      if (res.ok) {
        alert("User role updated successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to update role: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to refund this order? This will process a Stripe refund and set status to Refunded.")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/refund/`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Order refunded successfully!");
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to refund order: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleUserBlock = async (userId: number, currentActiveStatus: boolean) => {
    const action = currentActiveStatus ? "block" : "unblock";
    if (!confirm(`Are you sure you want to ${action} this user account?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActiveStatus }),
      });
      if (res.ok) {
        alert(`User account ${action}ed successfully!`);
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Failed to ${action} user: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const fetchData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const [
        productsRes,
        ordersRes,
        usersRes,
        analyticsRes,
        stockAdjustmentsRes,
        categoriesRes
      ] = await Promise.allSettled([
        fetch(`${apiBase}/api/products/`),
        fetch("/api/orders/"),
        fetch("/api/admin/users/"),
        fetch("/api/admin/analytics/"),
        fetch("/api/admin/stock-adjustments/"),
        fetch(`${apiBase}/api/categories/`)
      ]);

      if (productsRes.status === "fulfilled" && productsRes.value.ok) {
        setProducts(await productsRes.value.json());
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        setOrders(await ordersRes.value.json());
      }
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        setUsers(await usersRes.value.json());
      }
      if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
        setAnalytics(await analyticsRes.value.json());
      }
      if (stockAdjustmentsRes.status === "fulfilled" && stockAdjustmentsRes.value.ok) {
        setStockAdjustments(await stockAdjustmentsRes.value.json());
      }
      if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
        setCategories(await categoriesRes.value.json());
      }

      setIsLoadingAnalytics(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user || !user.isStaff) {
      router.push("/");
    } else {
      fetchData();
    }
  }, [user, router]);

  if (!user || !user.isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Access Denied. Redirecting...
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col lg:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col p-6 pt-28 lg:pt-32">
        <div className="flex items-center gap-2 mb-8 px-2">
          <LayoutDashboard className="w-5 h-5 text-gray-900" />
          <h2 className="font-bold text-gray-900 text-lg">Admin Panel</h2>
        </div>
        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {(["overview", "products", "orders", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
              }`}
            >
              {tab === "overview" && <LayoutDashboard className="w-4 h-4" />}
              {tab === "products" && <ShoppingBag className="w-4 h-4" />}
              {tab === "orders" && <ShoppingCart className="w-4 h-4" />}
              {tab === "users" && <Users className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 pt-6 lg:pt-32 max-w-[1200px]">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            <h1 className="font-serif text-3xl text-black">Dashboard Overview</h1>
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
              {[
                { title: "Gross Revenue", val: analytics ? `$${analytics.gross_revenue.toFixed(2)}` : "$0.00", icon: <DollarSign className="w-5 h-5 text-emerald-600" />, sub: "Paid orders total", isLoading: isLoadingAnalytics },
                { title: "Average Order Value", val: analytics ? `$${analytics.aov.toFixed(2)}` : "$0.00", icon: <TrendingUp className="w-5 h-5 text-indigo-600" />, sub: "Revenue per paid order", isLoading: isLoadingAnalytics },
                { title: "Catalog Items", val: products.length, icon: <ShoppingBag className="w-5 h-5 text-gray-700" />, sub: "Total products listed", isLoading: isLoadingAnalytics },
                { title: "Low Stock Items", val: products.filter(p => p.stock < 10).length, icon: <ShoppingBag className="w-5 h-5 text-amber-500" />, sub: "Stock level < 10 units", isLoading: isLoadingAnalytics },
                { title: "Customer Orders", val: orders.length, icon: <ShoppingCart className="w-5 h-5 text-gray-700" />, sub: "Total orders received", isLoading: isLoadingAnalytics },
                { title: "Registered Users", val: users.length, icon: <Users className="w-5 h-5 text-gray-700" />, sub: "Total customer accounts", isLoading: isLoadingAnalytics }
              ].map((c, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-[125px] transition-all hover:shadow-md hover:border-gray-200/60">
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider leading-none">{c.title}</p>
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">{c.icon}</div>
                  </div>
                  <div>
                    {c.isLoading ? (
                      <div className="h-6 w-20 bg-gray-100 animate-pulse rounded mt-2" />
                    ) : (
                      <p className="text-xl font-bold text-gray-900 mt-2 tracking-tight leading-none">{c.val}</p>
                    )}
                    <p className="text-[10px] text-gray-400 font-semibold mt-1.5">{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue & Orders Trend Line/Area Chart */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="font-serif text-lg text-black font-semibold">Revenue & Orders Trend</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Performance tracking over the last 30 days</p>
                </div>
                <div className="h-[320px] w-full mt-2">
                  {!isClient || !analytics ? (
                    <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400 font-semibold">
                      Loading trend metrics...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics.daily_logs}
                        margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#18181B" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#18181B" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={(str) => {
                            try {
                              const parts = str.split('-');
                              if (parts.length === 3) {
                                const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                              }
                              return str;
                            } catch {
                              return str;
                            }
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#9CA3AF"
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#9CA3AF"
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={false}
                          dx={10}
                          tickFormatter={(v) => Math.round(v).toString()}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255, 255, 255, 0.96)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#1F2937"
                          }}
                          labelFormatter={(str) => {
                            try {
                              const parts = str.split('-');
                              if (parts.length === 3) {
                                const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
                                return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
                              }
                              return str;
                            } catch {
                              return str;
                            }
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#18181B"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders_count"
                          name="Orders"
                          stroke="#F43F5E"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          fill="none"
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingBottom: '10px' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Selling Products Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="font-serif text-lg text-black font-semibold">Top-Selling Products</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Best performing items by units sold</p>
                </div>
                <div className="h-[320px] w-full mt-2">
                  {!isClient || !analytics ? (
                    <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400 font-semibold">
                      Loading product aggregates...
                    </div>
                  ) : analytics.top_products.length === 0 ? (
                    <div className="w-full h-full rounded-xl flex items-center justify-center text-xs text-gray-400 font-semibold border border-dashed border-gray-100">
                      No sales data available yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.top_products}
                        layout="vertical"
                        margin={{ top: 5, right: 5, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                        <XAxis
                          type="number"
                          stroke="#9CA3AF"
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={false}
                          dy={5}
                          tickFormatter={(v) => Math.round(v).toString()}
                        />
                        <YAxis
                          type="category"
                          dataKey="product_name"
                          stroke="#4B5563"
                          fontSize={10}
                          fontWeight={600}
                          tickLine={false}
                          axisLine={false}
                          width={110}
                          tickFormatter={(str) => str.length > 18 ? `${str.substring(0, 16)}...` : str}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255, 255, 255, 0.96)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#1F2937"
                          }}
                          formatter={(value, name) => {
                            if (name === "units_sold") return [value, "Units Sold"];
                            if (name === "revenue") return [`$${Number(value).toFixed(2)}`, "Revenue"];
                            return [value, name];
                          }}
                        />
                        <Bar
                          dataKey="units_sold"
                          name="Units Sold"
                          fill="#18181B"
                          radius={[0, 6, 6, 0]}
                          barSize={15}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Stock Adjustments History Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="font-serif text-lg text-black font-semibold">Inventory Stock Adjustments History</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">Logs of manual/automatic inventory stock level alterations</p>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Adjusted By</th>
                      <th className="pb-3 font-medium">Old Stock</th>
                      <th className="pb-3 font-medium">New Stock</th>
                      <th className="pb-3 font-medium">Reason</th>
                      <th className="pb-3 font-medium text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                    {stockAdjustments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-400 italic">No inventory logs available.</td>
                      </tr>
                    ) : (
                      stockAdjustments.map((sa) => (
                        <tr key={sa.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 font-bold text-gray-900">{sa.product_name}</td>
                          <td className="py-3">{sa.user_email || sa.user_username || "System / Admin"}</td>
                          <td className="py-3 font-mono">{sa.old_stock}</td>
                          <td className="py-3 font-mono text-gray-900 font-bold">{sa.new_stock}</td>
                          <td className="py-3 text-gray-500">{sa.reason}</td>
                          <td className="py-3 text-right text-gray-400 font-normal">{new Date(sa.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="font-serif text-3xl text-black">Products Management</h1>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Add Product
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 flex flex-col gap-6">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-4 font-medium">Product</th>
                      <th className="pb-4 font-medium">Price</th>
                      <th className="pb-4 font-medium">Stock</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="group hover:bg-gray-50/40 transition-colors">
                        <td className="py-4 flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1 shrink-0" />
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.id}</p>
                          </div>
                        </td>
                        <td className="py-4 font-semibold text-gray-900">${p.price}</td>
                        <td className="py-4">
                          <span className={`font-semibold ${p.stock < 10 ? "text-amber-600 font-bold" : "text-gray-900"}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.slug)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {isAddModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl flex flex-col gap-4 border border-gray-100 max-h-[90vh]">
                  <h3 className="font-serif text-xl text-black font-semibold">Add New Product</h3>
                  <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                    {/* General Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">General Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Product ID</label>
                          <input
                            type="text"
                            placeholder="e.g. skin-serum"
                            value={newProduct.id}
                            onChange={(e) => setNewProduct({ ...newProduct, id: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                          <input
                            type="text"
                            placeholder="Product Name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Slug</label>
                          <input
                            type="text"
                            placeholder="Slug"
                            value={newProduct.slug}
                            onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-black"
                          >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                          <input
                            type="number"
                            placeholder="Stock"
                            value={newProduct.stock}
                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={newProduct.image}
                          onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea
                          placeholder="Product Description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black h-20 resize-y"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Ingredients</label>
                        <textarea
                          placeholder="Ingredients list"
                          value={newProduct.ingredients}
                          onChange={(e) => setNewProduct({ ...newProduct, ingredients: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black h-20 resize-y"
                        />
                      </div>
                    </div>

                    {/* Skincare Specifications */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">Skincare Specifications</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <ListInput
                          label="Skin Concerns"
                          items={newProduct.skin_concerns}
                          onChange={(vals) => setNewProduct({ ...newProduct, skin_concerns: vals })}
                        />
                        <ListInput
                          label="Key Ingredients"
                          items={newProduct.key_ingredients}
                          onChange={(vals) => setNewProduct({ ...newProduct, key_ingredients: vals })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <ListInput
                          label="Skin Types"
                          items={newProduct.skin_types}
                          onChange={(vals) => setNewProduct({ ...newProduct, skin_types: vals })}
                        />
                        <ListInput
                          label="Application Steps"
                          items={newProduct.application_steps}
                          onChange={(vals) => setNewProduct({ ...newProduct, application_steps: vals })}
                        />
                      </div>
                    </div>

                    {/* Makeup Specifications */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">Makeup Specifications</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Finish</label>
                          <input
                            type="text"
                            placeholder="e.g. Matte, Dewy"
                            value={newProduct.finish}
                            onChange={(e) => setNewProduct({ ...newProduct, finish: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Applicator</label>
                          <input
                            type="text"
                            placeholder="e.g. Dropper, Brush"
                            value={newProduct.applicator}
                            onChange={(e) => setNewProduct({ ...newProduct, applicator: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                          />
                        </div>
                      </div>
                      <ListInput
                        label="Shades (Hex Codes)"
                        items={newProduct.shades}
                        onChange={(vals) => setNewProduct({ ...newProduct, shades: vals })}
                        isColor={true}
                      />
                    </div>

                    {/* Promotions & Status */}
                    <div className="space-y-3 pt-2 pb-4">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">Promotions & Status</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newProduct.is_deal_of_the_day}
                              onChange={(e) => setNewProduct({ ...newProduct, is_deal_of_the_day: e.target.checked })}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            Deal of the Day
                          </label>
                          {newProduct.is_deal_of_the_day && (
                            <div className="flex flex-col gap-1 mt-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Deal Expires At</label>
                              <input
                                type="datetime-local"
                                value={newProduct.deal_expires_at}
                                onChange={(e) => setNewProduct({ ...newProduct, deal_expires_at: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-start">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newProduct.is_active}
                              onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            Is Active
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 shrink-0">
                      <button type="submit" className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">Save Product</button>
                      <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isEditModalOpen && editingProduct && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl flex flex-col gap-4 border border-gray-100 max-h-[90vh]">
                  <h3 className="font-serif text-xl text-black font-semibold">Edit Product</h3>
                  <form onSubmit={handleEditProduct} className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                    {/* General Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">General Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Product ID</label>
                          <input
                            type="text"
                            placeholder="e.g. skin-serum"
                            value={editingProduct.id}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none text-gray-500"
                            disabled
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
                          <input
                            type="text"
                            placeholder="Product Name"
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Slug</label>
                          <input
                            type="text"
                            placeholder="Slug"
                            value={editingProduct.slug}
                            onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                          <select
                            value={editingProduct.category}
                            onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-black"
                          >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={editingProduct.price}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                          <input
                            type="number"
                            placeholder="Stock"
                            value={editingProduct.stock}
                            onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={editingProduct.image}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea
                          placeholder="Product Description"
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black h-20 resize-y"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Ingredients</label>
                        <textarea
                          placeholder="Ingredients list"
                          value={editingProduct.ingredients}
                          onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black h-20 resize-y"
                        />
                      </div>
                    </div>

                    {/* Skincare Specifications */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">Skincare Specifications</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <ListInput
                          label="Skin Concerns"
                          items={editingProduct.skin_concerns}
                          onChange={(vals) => setEditingProduct({ ...editingProduct, skin_concerns: vals })}
                        />
                        <ListInput
                          label="Key Ingredients"
                          items={editingProduct.key_ingredients}
                          onChange={(vals) => setEditingProduct({ ...editingProduct, key_ingredients: vals })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <ListInput
                          label="Skin Types"
                          items={editingProduct.skin_types}
                          onChange={(vals) => setEditingProduct({ ...editingProduct, skin_types: vals })}
                        />
                        <ListInput
                          label="Application Steps"
                          items={editingProduct.application_steps}
                          onChange={(vals) => setEditingProduct({ ...editingProduct, application_steps: vals })}
                        />
                      </div>
                    </div>

                    {/* Makeup Specifications */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">Makeup Specifications</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Finish</label>
                          <input
                            type="text"
                            placeholder="e.g. Matte, Dewy"
                            value={editingProduct.finish}
                            onChange={(e) => setEditingProduct({ ...editingProduct, finish: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Applicator</label>
                          <input
                            type="text"
                            placeholder="e.g. Dropper, Brush"
                            value={editingProduct.applicator}
                            onChange={(e) => setEditingProduct({ ...editingProduct, applicator: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                          />
                        </div>
                      </div>
                      <ListInput
                        label="Shades (Hex Codes)"
                        items={editingProduct.shades}
                        onChange={(vals) => setEditingProduct({ ...editingProduct, shades: vals })}
                        isColor={true}
                      />
                    </div>

                    {/* Promotions & Status */}
                    <div className="space-y-3 pt-2 pb-4">
                      <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5 text-sm">Promotions & Status</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editingProduct.is_deal_of_the_day}
                              onChange={(e) => setEditingProduct({ ...editingProduct, is_deal_of_the_day: e.target.checked })}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            Deal of the Day
                          </label>
                          {editingProduct.is_deal_of_the_day && (
                            <div className="flex flex-col gap-1 mt-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Deal Expires At</label>
                              <input
                                type="datetime-local"
                                value={editingProduct.deal_expires_at}
                                onChange={(e) => setEditingProduct({ ...editingProduct, deal_expires_at: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-black"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-start">
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editingProduct.is_active}
                              onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            Is Active
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 shrink-0">
                      <button type="submit" className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">Save Product</button>
                      <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="flex flex-col gap-6">
            <h1 className="font-serif text-3xl text-black">Customer Orders</h1>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 flex flex-col gap-6">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-4 font-medium">Order ID</th>
                      <th className="pb-4 font-medium">Customer</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Total</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {orders.map((o) => (
                      <Fragment key={o.id}>
                        <tr className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-4 font-mono text-xs text-gray-500">#{o.id.substring(0, 8)}...</td>
                          <td className="py-4 font-semibold text-gray-900">{o.user_identifier}</td>
                          <td className="py-4 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                          <td className="py-4 font-semibold text-gray-900">${o.total_price}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 capitalize">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                              className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {expandedOrderId === o.id ? "Hide Details" : "View Details"}
                            </button>
                          </td>
                        </tr>
                        {expandedOrderId === o.id && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50/50 p-6">
                              <div className="flex flex-col md:flex-row justify-between gap-8 text-sm text-left">
                                <div className="space-y-1 shrink-0">
                                  <h4 className="font-bold text-gray-900 mb-2">Shipping Information</h4>
                                  <p className="text-gray-600 font-semibold">{o.shipping_name}</p>
                                  <p className="text-gray-600">{o.shipping_address}</p>
                                  <p className="text-gray-600">{o.shipping_city}, {o.shipping_postal_code}</p>
                                </div>
                                <div className="space-y-4 shrink-0 w-48">
                                  <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Fulfillment Status</h4>
                                    <select
                                      value={o.status}
                                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white outline-none focus:border-black font-semibold capitalize"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Paid">Paid</option>
                                      <option value="Shipped">Shipped</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Failed">Failed</option>
                                      <option value="Refunded">Refunded</option>
                                    </select>
                                  </div>
                                  {o.status === "Paid" && (
                                    <div>
                                      <button
                                        onClick={() => handleRefundOrder(o.id)}
                                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-3 py-2 rounded-xl text-xs transition-colors border border-red-200/50"
                                      >
                                        Refund Order
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 md:max-w-md">
                                  <h4 className="font-bold text-gray-900 mb-2">Order Items</h4>
                                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                                    {o.items?.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center p-3 text-xs">
                                        <div>
                                          <p className="font-bold text-gray-900">{item.product_name}</p>
                                          <p className="text-gray-400 font-semibold">Qty: {item.quantity} × ${item.price}</p>
                                        </div>
                                        <p className="font-bold text-gray-900">${(item.quantity * item.price).toFixed(2)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="flex flex-col gap-6">
            <h1 className="font-serif text-3xl text-black">Registered Users</h1>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 flex flex-col gap-6">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-4 font-medium">Username</th>
                      <th className="pb-4 font-medium">Email</th>
                      <th className="pb-4 font-medium">Role</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium">Joined Date</th>
                      <th className="pb-4 font-medium">Last Login</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-4 font-semibold text-gray-900">{u.username}</td>
                        <td className="py-4 text-gray-500">{u.email || "N/A"}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_staff ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700"}`}>
                            {u.is_staff ? "Admin" : "Customer"}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {u.is_active ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="py-4 text-gray-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                        <td className="py-4 text-gray-500">
                          {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleUserRole(u.id, u.is_staff)}
                              className="text-xs font-semibold bg-gray-100 hover:bg-gray-250 text-gray-700 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200/40"
                            >
                              Toggle Admin
                            </button>
                            <button
                              onClick={() => handleToggleUserBlock(u.id, u.is_active)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border ${
                                u.is_active
                                  ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200/50"
                                  : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200/50"
                              }`}
                            >
                              {u.is_active ? "Block" : "Unblock"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
