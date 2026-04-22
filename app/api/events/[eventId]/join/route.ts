import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string }> };

// POST /api/events/[eventId]/join — 公開イベントへの自己参加登録
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "PUBLISHED" },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ログインユーザーをイベントオーナー配下のGuestとして取得 or 作成
  const guest = await prisma.guest.upsert({
    where: { userId_email: { userId: event.userId, email: session.user.email! } },
    create: {
      userId: event.userId,
      email: session.user.email!,
      name: session.user.name ?? null,
    },
    update: {},
  });

  // 重複チェック
  const existing = await prisma.invitation.findUnique({
    where: { eventId_guestId: { eventId, guestId: guest.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "already_joined" }, { status: 409 });
  }

  const now = new Date();
  const invitation = await prisma.invitation.create({
    data: {
      eventId,
      guestId: guest.id,
      status: "ACCEPTED",
      sentAt: now,
      respondedAt: now,
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}
