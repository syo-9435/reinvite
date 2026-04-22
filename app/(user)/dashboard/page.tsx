import { requireUser } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import InvitationStatusBadge from "@/components/invitations/InvitationStatusBadge";
import QuickInviteButton from "@/components/invitations/QuickInviteButton";

export default async function UserDashboardPage() {
  const session = await requireUser();

  const invitations = await prisma.invitation.findMany({
    where: {
      guest: { email: session.user.email! },
      event: { status: { not: "SUSPENDED" } },
    },
    include: { event: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const accepted = invitations.filter(i => i.status === "ACCEPTED").length;
  const pending  = invitations.filter(i => i.status === "PENDING").length;
  const latest   = invitations.find(i => i.status === "PENDING");

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
      {/* ヒーローヘッダー */}
      <div style={{
        background: "linear-gradient(160deg, #FF6B9D 0%, #FF9EC4 50%, #C084FC 100%)",
        padding: "28px 20px 44px",
        position: "relative",
        overflow: "hidden",
      }}>
        {[
          { w: 120, h: 120, top: -40, right: -30, c: "#FFE4F0" },
          { w: 60,  h: 60,  bottom: 10, left: 20, c: "#E9D5FF" },
          { w: 30,  h: 30,  top: 20, left: "40%", c: "#fff" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, width: s.w, height: s.h, top: s.top, bottom: s.bottom, left: s.left, right: s.right, background: s.c }} />
        ))}

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>ようこそ 🌟</p>
              <h1 style={{ color: "#fff", fontSize: 20, margin: "4px 0 0", fontWeight: 900 }}>
                {session.user.name ?? session.user.email?.split("@")[0]} さん
              </h1>
            </div>
          </div>

          {/* 未確認招待カード */}
          {latest && (
            <div style={{
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(12px)",
              borderRadius: 18,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.4)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>📨 新しい招待状</span>
                {pending > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.3)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{pending}件</span>
                )}
              </div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>{latest.event.title}</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: "0 0 12px" }}>
                {new Date(latest.event.startAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
              </p>
              <Link href={`/invitations/${latest.id}`} style={{
                background: "#fff",
                borderRadius: 10,
                padding: "8px 18px",
                color: "#FF6B9D",
                fontWeight: 700,
                fontSize: 12,
                textDecoration: "none",
                display: "inline-block",
              }}>
                招待状を確認する →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px 40px", marginTop: -12, position: "relative", zIndex: 1 }}>
        {/* INVITER・ADMIN向け: 招待するボタン */}
        {(session.user.role === "INVITER" || session.user.role === "ADMIN") && (
          <div style={{ marginBottom: 20 }}>
            <QuickInviteButton />
          </div>
        )}

        {/* ステータスサマリ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { label: "参加予定",  value: accepted, color: "#FF6B9D", bg: "#FFF0F6" },
            { label: "未確認",    value: pending,  color: "#D97706", bg: "#FFFBEB" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 18, padding: "16px 20px", textAlign: "center", border: "1.5px solid #FFF0F6" }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color }}>{value}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8B7A8E" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* 招待一覧 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1E0A1E", margin: 0 }}>🎫 マイ招待状</h2>
          <Link href="/invitations" style={{ fontSize: 12, color: "#FF6B9D", textDecoration: "none", fontWeight: 600 }}>すべて見る</Link>
        </div>

        {invitations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8B7A8E" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
            <p style={{ fontSize: 14 }}>招待はまだありません</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invitations.slice(0, 5).map(inv => (
              <Link key={inv.id} href={`/invitations/${inv.id}`} style={{
                background: "#fff",
                borderRadius: 16,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                border: "1.5px solid #FFF0F6",
                textDecoration: "none",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: "#FFB3D044",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0,
                }}>🎫</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1E0A1E" }}>{inv.event.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8B7A8E" }}>
                    {new Date(inv.event.startAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
                  </p>
                </div>
                <InvitationStatusBadge status={inv.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
