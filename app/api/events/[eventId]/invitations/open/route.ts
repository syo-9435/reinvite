import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string }> };

// POST /api/events/[eventId]/invitations/open
// 参加者未指定のオープン招待リンクを生成する
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "INVITER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { message, expiresAt } = await request.json().catch(() => ({}));

  // 名前なしのプレースホルダーゲストを作成
  const guest = await prisma.guest.create({
    data: { userId: session.user.id },
  });

  const invitation = await prisma.invitation.create({
    data: {
      eventId,
      guestId: guest.id,
      message: message || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sentAt: new Date(),
      status: "PENDING",
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/invite/${invitation.token}`;

  return NextResponse.json({ token: invitation.token, url }, { status: 201 });
}
