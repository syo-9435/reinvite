import { requireUser } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import InvitationStatusBadge from "@/components/invitations/InvitationStatusBadge";

type Params = { params: Promise<{ id: string }> };

export default async function UserInvitationDetailPage({ params }: Params) {
  const session = await requireUser();
  const { id } = await params;

  const inv = await prisma.invitation.findFirst({
    where: { id, guest: { email: session.user.email! } },
    include: { event: true, guest: true },
  });
  if (!inv) notFound();

  const fmt = (d: Date) => new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <div style={{
        background: "linear-gradient(135deg, #C084FC, #FF6B9D)",
        padding: "20px 20px 28px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, width: 90, height: 90, background: "rgba(255,255,255,0.3)", top: -20, right: -20 }} />
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
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: "0 0 4px" }}>招待状</p>
          <h1 style={{ color: "#fff", fontSize: 20, margin: 0, fontWeight: 900 }}>🎫 マイチケット</h1>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* チケット本体 */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(255,107,157,0.15)",
          marginBottom: 20,
        }}>
          {/* チケット上部 */}
          <div style={{
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            padding: "24px 24px 20px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.12, width: 80, height: 80, background: "#fff", top: -20, right: 30 }} />
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: "0 0 4px" }}>Re:invite</p>
            <h2 style={{ color: "#fff", fontSize: 20, margin: "0 0 4px", fontWeight: 900 }}>{inv.event.title}</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: 0 }}>{fmt(inv.event.startAt)}</p>
            {inv.event.venue && <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "2px 0 0" }}>📍 {inv.event.venue}</p>}
          </div>

          {/* ミシン目 */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
            <div style={{ width: 24, height: 24, background: "#F3EEF4", borderRadius: "50%", flexShrink: 0, marginLeft: -28 }} />
            <div style={{ flex: 1, borderTop: "2px dashed #F3EEF4", margin: "0 8px" }} />
            <div style={{ width: 24, height: 24, background: "#F3EEF4", borderRadius: "50%", flexShrink: 0, marginRight: -28 }} />
          </div>

          {/* チケット下部 */}
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#8B7A8E" }}>お名前</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E0A1E" }}>{inv.guest.name}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#8B7A8E" }}>ステータス</p>
                <InvitationStatusBadge status={inv.status} />
              </div>
            </div>

            {/* 招待メッセージ */}
            {inv.message && (
              <div style={{ background: "#FFF0F6", borderRadius: 12, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid #FF6B9D" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#1E0A1E" }}>{inv.message}</p>
              </div>
            )}

            {/* 来場済み */}
            {inv.checkedIn && (
              <div style={{ background: "#FFF0F6", borderRadius: 16, padding: "20px", textAlign: "center", border: "2px solid #FF6B9D" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#FF6B9D" }}>✓ 来場済み</p>
                {inv.checkedInAt && (
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "#8B7A8E" }}>{new Date(inv.checkedInAt).toLocaleString("ja-JP")}</p>
                )}
              </div>
            )}

            {/* 未回答 */}
            {inv.status === "PENDING" && (
              <div style={{ marginTop: 16 }}>
                <Link href={`/invite/${inv.token}`} style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px",
                  background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
                  borderRadius: 14,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
                }}>
                  🎉 参加登録する
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
