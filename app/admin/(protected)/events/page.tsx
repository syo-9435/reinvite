import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import EventStatusBadge from "@/components/events/EventStatusBadge";

const EMOJI_BY_STATUS: Record<string, string> = {
  PUBLISHED: "🌸", DRAFT: "📝", CANCELLED: "❌", COMPLETED: "✅", SUSPENDED: "⛔",
};

export default async function AdminEventsPage() {
  const session = await requireInviter();

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { startAt: "asc" },
    include: { _count: { select: { invitations: true } } },
  });

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
      <div style={{
        background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
        padding: "24px 24px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", borderRadius: "50%", width: 80, height: 80, background: "rgba(255,255,255,0.15)", top: -20, right: -20 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>管理画面</p>
            <h1 style={{ color: "#fff", fontSize: 22, margin: "4px 0 0", fontWeight: 900 }}>イベント管理</h1>
          </div>
          <Link href="/admin/events/new" style={{
            background: "rgba(255,255,255,0.25)",
            border: "none",
            borderRadius: 12,
            padding: "8px 16px",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}>
            ＋ 新規作成
          </Link>
        </div>
      </div>

      <div style={{ padding: "16px 20px 40px", marginTop: -8, position: "relative", zIndex: 1 }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8B7A8E" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>イベントがまだありません</p>
            <p style={{ fontSize: 13 }}>「新規作成」からイベントを追加してください</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map(event => {
              return (
                <Link key={event.id} href={`/admin/events/${event.id}`} style={{
                  background: "#fff",
                  borderRadius: 18,
                  boxShadow: "0 2px 12px rgba(255,107,157,0.08)",
                  border: "1.5px solid #FFF0F6",
                  overflow: "hidden",
                  textDecoration: "none",
                  display: "block",
                }}>
                  {/* フライヤー画像 */}
                  {event.imageUrl && (
                    <div style={{ position: "relative", width: "100%", paddingBottom: "42%", background: "#1E0A1E" }}>
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        style={{ objectFit: "cover", opacity: 0.92 }}
                        unoptimized
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to bottom, transparent 40%, rgba(30,10,30,0.55) 100%)",
                      }} />
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <EventStatusBadge status={event.status} />
                      </div>
                    </div>
                  )}

                  <div style={{ padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
                    {!event.imageUrl && (
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: "#FFB3D055",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, flexShrink: 0,
                      }}>
                        {EMOJI_BY_STATUS[event.status] ?? "📅"}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E0A1E" }}>{event.title}</p>
                        {!event.imageUrl && <EventStatusBadge status={event.status} />}
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: "#8B7A8E" }}>
                        {new Date(event.startAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                        {event.venue && ` · ${event.venue}`}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#8B7A8E" }}>招待数: <b style={{ color: "#FF6B9D" }}>{event._count.invitations}</b>名</p>
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
