import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetMail } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  // ユーザーが存在しなくても同じレスポンスを返す（メールアドレス探索防止）
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // 既存の未使用トークンを無効化
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // 新しいトークンを生成（64バイト = 128文字の16進数）
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    await sendPasswordResetMail({ to: user.email, name: user.name, resetUrl });
  }

  // 存在有無に関わらず同じレスポンス
  return NextResponse.json({
    message: "入力されたメールアドレスにリセット用URLを送信しました（登録済みの場合）",
  });
}
