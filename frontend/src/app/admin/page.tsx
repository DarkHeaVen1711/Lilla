"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Search, Trash2, Edit } from "lucide-react";

export default function AdminDashboard() {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "users">("overview");

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: "",
    name: "",
    slug: "",
    price: "",
    stock: "100",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pink-serum.png",
    is_active: true
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const prodRes = await fetch(`${apiBase}/api/products/`);
      setProducts(await prodRes.json());
      const orderRes = await fetch(`${apiBase}/api/orders/`);
      setOrders(await orderRes.json());
      const userRes = await fetch(`${apiBase}/api/admin/users/`);
      setUsers(await userRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleDeleteProduct = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/api/products/${slug}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Product deleted successfully!");
        fetchData();
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
    }
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
          stock: parseInt(newProduct.stock)
        }),
      });
      if (res.ok) {
        alert("Product added successfully!");
        setIsAddModalOpen(false);
        setNewProduct({ id: "", name: "", slug: "", price: "", stock: "100", image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pink-serum.png", is_active: true });
        fetchData();
      } else {
        const errors = await res.json();
        alert("Failed to add product: " + JSON.stringify(errors));
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
          name: editingProduct.name,
          price: parseFloat(editingProduct.price),
          stock: parseInt(editingProduct.stock),
          is_active: editingProduct.is_active
        }),
      });
      if (res.ok) {
        alert("Product updated successfully!");
        setIsEditModalOpen(false);
        setEditingProduct(null);
        fetchData();
      } else {
        alert("Failed to update product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Catalog Items", val: products.length, icon: <ShoppingBag /> },
                { title: "Low Stock Items", val: products.filter(p => p.stock < 10).length, icon: <ShoppingBag className="text-amber-500" /> },
                { title: "Customer Orders", val: orders.length, icon: <ShoppingCart /> },
                { title: "Registered Users", val: users.length, icon: <Users /> }
              ].map((c, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900">{c.icon}</div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{c.title}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{c.val}</p>
                  </div>
                </div>
              ))}
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
                              onClick={() => { setEditingProduct(p); setIsEditModalOpen(true); }}
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
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4 border border-gray-100">
                  <h3 className="font-serif text-xl text-black font-semibold">Add New Product</h3>
                  <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Product ID (e.g. skin-serum)"
                      value={newProduct.id}
                      onChange={(e) => setNewProduct({ ...newProduct, id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Slug"
                      value={newProduct.slug}
                      onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                      required
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProduct.is_active}
                        onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                      />
                      Is Active
                    </label>
                    <div className="flex gap-2 mt-2">
                      <button type="submit" className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800">Save</button>
                      <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-250">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isEditModalOpen && editingProduct && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4 border border-gray-100">
                  <h3 className="font-serif text-xl text-black font-semibold">Edit Product</h3>
                  <form onSubmit={handleEditProduct} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                        className="w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.is_active}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                      />
                      Is Active
                    </label>
                    <div className="flex gap-2 mt-2">
                      <button type="submit" className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-800">Save</button>
                      <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-250">Cancel</button>
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
                              <div className="flex flex-col md:flex-row justify-between gap-6 text-sm text-left">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-gray-900 mb-2">Shipping Information</h4>
                                  <p className="text-gray-600 font-semibold">{o.shipping_name}</p>
                                  <p className="text-gray-600">{o.shipping_address}</p>
                                  <p className="text-gray-600">{o.shipping_city}, {o.shipping_postal_code}</p>
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
      </main>
    </div>
  );
}
