import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string }> };

async function getOwnedEvent(eventId: string, userId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, userId },
  });
}

// GET /api/events/[eventId]
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
    include: {
      invitations: {
        include: { guest: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { invitations: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}

// PUT /api/events/[eventId]
export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await getOwnedEvent(eventId, session.user.id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { title, description, venue, address, startAt, status, imageUrl, ticketCodes } = body;

  if (!title || !startAt) {
    return NextResponse.json({ error: "タイトルと開催日時は必須です" }, { status: 400 });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description: description || null,
      venue: venue || null,
      address: address || null,
      startAt: new Date(startAt),
      status,
      imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
      ticketCodes: ticketCodes !== undefined ? (ticketCodes || null) : undefined,
    },
  });

  return NextResponse.json(updated);
}

// PATCH /api/events/[eventId] — ステータスのみ更新
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await getOwnedEvent(eventId, session.user.id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status } = await request.json();
  if (!status) return NextResponse.json({ error: "status は必須です" }, { status: 400 });

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });

  return NextResponse.json(updated);
}

// DELETE /api/events/[eventId]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await getOwnedEvent(eventId, session.user.id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.event.delete({ where: { id: eventId } });

  return new NextResponse(null, { status: 204 });
}
