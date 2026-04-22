import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, buildSessionToken } from "@/lib/superAdminAuth";

async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(COOKIE_NAME)?.value;
    if (!value) return false;
    return value === buildSessionToken();
  } catch {
    return false;
  }
}

const SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  companyName: true,
  groupName: true,
  isSuspended: true,
  contractStartAt: true,
  contractEndAt: true,
  createdAt: true,
} as const;

// GET — admin アカウント一覧
export async function GET() {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "INVITER"] } },
      select: SELECT,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (e) {
    console.error("[super-admin/admins GET]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST — admin アカウント新規作成
export async function POST(req: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, password, companyName, groupName, contractStartAt, contractEndAt } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "email と password は必須です" }, { status: 400 });
    }
    if (!contractStartAt || !contractEndAt) {
      return NextResponse.json({ error: "契約開始日・終了日は必須です" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        role: "ADMIN",
        companyName: companyName || null,
        groupName: groupName || null,
        contractStartAt: new Date(contractStartAt),
        contractEndAt: new Date(contractEndAt),
      },
      select: SELECT,
    });

    return NextResponse.json({ admin: user }, { status: 201 });
  } catch (e) {
    console.error("[super-admin/admins POST]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PATCH — 契約期間更新 or 停止/停止解除
export async function PATCH(req: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    // 停止トグル
    if ("isSuspended" in body) {
      const user = await prisma.user.update({
        where: { id },
        data: { isSuspended: body.isSuspended },
        select: SELECT,
      });
      return NextResponse.json({ admin: user });
    }

    // 契約期間更新
    const { contractStartAt, contractEndAt } = body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        contractStartAt: contractStartAt ? new Date(contractStartAt) : null,
        contractEndAt: contractEndAt ? new Date(contractEndAt) : null,
      },
      select: SELECT,
    });

    return NextResponse.json({ admin: user });
  } catch (e) {
    console.error("[super-admin/admins PATCH]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE — アカウント削除
export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[super-admin/admins DELETE]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
