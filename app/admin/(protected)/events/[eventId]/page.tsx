import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import DeleteEventButton from "@/components/events/DeleteEventButton";
import SuspendEventButton from "@/components/events/SuspendEventButton";
import InvitationStatusBadge from "@/components/invitations/InvitationStatusBadge";

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

// ── イベント情報タブ ─────────────────────────────────────────
function EventInfoTab({ event }: {
  event: {
    id: string; title: string; status: string;
    startAt: Date; endAt: Date | null;
    venue: string | null; address: string | null;
    description: string | null;
    imageUrl: string | null; ticketCodes: string | null;
    _count: { invitations: number };
  };
}) {
  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("ja-JP", {
      year: "numeric", month: "long", day: "numeric",
      weekday: "short", hour: "2-digit", minute: "2-digit",
    });

  const ticketList: string[] = event.ticketCodes ? JSON.parse(event.ticketCodes) : [];

  return (
    <div className="space-y-5">
      {event.imageUrl && (
        <div style={{ position: "relative", width: "100%", paddingBottom: "45%", borderRadius: 16, overflow: "hidden", background: "#1E0A1E" }}>
          <Image src={event.imageUrl} alt={event.title} fill style={{ objectFit: "cover", opacity: 0.95 }} unoptimized />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(30,10,30,0.5) 100%)" }} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-gray-400">開催日時</dt><dd className="font-semibold mt-0.5">{fmt(event.startAt)}</dd></div>
        {event.endAt && <div><dt className="text-gray-400">終了日時</dt><dd className="font-semibold mt-0.5">{fmt(event.endAt)}</dd></div>}
        {event.venue && <div><dt className="text-gray-400">会場</dt><dd className="font-semibold mt-0.5">{event.venue}</dd></div>}
        {event.address && <div><dt className="text-gray-400">住所</dt><dd className="font-semibold mt-0.5">{event.address}</dd></div>}
        <div><dt className="text-gray-400">招待数</dt><dd className="font-semibold mt-0.5">{event._count.invitations}件</dd></div>
      </dl>

      {event.description && (
        <div>
          <p className="text-sm text-gray-400 mb-1">説明</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {ticketList.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-2">有効なチケット番号（{ticketList.length}件）</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ticketList.map(code => (
              <span key={code} style={{
                padding: "3px 10px", borderRadius: 8,
                background: "#F3EEF4", color: "#8B7A8E",
                fontSize: 12, fontFamily: "monospace", fontWeight: 600,
              }}>{code}</span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 flex gap-3">
        <Link href={`/admin/events/${event.id}/invitations`}
          className="px-4 py-2 text-white text-sm font-bold rounded-xl transition"
          style={{ background: "linear-gradient(135deg, #ff2d8b, #e8007a)" }}>
          招待管理 →
        </Link>
        <Link href={`/admin/scan/${event.id}`}
          className="px-4 py-2 text-sm font-bold rounded-xl border-2 transition"
          style={{ borderColor: "#ff2d8b", color: "#ff2d8b" }}>
          QRスキャン
        </Link>
      </div>
    </div>
  );
}

// ── 参加者一覧タブ ───────────────────────────────────────────
async function ParticipantsTab({ eventId }: { eventId: string }) {
  const invitations = await prisma.invitation.findMany({
    where: { eventId, status: { not: "CANCELLED" } },
    include: { guest: { select: { name: true, email: true, phone: true, user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const registered = invitations.filter(i => i.guest.name);

  if (registered.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#8B7A8E", border: "2px dashed #EDE0F0", borderRadius: 18 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>参加者はまだいません</p>
        <p style={{ fontSize: 13, margin: 0 }}>招待リンクから参加登録されると表示されます</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#8B7A8E" }}>登録済み参加者: <b style={{ color: "#FF6B9D" }}>{registered.length}</b>名</p>
      <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #FFF0F6", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F9F0FB", background: "#FDFAFF" }}>
                {["名前", "連絡先", "招待者名", "ステータス", "登録日"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#8B7A8E", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #F9F0FB" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1E0A1E" }}>{inv.guest.name}</p>
                    {inv.plusOne > 0 && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7A8E" }}>+{inv.plusOne}名同伴</p>}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {inv.guest.email && <p style={{ margin: 0, fontSize: 12, color: "#8B7A8E" }}>{inv.guest.email}</p>}
                    {inv.guest.phone && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8B7A8E" }}>{inv.guest.phone}</p>}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {inv.guest.user.name ? (
                      <span style={{ fontSize: 13, color: "#1E0A1E", fontWeight: 600 }}>{inv.guest.user.name}</span>
                    ) : (
                      <span style={{ color: "#D4C8D6", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <InvitationStatusBadge status={inv.status} />
                    {inv.checkedIn && (
                      <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#ff2d8b", color: "#fff", fontWeight: 700 }}>来場済</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap", fontSize: 11, color: "#8B7A8E" }}>
                    {inv.respondedAt
                      ? new Date(inv.respondedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : new Date(inv.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 招待者別成果タブ ─────────────────────────────────────────
async function InviterPerformanceTab({ eventId }: { eventId: string }) {
  const invitations = await prisma.invitation.findMany({
    where: { eventId, status: { not: "CANCELLED" } },
    include: {
      guest: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  type InviterStats = { name: string; email: string; invited: number; checkedIn: number };
  const map = new Map<string, InviterStats>();

  for (const inv of invitations) {
    const uid = inv.guest.userId;
    if (!map.has(uid)) {
      map.set(uid, { name: inv.guest.user.name ?? inv.guest.user.email, email: inv.guest.user.email, invited: 0, checkedIn: 0 });
    }
    const s = map.get(uid)!;
    s.invited++;
    if (inv.checkedIn) s.checkedIn++;
  }

  const ranking = Array.from(map.values()).sort((a, b) => b.invited - a.invited);

  if (ranking.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#8B7A8E", border: "2px dashed #EDE0F0", borderRadius: 18 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>データがありません</p>
        <p style={{ fontSize: 13, margin: 0 }}>招待を送ると招待者別の成果が表示されます</p>
      </div>
    );
  }

  const totalInvited   = ranking.reduce((s, r) => s + r.invited,   0);
  const totalCheckedIn = ranking.reduce((s, r) => s + r.checkedIn, 0);
  const totalRate      = totalInvited ? Math.round(totalCheckedIn / totalInvited * 100) : 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "招待者数", value: ranking.length, suffix: "名", color: "#C084FC" },
          { label: "総招待数", value: totalInvited,   suffix: "名", color: "#FF6B9D" },
          { label: "総来場率", value: totalRate,      suffix: "%",  color: "#10B981" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "14px 12px", textAlign: "center", border: "1.5px solid #FFF0F6", boxShadow: "0 2px 8px rgba(255,107,157,0.07)" }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "#8B7A8E", fontWeight: 600, letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1.1 }}>
              {s.value}<span style={{ fontSize: 13, fontWeight: 600 }}>{s.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #FFF0F6", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #FFF0F6", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E0A1E" }}>招待数ランキング</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F9F0FB" }}>
                {["順位", "招待者", "招待数", "来場数", "来場率", "達成バー"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: h === "順位" ? "center" : "left", fontSize: 11, fontWeight: 600, color: "#8B7A8E", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => {
                const rate  = r.invited ? Math.round(r.checkedIn / r.invited * 100) : 0;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <tr key={r.email} style={{ borderBottom: "1px solid #F9F0FB", background: i === 0 ? "linear-gradient(90deg, #FFF8FC, #FAFEFF)" : undefined }}>
                    <td style={{ padding: "12px 14px", textAlign: "center", width: 52 }}>
                      {medal ? <span style={{ fontSize: 20 }}>{medal}</span> : (
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#F3EEF4", color: "#8B7A8E", fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", minWidth: 140 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: "#1E0A1E" }}>
                        {r.name}
                        {i === 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "linear-gradient(135deg, #FF6B9D, #C084FC)", color: "#fff", borderRadius: 6, padding: "1px 6px" }}>TOP</span>}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7A8E" }}>{r.email}</p>
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#FF6B9D" }}>{r.invited}</span>
                      <span style={{ fontSize: 11, color: "#8B7A8E", marginLeft: 2 }}>名</span>
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#10B981" }}>{r.checkedIn}</span>
                      <span style={{ fontSize: 11, color: "#8B7A8E", marginLeft: 2 }}>名</span>
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: rate >= 80 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }}>{rate}%</span>
                    </td>
                    <td style={{ padding: "12px 14px 12px 8px", minWidth: 100 }}>
                      <div style={{ height: 8, background: "#F3EEF4", borderRadius: 10, overflow: "hidden", width: 100 }}>
                        <div style={{ height: "100%", borderRadius: 10, width: `${rate}%`, background: rate >= 80 ? "linear-gradient(90deg, #10B981, #34D399)" : rate >= 50 ? "linear-gradient(90deg, #F59E0B, #FCD34D)" : "linear-gradient(90deg, #EF4444, #FCA5A5)" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── メインページ ────────────────────────────────────────────
export default async function AdminEventDetailPage({ params, searchParams }: Props) {
  const session = await requireInviter();
  const { eventId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "participants" ? "participants" : tab === "performance" ? "performance" : "info";

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
    include: { _count: { select: { invitations: true } } },
  });
  if (!event) notFound();

  const TABS = [
    { key: "info",         label: "イベント情報",  icon: "📋" },
    { key: "participants", label: "参加者一覧",    icon: "👥" },
    { key: "performance",  label: "招待者別成果",  icon: "📊" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <Link href="/admin/dashboard" className="hover:text-idol-500">イベント管理</Link>
        <span>/</span>
        <span className="text-gray-700">{event.title}</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2"><EventStatusBadge status={event.status} /></div>
            <h1 className="text-xl font-black text-gray-800">{event.title}</h1>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Link href={`/admin/events/${event.id}/edit`}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              編集
            </Link>
            <SuspendEventButton eventId={event.id} currentStatus={event.status} />
            <DeleteEventButton eventId={event.id} redirectTo="/admin/dashboard" />
          </div>
        </div>
      </div>

      {/* タブバー */}
      <div style={{ display: "flex", gap: 4, background: "#F3EEF4", borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {TABS.map(t => {
          const isActive = activeTab === t.key;
          return (
            <Link key={t.key}
              href={`/admin/events/${eventId}${t.key === "info" ? "" : `?tab=${t.key}`}`}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "9px 8px", borderRadius: 11, fontSize: 12, fontWeight: 700,
                textDecoration: "none", transition: "all 0.15s",
                background: isActive ? "#fff" : "transparent",
                color: isActive ? "#FF6B9D" : "#8B7A8E",
                boxShadow: isActive ? "0 2px 8px rgba(255,107,157,0.15)" : "none",
                whiteSpace: "nowrap",
              }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {activeTab === "participants" ? (
          <ParticipantsTab eventId={eventId} />
        ) : activeTab === "performance" ? (
          <InviterPerformanceTab eventId={eventId} />
        ) : (
          <EventInfoTab event={event} />
        )}
      </div>
    </div>
  );
}
