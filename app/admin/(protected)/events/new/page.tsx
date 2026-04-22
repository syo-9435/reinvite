import { requireInviter } from "@/lib/requireAdmin";
import EventForm from "@/components/events/EventForm";

export default async function AdminNewEventPage() {
  await requireInviter();
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-black text-gray-800 mb-6">イベント作成</h1>
      <EventForm redirectTo="/admin/events" />
    </div>
  );
}
