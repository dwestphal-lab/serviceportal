"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle, ChevronDown } from "lucide-react";
import { auth, type SystemPublic } from "@/lib/api";

interface LoginFormProps {
  systems: SystemPublic[];
}

export function LoginForm({ systems }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const defaultSystem = systems.find((s) => s.isDefault) ?? systems[0];

  const [systemId, setSystemId] = useState(defaultSystem?.id ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!systemId) {
      setError("Bitte wählen Sie ein System aus.");
      return;
    }

    setLoading(true);
    try {
      await auth.login({ systemConfigId: systemId, username, password, otp });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* System-Auswahl */}
      <div>
        <label className="block text-sm font-medium text-[#0a322d] mb-1.5">
          System
        </label>
        {systems.length === 0 ? (
          <div className="w-full px-3 py-2.5 rounded-lg border border-[#e7e2d3] bg-[#ebebf0] text-sm text-[#a3a3a3]">
            Keine Systeme konfiguriert
          </div>
        ) : (
          <div className="relative">
            <select
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              required
              className="w-full appearance-none px-3 py-2.5 rounded-lg border border-[#d4d0c7] bg-white text-sm text-[#0a322d] focus:outline-none focus:ring-2 focus:ring-[#1e7378] focus:border-transparent transition-colors"
            >
              <option value="" disabled>
                System auswählen…
              </option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? " (Standard)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          </div>
        )}
      </div>

      {/* Benutzername */}
      <div>
        <label className="block text-sm font-medium text-[#0a322d] mb-1.5">
          Benutzername
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          autoFocus
          placeholder="Ihr TANSS-Benutzername"
          className="w-full px-3 py-2.5 rounded-lg border border-[#d4d0c7] bg-white text-sm text-[#0a322d] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#1e7378] focus:border-transparent transition-colors"
        />
      </div>

      {/* Passwort */}
      <div>
        <label className="block text-sm font-medium text-[#0a322d] mb-1.5">
          Passwort
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[#d4d0c7] bg-white text-sm text-[#0a322d] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#1e7378] focus:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1e7378] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* OTP */}
      <div>
        <label className="block text-sm font-medium text-[#0a322d] mb-1.5">
          OTP
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={8}
          placeholder="123456"
          className="w-full px-3 py-2.5 rounded-lg border border-[#d4d0c7] bg-white text-sm text-[#0a322d] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#1e7378] focus:border-transparent transition-colors tracking-widest font-mono"
        />
        <p className="text-xs text-[#a3a3a3] mt-1">
          Einmalpasswort aus Ihrer Authenticator-App
        </p>
      </div>

      {/* Fehler */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || systems.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a322d] text-white text-sm font-semibold rounded-lg hover:bg-[#1e7378] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Anmeldung läuft…
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Anmelden
          </>
        )}
      </button>
    </form>
  );
}
