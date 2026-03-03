"use client";
import { useCallback } from "react";
import type { WaitNodeData } from "./WaitNode";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: WaitNodeData;
  onChange: (d: WaitNodeData) => void;
}

const PRESETS = [
  { label: "5s", value: 5 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1min", value: 60 },
  { label: "5min", value: 300 },
  { label: "15min", value: 900 },
  { label: "30min", value: 1800 },
  { label: "1h", value: 3600 },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (s > 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export default function WaitNodeConfig({
  nodeId: _nodeId,
  workspaceId: _workspaceId,
  flowId: _flowId,
  data,
  onChange,
}: Props) {
  const set = useCallback(
    (patch: Partial<WaitNodeData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );

  const seconds = data.seconds ?? 0;

  return (
    <div className="space-y-5">
      {/* ── 1. Presets ────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Atalhos</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set({ seconds: p.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                seconds === p.value
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 2. Custom seconds ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Tempo em segundos</SectionLabel>
        <input
          type="number"
          min={0}
          max={86400}
          step={1}
          placeholder="Ex: 10"
          value={seconds || ""}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            set({ seconds: isNaN(v) ? 0 : Math.max(0, Math.min(86400, v)) });
          }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Máximo: 86400 segundos (24 horas)
        </p>
      </div>

      {/* ── 3. Preview ────────────────────────────────────────────────────── */}
      {seconds > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700 flex items-center gap-2">
            <span className="text-lg">⏳</span>
            <span>
              O fluxo aguardará <strong>{formatDuration(seconds)}</strong> antes
              de prosseguir.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
