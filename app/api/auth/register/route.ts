import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, gender, ageGroup } = await request.json();

    if (!email || !password || !phone) {
      return NextResponse.json({ error: "メールアドレス・電話番号・パスワードは必須です" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }

    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { phone } }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }
    if (existingPhone) {
      return NextResponse.json({ error: "この電話番号は既に登録されています" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const role = email === process.env.ADMIN_EMAIL ? "ADMIN" : "INVITER";

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role, gender: gender || null, ageGroup: ageGroup || null },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
