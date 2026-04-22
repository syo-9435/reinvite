import { requireInviter } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EventForm from "@/components/events/EventForm";
import type { EventStatus } from "@/types/event";

type Params = { params: Promise<{ eventId: string }> };

export default async function AdminEditEventPage({ params }: Params) {
  const session = await requireInviter();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({ where: { id: eventId, userId: session.user.id } });
  if (!event) notFound();

  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocal = (d: Date) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <Link href="/admin/events" className="hover:text-idol-500">イベント管理</Link>
        <span>/</span>
        <Link href={`/admin/events/${eventId}`} className="hover:text-idol-500">{event.title}</Link>
        <span>/</span>
        <span className="text-gray-700">編集</span>
      </nav>
      <h1 className="text-2xl font-black text-gray-800 mb-6">イベント編集</h1>
      <EventForm
        eventId={event.id}
        redirectTo={`/admin/events/${event.id}`}
        defaultValues={{
          title: event.title,
          description: event.description ?? "",
          venue: event.venue ?? "",
          address: event.address ?? "",
          startAt: toLocal(event.startAt),
          status: event.status as EventStatus,
          imageUrl: event.imageUrl ?? "",
          // JSON array → newline-separated for textarea
          ticketCodes: event.ticketCodes
            ? (JSON.parse(event.ticketCodes) as string[]).join("\n")
            : "",
        }}
      />
    </div>
  );
}
