import { requireUser } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await requireUser();

  const [user, lineAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, passwordHash: true, gender: true, ageGroup: true },
    }),
    prisma.account.findFirst({
      where: { userId: session.user.id, provider: "line" },
      select: { providerAccountId: true },
    }),
  ]);

  return (
    <SettingsClient
      user={{
        name: user?.name ?? null,
        email: user?.email ?? "",
        hasPassword: !!user?.passwordHash,
        gender: user?.gender ?? null,
        ageGroup: user?.ageGroup ?? null,
      }}
      lineLinked={!!lineAccount}
    />
  );
}
