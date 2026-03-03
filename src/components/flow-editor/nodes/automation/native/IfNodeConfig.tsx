"use client";
import { useCallback } from "react";
import type { IfNodeData, IfOperator } from "./IfNode";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: IfNodeData;
  onChange: (d: IfNodeData) => void;
}

const OPERATORS: { value: IfOperator; label: string }[] = [
  { value: "equals", label: "É igual a" },
  { value: "not_equals", label: "É diferente de" },
  { value: "contains", label: "Contém" },
  { value: "not_contains", label: "Não contém" },
  { value: "greater_than", label: "Maior que" },
  { value: "less_than", label: "Menor que" },
  { value: "is_empty", label: "Está vazio" },
  { value: "is_not_empty", label: "Não está vazio" },
];

/** Operators that don't need a right-hand value */
const UNARY_OPERATORS: IfOperator[] = ["is_empty", "is_not_empty"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

export default function IfNodeConfig({
  nodeId: _nodeId,
  workspaceId: _workspaceId,
  flowId: _flowId,
  data,
  onChange,
}: Props) {
  const set = useCallback(
    (patch: Partial<IfNodeData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );

  const operator = data.operator ?? "equals";
  const needsRightValue = !UNARY_OPERATORS.includes(operator);

  return (
    <div className="space-y-5">
      {/* ── 1. Left value ─────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Valor / Variável</SectionLabel>
        <input
          type="text"
          placeholder="Ex: {{payload.status}}"
          value={data.leftValue ?? ""}
          onChange={(e) => set({ leftValue: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Use{" "}
          <code className="bg-gray-100 rounded px-0.5">{"{{variavel}}"}</code>{" "}
          para valores dinâmicos
        </p>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 2. Operator ───────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Operador</SectionLabel>
        <select
          value={operator}
          onChange={(e) => set({ operator: e.target.value as IfOperator })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 3. Right value ────────────────────────────────────────────────── */}
      {needsRightValue && (
        <div>
          <SectionLabel>Comparar com</SectionLabel>
          <input
            type="text"
            placeholder="Ex: ativo"
            value={data.rightValue ?? ""}
            onChange={(e) => set({ rightValue: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Use{" "}
            <code className="bg-gray-100 rounded px-0.5">{"{{variavel}}"}</code>{" "}
            para valores dinâmicos
          </p>
        </div>
      )}

      {/* ── Output paths info ─────────────────────────────────────────────── */}
      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700 space-y-2">
        <p className="font-semibold">🔀 Saídas do nó</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span>
              <strong>Sim</strong> — condição verdadeira
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>
              <strong>Não</strong> — condição falsa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
