import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/owned-events
// 自分が作成したイベント、または自分が招待されているイベントを返す（招待送信用）
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { invitations: { some: { guest: { email: session.user.email! } } } },
      ],
    },
    select: { id: true, title: true, startAt: true },
    orderBy: { startAt: "desc" },
  });

  return NextResponse.json(events);
}
