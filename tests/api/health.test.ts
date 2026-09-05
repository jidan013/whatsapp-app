import { describe, it, expect } from "vitest";

/**
 * API test ini butuh server Next.js yang benar-benar berjalan (`npm run dev`
 * atau `npm start`), karena Route Handler tidak bisa dipanggil langsung tanpa
 * Next.js runtime di test seperti ini. Set TEST_BASE_URL jika bukan localhost:3000.
 */
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("GET /api/health", () => {
  it("mengembalikan status ok dan database connected saat server berjalan normal", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok", database: "connected" });
  });
});
