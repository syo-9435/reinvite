import { requireUser } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type Params = { params: Promise<{ eventId: string }> };

export default async function EventParticipantsPage({ params }: Params) {
  const session = await requireUser();
  const { eventId } = await params;

  const isInviter = session.user.role === "INVITER" || session.user.role === "ADMIN";
  if (!isInviter) notFound();

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      invitations: { some: { guest: { userId: session.user.id } } },
    },
  });
  if (!event) notFound();

  const invitations = await prisma.invitation.findMany({
    where: {
      eventId,
      guest: { userId: session.user.id },
    },
    include: { guest: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const checkedInCount = invitations.filter(i => i.checkedIn).length;
  const acceptedCount = invitations.filter(i => i.status === "ACCEPTED").length;

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <div style={{
        background: "linear-gradient(135deg, #C084FC, #FF6B9D)",
        padding: "20px 20px 28px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.12, width: 90, height: 90, background: "#fff", top: -20, right: -20 }} />
        <Link href="/invitations" style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.25)",
          borderRadius: 10,
          padding: "6px 12px",
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          textDecoration: "none",
          marginBottom: 12,
          position: "relative",
          zIndex: 1,
        }}>← 戻る</Link>
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: "0 0 4px" }}>参加者一覧</p>
          <h1 style={{ color: "#fff", fontSize: 18, margin: 0, fontWeight: 900 }}>{event.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: "4px 0 0" }}>
            {new Date(event.startAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </p>
        </div>
      </div>

      {/* サマリバッジ */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "招待", value: invitations.length, bg: "#F3EEF4", color: "#8B7A8E" },
            { label: "参加確定", value: acceptedCount, bg: "#DCFCE7", color: "#16A34A" },
            { label: "入場済", value: checkedInCount, bg: "#FFF0F6", color: "#FF6B9D" },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{
              flex: 1, background: bg, borderRadius: 12,
              padding: "10px 0", textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color }}>{value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color, opacity: 0.8 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 参加者一覧 */}
      <div style={{ padding: 16 }}>
        {invitations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8B7A8E" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
            <p style={{ fontSize: 14, margin: 0 }}>参加者がいません</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invitations.map(inv => (
              <div key={inv.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#fff",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                border: `1.5px solid ${inv.checkedIn ? "#FFD6E8" : "#F3EEF4"}`,
              }}>
                {/* アバター */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: inv.checkedIn
                    ? "linear-gradient(135deg, #FF6B9D, #C084FC)"
                    : "#F3EEF4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {inv.checkedIn ? "✓" : "👤"}
                </div>

                {/* 名前・メール */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E0A1E" }}>
                    {inv.guest.name ?? "（未登録）"}
                  </p>
                  {inv.guest.email && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7A8E" }}>
                      {inv.guest.email}
                    </p>
                  )}
                </div>

                {/* 入場ステータスバッジ */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: inv.checkedIn ? "#FFF0F6" : "#F3EEF4",
                    color: inv.checkedIn ? "#FF6B9D" : "#8B7A8E",
                  }}>
                    {inv.checkedIn ? "入場済" : "未入場"}
                  </span>
                  {inv.checkedInAt && (
                    <span style={{ fontSize: 10, color: "#8B7A8E" }}>
                      {new Date(inv.checkedInAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
