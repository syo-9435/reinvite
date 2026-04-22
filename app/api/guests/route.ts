import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/guests
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guests = await prisma.guest.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { invitations: true } } },
  });

  return NextResponse.json(guests);
}

// POST /api/guests
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, note } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  if (email) {
    const existing = await prisma.guest.findUnique({
      where: { userId_email: { userId: session.user.id, email } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 409 }
      );
    }
  }

  const guest = await prisma.guest.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      note: note || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(guest, { status: 201 });
}
