import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      guest: { select: { name: true } },
      event: { select: { title: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });
  }

  if (invitation.status !== "ACCEPTED") {
    return NextResponse.json({ error: `この招待は${invitation.status === "DECLINED" ? "不参加" : invitation.status}です` }, { status: 422 });
  }

  if (invitation.checkedIn) {
    return NextResponse.json({
      alreadyCheckedIn: true,
      guestName: invitation.guest.name,
      eventTitle: invitation.event.title,
    });
  }

  await prisma.invitation.update({
    where: { token },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  return NextResponse.json({
    alreadyCheckedIn: false,
    guestName: invitation.guest.name,
    eventTitle: invitation.event.title,
  });
}
