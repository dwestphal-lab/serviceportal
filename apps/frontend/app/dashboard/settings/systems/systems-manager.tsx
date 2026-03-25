"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Server,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { settings, type SystemConfig } from "@/lib/api";

interface FormState {
  name: string;
  baseUrl: string;
  useBackend: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  baseUrl: "",
  useBackend: true,
  isDefault: false,
};

export function SystemsManager() {
  const [systems, setSystems] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await settings.getSystems();
      setSystems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(system: SystemConfig) {
    setEditingId(system.id);
    setShowCreate(false);
    setForm({
      name: system.name,
      baseUrl: system.baseUrl,
      useBackend: system.useBackend,
      isDefault: system.isDefault,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowCreate(false);
    setForm(EMPTY_FORM);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await settings.updateSystem(editingId, form);
      } else {
        await settings.createSystem(form);
      }
      cancelEdit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`System "${name}" wirklich deaktivieren?`)) return;
    try {
      await settings.deleteSystem(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    }
  }

  const previewUrl = form.baseUrl
    ? `${form.baseUrl.replace(/\/$/, "")}${form.useBackend ? "/backend" : ""}/api/v1/...`
    : "";

  const isFormValid = form.name.trim() && form.baseUrl.trim();

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* System-Liste */}
      <div className="bg-white rounded-xl border border-[#e7e2d3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e7e2d3]">
          <h3 className="font-semibold text-[#0a322d]">Konfigurierte Systeme</h3>
          <button
            type="button"
            onClick={() => { setShowCreate(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0a322d] text-white text-sm font-medium rounded-lg hover:bg-[#1e7378] transition-colors"
          >
            <Plus className="w-4 h-4" />
            System hinzufügen
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1e7378] mx-auto" />
          </div>
        ) : systems.length === 0 && !showCreate ? (
          <div className="px-5 py-10 text-center">
            <Server className="w-10 h-10 text-[#d4d0c7] mx-auto mb-3" />
            <p className="text-sm text-[#737373]">Noch keine Systeme konfiguriert.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e7e2d3]">
            {systems.map((system) => (
              <div key={system.id}>
                {editingId === system.id ? (
                  <SystemForm
                    form={form}
                    setForm={setForm}
                    previewUrl={previewUrl}
                    onSave={save}
                    onCancel={cancelEdit}
                    saving={saving}
                    isValid={!!isFormValid}
                  />
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#0a322d] text-sm">{system.name}</p>
                        {system.isDefault && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#befcfb] text-[#0a322d]">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#737373] mt-0.5 truncate">
                        {system.baseUrl}{system.useBackend ? "/backend" : ""}/api/v1/...
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(system)}
                        className="p-1.5 text-[#737373] hover:text-[#1e7378] hover:bg-[#ebebf0] rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(system.id, system.name)}
                        className="p-1.5 text-[#737373] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Neues System Formular */}
            {showCreate && (
              <SystemForm
                form={form}
                setForm={setForm}
                previewUrl={previewUrl}
                onSave={save}
                onCancel={cancelEdit}
                saving={saving}
                isValid={!!isFormValid}
                isNew
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── System-Formular ───────────────────────────────────────────────────────────

function SystemForm({
  form,
  setForm,
  previewUrl,
  onSave,
  onCancel,
  saving,
  isValid,
  isNew = false,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  previewUrl: string;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isValid: boolean;
  isNew?: boolean;
}) {
  return (
    <div className="px-5 py-4 bg-[#f9f8f5] space-y-4">
      <p className="text-sm font-semibold text-[#0a322d]">
        {isNew ? "Neues System" : "System bearbeiten"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[#0a322d] mb-1">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="TANSS Produktion"
            className="w-full px-3 py-2 text-sm border border-[#d4d0c7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e7378] bg-white"
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-xs font-medium text-[#0a322d] mb-1">
            Base URL
          </label>
          <input
            type="url"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://tanss.firma.de"
            className="w-full px-3 py-2 text-sm border border-[#d4d0c7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e7378] bg-white"
          />
        </div>
      </div>

      {/* API-Pfad Toggle */}
      <div>
        <label className="block text-xs font-medium text-[#0a322d] mb-2">
          API-Pfad
        </label>
        <button
          type="button"
          onClick={() => setForm({ ...form, useBackend: !form.useBackend })}
          className="flex items-center gap-3 px-3 py-2.5 bg-white border border-[#d4d0c7] rounded-lg hover:border-[#1e7378] transition-colors w-full"
        >
          {form.useBackend ? (
            <ToggleRight className="w-5 h-5 text-[#1e7378] shrink-0" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-[#a3a3a3] shrink-0" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-[#0a322d]">
              {form.useBackend ? "API im /backend-Verzeichnis" : "API direkt unter Base URL"}
            </p>
            <p className="text-xs text-[#737373]">
              {form.useBackend
                ? "URL wird um /backend erweitert"
                : "Kein /backend-Suffix"}
            </p>
          </div>
        </button>
      </div>

      {/* URL-Vorschau */}
      {previewUrl && (
        <div className="px-3 py-2 bg-[#0a322d]/5 rounded-lg">
          <p className="text-xs text-[#737373] mb-0.5">API-URL Vorschau</p>
          <p className="text-xs font-mono text-[#0a322d] break-all">{previewUrl}</p>
        </div>
      )}

      {/* Standard */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="w-4 h-4 accent-[#1e7378] rounded"
        />
        <span className="text-sm text-[#0a322d]">
          Als Standard-System für die Anmeldung verwenden
        </span>
      </label>

      {/* Aktionen */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isValid}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a322d] text-white text-sm font-medium rounded-lg hover:bg-[#1e7378] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Speichern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-[#737373] text-sm font-medium rounded-lg hover:bg-[#ebebf0] transition-colors"
        >
          <X className="w-4 h-4" />
          Abbrechen
        </button>
      </div>
    </div>
  );
}
