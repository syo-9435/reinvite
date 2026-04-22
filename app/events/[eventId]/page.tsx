import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import JoinButton from "./JoinButton";

type Props = { params: Promise<{ eventId: string }> };

export default async function PublicEventPage({ params }: Props) {
  const { eventId } = await params;
  const session = await auth();

  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "PUBLISHED" },
    include: { _count: { select: { invitations: true } } },
  });
  if (!event) notFound();

  // ログインユーザーの参加登録済み確認
  const isRegistered = session?.user?.email
    ? !!(await prisma.invitation.findFirst({
        where: {
          eventId,
          guest: { userId: event.userId, email: session.user.email },
        },
      }))
    : false;

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("ja-JP", {
      year: "numeric", month: "long", day: "numeric",
      weekday: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ background: "#0A060E", minHeight: "100vh", color: "#fff" }}>
      {/* ヘッダー */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,6,14,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto", padding: "0 20px",
          height: 58, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 20, fontWeight: 900,
              background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Re:invite</span>
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            {session ? (
              <Link href={session.user.role === "ADMIN" || session.user.role === "INVITER" ? "/admin/dashboard" : "/dashboard"} style={{
                padding: "7px 16px",
                background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
                borderRadius: 20, fontSize: 13, fontWeight: 700,
                color: "#fff", textDecoration: "none",
              }}>マイページ →</Link>
            ) : (
              <Link href="/login" style={{
                padding: "7px 16px",
                background: "rgba(255,107,157,0.15)",
                border: "1px solid rgba(255,107,157,0.4)",
                borderRadius: 20, fontSize: 13, fontWeight: 700,
                color: "#FF6B9D", textDecoration: "none",
              }}>ログイン</Link>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 80px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none",
          marginBottom: 24,
        }}>← イベント一覧に戻る</Link>

        {/* フライヤー */}
        {event.imageUrl && (
          <div style={{ position: "relative", width: "100%", paddingBottom: "50%", borderRadius: 20, overflow: "hidden", marginBottom: 28, background: "#1A0F20" }}>
            <Image src={event.imageUrl} alt={event.title} fill style={{ objectFit: "cover" }} unoptimized />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(10,6,14,0.6) 100%)" }} />
          </div>
        )}

        {/* タイトル */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "24px 24px 28px",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(255,107,157,0.15)", border: "1px solid rgba(255,107,157,0.3)",
            borderRadius: 8, padding: "3px 10px",
            fontSize: 11, fontWeight: 700, color: "#FF6B9D",
            marginBottom: 14, letterSpacing: "0.08em",
          }}>INVITE ONLY</div>

          <h1 style={{ margin: "0 0 24px", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 900, lineHeight: 1.2 }}>
            {event.title}
          </h1>

          <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div>
              <dt style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.05em" }}>開催日時</dt>
              <dd style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{fmt(event.startAt)}</dd>
            </div>
            {event.endAt && (
              <div>
                <dt style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.05em" }}>終了日時</dt>
                <dd style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{fmt(event.endAt)}</dd>
              </div>
            )}
            {event.venue && (
              <div>
                <dt style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.05em" }}>会場</dt>
                <dd style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{event.venue}</dd>
              </div>
            )}
            {event.address && (
              <div>
                <dt style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.05em" }}>住所</dt>
                <dd style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{event.address}</dd>
              </div>
            )}
          </dl>

          {event.description && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>イベント詳細</p>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {event.description}
              </p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <JoinButton
              eventId={eventId}
              isLoggedIn={!!session}
              initialRegistered={isRegistered}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
