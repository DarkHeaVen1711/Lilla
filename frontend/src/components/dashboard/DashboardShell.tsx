"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";

// ─── Nav Items ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: ("admin" | "manager")[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/admin/dashboard",        icon: "⊞", roles: ["admin"] },
  { label: "Orders",       href: "/admin/orders",           icon: "📦", roles: ["admin"] },
  { label: "Stock",        href: "/admin/stock",            icon: "🗃", roles: ["admin"] },
  { label: "Users",        href: "/admin/users",            icon: "👥", roles: ["admin"] },
  { label: "Overview",     href: "/manager/dashboard",      icon: "⊞", roles: ["manager"] },
  { label: "Products",     href: "/manager/products",       icon: "🛍", roles: ["manager"] },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const user = useStore((s) => s.user);
  const logoutUser = useStore((s) => s.logoutUser);

  const role = user?.role as "admin" | "manager" | undefined;

  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <div className="ds-root" data-collapsed={collapsed}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="ds-sidebar">
        {/* Branding */}
        <div className="ds-brand">
          {!collapsed && (
            <span className="ds-brand-text">
              LILLA <span className="ds-brand-badge">{role?.toUpperCase()}</span>
            </span>
          )}
          <button
            className="ds-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="ds-nav">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ds-nav-item${active ? " ds-nav-item--active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="ds-nav-icon">{item.icon}</span>
                {!collapsed && <span className="ds-nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="ds-sidebar-footer">
          {!collapsed && (
            <span className="ds-user-ident" title={user?.identityString}>
              {user?.identityString?.slice(0, 22)}
            </span>
          )}
          <button
            className="ds-logout-btn"
            onClick={() => {
              logoutUser();
              window.location.href = "/";
            }}
            title="Sign out"
          >
            {collapsed ? "⏏" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="ds-content">{children}</main>

      {/* ── Inline styles (scoped) ──────────────────────────── */}
      <style jsx>{`
        /* Root grid */
        .ds-root {
          display: grid;
          grid-template-columns: 220px 1fr;
          min-height: 100vh;
          background: #0a0a0f;
          color: #e8e8f0;
          transition: grid-template-columns 0.25s ease;
        }
        .ds-root[data-collapsed="true"] {
          grid-template-columns: 64px 1fr;
        }

        /* Sidebar */
        .ds-sidebar {
          display: flex;
          flex-direction: column;
          background: #111118;
          border-right: 1px solid #1e1e2e;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }

        /* Brand row */
        .ds-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px 16px;
          border-bottom: 1px solid #1e1e2e;
          min-height: 64px;
        }
        .ds-brand-text {
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: 0.1em;
          color: #c9a96e;
          white-space: nowrap;
        }
        .ds-brand-badge {
          font-size: 0.6rem;
          background: #1e2a1e;
          color: #5fa85f;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
          vertical-align: middle;
        }
        .ds-collapse-btn {
          background: none;
          border: 1px solid #2a2a3e;
          color: #888;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.7rem;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .ds-collapse-btn:hover {
          background: #1e1e2e;
          color: #e8e8f0;
        }

        /* Nav */
        .ds-nav {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }
        .ds-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #888;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .ds-nav-item:hover {
          background: #1a1a28;
          color: #e8e8f0;
        }
        .ds-nav-item--active {
          background: #1a2435;
          color: #c9a96e;
          border-left: 2px solid #c9a96e;
        }
        .ds-nav-icon {
          flex-shrink: 0;
          font-size: 1rem;
          width: 20px;
          text-align: center;
        }
        .ds-nav-label {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Footer */
        .ds-sidebar-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid #1e1e2e;
          gap: 8px;
        }
        .ds-user-ident {
          font-size: 0.75rem;
          color: #555;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .ds-logout-btn {
          background: none;
          border: 1px solid #2a2a3e;
          color: #888;
          border-radius: 6px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 0.75rem;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .ds-logout-btn:hover {
          background: #2a1a1a;
          color: #d9534f;
          border-color: #d9534f;
        }

        /* Main content */
        .ds-content {
          padding: 32px;
          overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ds-root {
            grid-template-columns: 0px 1fr;
          }
          .ds-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
