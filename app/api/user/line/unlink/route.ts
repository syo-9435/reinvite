import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // パスワードが未設定の場合は解除を禁止（ログイン手段がなくなる）
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "パスワードを設定してから LINE 連携を解除してください" },
      { status: 400 }
    );
  }

  const deleted = await prisma.account.deleteMany({
    where: { userId: session.user.id, provider: "line" },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "LINE 連携が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
