import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function requireInviter() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "INVITER") redirect("/dashboard");
  return session;
}

export async function requireUser() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}
