import { cookies } from "next/headers";
import SuperAdminClient from "./SuperAdminClient";
import SuperAdminLogin from "./SuperAdminLogin";
import { COOKIE_NAME, buildSessionToken } from "@/lib/superAdminAuth";

export default async function SuperAdminPage() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  const isAuthed = !!value && value === buildSessionToken();

  if (!isAuthed) {
    return <SuperAdminLogin />;
  }

  return <SuperAdminClient />;
}
