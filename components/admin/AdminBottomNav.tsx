"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_NAV = [
  { href: "/admin/dashboard", label: "マイページ", icon: "🏠" },
  { href: "/admin/events",    label: "イベント管理",   icon: "📅" },
  { href: "/admin/scan",      label: "QRスキャン",     icon: "📱" },
];

const ADMIN_ONLY_NAV = [
  { href: "/admin/users", label: "ユーザー", icon: "👥" },
];

export default function AdminBottomNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const nav = role === "ADMIN" ? [...BASE_NAV, ...ADMIN_ONLY_NAV] : BASE_NAV;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, #2D0A2E 0%, #1E0A1E 100%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
      }}>
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "4px 12px",
                textDecoration: "none",
                color: active ? "#FF6B9D" : "rgba(255,255,255,0.45)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
