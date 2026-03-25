import type { FastifyInstance } from "fastify";
import { prisma } from "@plenium/db";
import { requireAuth } from "../../core/auth-plugin.js";
import { tanssLogin, buildApiBase } from "./tanss.service.js";
import { MODULE_REGISTRY } from "../../core/modules.js";
import { importTanssEmployees } from "../settings/import.service.js";

interface LoginBody {
  systemConfigId: string;
  username: string;
  password: string;
  otp: string;
}

export async function authRoutes(server: FastifyInstance) {
  // ── POST /api/v1/auth/login ──────────────────────────────────────────────
  server.post<{ Body: LoginBody }>(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["systemConfigId", "username", "password", "otp"],
          properties: {
            systemConfigId: { type: "string", minLength: 1 },
            username:       { type: "string", minLength: 1 },
            password:       { type: "string", minLength: 1 },
            otp:            { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { systemConfigId, username, password, otp } = request.body;

      // System-Config laden
      const systemConfig = await prisma.systemConfig.findUnique({
        where: { id: systemConfigId, isActive: true },
      });
      if (!systemConfig) {
        return reply.status(400).send({
          error: "INVALID_SYSTEM",
          message: "Unbekanntes oder inaktives System.",
        });
      }

      // TANSS-Login
      const result = await tanssLogin(
        { baseUrl: systemConfig.baseUrl, useBackend: systemConfig.useBackend },
        username,
        password,
        otp
      );

      if (!result.success || !result.token) {
        return reply.status(401).send({
          error: "AUTH_FAILED",
          message: result.error ?? "Anmeldung fehlgeschlagen.",
        });
      }

      // User upserten (TANSS-ID als eindeutiger Schlüssel)
      const tanssId = result.userId ?? username;
      const isFirstAdminUser = ["westphal", "asmussen"].includes(username);

      const user = await prisma.user.upsert({
        where: { tanssId },
        update: {
          username,
          displayName: result.displayName ?? username,
          systemConfigId,
          isActive: true,
        },
        create: {
          tanssId,
          username,
          displayName: result.displayName ?? username,
          isAdmin: isFirstAdminUser,
          systemConfigId,
        },
      });

      // Admin bekommt alle Module; nicht-Admin: keine automatische Zuweisung (gesperrt by default)
      if (user.isAdmin) {
        for (const mod of MODULE_REGISTRY) {
          await prisma.modulePermission.upsert({
            where: { userId_moduleId: { userId: user.id, moduleId: mod.id } },
            update: { allowed: true },
            create: { userId: user.id, moduleId: mod.id, allowed: true },
          });
        }

        // Auto-Import aller TANSS-Techniker im Hintergrund
        const apiBase = buildApiBase(systemConfig);
        void importTanssEmployees(apiBase, result.token!, systemConfigId)
          .catch((err: unknown) => server.log.warn(err, "Auto-Import der TANSS-Techniker fehlgeschlagen"));
      }

      // JWT signieren
      const token = server.jwt.sign({
        userId: user.id,
        username: user.username,
        displayName: user.displayName ?? user.username,
        isAdmin: user.isAdmin,
        tanssToken: result.token,
        systemConfigId,
      });

      // httpOnly Cookie setzen
      reply.setCookie("plenium_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8h
      });

      return reply.send({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
        },
      });
    }
  );

  // ── POST /api/v1/auth/logout ─────────────────────────────────────────────
  server.post("/logout", async (_request, reply) => {
    reply.clearCookie("plenium_session", { path: "/" });
    return reply.send({ success: true });
  });

  // ── GET /api/v1/auth/me ──────────────────────────────────────────────────
  server.get(
    "/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          isAdmin: true,
          systemConfigId: true,
          modulePermissions: {
            where: { allowed: true },
            select: { moduleId: true },
          },
        },
      });

      if (!user) {
        reply.clearCookie("plenium_session", { path: "/" });
        return reply.status(401).send({ error: "UNAUTHORIZED", message: "Benutzer nicht gefunden." });
      }

      // Admins erhalten immer alle registrierten Module (inkl. zukünftige)
      const modules = user.isAdmin
        ? MODULE_REGISTRY.map((m) => m.id)
        : user.modulePermissions.map((p) => p.moduleId);

      return reply.send({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        systemConfigId: user.systemConfigId,
        modules,
      });
    }
  );
}
