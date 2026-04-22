import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminScanPage() {
  const session = await requireInviter();

  const events = await prisma.event.findMany({
    where: { userId: session.user.id, status: "PUBLISHED" },
    orderBy: { startAt: "asc" },
    include: { _count: { select: { invitations: true } } },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-black text-gray-800 mb-2">QRスキャン</h1>
      <p className="text-sm text-gray-400 mb-6">チェックインするイベントを選択してください</p>

      {events.length === 0 ? (
        <p className="text-gray-400 text-center py-16">公開中のイベントがありません</p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/admin/scan/${ev.id}`}
                className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-transparent hover:border-idol-300 hover:shadow-sm transition"
              >
                <div>
                  <p className="font-bold text-gray-800">{ev.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(ev.startAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    {ev.venue && ` · ${ev.venue}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">招待 {ev._count.invitations}名</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: "#ff2d8b" }}>スキャン開始 →</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
