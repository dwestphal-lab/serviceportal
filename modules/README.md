# Module — PLENIUM Service Portal

Dieses Verzeichnis enthält die Dokumentation und Changelogs für alle installierten Module.

---

## Modul-Architektur

Jedes Modul ist in **drei** Bereiche aufgeteilt, die separat entfernt werden können:

```
Frontend:  apps/frontend/modules/[name]/
Backend:   apps/backend/src/modules/[name]/
DB:        packages/db/prisma/schema.prisma  (neue Models eintragen)
Docs:      modules/[name]/CHANGELOG.md        ← dieser Ordner
```

---

## Neues Modul erstellen

### 1. Frontend-Modul
```
apps/frontend/modules/[name]/
├── components/        # Modul-spezifische UI-Komponenten
├── hooks/             # React Hooks
├── lib/               # Hilfsfunktionen
└── index.ts           # Öffentliche API des Frontend-Moduls
```

Die Modul-Seiten werden als reguläre Next.js Route angelegt:
```
apps/frontend/app/dashboard/[name]/
└── page.tsx           # Modul-Hauptseite
```

Sidebar-Eintrag in `apps/frontend/components/layout/Sidebar.tsx` ergänzen.

### 2. Backend-Modul
```
apps/backend/src/modules/[name]/
├── routes.ts          # Fastify Route-Handler
├── service.ts         # Business Logic
├── schema.ts          # Zod Validierungs-Schemas
└── index.ts           # Registriert Routes + Services
```

Routes in `apps/backend/src/index.ts` registrieren:
```ts
import { nameRoutes } from "./modules/name/index.js";
await server.register(nameRoutes, { prefix: "/api/v1/name" });
```

### 3. Datenbank
Neue Prisma Models in `packages/db/prisma/schema.prisma` eintragen,
dann Migration generieren:
```bash
pnpm db:migrate
# → Gibt einen Migration-Namen ein, z.B. "add_[name]_module"
```

### 4. Dokumentation
```
modules/[name]/
└── CHANGELOG.md
```

---

## Modul entfernen

1. Frontend-Ordner löschen: `apps/frontend/modules/[name]/`
2. Frontend-Seite löschen: `apps/frontend/app/dashboard/[name]/`
3. Sidebar-Eintrag entfernen
4. Backend-Ordner löschen: `apps/backend/src/modules/[name]/`
5. Backend-Route-Registrierung entfernen
6. Prisma-Models auskommentieren/entfernen + neue Migration erstellen
7. `modules/[name]/` Ordner löschen

> **Achtung:** Datenbank-Migrations niemals ohne explizite Freigabe rückgängig machen!
> Produktionsdaten gehen dabei verloren.

---

## Installierte Module

| Modul | Version | Status | Beschreibung |
|---|---|---|---|
| *(leer)* | — | — | Noch keine Module installiert |
