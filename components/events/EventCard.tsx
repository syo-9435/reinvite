"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const GRADIENTS = [
  "linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%)",
  "linear-gradient(135deg, #818CF8 0%, #EC4899 100%)",
  "linear-gradient(135deg, #F472B6 0%, #FB923C 100%)",
  "linear-gradient(135deg, #34D399 0%, #3B82F6 100%)",
  "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)",
];

type Props = {
  event: {
    id: string;
    title: string;
    startAt: Date | string;
    venue: string | null;
    imageUrl: string | null;
    _count: { invitations: number };
  };
};

export default function EventCard({ event }: Props) {
  const [hovered, setHovered] = useState(false);

  const dateStr = new Date(event.startAt).toLocaleDateString("ja-JP", {
    month: "short", day: "numeric", weekday: "short",
  });
  const timeStr = new Date(event.startAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit", minute: "2-digit",
  });

  const fallbackGrad = GRADIENTS[event.title.charCodeAt(0) % GRADIENTS.length];

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", display: "block" }}>
      <article style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "#16101A",
        border: "1px solid rgba(255,255,255,0.08)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 60px rgba(255,107,157,0.25)" : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* フライヤー画像 */}
        <div style={{ position: "relative", width: "100%", paddingBottom: "130%", background: fallbackGrad }}>
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              style={{ objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48,
            }}>🎫</div>
          )}
          {/* 下グラデーション */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(10,6,14,0.92) 100%)",
          }} />
          {/* 招待制バッジ */}
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(255,107,157,0.85)",
            backdropFilter: "blur(8px)",
            borderRadius: 8,
            padding: "3px 8px",
            fontSize: 10, fontWeight: 700, color: "#fff",
            letterSpacing: "0.05em",
          }}>INVITE ONLY</div>
        </div>

        {/* テキスト情報 */}
        <div style={{ padding: "12px 14px 14px" }}>
          <p style={{
            margin: "0 0 6px",
            fontSize: 14, fontWeight: 800, color: "#fff",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>{event.title}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: "#FF6B9D" }}>📅</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                {dateStr} {timeStr}
              </span>
            </div>
            {event.venue && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, color: "#C084FC" }}>📍</span>
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.55)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {event.venue}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
