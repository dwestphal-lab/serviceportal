/**
 * Zentrale Konfiguration — liest Umgebungsvariablen und stellt typsichere Werte bereit.
 * Alle Werte haben sinnvolle Entwicklungs-Defaults.
 */

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  host: process.env.HOST ?? "0.0.0.0",
  nodeEnv: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",

  database: {
    url: requireEnv(
      "DATABASE_URL",
      "postgresql://postgres:postgres@localhost:5432/plenium"
    ),
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? "plenium-dev-secret-change-in-production",
    expiresIn: "8h" as const,
  },
} as const;

export const isDev = config.nodeEnv === "development";
export const isProd = config.nodeEnv === "production";
