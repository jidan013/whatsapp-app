import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { PwaServiceWorkerRegister } from "@/components/shared/pwa-register";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "WhatsApp Agenda System",
    template: "%s | WhatsApp Agenda System",
  },
  description: "Enterprise WhatsApp Work Management System",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} font-sans`}>
        <Providers>
          {children}
          <PwaServiceWorkerRegister />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}