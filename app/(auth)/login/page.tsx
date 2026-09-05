import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, MessageSquare, Shield, HelpCircle } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | WorkHub",
  description: "Masuk ke dashboard WorkHub untuk mengelola agenda dan work order",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-4 py-8 md:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center opacity-5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-sm sm:p-8">
          {/* Decorative top bar */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
          
          {/* Logo & Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/30">
              <Briefcase className="h-8 w-8 text-white" />
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-md">
                <span className="text-[8px] font-bold text-white">✓</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              WorkHub
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola agenda & work order terintegrasi
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200/50">
              <MessageSquare className="h-3.5 w-3.5" />
              WHATSAPP INTEGRATED
            </span>
          </div>

          {/* Login Form */}
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>

          {/* Footer Links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link 
              href="/help" 
              className="flex items-center gap-1 transition-colors hover:text-slate-600"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Bantuan
            </Link>
            <span className="text-slate-300">·</span>
            <Link 
              href="/privacy" 
              className="flex items-center gap-1 transition-colors hover:text-slate-600"
            >
              <Shield className="h-3.5 w-3.5" />
              Kebijakan Privasi
            </Link>
          </div>
        </div>

        {/* Version Info */}
        <p className="mt-4 text-center text-xs text-slate-400">
          v2.0.0 · © {new Date().getFullYear()} WorkHub
        </p>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-11 w-full animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-11 w-full animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="h-11 w-full animate-pulse rounded-md bg-slate-200" />
    </div>
  );
}