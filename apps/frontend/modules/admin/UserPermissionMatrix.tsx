"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Download, ShieldCheck, ShieldOff, Loader2, CheckCircle2, XCircle, Crown,
} from "lucide-react";
import { settings, type UserWithPermissions, type ModuleDefinition } from "@/lib/api";

export function UserPermissionMatrix() {
  const [users, setUsers]     = useState<UserWithPermissions[]>([]);
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [toast, setToast]     = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [togglingAdmin, setTogglingAdmin] = useState<Set<string>>(new Set());

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, m] = await Promise.all([settings.getPermissions(), settings.getModules()]);
      setUsers(u);
      setModules(m);
    } catch {
      showToast("error", "Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleImport() {
    setImporting(true);
    try {
      const result = await settings.importFromTanss();
      showToast(
        "success",
        `Import abgeschlossen: ${result.imported} importiert, ${result.skipped} übersprungen (${result.total} gesamt).`
      );
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import fehlgeschlagen";
      showToast("error", msg);
    } finally {
      setImporting(false);
    }
  }

  async function handleToggleAdmin(userId: string, currentIsAdmin: boolean) {
    if (togglingAdmin.has(userId)) return;
    setTogglingAdmin((prev) => new Set(prev).add(userId));
    const newIsAdmin = !currentIsAdmin;

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isAdmin: newIsAdmin } : u))
    );

    try {
      await settings.setAdmin(userId, newIsAdmin);
      if (newIsAdmin) await load();
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: currentIsAdmin } : u))
      );
      showToast("error", "Admin-Status konnte nicht gespeichert werden.");
    } finally {
      setTogglingAdmin((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
    }
  }

  async function handleToggle(userId: string, moduleId: string, currentAllowed: boolean) {
    const key = `${userId}:${moduleId}`;
    if (toggling.has(key)) return;

    setToggling((prev) => new Set(prev).add(key));
    const newAllowed = !currentAllowed;

    // Optimistisches Update
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const existing = u.modulePermissions.find((p) => p.moduleId === moduleId);
        if (existing) {
          return {
            ...u,
            modulePermissions: u.modulePermissions.map((p) =>
              p.moduleId === moduleId ? { ...p, allowed: newAllowed } : p
            ),
          };
        }
        return {
          ...u,
          modulePermissions: [...u.modulePermissions, { moduleId, allowed: newAllowed }],
        };
      })
    );

    try {
      await settings.setPermission({ userId, moduleId, allowed: newAllowed });
    } catch {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          return {
            ...u,
            modulePermissions: u.modulePermissions.map((p) =>
              p.moduleId === moduleId ? { ...p, allowed: currentAllowed } : p
            ),
          };
        })
      );
      showToast("error", "Berechtigung konnte nicht gespeichert werden.");
    } finally {
      setToggling((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
    }
  }

  function isAllowed(user: UserWithPermissions, moduleId: string): boolean {
    return user.modulePermissions.find((p) => p.moduleId === moduleId)?.allowed === true;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0a322d]">Berechtigungsmatrix</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            Modul-Zugriff pro Benutzer freigeben oder sperren.
            Neue Benutzer sind standardmäßig gesperrt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[#d4d0c7] rounded-lg bg-white text-[#0a322d] hover:border-[#1e7378] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0a322d] text-white rounded-lg hover:bg-[#1e7378] transition-colors disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Aus TANSS importieren
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Tabelle */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#737373]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Lade Benutzer…
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#737373] text-sm mb-3">Noch keine Benutzer vorhanden.</p>
          <p className="text-[#a3a3a3] text-xs">
            Klicke auf „Aus TANSS importieren" um alle Techniker aus TANSS zu laden.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e7e2d3] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e7e2d3] bg-[#f9f8f5]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#737373] uppercase tracking-wider w-64">
                  Benutzer
                </th>
                {modules.map((mod) => (
                  <th
                    key={mod.id}
                    className="text-center px-4 py-3 text-xs font-semibold text-[#737373] uppercase tracking-wider"
                  >
                    {mod.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede6]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#fafaf8] transition-colors">
                  {/* User-Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0a322d]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-[#0a322d]">
                          {(user.displayName ?? user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-[#0a322d] truncate">
                            {user.displayName ?? user.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleToggleAdmin(user.id, user.isAdmin)}
                            disabled={togglingAdmin.has(user.id)}
                            title={user.isAdmin ? "Admin-Rechte entziehen" : "Zum Administrator machen"}
                            className="shrink-0 disabled:opacity-50"
                          >
                            {togglingAdmin.has(user.id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : (
                              <Crown
                                className={`w-3.5 h-3.5 transition-colors ${
                                  user.isAdmin
                                    ? "text-amber-500 hover:text-amber-400"
                                    : "text-[#d4d0c7] hover:text-amber-400"
                                }`}
                              />
                            )}
                          </button>
                        </div>
                        <span className="text-xs text-[#a3a3a3]">{user.username}</span>
                      </div>
                    </div>
                  </td>

                  {/* Modul-Toggles */}
                  {modules.map((mod) => {
                    const allowed = isAllowed(user, mod.id);
                    const key     = `${user.id}:${mod.id}`;
                    const busy    = toggling.has(key);

                    return (
                      <td key={mod.id} className="text-center px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => void handleToggle(user.id, mod.id, allowed)}
                          disabled={busy}
                          title={allowed ? "Zugriff sperren" : "Zugriff erlauben"}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#1e7378]" />
                          ) : allowed ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-600 hover:text-emerald-700" />
                          ) : (
                            <ShieldOff className="w-5 h-5 text-[#d4d0c7] hover:text-red-400" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#f0ede6] bg-[#f9f8f5] flex items-center gap-4 text-xs text-[#a3a3a3]">
            <span>{users.length} Benutzer</span>
            <span>·</span>
            <span>{modules.length} Module</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> = Zugriff erlaubt
            </span>
            <span className="flex items-center gap-1">
              <ShieldOff className="w-3.5 h-3.5 text-[#d4d0c7]" /> = Zugriff gesperrt
            </span>
            <span className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> = Administrator
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
