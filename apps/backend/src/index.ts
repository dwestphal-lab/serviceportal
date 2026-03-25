import { createServer } from "./core/server.js";
import { config } from "./core/config.js";
import { ROUTE_REGISTRY } from "./core/route-registry.js";

async function main() {
  const server = await createServer();

  // ── Modul-Routen ──────────────────────────────────────────────────────────
  for (const { plugin, prefix } of ROUTE_REGISTRY) {
    await server.register(plugin, { prefix });
  }

  try {
    await server.listen({ port: config.port, host: config.host });
    console.log(
      `\n🚀 PLENIUM Backend läuft auf http://${config.host}:${config.port}\n`
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  console.log("SIGTERM empfangen — Server wird beendet...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT empfangen — Server wird beendet...");
  process.exit(0);
});

main();
