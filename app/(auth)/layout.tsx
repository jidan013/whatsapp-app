import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | WorkHub",
    default: "WorkHub",
  },
  description: "Platform manajemen agenda dan work order terintegrasi WhatsApp",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-4 py-8">
      {children}
    </div>
  );
}