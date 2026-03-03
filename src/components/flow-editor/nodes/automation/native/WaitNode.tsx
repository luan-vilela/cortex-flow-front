"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

export interface WaitNodeData {
  /** Delay in seconds */
  seconds?: number;
  [key: string]: unknown;
}

function WaitNode({ data, selected }: NodeProps) {
  const d = data as WaitNodeData;
  const seconds = d.seconds ?? 0;
  const isConfigured = seconds > 0;

  let label = "Wait";
  if (isConfigured) {
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      label = m > 0 ? `${h}h ${m}min` : `${h}h`;
    } else if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      label = s > 0 ? `${m}min ${s}s` : `${m}min`;
    } else {
      label = `${seconds}s`;
    }
  }

  return (
    <FlowNode
      variant="work"
      color="orange"
      icon="⏳"
      label={label}
      configured={isConfigured}
      selected={selected}
      disabled={!!d.disabled}
    />
  );
}

export default memo(WaitNode);
