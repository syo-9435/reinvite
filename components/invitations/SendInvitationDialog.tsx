"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Guest = { id: string; name: string | null; email: string | null };

interface Props {
  eventId: string;
  availableGuests: Guest[];
  onClose: () => void;
}

export default function SendInvitationDialog({ eventId, availableGuests, onClose }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleGuest(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === availableGuests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableGuests.map((g) => g.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError("ゲストを1名以上選択してください");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestIds: Array.from(selectedIds),
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
        <h2 className="text-lg font-bold text-gray-800 mb-4">招待を送る</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ゲスト選択 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                ゲストを選択 <span className="text-red-500">*</span>
              </label>
              {availableGuests.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-idol-500 hover:text-idol-600"
                >
                  {selectedIds.size === availableGuests.length ? "全解除" : "全選択"}
                </button>
              )}
            </div>

            {availableGuests.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center border border-dashed rounded-lg">
                招待可能なゲストがいません（全員に招待済み）
              </p>
            ) : (
              <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {availableGuests.map((guest) => (
                  <li key={guest.id}>
                    <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(guest.id)}
                        onChange={() => toggleGuest(guest.id)}
                        className="accent-idol-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{guest.name}</p>
                        {guest.email && (
                          <p className="text-xs text-gray-400">{guest.email}</p>
                        )}
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
              onChange={(e) => setMessage(e.target.value)}
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
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || availableGuests.length === 0}
              className="flex-1 py-2.5 bg-idol-500 hover:bg-idol-600 disabled:bg-idol-300 text-white font-medium rounded-lg text-sm transition"
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
