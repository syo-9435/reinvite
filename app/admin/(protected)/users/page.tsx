import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const adminId = session.user.id;

  // このadminが所有するイベントのID一覧
  const myEvents = await prisma.event.findMany({
    where: { userId: adminId },
    select: { id: true },
  });
  const eventIds = myEvents.map(e => e.id);

  // それらのイベントに招待されているゲスト一覧
  const guests = await prisma.guest.findMany({
    where: {
      invitations: { some: { eventId: { in: eventIds } } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      invitations: {
        where: { eventId: { in: eventIds } },
        select: {
          id: true,
          status: true,
          checkedIn: true,
          event: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-black text-gray-800 mb-6">参加者管理</h1>
      <AdminUsersClient guests={guests} />
    </div>
  );
}
