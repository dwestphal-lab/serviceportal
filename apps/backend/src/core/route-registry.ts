import type { FastifyInstance } from "fastify";
import { authRoutes }           from "../modules/auth/routes.js";
import { settingsRoutes }       from "../modules/settings/routes.js";
import { tanssDashboardRoutes } from "../modules/tanss-dashboard/routes.js";
import { tanssTesterRoutes }    from "../modules/tanss-tester/routes.js";
import { auswertungenRoutes }   from "../modules/auswertungen/routes.js";

interface RouteEntry {
  plugin: (server: FastifyInstance) => Promise<void>;
  prefix: string;
}

export const ROUTE_REGISTRY: RouteEntry[] = [
  { plugin: authRoutes,           prefix: "/api/v1/auth" },
  { plugin: settingsRoutes,       prefix: "/api/v1/settings" },
  { plugin: tanssDashboardRoutes, prefix: "/api/v1/tanss-dashboard" },
  { plugin: tanssTesterRoutes,    prefix: "/api/v1/tanss-tester" },
  { plugin: auswertungenRoutes,   prefix: "/api/v1/auswertungen" },
];
