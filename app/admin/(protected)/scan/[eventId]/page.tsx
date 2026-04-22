import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ScanClient from "./ScanClient";

type Params = { params: Promise<{ eventId: string }> };

export default async function AdminScanEventPage({ params }: Params) {
  const session = await requireInviter();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
    include: {
      _count: { select: { invitations: true } },
      invitations: {
        where: { checkedIn: true },
        select: { id: true },
      },
    },
  });
  if (!event) notFound();

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <Link href="/admin/scan" className="hover:text-idol-500">QRスキャン</Link>
        <span>/</span>
        <span className="text-gray-700">{event.title}</span>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-gray-800">{event.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            来場済み {event.invitations.length} / {event._count.invitations} 名
          </p>
        </div>
      </div>

      <ScanClient eventId={eventId} />
    </div>
  );
}
