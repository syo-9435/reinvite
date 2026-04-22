"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AuthButton({ loggedIn }: { loggedIn: boolean }) {
  if (loggedIn) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        style={{
          padding: "7px 16px",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 20, fontSize: 13, fontWeight: 600,
          color: "rgba(255,255,255,0.5)", background: "transparent",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >ログアウト</button>
    );
  }
  return (
    <Link href="/login" style={{
      padding: "7px 16px",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 20, fontSize: 13, fontWeight: 600,
      color: "rgba(255,255,255,0.5)", textDecoration: "none",
    }}>ログイン</Link>
  );
}
