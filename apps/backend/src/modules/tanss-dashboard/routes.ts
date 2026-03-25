import type { FastifyInstance } from "fastify";
import { prisma } from "@plenium/db";
import { requireAuth } from "../../core/auth-plugin.js";
import { tanssGetDashboardStats } from "../auth/tanss.service.js";

export async function tanssDashboardRoutes(server: FastifyInstance) {
  // ── GET /api/v1/tanss-dashboard/stats ─────────────────────────────────────
  server.get(
    "/stats",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { tanssToken, systemConfigId } = request.user;

      const systemConfig = await prisma.systemConfig.findUnique({
        where: { id: systemConfigId, isActive: true },
        select: { baseUrl: true, useBackend: true },
      });

      if (!systemConfig) {
        return reply.status(400).send({
          error: "NO_SYSTEM",
          message: "System-Konfiguration nicht gefunden.",
        });
      }

      const stats = await tanssGetDashboardStats(
        { baseUrl: systemConfig.baseUrl, useBackend: systemConfig.useBackend },
        tanssToken
      );

      return reply.send(stats);
    }
  );
}
