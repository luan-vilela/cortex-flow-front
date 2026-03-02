"use client";
import { useCallback, useState } from "react";
import type {
  HttpResponseNodeData,
  HttpStatusCode,
  ResponseContentType,
} from "./HttpResponseNode";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: HttpResponseNodeData;
  onChange: (d: HttpResponseNodeData) => void;
}

const STATUS_CODES: { value: HttpStatusCode; label: string; color: string }[] =
  [
    {
      value: "200",
      label: "200 OK",
      color: "border-emerald-500 bg-emerald-50 text-emerald-700",
    },
    {
      value: "201",
      label: "201 Created",
      color: "border-blue-500 bg-blue-50 text-blue-700",
    },
    {
      value: "204",
      label: "204 No Content",
      color: "border-gray-400 bg-gray-50 text-gray-600",
    },
    {
      value: "400",
      label: "400 Bad Request",
      color: "border-yellow-500 bg-yellow-50 text-yellow-700",
    },
    {
      value: "401",
      label: "401 Unauthorized",
      color: "border-orange-500 bg-orange-50 text-orange-700",
    },
    {
      value: "403",
      label: "403 Forbidden",
      color: "border-red-400 bg-red-50 text-red-600",
    },
    {
      value: "404",
      label: "404 Not Found",
      color: "border-red-500 bg-red-50 text-red-700",
    },
    {
      value: "422",
      label: "422 Unprocessable",
      color: "border-purple-500 bg-purple-50 text-purple-700",
    },
    {
      value: "500",
      label: "500 Server Error",
      color: "border-rose-600 bg-rose-50 text-rose-700",
    },
  ];

const CONTENT_TYPES: { value: ResponseContentType; label: string }[] = [
  { value: "application/json", label: "JSON (application/json)" },
  { value: "text/plain", label: "Texto puro (text/plain)" },
  { value: "text/html", label: "HTML (text/html)" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

export default function HttpResponseNodeConfig({
  nodeId: _nodeId,
  workspaceId: _workspaceId,
  flowId: _flowId,
  data,
  onChange,
}: Props) {
  const set = useCallback(
    (patch: Partial<HttpResponseNodeData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );
  const [showHelp, setShowHelp] = useState(false);

  const statusCode = data.statusCode ?? "200";
  const contentType = data.contentType ?? "application/json";
  const hasBody = statusCode !== "204";

  const selectedStatus = STATUS_CODES.find((s) => s.value === statusCode);

  return (
    <div className="space-y-5">
      {/* ── 1. Status Code ──────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Código de Status *</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_CODES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set({ statusCode: s.value })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                statusCode === s.value
                  ? s.color
                  : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {s.value}
            </button>
          ))}
        </div>
        {selectedStatus && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            {selectedStatus.label}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 2. Content-Type ─────────────────────────────────────────────── */}
      {hasBody && (
        <div>
          <SectionLabel>Content-Type</SectionLabel>
          <select
            value={contentType}
            onChange={(e) =>
              set({ contentType: e.target.value as ResponseContentType })
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {CONTENT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 3. Body ─────────────────────────────────────────────────────── */}
      {hasBody && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Corpo da Resposta
            </label>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              title="Como usar variáveis no corpo da resposta"
              className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center transition-colors ${
                showHelp
                  ? "border-orange-400 bg-orange-100 text-orange-600"
                  : "border-gray-300 bg-gray-50 text-gray-400 hover:border-orange-300 hover:text-orange-500"
              }`}
            >
              ?
            </button>
          </div>

          {showHelp && (
            <div className="mb-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-[11px] text-gray-700">
              <p className="font-semibold text-orange-700 mb-2">
                Como usar variáveis no corpo:
              </p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-orange-200">
                    <th
                      className="text-left pb-1 pr-3 font-semibold text-gray-500 uppercase tracking-wide"
                      style={{ fontSize: "10px" }}
                    >
                      Sintaxe
                    </th>
                    <th
                      className="text-left pb-1 font-semibold text-gray-500 uppercase tracking-wide"
                      style={{ fontSize: "10px" }}
                    >
                      O que retorna
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {(
                    [
                      ["{{all()}}", "JSON completo do contexto"],
                      ["{{variavel}}", "Valor de uma variável do payload"],
                      ["{{httpResponse}}", "Resposta de um HTTP Request"],
                      ["{{httpResponse.body}}", "Body da resposta HTTP"],
                      [
                        "{{httpResponse.body.campo}}",
                        "Campo específico do body",
                      ],
                    ] as [string, string][]
                  ).map(([syntax, desc]) => (
                    <tr key={syntax}>
                      <td className="py-1 pr-3 align-top">
                        <code className="bg-white border border-orange-200 rounded px-1 text-orange-700 whitespace-nowrap">
                          {syntax}
                        </code>
                      </td>
                      <td className="py-1 text-gray-600 align-top">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <textarea
            rows={8}
            placeholder={
              contentType === "application/json"
                ? `{\n  "success": true,\n  "data": "{{variavel}}"\n}`
                : "Conteúdo da resposta..."
            }
            value={data.body ?? ""}
            onChange={(e) => set({ body: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Use{" "}
            <code className="bg-gray-100 rounded px-0.5">{"{{variavel}}"}</code>{" "}
            para valores dinâmicos do payload
          </p>
        </div>
      )}

      {/* ── 204 hint ──────────────────────────────────────────────────── */}
      {!hasBody && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500">
          O status <strong>204 No Content</strong> não envia corpo na resposta.
        </div>
      )}
    </div>
  );
}
