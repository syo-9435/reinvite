import { createHash } from "crypto";

export const COOKIE_NAME = "super_admin_session";

/** パスワード + シークレットの SHA-256 ハッシュ */
export function buildSessionToken(): string {
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "superadmin123";
  const secret = process.env.SUPER_ADMIN_HMAC_SECRET ?? "super-admin-hmac-secret";
  return createHash("sha256").update(password + secret).digest("hex");
}
