import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { config } from "./config.js";

export interface JwtPayload {
  userId: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  tanssToken: string;
  systemConfigId: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function registerAuthPlugin(server: FastifyInstance) {
  await server.register(fastifyCookie);

  await server.register(fastifyJwt, {
    secret: config.jwt.secret,
    cookie: {
      cookieName: "plenium_session",
      signed: false,
    },
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: "UNAUTHORIZED", message: "Nicht angemeldet." });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    if (!request.user.isAdmin) {
      reply.status(403).send({ error: "FORBIDDEN", message: "Keine Administratorberechtigung." });
    }
  } catch {
    reply.status(401).send({ error: "UNAUTHORIZED", message: "Nicht angemeldet." });
  }
}
