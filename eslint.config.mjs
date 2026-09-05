import { FlatCompat } from "@eslint/eslintrc";
import security from "eslint-plugin-security";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["bot/**/*.ts", "app/sw.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      security,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Ketentuan wajib master prompt: tidak boleh ada any / ts-ignore / eslint-disable
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      // File path yang dipakai di fs.* selalu berasal dari nilai yang sudah divalidasi/
      // di-generate secara internal (UUID acak, env var konfigurasi server, hasil sanitasi
      // ekstensi) - bukan input pengguna mentah - jadi aturan ini terlalu banyak
      // false-positive untuk codebase ini. Path traversal dicegah manual di
      // lib/storage/local-storage-driver.ts via path.basename() + validasi ekstensi.
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  {
    // Proses bot berjalan standalone (tsx/node), punya tsconfig terpisah (bot/tsconfig.json)
    // yang sengaja dikecualikan dari tsconfig.json root - jadi butuh parserOptions.project sendiri.
    files: ["bot/**/*.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      security,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./bot/tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      // bot/ adalah proses Node.js backend murni, bukan React. next/core-web-vitals
      // mengaktifkan react-hooks/rules-of-hooks secara global, yang false-positive pada
      // fungsi library apa pun bernama "useXxx" (mis. Baileys' useMultiFileAuthState)
      // meski bukan React Hook sama sekali.
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    // Service worker berjalan di WorkerGlobalScope, punya tsconfig terpisah (tsconfig.worker.json).
    files: ["app/sw.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      security,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.worker.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "storage/**",
      "uploads/**",
      "exports/**",
      "backup/**",
      "prisma/migrations/**",
      // File konfigurasi .js/.mjs di root bukan bagian dari tsconfig.json manapun
      // (bukan kode aplikasi TypeScript), jadi tidak perlu typed-linting.
      // *.config.ts (next.config.ts, tailwind.config.ts, vitest.config.ts) TETAP
      // di-lint karena memang bagian dari tsconfig.json.
      "*.config.js",
      "*.config.mjs",
    ],
  },
];

export default config;
