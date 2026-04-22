import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

// GET /api/invite/[token] — 招待情報取得（公開）
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      guest: { select: { name: true } },
      event: {
        select: { title: true, description: true, venue: true, address: true, startAt: true, endAt: true, ticketCodes: true },
      },
    },
  });

  if (!invitation) return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });

  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    if (invitation.status === "PENDING") {
      await prisma.invitation.update({ where: { token }, data: { status: "EXPIRED" } });
    }
    return NextResponse.json({ error: "この招待は期限切れです" }, { status: 410 });
  }

  return NextResponse.json(invitation);
}

// POST /api/invite/[token] — 回答送信（公開）
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      guest: { select: { id: true, name: true } },
      event: { select: { id: true, ticketCodes: true } },
    },
  });

  if (!invitation) return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });

  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "この招待は既に回答済みかキャンセルされています" }, { status: 409 });
  }

  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { token }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "この招待は期限切れです" }, { status: 410 });
  }

  const body = await request.json();
  const { status, name, phone, ticketCode, smsCode, verificationId } = body;

  // チケット番号のバリデーション
  if (invitation.event.ticketCodes) {
    const validCodes: string[] = JSON.parse(invitation.event.ticketCodes);
    if (validCodes.length > 0) {
      if (!ticketCode?.trim()) {
        return NextResponse.json({ error: "チケット番号を入力してください" }, { status: 400 });
      }
      if (!validCodes.includes(ticketCode.trim())) {
        return NextResponse.json({ error: "チケット番号が無効です" }, { status: 400 });
      }
      // 同一イベントで既に使われていないか確認
      const alreadyUsed = await prisma.invitation.findFirst({
        where: {
          eventId: invitation.event.id,
          ticketCode: ticketCode.trim(),
          id: { not: invitation.id },
        },
      });
      if (alreadyUsed) {
        return NextResponse.json({ error: "このチケット番号は既に使用されています" }, { status: 409 });
      }
    }
  }

  // PENDING招待は常に名前・電話番号・SMS認証が必須
  if (!name?.trim()) {
    return NextResponse.json({ error: "お名前を入力してください" }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: "電話番号を入力してください" }, { status: 400 });
  }
  if (!smsCode?.trim()) {
    return NextResponse.json({ error: "SMS認証コードを入力してください" }, { status: 400 });
  }
  if (!verificationId) {
    return NextResponse.json({ error: "SMS認証を完了してください" }, { status: 400 });
  }

  // verificationId で直接照合（電話番号の正規化ズレを回避）
  const verification = await prisma.smsVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification || verification.used) {
    return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 400 });
  }
  if (verification.code !== smsCode.trim()) {
    return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 400 });
  }
  if (verification.expiresAt < new Date()) {
    return NextResponse.json({ error: "認証コードの有効期限が切れています。再送信してください" }, { status: 400 });
  }

  // コードを使用済みにする
  await prisma.smsVerification.update({ where: { id: verification.id }, data: { used: true } });

  await prisma.guest.update({
    where: { id: invitation.guest.id },
    data: {
      name:  name.trim(),
      phone: phone?.trim() || null,
    },
  });

  const resolvedStatus = status ?? "ACCEPTED";
  if (!["ACCEPTED", "DECLINED"].includes(resolvedStatus)) {
    return NextResponse.json({ error: "無効な回答です" }, { status: 400 });
  }

  const newQrToken = resolvedStatus === "ACCEPTED"
    ? crypto.randomUUID()
    : undefined;

  try {
    const updated = await prisma.invitation.update({
      where: { token },
      data: {
        status: resolvedStatus,
        plusOne: 0,
        respondedAt: new Date(),
        ticketCode: ticketCode?.trim() || null,
        ...(newQrToken ? { qrToken: newQrToken } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[invite POST] prisma.invitation.update failed:", message);
    return NextResponse.json({ error: `登録処理中にエラーが発生しました: ${message}` }, { status: 500 });
  }
}
