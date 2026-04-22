import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import EventStatusBadge from "@/components/events/EventStatusBadge";

export default async function AdminDashboardPage() {
  const session = await requireInviter();

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { startAt: "desc" },
    include: {
      invitations: { select: { status: true } },
      _count: { select: { invitations: true } },
    },
  });

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("ja-JP", {
      year: "numeric", month: "short", day: "numeric",
      weekday: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <div style={{
        background: "linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%)",
        padding: "24px 24px 28px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", borderRadius: "50%", width: 100, height: 100, background: "rgba(255,255,255,0.12)", top: -30, right: -20 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>管理画面</p>
            <h1 style={{ color: "#fff", fontSize: 22, margin: "4px 0 0", fontWeight: 900 }}>イベント管理</h1>
          </div>
          <Link href="/admin/events/new" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: "#fff",
            borderRadius: 14,
            color: "#FF6B9D",
            fontWeight: 900, fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}>
            <span style={{ fontSize: 18 }}>✨</span>
            イベント作成
          </Link>
        </div>
      </div>

      {/* イベント一覧 */}
      <div style={{ padding: "16px 20px 60px" }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#8B7A8E" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📅</div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>イベントがありません</p>
            <p style={{ fontSize: 13, margin: "0 0 24px" }}>「イベント作成」から最初のイベントを作りましょう</p>
            <Link href="/admin/events/new" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px",
              background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
              borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 14,
              textDecoration: "none", boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
            }}>
              <span>✨</span> イベントを作成する
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {events.map(event => {
              const accepted = event.invitations.filter(i => i.status === "ACCEPTED").length;
              const total    = event._count.invitations;

              return (
                <Link key={event.id} href={`/admin/events/${event.id}`} style={{
                  background: "#fff",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 2px 14px rgba(255,107,157,0.08)",
                  border: "1.5px solid #FFF0F6",
                  textDecoration: "none",
                  display: "block",
                }}>
                  {/* フライヤー */}
                  {event.imageUrl && (
                    <div style={{ position: "relative", width: "100%", paddingBottom: "38%", background: "#1E0A1E" }}>
                      <Image src={event.imageUrl} alt={event.title} fill style={{ objectFit: "cover", opacity: 0.9 }} unoptimized />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(10,0,18,0.6) 100%)" }} />
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <EventStatusBadge status={event.status} />
                      </div>
                    </div>
                  )}

                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1E0A1E", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                        {event.title}
                      </p>
                      {!event.imageUrl && (
                        <div style={{ marginLeft: 8, flexShrink: 0 }}>
                          <EventStatusBadge status={event.status} />
                        </div>
                      )}
                    </div>

                    {/* 日時・会場 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12 }}>📅</span>
                        <span style={{ fontSize: 12, color: "#8B7A8E" }}>{fmt(event.startAt)}</span>
                      </div>
                      {event.venue && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12 }}>📍</span>
                          <span style={{ fontSize: 12, color: "#8B7A8E" }}>{event.venue}</span>
                        </div>
                      )}
                    </div>

                    {/* 参加者数 */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "#F9F5FF", borderRadius: 10, padding: "8px 12px",
                    }}>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 10, color: "#8B7A8E" }}>招待数</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#C084FC" }}>{total}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 10, color: "#8B7A8E" }}>参加確定</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#FF6B9D" }}>{accepted}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
