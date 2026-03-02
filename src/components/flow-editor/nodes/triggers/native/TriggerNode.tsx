"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

interface TriggerData {
  triggerType?: "manual" | "webhook" | "cron";
  httpMethod?: string;
  label?: string;
  [key: string]: unknown;
}

const ICONS: Record<string, string> = {
  manual: "▶",
  webhook: "🔗",
  cron: "⏱",
};

const LABELS: Record<string, string> = {
  manual: "Gatilho",
  webhook: "Webhook",
  cron: "Agendamento",
};

function TriggerNode({ data, selected }: NodeProps) {
  const d = data as TriggerData;
  const type = d.triggerType ?? "manual";

  return (
    <FlowNode
      variant="start"
      color="emerald"
      icon={ICONS[type]}
      label={d.label || LABELS[type]}
      selected={selected}
      disabled={!!d.disabled}
    />
  );
}

export default memo(TriggerNode);
