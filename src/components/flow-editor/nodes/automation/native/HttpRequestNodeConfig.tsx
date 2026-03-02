"use client";
import { useCallback, useState } from "react";
import type {
  HttpRequestNodeData,
  HttpMethod,
  AuthType,
  HeaderEntry,
} from "./HttpRequestNode";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: HttpRequestNodeData;
  onChange: (d: HttpRequestNodeData) => void;
}

interface TestResult {
  status: number;
  statusText: string;
  body: string;
  durationMs: number;
  error?: string;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_ACTIVE: Record<HttpMethod, string> = {
  GET: "border-emerald-500 bg-emerald-50 text-emerald-700",
  POST: "border-blue-500 bg-blue-50 text-blue-700",
  PUT: "border-orange-500 bg-orange-50 text-orange-700",
  PATCH: "border-violet-500 bg-violet-50 text-violet-700",
  DELETE: "border-red-500 bg-red-50 text-red-700",
};

const BODY_METHODS: HttpMethod[] = ["POST", "PUT", "PATCH"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
  mono,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow ${mono ? "font-mono" : ""}`}
    />
  );
}

function statusBadgeClass(status: number) {
  if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-700";
  if (status >= 300 && status < 400) return "bg-blue-100 text-blue-700";
  if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function HttpRequestNodeConfig({
  nodeId: _nodeId,
  workspaceId: _workspaceId,
  flowId: _flowId,
  data,
  onChange,
}: Props) {
  const [showHeaders, setShowHeaders] = useState(
    !!(data.headers && data.headers.length > 0),
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const set = useCallback(
    (patch: Partial<HttpRequestNodeData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );

  const method = data.method ?? "GET";
  const authType = data.authType ?? "none";
  const headers: HeaderEntry[] = data.headers ?? [];

  // ── Header list helpers ──────────────────────────────────────────────────────
  const addHeader = () =>
    set({ headers: [...headers, { key: "", value: "" }] });

  const updateHeader = (i: number, field: "key" | "value", val: string) => {
    const next = headers.map((h, idx) =>
      idx === i ? { ...h, [field]: val } : h,
    );
    set({ headers: next });
  };

  const removeHeader = (i: number) => {
    const next = headers.filter((_, idx) => idx !== i);
    set({ headers: next });
  };

  // ── Test request ─────────────────────────────────────────────────────────────
  const runTest = async () => {
    const url = data.url?.trim();
    if (!url) return;

    setTesting(true);
    setTestResult(null);

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Auth
    if (authType === "bearer" && data.bearerToken) {
      reqHeaders["Authorization"] = `Bearer ${data.bearerToken}`;
    } else if (authType === "basic" && data.basicUser) {
      const encoded = btoa(`${data.basicUser}:${data.basicPassword ?? ""}`);
      reqHeaders["Authorization"] = `Basic ${encoded}`;
    } else if (authType === "apikey" && data.apiKeyHeader) {
      reqHeaders[data.apiKeyHeader] = data.apiKeyValue ?? "";
    }

    // Custom headers
    for (const h of headers) {
      if (h.key.trim()) reqHeaders[h.key.trim()] = h.value;
    }

    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body:
          BODY_METHODS.includes(method) && data.body ? data.body : undefined,
      });

      const durationMs = Date.now() - t0;
      let body = "";
      try {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("json")) {
          const json = await res.json();
          body = JSON.stringify(json, null, 2);
        } else {
          body = await res.text();
        }
      } catch {
        body = "(sem corpo)";
      }

      setTestResult({
        status: res.status,
        statusText: res.statusText,
        body: body.slice(0, 2000),
        durationMs,
      });
    } catch (err: unknown) {
      setTestResult({
        status: 0,
        statusText: "Erro de rede",
        body: "",
        durationMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── 1. Método ─────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Método HTTP</SectionLabel>
        <div className="flex gap-1.5 flex-wrap">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set({ method: m })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                method === m
                  ? METHOD_ACTIVE[m]
                  : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. URL ────────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>URL *</SectionLabel>
        <TextInput
          placeholder="https://api.exemplo.com/endpoint"
          value={data.url ?? ""}
          onChange={(v) => set({ url: v })}
          mono
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Use{" "}
          <code className="bg-gray-100 rounded px-0.5">{"{{variavel}}"}</code>{" "}
          para valores dinâmicos
        </p>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 3. Autenticação ──────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Autenticação</SectionLabel>
        <select
          value={authType}
          onChange={(e) => set({ authType: e.target.value as AuthType })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="none">Nenhuma</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth (usuário + senha)</option>
          <option value="apikey">API Key (header customizado)</option>
        </select>

        {authType === "bearer" && (
          <div className="mt-3">
            <SectionLabel>Token</SectionLabel>
            <TextInput
              placeholder="eyJhbGci..."
              value={data.bearerToken ?? ""}
              onChange={(v) => set({ bearerToken: v })}
              mono
              type="password"
            />
          </div>
        )}

        {authType === "basic" && (
          <div className="mt-3 space-y-2">
            <div>
              <SectionLabel>Usuário</SectionLabel>
              <TextInput
                placeholder="usuario"
                value={data.basicUser ?? ""}
                onChange={(v) => set({ basicUser: v })}
              />
            </div>
            <div>
              <SectionLabel>Senha</SectionLabel>
              <TextInput
                placeholder="••••••••"
                value={data.basicPassword ?? ""}
                onChange={(v) => set({ basicPassword: v })}
                type="password"
              />
            </div>
          </div>
        )}

        {authType === "apikey" && (
          <div className="mt-3 space-y-2">
            <div>
              <SectionLabel>Nome do Header</SectionLabel>
              <TextInput
                placeholder="X-API-Key"
                value={data.apiKeyHeader ?? ""}
                onChange={(v) => set({ apiKeyHeader: v })}
                mono
              />
            </div>
            <div>
              <SectionLabel>Valor</SectionLabel>
              <TextInput
                placeholder="sua-chave-aqui"
                value={data.apiKeyValue ?? ""}
                onChange={(v) => set({ apiKeyValue: v })}
                mono
                type="password"
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 4. Headers customizados ──────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowHeaders((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span
            className={`transition-transform ${showHeaders ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          {showHeaders ? "Ocultar" : "Adicionar"} Headers customizados
          {headers.length > 0 && !showHeaders && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">
              {headers.length}
            </span>
          )}
        </button>

        {showHeaders && (
          <div className="mt-3 space-y-2">
            {headers.map((h, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Header"
                  value={h.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="text"
                  placeholder="Valor"
                  value={h.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(i)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-sm"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addHeader}
              className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              + Adicionar header
            </button>
          </div>
        )}
      </div>

      {/* ── 5. Body (só para POST / PUT / PATCH) ─────────────────────────── */}
      {BODY_METHODS.includes(method) && (
        <>
          <div className="border-t border-gray-100" />
          <div>
            <SectionLabel>Body (JSON / texto)</SectionLabel>
            <textarea
              rows={6}
              placeholder={'{\n  "campo": "{{valor}}"\n}'}
              value={data.body ?? ""}
              onChange={(e) => set({ body: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition-shadow"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Use{" "}
              <code className="bg-gray-100 rounded px-0.5">
                {"{{variavel}}"}
              </code>{" "}
              para valores dinâmicos
            </p>
          </div>
        </>
      )}

      <div className="border-t border-gray-100" />

      {/* ── 6. Saída de erro ──────────────────────────────────────────────── */}
      <div>
        {/* <SectionLabel>Avançado</SectionLabel> */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={!!data.enableErrorOutput}
              onChange={(e) => set({ enableErrorOutput: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full border-2 border-gray-300 bg-gray-100 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 leading-tight">
              Habilitar saída de erro
            </p>
          </div>
        </label>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 7. Testar requisição ─────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          disabled={!data.url?.trim() || testing}
          onClick={runTest}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-orange-300 bg-orange-50 text-orange-600 text-sm font-semibold hover:bg-orange-100 hover:border-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {testing ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Enviando…
            </>
          ) : (
            <>▶ Testar requisição</>
          )}
        </button>

        {!data.url?.trim() && (
          <p className="text-[11px] text-gray-400 mt-1 text-center">
            Informe uma URL para habilitar o teste
          </p>
        )}

        {/* Resultado do teste */}
        {testResult && (
          <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
            {/* Header do resultado */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {testResult.error ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    Erro
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(testResult.status)}`}
                  >
                    {testResult.status} {testResult.statusText}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400">
                {testResult.durationMs}ms
              </span>
            </div>

            {/* Body da resposta */}
            <div className="p-3">
              {testResult.error ? (
                <p className="text-xs text-red-500 font-mono break-all">
                  {testResult.error}
                </p>
              ) : testResult.body ? (
                <pre className="text-[11px] font-mono text-gray-600 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                  {testResult.body}
                </pre>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Sem corpo na resposta
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
