import ResetPasswordClient from "./ResetPasswordClient";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

export default async function ResetPasswordPage({ params }: Params) {
  const { token } = await params;

  // サーバー側でトークンの有効性を事前チェック
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true },
  });

  const isExpired = !resetToken || resetToken.usedAt !== null || resetToken.expiresAt < new Date();

  return <ResetPasswordClient token={token} isExpired={isExpired} />;
}
