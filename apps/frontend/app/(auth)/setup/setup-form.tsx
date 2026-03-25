"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Check, X, ToggleLeft, ToggleRight,
  Loader2, ArrowLeft, Server, Trash2, AlertCircle,
} from "lucide-react";
import { setup, type SystemConfigSetup } from "@/lib/api";

interface FormState {
  name: string;
  baseUrl: string;
  useBackend: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = { name: "", baseUrl: "", useBackend: true, isDefault: false };

export function SetupForm({ systems: initial }: { systems: SystemConfigSetup[] }) {
  const router = useRouter();
  const [systems, setSystems] = useState(initial);
  const [editingId, setEditingId] = useState<string | "new" | null>(
    initial.length === 0 ? "new" : null
  );
  const [form, setForm] = useState<FormState>(
    initial.length === 0
      ? { ...EMPTY_FORM, isDefault: true }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await setup.getSystems();
    setSystems(data);
  }

  function startEdit(s: SystemConfigSetup) {
    setEditingId(s.id);
    setForm({ name: s.name, baseUrl: s.baseUrl, useBackend: s.useBackend, isDefault: s.isDefault });
  }

  function startNew() {
    setEditingId("new");
    setForm({ ...EMPTY_FORM, isDefault: systems.length === 0 });
  }

  function cancel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function save() {
    if (!form.name.trim() || !form.baseUrl.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") {
        await setup.createSystem(form);
      } else if (editingId) {
        await setup.updateSystem(editingId, form);
      }
      await reload();
      cancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = form.baseUrl
    ? `${form.baseUrl.replace(/\/$/, "")}${form.useBackend ? "/backend" : ""}/api/v1/...`
    : "";

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* System-Liste */}
      {systems.length > 0 && (
        <div className="space-y-2">
          {systems.map((s) => (
            <div key={s.id}>
              {editingId === s.id ? (
                <SystemForm
                  form={form} setForm={setForm} previewUrl={previewUrl}
                  onSave={save} onCancel={cancel} saving={saving}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-[#f9f8f5] border border-[#e7e2d3] rounded-xl">
                  <div className="p-2 bg-[#e7e2d3] rounded-lg shrink-0">
                    <Server className="w-4 h-4 text-[#1e7378]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[#0a322d]">{s.name}</p>
                      {s.isDefault && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#befcfb] text-[#0a322d] font-medium">
                          Standard
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#737373] truncate mt-0.5">
                      {s.baseUrl}{s.useBackend ? "/backend" : ""}/api/v1/…
                    </p>
                  </div>
                  <button
                    type="button" onClick={() => startEdit(s)}
                    className="p-1.5 text-[#737373] hover:text-[#1e7378] hover:bg-white rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Neues System Formular */}
      {editingId === "new" && (
        <SystemForm
          form={form} setForm={setForm} previewUrl={previewUrl}
          onSave={save} onCancel={systems.length > 0 ? cancel : undefined}
          saving={saving} isNew
        />
      )}

      {/* Aktionen */}
      <div className="flex items-center justify-between pt-1">
        {editingId !== "new" && (
          <button
            type="button" onClick={startNew}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#1e7378] font-medium hover:bg-[#befcfb]/30 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            System hinzufügen
          </button>
        )}
        {editingId === null && systems.length > 0 && (
          <button
            type="button" onClick={() => router.push("/login")}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a322d] text-white text-sm font-semibold rounded-lg hover:bg-[#1e7378] transition-colors ml-auto"
          >
            Zur Anmeldung
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {systems.length === 0 && editingId === null && (
        <div className="text-center py-4">
          <p className="text-sm text-[#737373]">Noch kein System konfiguriert.</p>
        </div>
      )}

      {/* Zurück-Link */}
      {systems.length > 0 && (
        <button
          type="button" onClick={() => router.push("/login")}
          className="flex items-center gap-1.5 text-xs text-[#a3a3a3] hover:text-[#1e7378] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zur Anmeldung
        </button>
      )}
    </div>
  );
}

// ── Inline-Formular ───────────────────────────────────────────────────────────

function SystemForm({
  form, setForm, previewUrl, onSave, onCancel, saving, isNew = false,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  previewUrl: string;
  onSave: () => void;
  onCancel?: () => void;
  saving: boolean;
  isNew?: boolean;
}) {
  const isValid = form.name.trim() && form.baseUrl.trim();

  return (
    <div className="space-y-3 p-4 bg-[#f9f8f5] border border-[#d4d0c7] rounded-xl">
      <p className="text-sm font-semibold text-[#0a322d]">
        {isNew ? "Neues System anlegen" : "System bearbeiten"}
      </p>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-[#0a322d] mb-1">Name</label>
        <input
          type="text" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="z.B. TANSS Produktion"
          autoFocus
          className="w-full px-3 py-2 text-sm border border-[#d4d0c7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e7378] bg-white"
        />
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-xs font-medium text-[#0a322d] mb-1">Server-URL</label>
        <input
          type="url" value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          placeholder="https://tanss.ihrefirma.de"
          className="w-full px-3 py-2 text-sm border border-[#d4d0c7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e7378] bg-white"
        />
      </div>

      {/* Backend-Toggle */}
      <button
        type="button"
        onClick={() => setForm({ ...form, useBackend: !form.useBackend })}
        className="flex items-center gap-3 w-full px-3 py-2.5 bg-white border border-[#d4d0c7] rounded-lg hover:border-[#1e7378] transition-colors text-left"
      >
        {form.useBackend
          ? <ToggleRight className="w-5 h-5 text-[#1e7378] shrink-0" />
          : <ToggleLeft className="w-5 h-5 text-[#a3a3a3] shrink-0" />}
        <div>
          <p className="text-sm font-medium text-[#0a322d]">
            {form.useBackend ? "API unter /backend" : "API direkt unter Server-URL"}
          </p>
          <p className="text-xs text-[#737373]">
            {form.useBackend ? "URL wird um /backend erweitert" : "Kein /backend-Suffix"}
          </p>
        </div>
      </button>

      {/* Vorschau */}
      {previewUrl && (
        <div className="px-3 py-2 bg-[#0a322d]/5 rounded-lg">
          <p className="text-xs text-[#737373] mb-0.5">API-Adresse</p>
          <p className="text-xs font-mono text-[#0a322d] break-all">{previewUrl}</p>
        </div>
      )}

      {/* Standard */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox" checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="w-4 h-4 accent-[#1e7378] rounded"
        />
        <span className="text-sm text-[#0a322d]">Als Standard-System vorauswählen</span>
      </label>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button" onClick={onSave} disabled={saving || !isValid}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a322d] text-white text-sm font-medium rounded-lg hover:bg-[#1e7378] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Speichern
        </button>
        {onCancel && (
          <button
            type="button" onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#737373] rounded-lg hover:bg-[#ebebf0] transition-colors"
          >
            <X className="w-4 h-4" />
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}
