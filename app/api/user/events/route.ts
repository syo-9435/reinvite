import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/events — 参加登録済みイベント一覧
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      invitations: {
        some: {
          guest: { email: session.user.email! },
        },
      },
    },
    select: { id: true, title: true, startAt: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(events);
}
