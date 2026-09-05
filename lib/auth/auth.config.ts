import type { NextAuthConfig } from "next-auth";
import type { PermissionCode } from "@/types/permissions";

export const authConfig = {
  trustHost: true, // wajib di Vercel/proxy: agar NextAuth pakai host dari request, bukan fallback ke localhost
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.AUTH_SESSION_MAX_AGE ?? 2592000),
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions as PermissionCode[];
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.roles = token.roles as string[];
      session.user.permissions = token.permissions as PermissionCode[];
      session.user.avatarUrl = token.avatarUrl as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;