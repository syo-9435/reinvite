import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invitations = await prisma.invitation.findMany({
    where: { guest: { email: session.user.email! } },
    include: { event: true, guest: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}
