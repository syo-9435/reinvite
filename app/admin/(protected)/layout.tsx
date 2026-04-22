import { requireInviter } from "@/lib/requireAdmin";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import ContractExpired from "@/components/admin/ContractExpired";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireInviter();

  // INVITER ロールのみ契約期限チェック（ADMIN は制限なし）
  if (session.user.role === "INVITER") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { contractStartAt: true, contractEndAt: true },
    });

    if (user?.contractEndAt && new Date(user.contractEndAt) < new Date()) {
      return (
        <ContractExpired
          contractEndAt={user.contractEndAt.toISOString()}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:flex">
        <AdminSidebar role={session.user.role} />
      </div>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <AdminBottomNav role={session.user.role} />
    </div>
  );
}
