import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// ログイン後のロール別振り分けページ
export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  // INVITER その他
  redirect("/dashboard");
}
