"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface TriggerData {
  triggerType?: "manual" | "webhook" | "cron";
  httpMethod?: string;
  label?: string;
  [key: string]: unknown;
}

const icons: Record<string, string> = {
  manual: "▶",
  webhook: "🔗",
  cron: "⏱",
};

const labels: Record<string, string> = {
  manual: "Acionamento Manual",
  webhook: "Webhook",
  cron: "Agendamento",
};

function TriggerNode({ data, selected }: NodeProps) {
  const d = data as TriggerData;
  const type = d.triggerType ?? "manual";
  return (
    <div
      className={`group flex flex-col items-center gap-2 p-3 w-24 rounded-2xl bg-white transition-all cursor-pointer ${
        selected
          ? "ring-2 ring-emerald-500 ring-offset-2 shadow-lg shadow-emerald-100"
          : "ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:ring-emerald-300"
      }`}
    >
      {/* Icon block */}
      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xl shadow-sm">
        {icons[type]}
      </div>
      {/* Label */}
      <p className="text-[11px] font-semibold text-gray-600 text-center leading-tight w-full truncate">
        Gatilho
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-white !shadow-sm"
      />
    </div>
  );
}

export default memo(TriggerNode);
