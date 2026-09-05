// components/auth/login-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email atau username wajib diisi" }));
      return;
    }
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: "Kata sandi wajib diisi" }));
      return;
    }

    startTransition(() => {
      // Panggil signIn dalam async dan tangani hasilnya
      void (async () => {
        try {
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
            callbackUrl: "/agenda",
          });

          if (result?.error) {
            setErrors({ general: "Email atau kata sandi salah" });
            toast.error("Login gagal, periksa kembali kredensial Anda");
          } else {
            toast.success("Selamat datang kembali!");
            router.push("/agenda");
            router.refresh();
          }
        } catch {
          setErrors({ general: "Terjadi kesalahan pada server" });
          toast.error("Gagal terhubung ke server");
        }
      })();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email atau Username
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="nama@perusahaan.com"
          className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            errors.email
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
              : "border-slate-200 focus:border-blue-400 focus:ring-blue-200"
          }`}
          disabled={isPending}
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Kata Sandi
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-blue-600 transition-colors hover:text-blue-700 hover:underline"
          >
            Lupa Kata Sandi?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Masukkan kata sandi"
            className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
              errors.password
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                : "border-slate-200 focus:border-blue-400 focus:ring-blue-200"
            }`}
            disabled={isPending}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
          />
          Ingat Saya
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Masuk ke Dashboard
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        )}
      </button>

      {errors.general && (
        <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 ring-1 ring-red-200/50">
          {errors.general}
        </div>
      )}
    </form>
  );
}