import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invitation = await prisma.invitation.findFirst({
    where: { id, guest: { email: session.user.email! } },
    include: { event: true, guest: true },
  });

  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invitation);
}
