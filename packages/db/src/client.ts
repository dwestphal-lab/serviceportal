import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma Client.
 * In Entwicklung wird die Instanz global gecacht, um Hot-Reload-Verbindungs-
 * lecks zu vermeiden. In Produktion wird direkt eine neue Instanz erstellt.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
