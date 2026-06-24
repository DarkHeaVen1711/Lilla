"use client";

import { useState, useEffect, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/apiClient";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  role: "customer" | "manager" | "admin";
  last_login: string | null;
  date_joined: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  manager: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  customer: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin } = useStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    user: AdminUser | null;
    newRole: string;
  }>({ open: false, user: null, newRole: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      const res = await apiFetch(`/api/admin/users/?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const openConfirm = (user: AdminUser, newRole: string) => {
    setActionError("");
    setConfirmModal({ open: true, user, newRole });
  };

  const handleRoleChange = async () => {
    if (!confirmModal.user) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await apiFetch(
        `/api/admin/users/${confirmModal.user.id}/role/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: confirmModal.newRole }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setConfirmModal({ open: false, user: null, newRole: "" });
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Promote users to Manager or demote them. Every change is logged.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Last Login</th>
                  <th className="px-5 py-3 text-left">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <AnimatePresence>
                  {filtered.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">{user.username}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{user.email || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">{fmt(user.date_joined)}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{fmt(user.last_login)}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={user.role}
                          onChange={(e) => openConfirm(user, e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        >
                          <option value="customer">Customer</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-zinc-500">No users match your filter.</div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.open && confirmModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmModal({ open: false, user: null, newRole: "" })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-white mb-2">Confirm Role Change</h2>
              <p className="text-zinc-400 text-sm mb-4">
                Change{" "}
                <span className="text-white font-medium">{confirmModal.user.username}</span>'s role from{" "}
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLORS[confirmModal.user.role]}`}>
                  {confirmModal.user.role}
                </span>{" "}
                to{" "}
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_COLORS[confirmModal.newRole]}`}>
                  {confirmModal.newRole}
                </span>
                ?
              </p>
              {actionError && (
                <p className="text-red-400 text-sm mb-3 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                  {actionError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ open: false, user: null, newRole: "" })}
                  className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Updating…" : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
