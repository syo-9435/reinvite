import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/invitations
// メールアドレス宛に招待メールを送信し、招待レコードをDBに保存する
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "INVITER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId, emails, message } = await request.json();

  if (!eventId || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "イベントとメールアドレスを指定してください" }, { status: 400 });
  }

  const validEmails: string[] = emails
    .filter((e: unknown) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .map((e: string) => e.trim().toLowerCase());

  if (validEmails.length === 0) {
    return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
  }

  // イベント取得（自分が作成したイベント。ADMINは全イベント可）
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      ...(role === "ADMIN" ? {} : {
        OR: [
          { userId: session.user.id },
          { invitations: { some: { guest: { email: session.user.email! } } } },
        ],
      }),
    },
  });
  if (!event) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });

  const inviterName = session.user.name ?? "主催者";
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const now = new Date();
  const created = [];

  for (const email of validEmails) {
    // Guest レコードを upsert（招待者ユーザーID + email でユニーク）
    const guest = await prisma.guest.upsert({
      where: { userId_email: { userId: session.user.id, email } },
      update: {},
      create: { email, userId: session.user.id },
    });

    // すでにアクティブな招待がある場合はスキップ
    const existing = await prisma.invitation.findFirst({
      where: { eventId, guestId: guest.id, status: { not: "CANCELLED" } },
    });
    if (existing) continue;

    // 招待レコード作成
    const inv = await prisma.invitation.create({
      data: {
        eventId,
        guestId: guest.id,
        message: message || null,
        sentAt: now,
        status: "PENDING",
      },
    });

    const inviteUrl = `${baseUrl}/invite/${inv.token}`;

    // Resend でメール送信
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_your")) {
      try {
        await resend.emails.send({
          from: "Re:invite <onboarding@resend.dev>",
          to: email,
          subject: `【Re:invite】${event.title} へのご招待`,
          html: buildInviteHtml({ inviterName, eventTitle: event.title, inviteUrl, message }),
        });
      } catch (err) {
        console.error(`[Re:invite] メール送信失敗 (${email}):`, err);
      }
    } else {
      console.log(`[Re:invite] 招待URL (${email}): ${inviteUrl}`);
    }

    created.push({ id: inv.id, email, token: inv.token });
  }

  if (created.length === 0) {
    return NextResponse.json({ error: "選択したメールアドレスはすべて招待済みです" }, { status: 409 });
  }

  return NextResponse.json(created, { status: 201 });
}

// GET /api/invitations?eventId=xxx
// 送信済み招待一覧を取得する
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "INVITER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId が必要です" }, { status: 400 });

  const invitations = await prisma.invitation.findMany({
    where: {
      eventId,
      event: role === "ADMIN" ? undefined : { userId: session.user.id },
    },
    include: { guest: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

function buildInviteHtml({
  inviterName,
  eventTitle,
  inviteUrl,
  message,
}: {
  inviterName: string;
  eventTitle: string;
  inviteUrl: string;
  message?: string;
}): string {
  const messageBlock = message
    ? `<div style="background:#FFF0F6;border-radius:12px;padding:14px 16px;border-left:3px solid #FF6B9D;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#1E0A1E;line-height:1.7;white-space:pre-line;">${message}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F3EEF4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEF4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#FF6B9D;letter-spacing:-0.5px;">Re:invite</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFCFE;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(255,107,157,0.12);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#FF6B9D,#C084FC);padding:28px 32px;">
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;">INVITATION</p>
                    <h2 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">${eventTitle}</h2>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#1E0A1E;line-height:1.6;">
                      <strong>${inviterName}</strong> さんからイベントへのご招待が届いています。
                    </p>
                    ${messageBlock}
                    <p style="margin:0 0 24px;font-size:14px;color:#8B7A8E;line-height:1.7;">
                      下のボタンから参加情報を入力してください。
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="${inviteUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#FF6B9D,#C084FC);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">
                            参加フォームを開く →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:20px 0 0;font-size:11px;color:#8B7A8E;">
                      ボタンが開けない場合: <span style="color:#FF6B9D;word-break:break-all;">${inviteUrl}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#8B7A8E;">© Re:invite · このメールは自動送信です</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
