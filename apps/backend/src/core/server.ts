import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { config, isDev } from "./config.js";
import { registerAuthPlugin } from "./auth-plugin.js";

/**
 * Erstellt und konfiguriert die Fastify-Instanz.
 * Modul-Routen werden in src/index.ts registriert.
 */
export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: isDev
      ? {
          level: "info",
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }
      : { level: "warn" },
    trustProxy: true,
  });

  // ── Security: HTTP-Header ──────────────────────────────────────────────────
  await server.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  await server.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ── Auth: JWT + Cookie ────────────────────────────────────────────────────
  await registerAuthPlugin(server);

  // ── Health Check ──────────────────────────────────────────────────────────
  server.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              version: { type: "string" },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
    async () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      uptime: process.uptime(),
    })
  );

  // ── API v1 Status ─────────────────────────────────────────────────────────
  server.get("/api/v1/status", async () => ({
    status: "ok",
    service: "PLENIUM Backend",
    version: "0.1.0",
    environment: config.nodeEnv,
  }));

  // ── 404 Handler ───────────────────────────────────────────────────────────
  server.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: "NOT_FOUND",
      message: "Die angeforderte Route existiert nicht.",
    });
  });

  // ── Error Handler ─────────────────────────────────────────────────────────
  server.setErrorHandler((error: { statusCode?: number; code?: string; message?: string }, _request, reply) => {
    server.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: error.code ?? "INTERNAL_SERVER_ERROR",
      message:
        statusCode >= 500
          ? "Ein interner Fehler ist aufgetreten."
          : error.message,
    });
  });

  return server;
}
