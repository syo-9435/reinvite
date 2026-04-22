"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string | null; email: string | null; phone: string | null };

interface Props {
  eventId: string;
  alreadyInvitedEmails: Set<string>;
  onClose: () => void;
}

export default function InviteMembersDialog({ eventId, alreadyInvitedEmails, onClose }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/members")
      .then(r => r.json())
      .then((data: Member[]) => {
        // 既に招待済みの人を除外
        setMembers(data.filter(m => !m.email || !alreadyInvitedEmails.has(m.email)));
        setFetchLoading(false);
      });
  }, [alreadyInvitedEmails]);

  function toggleMember(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map(m => m.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("参加者を1名以上選択してください");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/invite-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds: Array.from(selectedIds),
        message: message || null,
        expiresAt: expiresAt || null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: 20 }}>👥</span>
          <h2 className="text-lg font-bold text-gray-800">参加者に招待を送る</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 参加者選択 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                参加者を選択 <span className="text-red-500">*</span>
              </label>
              {members.length > 0 && (
                <button type="button" onClick={toggleAll} className="text-xs text-idol-500 hover:text-idol-600">
                  {selectedIds.size === members.length ? "全解除" : "全選択"}
                </button>
              )}
            </div>

            {fetchLoading ? (
              <p className="text-sm text-gray-400 py-4 text-center">読み込み中...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center border border-dashed rounded-lg">
                招待可能な参加者がいません
              </p>
            ) : (
              <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                {members.map(member => (
                  <li key={member.id}>
                    <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="accent-idol-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{member.name ?? "（未設定）"}</p>
                        <p className="text-xs text-gray-400">
                          {member.email}
                          {member.phone && <span className="ml-2">{member.phone}</span>}
                        </p>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* メッセージ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              招待メッセージ（任意）
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="ご参加をお待ちしております..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 resize-none"
            />
          </div>

          {/* 有効期限 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              回答期限（任意）
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || members.length === 0}
              className="flex-1 py-2.5 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #C084FC, #FF6B9D)" }}
            >
              {loading ? "送信中..." : `招待する（${selectedIds.size}名）`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-sm transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
