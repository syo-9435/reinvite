"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "マイページ", icon: "✦" },
  { href: "/events",    label: "イベント",       icon: "♪" },
  { href: "/guests",   label: "ゲスト",          icon: "✿" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #1a0010 0%, #2d0020 60%, #3d0030 100%)" }}
    >
      {/* ロゴ */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            translate="no"
            className="text-2xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, #ff2d8b, #ff75be)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Re:invite
          </span>
        </Link>
        <p className="text-xs text-white/30 mt-0.5 tracking-widest">IDOL EVENT</p>
      </div>

      {/* ナビ */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
              style={active ? { background: "linear-gradient(135deg, #ff2d8b33, #e8007a22)", borderLeft: "3px solid #ff2d8b" } : {}}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ログアウト */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition"
        >
          <span>⏻</span>
          ログアウト
        </button>
      </div>
    </aside>
  );
}
