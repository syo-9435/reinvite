import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 連携開始: HttpOnly Cookie を発行して LINE OAuth フローを開始させる
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("line_link_user_id", session.user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5分
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
