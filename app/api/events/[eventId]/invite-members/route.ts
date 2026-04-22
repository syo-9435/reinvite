import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ eventId: string }> };

// POST /api/events/[eventId]/invite-members
// MEMBERユーザーを選択して招待状を送る（ゲストレコードを自動作成）
export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "INVITER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;

  // イベントのオーナー、または参加登録済みのユーザーが招待可能
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { userId: session.user.id },
        { invitations: { some: { guest: { email: session.user.email! } } } },
      ],
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { userIds, message, expiresAt } = await request.json();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "参加者を1名以上選択してください" }, { status: 400 });
  }

  // MEMBERユーザーを取得
  const members = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "MEMBER" },
  });

  if (members.length === 0) {
    return NextResponse.json({ error: "有効な参加者が見つかりません" }, { status: 400 });
  }

  const now = new Date();
  const invitations = [];

  for (const member of members) {
    // Guest レコードを upsert（同一 email+userId の組み合わせで検索）
    let guest;
    if (member.email) {
      guest = await prisma.guest.upsert({
        where: { userId_email: { userId: session.user.id, email: member.email } },
        update: { name: member.name ?? member.email, phone: member.phone ?? undefined },
        create: {
          name: member.name ?? member.email,
          email: member.email,
          phone: member.phone ?? null,
          userId: session.user.id,
        },
      });
    } else {
      // email なし（LINE専用アカウント等）はスキップ
      continue;
    }

    // 既存招待チェック（CANCELLED以外）
    const existingInv = await prisma.invitation.findFirst({
      where: { eventId, guestId: guest.id, status: { not: "CANCELLED" } },
    });
    if (existingInv) continue;

    const inv = await prisma.invitation.create({
      data: {
        eventId,
        guestId: guest.id,
        message: message || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sentAt: now,
        status: "PENDING",
      },
      include: { guest: true },
    });

    invitations.push(inv);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    console.log(`[Re:invite] 招待URL (${inv.guest.name}): ${baseUrl}/invite/${inv.token}`);
  }

  if (invitations.length === 0) {
    return NextResponse.json({ error: "選択した参加者は全員すでに招待済みです" }, { status: 409 });
  }

  return NextResponse.json(invitations, { status: 201 });
}
