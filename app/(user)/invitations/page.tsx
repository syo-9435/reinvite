import { requireUser } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import InvitationStatusBadge from "@/components/invitations/InvitationStatusBadge";

export default async function UserInvitationsPage() {
  const session = await requireUser();
  const isInviter = session.user.role === "INVITER" || session.user.role === "ADMIN";

  if (isInviter) {
    const isAdmin = session.user.role === "ADMIN";
    // INVITER / ADMIN: 自分が招待を送ったイベント一覧
    // INVITER は停止中を除外、ADMIN は全件表示
    const events = await prisma.event.findMany({
      where: {
        invitations: { some: { guest: { userId: session.user.id } } },
        ...(isAdmin ? {} : { status: { not: "SUSPENDED" } }),
      },
      include: {
        _count: { select: { invitations: true } },
        invitations: {
          where: { guest: { userId: session.user.id } },
          select: { checkedIn: true, status: true },
        },
      },
      orderBy: { startAt: "desc" },
    });

    return (
      <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
        <div style={{
          background: "linear-gradient(135deg, #C084FC, #FF6B9D)",
          padding: "20px 20px 28px",
        }}>
          <h1 style={{ color: "#fff", fontSize: 20, margin: 0, fontWeight: 900 }}>📋 招待イベント一覧</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: "4px 0 0" }}>
            招待を送ったイベントの参加者を確認できます
          </p>
        </div>

        <div style={{ padding: 16 }}>
          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8B7A8E" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: 14, margin: 0 }}>招待を送ったイベントはありません</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {events.map(ev => {
                const total = ev.invitations.length;
                const checkedIn = ev.invitations.filter(i => i.checkedIn).length;
                const accepted = ev.invitations.filter(i => i.status === "ACCEPTED").length;
                return (
                  <Link
                    key={ev.id}
                    href={`/invitations/events/${ev.id}`}
                    style={{
                      display: "block",
                      background: "#fff",
                      borderRadius: 18,
                      padding: "16px 18px",
                      textDecoration: "none",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      border: "1.5px solid #F3EEF4",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E0A1E" }}>{ev.title}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#8B7A8E" }}>
                          {new Date(ev.startAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
                        </p>
                      </div>
                      <span style={{ color: "#C084FC", fontSize: 18, flexShrink: 0 }}>›</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <span style={{ fontSize: 12, background: "#F3EEF4", borderRadius: 8, padding: "3px 10px", color: "#8B7A8E", fontWeight: 600 }}>
                        招待 {total}名
                      </span>
                      <span style={{ fontSize: 12, background: "#DCFCE7", borderRadius: 8, padding: "3px 10px", color: "#16A34A", fontWeight: 600 }}>
                        参加 {accepted}名
                      </span>
                      <span style={{ fontSize: 12, background: "#FFF0F6", borderRadius: 8, padding: "3px 10px", color: "#FF6B9D", fontWeight: 600 }}>
                        入場済 {checkedIn}名
                      </span>
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

  // MEMBER: 自分が受け取った招待一覧（停止中イベントは除外）
  const invitations = await prisma.invitation.findMany({
    where: {
      guest: { email: session.user.email! },
      event: { status: { not: "SUSPENDED" } },
    },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-black text-gray-800 mb-6">招待一覧</h1>

      {invitations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">招待はまだありません</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {invitations.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invitations/${inv.id}`}
                className="block p-5 bg-white rounded-2xl border border-gray-100 hover:border-idol-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800">{inv.event.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(inv.event.startAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {inv.event.venue && <p className="text-xs text-gray-400 mt-0.5">{inv.event.venue}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <InvitationStatusBadge status={inv.status} />
                    {inv.checkedIn && (
                      <span className="text-xs font-bold" style={{ color: "#ff2d8b" }}>来場済み</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
