import { prisma } from "@/lib/prisma";
import Link from "next/link";
import InviteResponseClient from "./InviteResponseClient";

type Params = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Params) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      guest: { select: { name: true } },
      event: { select: { title: true, description: true, venue: true, address: true, startAt: true, endAt: true, ticketCodes: true, status: true } },
    },
  });

  if (!invitation) return <ErrorPage message="招待が見つかりません" />;
  if (invitation.event.status === "SUSPENDED") return <ErrorPage message="このイベントは現在公開停止中です" />;
  if (invitation.expiresAt && invitation.expiresAt < new Date()) return <ErrorPage message="この招待の回答期限が過ぎています" />;
  if (invitation.status === "CANCELLED") return <ErrorPage message="この招待はキャンセルされました" />;

  const fmt = (d: Date) => new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      background: "linear-gradient(160deg, #FF6B9D 0%, #FF9EC4 50%, #C084FC 100%)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      position: "relative",
      overflow: "hidden",
    }}>
      {[
        { w: 160, h: 160, top: -50, right: -50, c: "rgba(255,255,255,0.12)" },
        { w: 80,  h: 80,  bottom: 40, left: 20, c: "rgba(233,213,255,0.2)" },
      ].map((s, i) => (
        <div key={i} style={{ position: "fixed", borderRadius: "50%", width: s.w, height: s.h, top: s.top, bottom: s.bottom, left: s.left, right: s.right, background: s.c, pointerEvents: "none" }} />
      ))}

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <Link href="/" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
          <p style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "-0.5px",
            marginBottom: 16,
            background: "rgba(255,255,255,0.9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Re:invite</p>
        </Link>

        <div style={{ background: "#FFFCFE", borderRadius: 28, overflow: "hidden", boxShadow: "0 12px 48px rgba(255,107,157,0.25)" }}>
          {/* イベントヘッダー */}
          <div style={{
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            padding: "24px 24px 20px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, width: 80, height: 80, background: "#fff", top: -20, right: -20 }} />
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: "0 0 8px", letterSpacing: 2, fontWeight: 700 }}>INVITATION</p>
            <h1 style={{ color: "#fff", fontSize: 20, margin: "0 0 8px", fontWeight: 900 }}>{invitation.event.title}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: 0 }}>📅 {fmt(invitation.event.startAt)}</p>
              {invitation.event.venue && <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>📍 {invitation.event.venue}{invitation.event.address && ` · ${invitation.event.address}`}</p>}
            </div>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            {/* 宛名（名前がある場合のみ） */}
            {invitation.guest.name && (
              <p style={{ margin: "0 0 16px", fontSize: 15, color: "#1E0A1E" }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#FF6B9D" }}>{invitation.guest.name}</span> さんへ
              </p>
            )}

            {/* メッセージ */}
            {invitation.message && (
              <div style={{ background: "#FFF0F6", borderRadius: 14, padding: "12px 16px", marginBottom: 16, borderLeft: "3px solid #FF6B9D" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E", whiteSpace: "pre-wrap" }}>{invitation.message}</p>
              </div>
            )}

            {invitation.event.description && (
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8B7A8E", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{invitation.event.description}</p>
            )}

            {invitation.expiresAt && (
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#8B7A8E" }}>
                ⏱ 回答期限: {new Date(invitation.expiresAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            <InviteResponseClient
              token={token}
              alreadyAccepted={invitation.status === "ACCEPTED"}
              requiresTicket={!!(invitation.event.ticketCodes && JSON.parse(invitation.event.ticketCodes).length > 0)}
              initialStatus={invitation.status}
              initialResponseNote={invitation.responseNote}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #FF6B9D 0%, #C084FC 100%)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      <div style={{ background: "#FFFCFE", borderRadius: 28, padding: "40px 32px", textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>Re:invite</p>
        <p style={{ color: "#8B7A8E", fontSize: 14 }}>{message}</p>
      </div>
    </div>
  );
}
