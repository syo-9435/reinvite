import { requireUser } from "@/lib/requireAdmin";
import UserSidebar from "@/components/user/UserSidebar";
import UserBottomNav from "@/components/user/UserBottomNav";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:flex">
        <UserSidebar />
      </div>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <UserBottomNav />
    </div>
  );
}
