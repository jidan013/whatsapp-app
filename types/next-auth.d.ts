// types/next-auth.d.tsimport type { PermissionCode } from "@/types/permissions";
import type { DefaultSession } from "next-auth";

export interface AppSessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roles: string[];
  permissions: PermissionCode[];
}

declare module "@auth/core/types" {
  // Tidak menggunakan extends agar interface memiliki anggota
  interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    roles: string[];
    permissions: PermissionCode[];
  }
  
  interface Session {
    user: AppSessionUser & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: PermissionCode[];
    avatarUrl: string | null;
  }
}

// Untuk kompatibilitas IDE saat mengimpor dari "next-auth"
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    roles: string[];
    permissions: PermissionCode[];
  }
  
  interface Session {
    user: AppSessionUser & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: PermissionCode[];
    avatarUrl: string | null;
  }
}