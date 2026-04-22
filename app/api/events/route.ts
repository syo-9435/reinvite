import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/events — イベント一覧
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { startAt: "asc" },
    include: {
      _count: { select: { invitations: true } },
    },
  });

  return NextResponse.json(events);
}

// POST /api/events — イベント作成
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, venue, address, startAt, status, imageUrl, ticketCodes } = body;

  if (!title || !startAt) {
    return NextResponse.json({ error: "タイトルと開催日時は必須です" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      venue: venue || null,
      address: address || null,
      startAt: new Date(startAt),
      status: status ?? "DRAFT",
      imageUrl: imageUrl || null,
      ticketCodes: ticketCodes || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
