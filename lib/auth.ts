import NextAuth, { CredentialsSignin } from "next-auth";

class AccountSuspended extends CredentialsSignin {
  code = "ACCOUNT_SUSPENDED";
}
import Credentials from "next-auth/providers/credentials";
import Line from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;
        if (user.isSuspended) throw new AccountSuspended();
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),

    Line({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // credentials は既存ロジック通過
      if (account?.provider === "credentials") return true;

      if (account?.provider === "line") {
        const lineUserId = account.providerAccountId;

        // ── Cookie から「連携モード」かどうかを確認 ──
        const cookieStore = await cookies();
        const linkUserId = cookieStore.get("line_link_user_id")?.value;

        if (linkUserId) {
          // 連携モード: Cookie はここで消費（削除は次のレスポンスで行うためログだけ）
          const existingAccount = await prisma.account.findUnique({
            where: { provider_providerAccountId: { provider: "line", providerAccountId: lineUserId } },
          });

          if (existingAccount && existingAccount.userId !== linkUserId) {
            // 別ユーザーにすでに連携済み
            return "/settings?error=line_already_linked";
          }

          await prisma.account.upsert({
            where: { provider_providerAccountId: { provider: "line", providerAccountId: lineUserId } },
            update: {
              access_token: account.access_token ?? null,
              id_token: account.id_token ?? null,
            },
            create: {
              userId: linkUserId,
              type: "oidc",
              provider: "line",
              providerAccountId: lineUserId,
              access_token: account.access_token ?? null,
              id_token: account.id_token ?? null,
              token_type: "bearer",
            },
          });

          // 元のユーザーセッションを維持するためユーザーIDを上書き
          const existingUser = await prisma.user.findUnique({ where: { id: linkUserId } });
          if (existingUser) {
            user.id = existingUser.id;
            user.email = existingUser.email;
            user.name = existingUser.name;
            (user as { role?: string }).role = existingUser.role;
          }

          return "/settings?linked=line";
        }

        // ── 通常 LINE ログイン ──

        // 1. 既存の Account から User を探す
        const existingAccount = await prisma.account.findUnique({
          where: { provider_providerAccountId: { provider: "line", providerAccountId: lineUserId } },
          include: { user: true },
        });

        if (existingAccount) {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: { access_token: account.access_token ?? null },
          });
          user.id = existingAccount.userId;
          user.email = existingAccount.user.email;
          user.name = existingAccount.user.name;
          (user as { role?: string }).role = existingAccount.user.role;
          return true;
        }

        // 2. LINE の email で既存 User を探す
        const email = (profile as { email?: string })?.email;
        if (email) {
          const userByEmail = await prisma.user.findUnique({ where: { email } });
          if (userByEmail) {
            await prisma.account.create({
              data: {
                userId: userByEmail.id,
                type: "oidc",
                provider: "line",
                providerAccountId: lineUserId,
                access_token: account.access_token ?? null,
                id_token: account.id_token ?? null,
                token_type: "bearer",
              },
            });
            user.id = userByEmail.id;
            user.email = userByEmail.email;
            user.name = userByEmail.name;
            (user as { role?: string }).role = userByEmail.role;
            return true;
          }
        }

        // 3. 完全新規 → User + Account を作成
        const newEmail = email ?? `line_${lineUserId}@line.local`;
        const lineProfile = profile as { name?: string; picture?: string } | undefined;
        const newUser = await prisma.user.create({
          data: {
            email: newEmail,
            name: lineProfile?.name ?? null,
            image: lineProfile?.picture ?? null,
            role: "INVITER",
            accounts: {
              create: {
                type: "oidc",
                provider: "line",
                providerAccountId: lineUserId,
                access_token: account.access_token ?? null,
                id_token: account.id_token ?? null,
                token_type: "bearer",
              },
            },
          },
        });
        user.id = newUser.id;
        user.email = newUser.email;
        user.name = newUser.name;
        (user as { role?: string }).role = newUser.role;
        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        if (account?.provider === "line") {
          // LINE ログイン時は DB から role を取得
          const dbUser = await prisma.user.findUnique({ where: { id: user.id as string } });
          token.role = dbUser?.role ?? "INVITER";
        } else {
          token.role = (user as { role?: string }).role ?? "INVITER";
        }
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },

  },
});
