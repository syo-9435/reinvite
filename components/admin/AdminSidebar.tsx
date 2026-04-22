"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const BASE_NAV = [
  { href: "/admin/dashboard",  label: "マイページ", icon: "🏠" },
  { href: "/admin/events",     label: "イベント管理",   icon: "📅" },
  { href: "/admin/scan",       label: "QRスキャン",     icon: "📱" },
];

const ADMIN_NAV = [
  { href: "/admin/users",      label: "ユーザー",   icon: "👥" },
];

export default function AdminSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const nav = role === "ADMIN" ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #2D0A2E 0%, #1E0A1E 100%)",
      flexShrink: 0,
    }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <h1 translate="no" style={{ margin: 0, fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Re:invite
          </h1>
        </Link>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}>
          {role === "ADMIN" ? "ADMIN" : "INVITER"}
        </p>
      </div>

      <nav style={{ flex: 1, padding: "16px 10px" }}>
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              marginBottom: 4,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.15s",
              background: active ? "rgba(255,107,157,0.15)" : "transparent",
              color: active ? "#FF6B9D" : "rgba(255,255,255,0.45)",
              borderLeft: active ? "3px solid #FF6B9D" : "3px solid transparent",
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 14,
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.3)",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
        }}>
          <span>⏻</span>ログアウト
        </button>
      </div>
    </aside>
  );
}
