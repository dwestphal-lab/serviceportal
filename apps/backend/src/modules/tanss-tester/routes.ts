import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../core/auth-plugin.js";
import { buildApiBase } from "../auth/tanss.service.js";
import { prisma } from "@plenium/db";

interface TanssRequestBody {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: unknown;
  extraHeaders?: Record<string, string>;
}

export async function tanssTesterRoutes(server: FastifyInstance) {
  server.post<{ Body: TanssRequestBody }>(
    "/request",
    {
      preHandler: requireAuth,
      schema: {
        body: {
          type: "object",
          required: ["method", "path"],
          properties: {
            method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
            path:   { type: "string", minLength: 1 },
            body:   {},
            extraHeaders: { type: "object", additionalProperties: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { method, path, body, extraHeaders = {} } = request.body;
      const { tanssToken, systemConfigId } = request.user;

      // System-Config für API-Base laden
      const systemConfig = await prisma.systemConfig.findUnique({
        where: { id: systemConfigId },
        select: { baseUrl: true, useBackend: true },
      });
      if (!systemConfig) {
        return reply.status(400).send({ error: "SYSTEM_NOT_FOUND", message: "System-Config nicht gefunden." });
      }

      const apiBase = buildApiBase(systemConfig);

      // Pfad bereinigen
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const url = `${apiBase}${cleanPath}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apiToken: tanssToken,
        ...extraHeaders,
      };

      let tanssResponse: Response;
      const startMs = Date.now();
      try {
        tanssResponse = await fetch(url, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(30_000),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verbindungsfehler";
        return reply.status(502).send({
          error: "TANSS_UNREACHABLE",
          message: `TANSS nicht erreichbar: ${message}`,
        });
      }

      const durationMs = Date.now() - startMs;

      // Response-Body lesen
      const contentType = tanssResponse.headers.get("content-type") ?? "";
      let responseBody: unknown;
      try {
        if (contentType.includes("application/json")) {
          responseBody = await tanssResponse.json();
        } else {
          responseBody = await tanssResponse.text();
        }
      } catch {
        responseBody = null;
      }

      // Relevante Response-Headers sammeln
      const responseHeaders: Record<string, string> = {};
      for (const [key, value] of tanssResponse.headers.entries()) {
        responseHeaders[key] = value;
      }

      return reply.send({
        status: tanssResponse.status,
        statusText: tanssResponse.statusText,
        durationMs,
        url,
        headers: responseHeaders,
        body: responseBody,
      });
    }
  );
}
