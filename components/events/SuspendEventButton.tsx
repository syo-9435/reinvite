"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  {
    value: "PUBLISHED",
    label: "公開中（受付中）",
    color: "#10B981",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#10B981",
  },
  {
    value: "SUSPENDED",
    label: "公開停止",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
] as const;

export default function SuspendEventButton({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 外クリックで閉じる
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function handleSelect(value: string) {
    if (value === currentStatus) { setOpen(false); return; }
    setOpen(false);
    setLoading(true);
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setLoading(false);
    router.refresh();
  }

  const current = OPTIONS.find(o => o.value === currentStatus);
  const isSuspended = currentStatus === "SUSPENDED";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 8,
          border: `1px solid ${isSuspended ? "#FDE68A" : "#D1FAE5"}`,
          background: isSuspended ? "#FFFBEB" : "#ECFDF5",
          color: isSuspended ? "#92400E" : "#065F46",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: isSuspended ? "#F59E0B" : "#10B981",
          display: "inline-block", flexShrink: 0,
        }} />
        {loading ? "更新中..." : (current?.label ?? "ステータス変更")}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          zIndex: 50,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 180,
          overflow: "hidden",
        }}>
          <div style={{ padding: "8px 12px 6px", fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em" }}>
            公開ステータス
          </div>
          {OPTIONS.map(opt => {
            const isActive = opt.value === currentStatus;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background: isActive ? opt.bg : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: opt.dot, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? opt.color : "#374151",
                }}>
                  {opt.label}
                </span>
                {isActive && (
                  <span style={{ marginLeft: "auto", fontSize: 12, color: opt.color }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
