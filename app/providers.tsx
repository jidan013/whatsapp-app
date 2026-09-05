"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryProvider } from "@/components/shared/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryProvider>
          {children}
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}