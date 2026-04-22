"use client";

import { signOut } from "next-auth/react";

type Props = {
  contractEndAt: string; // ISO string
};

export default function ContractExpired({ contractEndAt }: Props) {
  const ended = new Date(contractEndAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #0A060E 0%, #1E0A1E 100%)",
      padding: 24,
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,107,157,0.3)",
        borderRadius: 20,
        padding: "40px 32px",
        maxWidth: 440,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FF6B9D", marginBottom: 12 }}>
          契約期間が終了しました
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 32 }}>
          契約終了日時：{ended}
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 32 }}>
          引き続きご利用の場合は、管理者にお問い合わせください。
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          style={{
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 32px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
