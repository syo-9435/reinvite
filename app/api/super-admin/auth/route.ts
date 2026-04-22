import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, buildSessionToken } from "@/lib/superAdminAuth";

const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "superadmin123";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== SUPER_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, buildSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[super-admin/auth POST]", e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[super-admin/auth DELETE]", e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
