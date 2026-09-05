import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validation/auth.schema";
import { userRepository } from "@/repositories/user.repository";
import { authConfig } from "@/lib/auth/auth.config";
import type { PermissionCode } from "@/types/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        try {
          const parsed = loginSchema.safeParse(rawCredentials);
          if (!parsed.success) {
            console.error("Login validation error:", parsed.error);
            return null;
          }

          const { email, password } = parsed.data;
          const record = await userRepository.findAuthenticatedUserByEmail(email);

          if (!record || !record.isActive) {
            return null;
          }

          // ✅ Dynamic import menghindari bundling argon2 di edge/middleware
          const { verifyPassword } = await import("@/lib/auth/password");
          const passwordMatches = await verifyPassword(record.passwordHash, password);

          if (!passwordMatches) {
            return null;
          }

          await userRepository.touchLastLogin(record.id);

          return {
            id: record.id,
            name: record.name,
            email: record.email,
            avatarUrl: record.avatarUrl,
            roles: record.roles ?? [],
            permissions: (record.permissions ?? []) as PermissionCode[],
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
});