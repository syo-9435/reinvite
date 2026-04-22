import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/sms/send-code
// 電話番号に6桁の認証コードをSMSで送信する（公開エンドポイント）
// TWILIO_ENABLED=true の場合のみ実際にSMSを送信。それ以外はコンソールに出力（開発モード）
export async function POST(request: Request) {
  const { phone } = await request.json();

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "電話番号を入力してください" }, { status: 400 });
  }

  // 日本の電話番号を E.164 形式に変換（09012345678 → +819012345678）
  const normalized = normalizePhone(phone.trim());
  if (!normalized) {
    return NextResponse.json({ error: "有効な電話番号を入力してください（例: 09012345678）" }, { status: 400 });
  }

  // 6桁のランダムコード生成
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分後

  // 古い未使用コードを削除して新しいコードを保存
  await prisma.smsVerification.deleteMany({ where: { phone: normalized, used: false } });
  const verification = await prisma.smsVerification.create({ data: { phone: normalized, code, expiresAt } });

  // TWILIO_ENABLED=true のときのみ実際に SMS 送信（本番用）
  // それ以外は開発モードとしてコンソールに認証コードを出力する
  if (process.env.TWILIO_ENABLED === "true") {
    // Twilio は使用時のみ動的インポート（起動時の副作用を防ぐ）
    const { default: twilio } = await import("twilio");
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `【Re:invite】認証コード: ${code}（5分以内に入力してください）`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: normalized,
    });
  } else {
    console.log(`\n====================================`);
    console.log(`📱 [Re:invite] SMS認証コード (開発モード)`);
    console.log(`   宛先: ${normalized}`);
    console.log(`   コード: ${code}`);
    console.log(`====================================\n`);
    return NextResponse.json({ ok: true, verificationId: verification.id, mockCode: code });
  }

  return NextResponse.json({ ok: true, verificationId: verification.id });
}

function normalizePhone(phone: string): string | null {
  // 数字以外を除去
  const digits = phone.replace(/\D/g, "");

  // 日本の携帯番号: 11桁 (090/080/070/060 など)
  if (/^0[789]\d{9}$/.test(digits)) {
    return "+81" + digits.slice(1);
  }
  // すでに国番号付き (8190xxxxxxxx)
  if (/^81[789]\d{9}$/.test(digits)) {
    return "+" + digits;
  }
  // E.164 形式が渡された場合 (+81...)
  if (phone.startsWith("+")) {
    return phone.replace(/\s/g, "");
  }
  return null;
}
