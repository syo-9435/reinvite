import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Params = { params: Promise<{ qrToken: string }> };

export default async function TicketPage({ params }: Params) {
  const { qrToken } = await params;

  const inv = await prisma.invitation.findUnique({
    where: { qrToken },
    include: {
      guest: { select: { name: true, email: true } },
      event: { select: { title: true, startAt: true, venue: true } },
    },
  });
  if (!inv) notFound();

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("ja-JP", {
      year: "numeric", month: "long", day: "numeric",
      weekday: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 360, width: "100%" }}>
        {/* チケットカード */}
        <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 32px rgba(255,107,157,0.15)" }}>
          {/* ヘッダー */}
          <div style={{
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            padding: "24px 24px 20px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.12, width: 80, height: 80, background: "#fff", top: -20, right: 30 }} />
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: "0 0 4px" }} translate="no">Re:invite</p>
            <h1 style={{ color: "#fff", fontSize: 20, margin: "0 0 4px", fontWeight: 900 }}>{inv.event.title}</h1>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: 0 }}>{fmt(inv.event.startAt)}</p>
            {inv.event.venue && (
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "2px 0 0" }}>📍 {inv.event.venue}</p>
            )}
          </div>

          {/* ミシン目 */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
            <div style={{ width: 24, height: 24, background: "#F3EEF4", borderRadius: "50%", flexShrink: 0, marginLeft: -28 }} />
            <div style={{ flex: 1, borderTop: "2px dashed #F3EEF4", margin: "0 8px" }} />
            <div style={{ width: 24, height: 24, background: "#F3EEF4", borderRadius: "50%", flexShrink: 0, marginRight: -28 }} />
          </div>

          {/* 参加者情報 */}
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 2px", fontSize: 10, color: "#8B7A8E" }}>お名前</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E0A1E" }}>{inv.guest.name ?? "—"}</p>
            </div>

            {inv.guest.email && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#8B7A8E" }}>メールアドレス</p>
                <p style={{ margin: 0, fontSize: 13, color: "#1E0A1E" }}>{inv.guest.email}</p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 2px", fontSize: 10, color: "#8B7A8E" }}>ステータス</p>
              {inv.checkedIn ? (
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "#FFF0F6", color: "#FF6B9D", fontWeight: 700, fontSize: 13 }}>
                  ✓ 入場済み
                </span>
              ) : (
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "#F3EEF4", color: "#8B7A8E", fontWeight: 700, fontSize: 13 }}>
                  未入場
                </span>
              )}
            </div>

            {inv.checkedIn && inv.checkedInAt && (
              <p style={{ margin: "0 0 16px", fontSize: 11, color: "#8B7A8E" }}>
                入場: {new Date(inv.checkedInAt).toLocaleString("ja-JP")}
              </p>
            )}

            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#8B7A8E" }}>チケットID</p>
              <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "#1E0A1E", wordBreak: "break-all" }}>{inv.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
