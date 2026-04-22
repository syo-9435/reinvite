import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ guestId: string }> };

// PUT /api/guests/[guestId]
export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guestId } = await params;
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, userId: session.user.id },
  });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, email, phone, note } = await request.json();
  if (!name) return NextResponse.json({ error: "名前は必須です" }, { status: 400 });

  const updated = await prisma.guest.update({
    where: { id: guestId },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      note: note || null,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/guests/[guestId]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { guestId } = await params;
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, userId: session.user.id },
  });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.guest.delete({ where: { id: guestId } });
  return new NextResponse(null, { status: 204 });
}
