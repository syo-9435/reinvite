"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InvitationStatusBadge from "@/components/invitations/InvitationStatusBadge";

type Guest = { id: string; name: string | null; email: string | null };
type Invitation = {
  id: string; token: string; status: string;
  sentAt: Date | string | null; respondedAt: Date | string | null;
  expiresAt: Date | string | null; message: string | null;
  responseNote: string | null; plusOne: number;
  checkedIn: boolean; checkedInAt: Date | string | null;
  guest: Guest;
};

interface Props {
  event: { id: string; title: string };
  invitations: Invitation[];
  availableGuests: Guest[];
  stats: { total: number; accepted: number; declined: number; pending: number; checkedIn: number };
}

export default function AdminInvitationsClient({ event, invitations, stats }: Props) {
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm("この招待をキャンセルしますか？")) return;
    await fetch(`/api/events/${event.id}/invitations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("この招待を削除しますか？")) return;
    await fetch(`/api/events/${event.id}/invitations/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function copyUrl(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-800">招待管理</h1>
      </div>

      {/* 集計 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "合計",    value: stats.total,     color: "text-gray-700" },
          { label: "参加",    value: stats.accepted,  color: "text-green-600" },
          { label: "不参加",  value: stats.declined,  color: "text-red-500" },
          { label: "未回答",  value: stats.pending,   color: "text-yellow-600" },
          { label: "来場済み", value: stats.checkedIn, color: "text-idol-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <p>まだ招待を送っていません</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {invitations.map((inv) => (
            <li key={inv.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{inv.guest.name}</span>
                    <InvitationStatusBadge status={inv.status} />
                    {inv.checkedIn && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "#ff2d8b" }}>来場済み</span>
                    )}
                    {inv.plusOne > 0 && <span className="text-xs text-gray-400">+{inv.plusOne}名同伴</span>}
                  </div>
                  {inv.guest.email && <p className="text-xs text-gray-400">{inv.guest.email}</p>}
                  {inv.responseNote && (
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">「{inv.responseNote}」</p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    送信: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString("ja-JP") : "—"}
                    {inv.respondedAt && ` · 回答: ${new Date(inv.respondedAt).toLocaleDateString("ja-JP")}`}
                    {inv.checkedInAt && ` · 来場: ${new Date(inv.checkedInAt).toLocaleString("ja-JP")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inv.status === "PENDING" && (
                    <button onClick={() => copyUrl(inv.token)} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      {copiedToken === inv.token ? "コピー済み" : "URLコピー"}
                    </button>
                  )}
                  {inv.status === "PENDING" && (
                    <button onClick={() => handleCancel(inv.id)} className="text-xs text-gray-400 hover:text-gray-600">キャンセル</button>
                  )}
                  <button onClick={() => handleDelete(inv.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

    </>
  );
}
