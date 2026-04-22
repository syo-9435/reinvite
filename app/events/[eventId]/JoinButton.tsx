"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  eventId: string;
  isLoggedIn: boolean;
  initialRegistered: boolean;
}

export default function JoinButton({ eventId, isLoggedIn, initialRegistered }: Props) {
  const router = useRouter();
  const [registered, setRegistered] = useState(initialRegistered);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/events/${eventId}`);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/join`, { method: "POST" });
    setLoading(false);

    if (res.ok || res.status === 409) {
      setRegistered(true);
    }
  }

  if (registered) {
    return (
      <button disabled style={{
        width: "100%", padding: "14px",
        borderRadius: 14, border: "none",
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.35)",
        fontWeight: 700, fontSize: 14,
        cursor: "not-allowed", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span>✓</span> 参加登録済み
      </button>
    );
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      style={{
        width: "100%", padding: "14px",
        borderRadius: 14, border: "none",
        background: loading
          ? "rgba(255,107,157,0.5)"
          : "linear-gradient(135deg, #FF6B9D, #C084FC)",
        color: "#fff",
        fontWeight: 700, fontSize: 14,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        boxShadow: loading ? "none" : "0 4px 20px rgba(255,107,157,0.4)",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <span style={{ fontSize: 16 }}>🎫</span>
      {loading ? "登録中..." : "このイベントに参加する"}
    </button>
  );
}
