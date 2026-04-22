"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  eventId: string;
  onClose: () => void;
}

export default function GenerateLinkDialog({ eventId, onClose }: Props) {
  const router = useRouter();
  const [message, setMessage]   = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ url: string } | null>(null);
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState("");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/invitations/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message || null, expiresAt: expiresAt || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "エラーが発生しました"); return; }
    setResult(data);
    router.refresh();
  }

  async function copyUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">招待リンクを生成</h2>
        <p className="text-xs text-gray-400 mb-5">参加者未指定のオープンリンクを発行します。リンクを受け取った方が名前・連絡先を入力して参加登録できます。</p>

        {!result ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">招待メッセージ（任意）</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                placeholder="ご参加をお待ちしております..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">回答期限（任意）</label>
              <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400" />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={handleGenerate} disabled={loading}
                className="flex-1 py-2.5 text-white font-bold rounded-lg text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #FF6B9D, #C084FC)" }}>
                {loading ? "生成中..." : "🔗 リンクを生成する"}
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-sm transition">
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div style={{ background: "#FFF0F6", border: "1.5px solid #FFB3D0", borderRadius: 12, padding: "14px 16px" }}>
              <p className="text-xs text-gray-500 mb-2 font-semibold">招待リンク（このURLを参加者にシェアしてください）</p>
              <p className="text-sm font-mono text-gray-800 break-all">{result.url}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={copyUrl}
                className="flex-1 py-2.5 text-white font-bold rounded-lg text-sm"
                style={{ background: copied ? "#10B981" : "linear-gradient(135deg, #FF6B9D, #C084FC)" }}>
                {copied ? "✓ コピーしました" : "URLをコピー"}
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-sm">
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
