"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionWatcherProps {
  /** Unix-Timestamp in Sekunden (aus JWT exp-Claim) */
  expiresAt: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
/** Warnung X Millisekunden vor Ablauf anzeigen */
const WARN_BEFORE_MS = 5 * 60 * 1000; // 5 Minuten
/** Automatischer Logout X Millisekunden vor Ablauf */
const LOGOUT_BEFORE_MS = 30 * 1000; // 30 Sekunden

export default function SessionWatcher({ expiresAt }: SessionWatcherProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const expiresAtMs = expiresAt * 1000;
    const now = Date.now();
    const msUntilExpiry = expiresAtMs - now;

    // Bereits abgelaufen
    if (msUntilExpiry <= 0) {
      void performLogout();
      return;
    }

    // Warnung einplanen
    const msUntilWarn = msUntilExpiry - WARN_BEFORE_MS;
    if (msUntilWarn > 0) {
      warnTimer.current = setTimeout(() => {
        setShowWarning(true);
        startCountdown(expiresAtMs);
      }, msUntilWarn);
    } else {
      // Bereits im Warnfenster
      setShowWarning(true);
      startCountdown(expiresAtMs);
    }

    // Logout einplanen
    const msUntilLogout = msUntilExpiry - LOGOUT_BEFORE_MS;
    logoutTimer.current = setTimeout(
      () => void performLogout(),
      Math.max(msUntilLogout, 0)
    );

    return () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [expiresAt]);

  function startCountdown(expiresAtMs: number) {
    const update = () => {
      const secs = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setRemainingSeconds(secs);
    };
    update();
    countdownInterval.current = setInterval(update, 1000);
  }

  async function performLogout() {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    router.push("/login?reason=session_expired");
    router.refresh();
  }

  if (!showWarning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr =
    minutes > 0
      ? `${minutes}:${String(seconds).padStart(2, "0")} Min.`
      : `${seconds} Sek.`;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-[#0a322d] text-white rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 border border-[#5afff5]/20">
      <div className="mt-0.5 w-2 h-2 rounded-full bg-[#5afff5] shrink-0 animate-pulse" />
      <div>
        <p className="text-sm font-semibold text-[#5afff5]">Sitzung läuft ab</p>
        <p className="text-xs text-white/70 mt-0.5">
          Automatische Abmeldung in{" "}
          <span className="font-mono text-white">{timeStr}</span>
        </p>
      </div>
    </div>
  );
}
