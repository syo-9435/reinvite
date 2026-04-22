import type { NextAuthConfig } from "next-auth";

// Edge Runtime (middleware) で使える軽量設定
// Prisma など Node.js 専用 API は含めない
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  callbacks: {
    session({ session, token }) {
      // JWT に埋め込んだ id / role を session に反映
      session.user.id   = (token.id ?? token.sub) as string;
      session.user.role = (token.role as string) ?? "";
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
