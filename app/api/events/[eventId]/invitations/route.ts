import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string }> };

// GET /api/events/[eventId]/invitations
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;

  // イベントの所有確認
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invitations = await prisma.invitation.findMany({
    where: { eventId },
    include: { guest: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

// POST /api/events/[eventId]/invitations — 招待を送信
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: session.user.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { guestIds, message, expiresAt } = await request.json();

  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    return NextResponse.json({ error: "ゲストを1名以上選択してください" }, { status: 400 });
  }

  // 既存招待を除外（重複防止）
  const existing = await prisma.invitation.findMany({
    where: { eventId, guestId: { in: guestIds } },
    select: { guestId: true },
  });
  const existingIds = new Set(existing.map((i) => i.guestId));
  const newGuestIds = guestIds.filter((id: string) => !existingIds.has(id));

  if (newGuestIds.length === 0) {
    return NextResponse.json(
      { error: "選択したゲストは既に招待済みです" },
      { status: 409 }
    );
  }

  const now = new Date();
  const invitations = await prisma.$transaction(
    newGuestIds.map((guestId: string) =>
      prisma.invitation.create({
        data: {
          eventId,
          guestId,
          message: message || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          sentAt: now,
          status: "PENDING",
        },
        include: { guest: true },
      })
    )
  );

  // 招待URLをコンソールに出力（メール未設定時の確認用）
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  invitations.forEach((inv) => {
    console.log(`[Re:invite] 招待URL (${inv.guest.name}): ${baseUrl}/invite/${inv.token}`);
  });

  return NextResponse.json(invitations, { status: 201 });
}
