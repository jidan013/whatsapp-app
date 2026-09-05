import http from "node:http";
import { BOT_CONFIG } from "@/bot/config";
import { botLogger } from "@/bot/utils/logger";
import { getBotState } from "@/bot/state";
import { logoutCurrentSession, triggerReconnect } from "@/bot/connection";

let isConnected = false;

export function setBotConnected(connected: boolean): void {
  isConnected = connected;
}

function sendJson(response: http.ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

export function startHealthcheckServer(): http.Server {
  const server = http.createServer((request, response) => {
    // Endpoint lama, dipertahankan agar tidak mematahkan pemakaian lain.
    if (request.url === "/health" && request.method === "GET") {
      sendJson(response, isConnected ? 200 : 503, {
        status: isConnected ? "ok" : "disconnected",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (request.url === "/status" && request.method === "GET") {
      const state = getBotState();
      sendJson(response, 200, {
        connected: state.connected,
        phoneNumber: state.phoneNumber,
        lastPingAt: state.lastConnectedAt,
      });
      return;
    }

    if (request.url === "/qrcode" && request.method === "GET") {
      const state = getBotState();
      sendJson(response, 200, { qr: state.qrDataUrl });
      return;
    }

    if (request.url === "/disconnect" && request.method === "POST") {
      logoutCurrentSession()
        .then((result) => sendJson(response, result.success ? 200 : 400, result))
        .catch((error: unknown) => {
          botLogger.error({ err: error }, "Error saat memproses /disconnect");
          sendJson(response, 500, { success: false, error: "Internal error" });
        });
      return;
    }

    if (request.url === "/reconnect" && request.method === "POST") {
      const result = triggerReconnect();
      sendJson(response, result.success ? 200 : 409, result);
      return;
    }

    response.writeHead(404);
    response.end();
  });

  server.listen(BOT_CONFIG.healthcheckPort, () => {
    botLogger.info({ port: BOT_CONFIG.healthcheckPort }, "Bot healthcheck server berjalan");
  });

  return server;
}