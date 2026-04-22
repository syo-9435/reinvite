import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_GENDERS   = ["MALE", "FEMALE", "OTHER", "NO_ANSWER"];
const VALID_AGE_GROUPS = ["TEENS", "TWENTIES", "THIRTIES", "FORTIES", "FIFTIES_PLUS"];

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gender, ageGroup } = await request.json();

  if (gender !== null && gender !== undefined && !VALID_GENDERS.includes(gender)) {
    return NextResponse.json({ error: "無効な性別です" }, { status: 400 });
  }
  if (ageGroup !== null && ageGroup !== undefined && !VALID_AGE_GROUPS.includes(ageGroup)) {
    return NextResponse.json({ error: "無効な年代です" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      gender:   gender   ?? null,
      ageGroup: ageGroup ?? null,
    },
    select: { gender: true, ageGroup: true },
  });

  return NextResponse.json(updated);
}
