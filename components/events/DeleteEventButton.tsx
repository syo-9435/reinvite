"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  eventId: string;
  redirectTo?: string;
}

export default function DeleteEventButton({ eventId, redirectTo = "/admin/events" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("このイベントを削除しますか？招待データも全て削除されます。")) return;
    setLoading(true);
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
    >
      {loading ? "削除中..." : "削除"}
    </button>
  );
}
