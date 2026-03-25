import type { FastifyInstance } from "fastify";
import { prisma } from "@plenium/db";
import { requireAdmin } from "../../core/auth-plugin.js";
import { MODULE_REGISTRY } from "../../core/modules.js";
import { importTanssEmployees } from "./import.service.js";
import { buildApiBase } from "../auth/tanss.service.js";

interface SystemConfigBody {
  name: string;
  baseUrl: string;
  useBackend: boolean;
  isDefault?: boolean;
}

interface ModulePermissionBody {
  userId: string;
  moduleId: string;
  allowed: boolean;
}

export async function settingsRoutes(server: FastifyInstance) {
  // ── GET /api/v1/settings/systems/public — aktive Systeme (Login-Seite) ────
  server.get("/systems/public", async (_request, reply) => {
    const systems = await prisma.systemConfig.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, isDefault: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return reply.send(systems);
  });

  // ── GET /api/v1/settings/systems/setup — alle Systeme für Setup (kein Auth) ─
  server.get("/systems/setup", async (_request, reply) => {
    const systems = await prisma.systemConfig.findMany({
      where: { isActive: true },
      select: { id: true, name: true, baseUrl: true, useBackend: true, isDefault: true, type: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return reply.send(systems);
  });

  // ── POST /api/v1/settings/systems/setup — neues System anlegen (kein Auth) ─
  server.post<{ Body: SystemConfigBody }>(
    "/systems/setup",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "baseUrl", "useBackend"],
          properties: {
            name:       { type: "string", minLength: 1, maxLength: 100 },
            baseUrl:    { type: "string", minLength: 1 },
            useBackend: { type: "boolean" },
            isDefault:  { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, baseUrl, useBackend, isDefault } = request.body;
      if (isDefault) {
        await prisma.systemConfig.updateMany({ data: { isDefault: false } });
      }
      const system = await prisma.systemConfig.create({
        data: { name, baseUrl: baseUrl.replace(/\/$/, ""), useBackend, isDefault: isDefault ?? false },
      });
      return reply.status(201).send(system);
    }
  );

  // ── PUT /api/v1/settings/systems/setup/:id — System bearbeiten (kein Auth) ─
  server.put<{ Params: { id: string }; Body: SystemConfigBody }>(
    "/systems/setup/:id",
    {
      schema: {
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        body: {
          type: "object",
          required: ["name", "baseUrl", "useBackend"],
          properties: {
            name:       { type: "string", minLength: 1, maxLength: 100 },
            baseUrl:    { type: "string", minLength: 1 },
            useBackend: { type: "boolean" },
            isDefault:  { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, baseUrl, useBackend, isDefault } = request.body;
      if (isDefault) {
        await prisma.systemConfig.updateMany({ data: { isDefault: false } });
      }
      const system = await prisma.systemConfig.update({
        where: { id },
        data: { name, baseUrl: baseUrl.replace(/\/$/, ""), useBackend, isDefault: isDefault ?? false },
      });
      return reply.send(system);
    }
  );

  // ── GET /api/v1/settings/systems — alle Systeme (Admin) ──────────────────
  server.get(
    "/systems",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const systems = await prisma.systemConfig.findMany({
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      });
      return reply.send(systems);
    }
  );

  // ── POST /api/v1/settings/systems ─────────────────────────────────────────
  server.post<{ Body: SystemConfigBody }>(
    "/systems",
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: "object",
          required: ["name", "baseUrl", "useBackend"],
          properties: {
            name:       { type: "string", minLength: 1, maxLength: 100 },
            baseUrl:    { type: "string", minLength: 1, format: "uri" },
            useBackend: { type: "boolean" },
            isDefault:  { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, baseUrl, useBackend, isDefault } = request.body;

      // Wenn isDefault gesetzt, alle anderen auf false setzen
      if (isDefault) {
        await prisma.systemConfig.updateMany({ data: { isDefault: false } });
      }

      const system = await prisma.systemConfig.create({
        data: { name, baseUrl: baseUrl.replace(/\/$/, ""), useBackend, isDefault: isDefault ?? false },
      });
      return reply.status(201).send(system);
    }
  );

  // ── PUT /api/v1/settings/systems/:id ──────────────────────────────────────
  server.put<{ Params: { id: string }; Body: SystemConfigBody }>(
    "/systems/:id",
    {
      preHandler: requireAdmin,
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
        body: {
          type: "object",
          required: ["name", "baseUrl", "useBackend"],
          properties: {
            name:       { type: "string", minLength: 1, maxLength: 100 },
            baseUrl:    { type: "string", minLength: 1 },
            useBackend: { type: "boolean" },
            isDefault:  { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, baseUrl, useBackend, isDefault } = request.body;

      if (isDefault) {
        await prisma.systemConfig.updateMany({ data: { isDefault: false } });
      }

      const system = await prisma.systemConfig.update({
        where: { id },
        data: { name, baseUrl: baseUrl.replace(/\/$/, ""), useBackend, isDefault: isDefault ?? false },
      });
      return reply.send(system);
    }
  );

  // ── DELETE /api/v1/settings/systems/:id ───────────────────────────────────
  server.delete<{ Params: { id: string } }>(
    "/systems/:id",
    {
      preHandler: requireAdmin,
      schema: {
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      },
    },
    async (request, reply) => {
      await prisma.systemConfig.update({
        where: { id: request.params.id },
        data: { isActive: false },
      });
      return reply.status(204).send();
    }
  );

  // ── GET /api/v1/settings/permissions — Berechtigungsmatrix ───────────────
  server.get(
    "/permissions",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          username: true,
          displayName: true,
          isAdmin: true,
          modulePermissions: { select: { moduleId: true, allowed: true } },
        },
        orderBy: { username: "asc" },
      });
      return reply.send(users);
    }
  );

  // ── POST /api/v1/settings/permissions ────────────────────────────────────
  server.post<{ Body: ModulePermissionBody }>(
    "/permissions",
    {
      preHandler: requireAdmin,
      schema: {
        body: {
          type: "object",
          required: ["userId", "moduleId", "allowed"],
          properties: {
            userId:   { type: "string" },
            moduleId: { type: "string" },
            allowed:  { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId, moduleId, allowed } = request.body;
      const perm = await prisma.modulePermission.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        update: { allowed },
        create: { userId, moduleId, allowed },
      });
      return reply.send(perm);
    }
  );

  // ── GET /api/v1/settings/users — User-Liste (Admin) ───────────────────────
  server.get(
    "/users",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          isAdmin: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { username: "asc" },
      });
      return reply.send(users);
    }
  );

  // ── PUT /api/v1/settings/users/:id/admin ─────────────────────────────────
  server.put<{ Params: { id: string }; Body: { isAdmin: boolean } }>(
    "/users/:id/admin",
    {
      preHandler: requireAdmin,
      schema: {
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        body: { type: "object", required: ["isAdmin"], properties: { isAdmin: { type: "boolean" } } },
      },
    },
    async (request, reply) => {
      const user = await prisma.user.update({
        where: { id: request.params.id },
        data: { isAdmin: request.body.isAdmin },
        select: { id: true, username: true, isAdmin: true },
      });
      return reply.send(user);
    }
  );

  // ── GET /api/v1/settings/modules — Modul-Registry ─────────────────────────
  server.get(
    "/modules",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      return reply.send(MODULE_REGISTRY);
    }
  );

  // ── POST /api/v1/settings/users/import-from-tanss ─────────────────────────
  server.post(
    "/users/import-from-tanss",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { tanssToken, systemConfigId } = request.user;

      const systemConfig = await prisma.systemConfig.findUnique({
        where: { id: systemConfigId },
        select: { baseUrl: true, useBackend: true },
      });
      if (!systemConfig) {
        return reply.status(400).send({ error: "SYSTEM_NOT_FOUND", message: "System-Config nicht gefunden." });
      }

      try {
        const result = await importTanssEmployees(buildApiBase(systemConfig), tanssToken, systemConfigId);
        return reply.send(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import fehlgeschlagen";
        return reply.status(502).send({ error: "IMPORT_FAILED", message });
      }
    }
  );
}
