"use client";

import { useState } from "react";
import { Send, Loader2, ChevronDown, Clock, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import { tanssTester, type TanssTestResponse } from "@/lib/api";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type Method = (typeof METHODS)[number];

const QUICK_PATHS = [
  { label: "Eigene Tickets", path: "/tickets/own", method: "GET" as Method },
  { label: "Alle Mitarbeiter", path: "/employees", method: "GET" as Method },
  { label: "Rückrufe", path: "/callbacks", method: "GET" as Method },
  { label: "Tags", path: "/tags", method: "GET" as Method },
  { label: "Ticket-Typen", path: "/ticketTypes", method: "GET" as Method },
  { label: "Companies (Suche)", path: "/search", method: "POST" as Method },
];

function statusColor(status: number) {
  if (status < 300) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (status < 400) return "text-blue-600 bg-blue-50 border-blue-200";
  if (status < 500) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function TanssApiTester() {
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/employees");
  const [bodyText, setBodyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TanssTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"body" | "headers">("body");

  async function send() {
    setLoading(true);
    setError(null);
    setResult(null);

    let parsedBody: unknown = undefined;
    if (bodyText.trim() && method !== "GET" && method !== "DELETE") {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        setError("JSON-Body ungültig. Bitte überprüfen Sie das Format.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await tanssTester.request({ method, path, body: parsedBody });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function copyResponse() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function applyQuickPath(p: { label: string; path: string; method: Method }) {
    setPath(p.path);
    setMethod(p.method);
    if (p.method === "POST" && p.path === "/search") {
      setBodyText(JSON.stringify({ name: "", itemsPerPage: 20, page: 0 }, null, 2));
    } else {
      setBodyText("");
    }
    setResult(null);
    setError(null);
  }

  const bodyFormatted =
    result?.body != null
      ? typeof result.body === "string"
        ? result.body
        : JSON.stringify(result.body, null, 2)
      : "";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Quick Paths */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PATHS.map((p) => (
          <button
            key={p.path}
            type="button"
            onClick={() => applyQuickPath(p)}
            className="text-xs px-2.5 py-1 rounded-full border border-[#d4d0c7] bg-white text-[#0a322d] hover:border-[#1e7378] hover:text-[#1e7378] transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Request Builder */}
      <div className="bg-white rounded-xl border border-[#e7e2d3] overflow-hidden">
        <div className="flex items-center gap-0">
          {/* Method Selector */}
          <div className="relative border-r border-[#e7e2d3]">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
              className="appearance-none h-12 pl-4 pr-8 text-sm font-semibold bg-[#f9f8f5] text-[#0a322d] focus:outline-none cursor-pointer border-0"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#737373]" />
          </div>

          {/* Path Input */}
          <div className="flex items-center gap-1 flex-1 px-3">
            <span className="text-xs text-[#a3a3a3] font-mono shrink-0">/api/v1</span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && send()}
              placeholder="/tickets/own"
              className="flex-1 h-12 text-sm font-mono text-[#0a322d] focus:outline-none bg-transparent placeholder:text-[#c4c0b8]"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={send}
            disabled={loading || !path.trim()}
            className="flex items-center gap-2 px-5 h-12 bg-[#0a322d] text-white text-sm font-semibold hover:bg-[#1e7378] disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Senden
          </button>
        </div>

        {/* Body Editor */}
        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <div className="border-t border-[#e7e2d3]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#f9f8f5] border-b border-[#e7e2d3]">
              <span className="text-xs font-medium text-[#737373]">Request Body (JSON)</span>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              rows={8}
              className="w-full px-4 py-3 text-sm font-mono text-[#0a322d] focus:outline-none resize-y bg-white"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Response */}
      {result && (
        <div className="bg-white rounded-xl border border-[#e7e2d3] overflow-hidden">
          {/* Response Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e7e2d3] bg-[#f9f8f5]">
            <div className="flex items-center gap-3">
              {result.status < 400 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${statusColor(result.status)}`}>
                {result.status} {result.statusText}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#737373]">
                <Clock className="w-3 h-3" />
                {result.durationMs} ms
              </span>
              <span className="text-xs text-[#a3a3a3] font-mono truncate max-w-[300px]">{result.url}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Tabs */}
              {(["body", "headers"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    activeTab === tab
                      ? "bg-[#0a322d] text-white"
                      : "text-[#737373] hover:text-[#0a322d]"
                  }`}
                >
                  {tab === "body" ? "Body" : "Headers"}
                </button>
              ))}
              <button
                type="button"
                onClick={copyResponse}
                className="p-1.5 text-[#737373] hover:text-[#0a322d] ml-1"
                title="Kopieren"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Response Body */}
          {activeTab === "body" && (
            <pre className="p-4 text-xs font-mono text-[#0a322d] overflow-auto max-h-[500px] bg-white whitespace-pre-wrap break-words">
              {bodyFormatted || <span className="text-[#a3a3a3]">(kein Body)</span>}
            </pre>
          )}

          {/* Response Headers */}
          {activeTab === "headers" && (
            <div className="p-4 space-y-1.5 max-h-[300px] overflow-auto">
              {Object.entries(result.headers).map(([k, v]) => (
                <div key={k} className="flex gap-3 text-xs">
                  <span className="font-mono text-[#1e7378] shrink-0 w-48 truncate">{k}</span>
                  <span className="font-mono text-[#0a322d] break-all">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
