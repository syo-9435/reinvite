import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { qrToken } = await req.json();

  if (!qrToken) {
    return NextResponse.json({ error: "qrTokenが必要です" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { qrToken },
    include: {
      guest: { select: { name: true } },
      event: { select: { title: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "無効なQRコードです" }, { status: 404 });
  }

  if (invitation.checkedIn) {
    return NextResponse.json(
      { error: "入場済みです", guestName: invitation.guest.name, eventTitle: invitation.event.title },
      { status: 409 }
    );
  }

  await prisma.invitation.update({
    where: { qrToken },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  return NextResponse.json({
    guestName: invitation.guest.name,
    eventTitle: invitation.event.title,
  });
}
