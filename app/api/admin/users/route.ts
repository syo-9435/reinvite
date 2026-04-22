import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminId = session.user.id;

  const myEvents = await prisma.event.findMany({
    where: { userId: adminId },
    select: { id: true },
  });
  const eventIds = myEvents.map(e => e.id);

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

  return NextResponse.json(guests);
}
