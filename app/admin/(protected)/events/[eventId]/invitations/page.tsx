import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminInvitationsClient from "./AdminInvitationsClient";

type Params = { params: Promise<{ eventId: string }> };

export default async function AdminInvitationsPage({ params }: Params) {
  const session = await requireInviter();
  const { eventId } = await params;

  const [event, guests] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, userId: session.user.id },
      include: {
        invitations: { include: { guest: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.guest.findMany({ where: { userId: session.user.id }, orderBy: { name: "asc" } }),
  ]);
  if (!event) notFound();

  const invitedIds = new Set(event.invitations.filter((i) => i.status !== "CANCELLED").map((i) => i.guestId));
  const availableGuests = guests.filter((g) => !invitedIds.has(g.id));

  const stats = {
    total: event.invitations.length,
    accepted: event.invitations.filter((i) => i.status === "ACCEPTED").length,
    declined: event.invitations.filter((i) => i.status === "DECLINED").length,
    pending: event.invitations.filter((i) => i.status === "PENDING").length,
    checkedIn: event.invitations.filter((i) => i.checkedIn).length,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <Link href="/admin/events" className="hover:text-idol-500">イベント管理</Link>
        <span>/</span>
        <Link href={`/admin/events/${eventId}`} className="hover:text-idol-500">{event.title}</Link>
        <span>/</span>
        <span className="text-gray-700">招待管理</span>
      </nav>
      <AdminInvitationsClient
        event={{ id: event.id, title: event.title }}
        invitations={event.invitations}
        availableGuests={availableGuests}
        stats={stats}
      />
    </div>
  );
}
