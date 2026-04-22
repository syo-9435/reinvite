import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_EXACT = ["/"];
const PUBLIC_PATHS = ["/invite", "/api/invite", "/api/sms", "/api/admin/register", "/ticket", "/super-admin", "/api/super-admin"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/admin/login", "/admin/register", "/admin/forgot-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic = PUBLIC_EXACT.includes(pathname) || PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PATHS.some((p) => pathname === p);

  // 未認証 → /login
  if (!req.auth && !isPublic && !isAuth && !isApiAuth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth?.user?.role;

  // /admin/* → ADMIN のみ（/admin/login は除外）
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/register") && !pathname.startsWith("/admin/forgot-password")) {
    if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 認証済みが /login or /register → role別にリダイレクト
  if (req.auth && isAuth) {
    const dest = role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
