import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string; invitationId: string }> };

// PATCH /api/events/[eventId]/invitations/[invitationId] — ステータス変更（キャンセルなど）
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, invitationId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, eventId },
  });
  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status } = await request.json();
  const allowed = ["PENDING", "CANCELLED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
  }

  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: { status },
    include: { guest: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/events/[eventId]/invitations/[invitationId]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, invitationId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invitation.deleteMany({ where: { id: invitationId, eventId } });
  return new NextResponse(null, { status: 204 });
}
