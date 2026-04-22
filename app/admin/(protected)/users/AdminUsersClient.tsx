"use client";

import { useState } from "react";

type Invitation = {
  id: string;
  status: string;
  checkedIn: boolean;
  event: { id: string; title: string };
};

type Guest = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  invitations: Invitation[];
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "未回答",
  ACCEPTED:  "参加",
  DECLINED:  "不参加",
  MAYBE:     "未定",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:  { background: "#F3F4F6", color: "#9CA3AF" },
  ACCEPTED: { background: "#ECFDF5", color: "#10B981", border: "1px solid #D1FAE5" },
  DECLINED: { background: "#FFF1F2", color: "#F43F5E", border: "1px solid #FFE4E6" },
  MAYBE:    { background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" },
};

export default function AdminUsersClient({ guests }: { guests: Guest[] }) {
  const [search, setSearch] = useState("");

  const filtered = guests.filter(g => {
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.invitations.some(inv => inv.event.title.toLowerCase().includes(q))
    );
  });

  if (guests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">まだ参加者がいません</p>
        <p className="text-gray-300 text-xs mt-1">イベントを作成して招待すると、ここに表示されます</p>
      </div>
    );
  }

  return (
    <div>
      {/* 検索 */}
      <input
        type="text"
        placeholder="名前・メール・電話番号・イベント名で検索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-pink-300 transition"
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="px-5 py-3">参加者</th>
              <th className="px-5 py-3">イベント / ステータス</th>
              <th className="px-5 py-3">チェックイン</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(guest => (
              <tr key={guest.id} className="hover:bg-gray-50/50 transition align-top">
                <td className="px-5 py-4">
                  <p className="font-semibold text-gray-800">{guest.name ?? "（未設定）"}</p>
                  {guest.email && <p className="text-xs text-gray-400 mt-0.5">{guest.email}</p>}
                  {guest.phone && <p className="text-xs text-gray-400">{guest.phone}</p>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1.5">
                    {guest.invitations.map(inv => (
                      <div key={inv.id} className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600 truncate max-w-[160px]">{inv.event.title}</span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                          style={STATUS_STYLE[inv.status] ?? { background: "#F3F4F6", color: "#9CA3AF" }}
                        >
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1.5">
                    {guest.invitations.map(inv => (
                      <span key={inv.id} className={`text-xs font-semibold ${inv.checkedIn ? "text-emerald-500" : "text-gray-300"}`}>
                        {inv.checkedIn ? "✓ 済" : "—"}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            「{search}」に一致する参加者が見つかりません
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} 件表示</p>
    </div>
  );
}
