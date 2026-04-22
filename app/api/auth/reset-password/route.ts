import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return NextResponse.json({ error: "無効または期限切れのリンクです" }, { status: 400 });
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: "このリンクは既に使用済みです" }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "リンクの有効期限が切れています。再度リセットをリクエストしてください" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // パスワード更新とトークン使用済みマークを同時に実行
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "パスワードを更新しました" });
}
