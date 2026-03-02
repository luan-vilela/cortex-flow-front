"use client";
import { useCallback } from "react";
import type { Node } from "@xyflow/react";
import TriggerNodeConfig from "./nodes/triggers/native/TriggerNodeConfig";
import GmailNodeConfig from "./nodes/communication/google/GmailNodeConfig";
import type { GmailNodeData } from "./nodes/communication/google/GmailNode";
import HttpRequestNodeConfig from "./nodes/automation/native/HttpRequestNodeConfig";
import type { HttpRequestNodeData } from "./nodes/automation/native/HttpRequestNode";
import HttpResponseNodeConfig from "./nodes/automation/native/HttpResponseNodeConfig";
import type { HttpResponseNodeData } from "./nodes/automation/native/HttpResponseNode";
import { getNodeDef, CATEGORIES } from "@/lib/node-registry";
import type { FlowNodeColor } from "./FlowNode";

interface Props {
  node: Node | null;
  onUpdateData: (id: string, newData: Record<string, unknown>) => void;
  workspaceId: string;
  flowId: string;
}

// ── Color map: FlowNodeColor → Tailwind text class ────────────────────────────
const COLOR_TEXT: Record<FlowNodeColor, string> = {
  emerald: "text-emerald-600",
  violet: "text-violet-600",
  blue: "text-blue-600",
  orange: "text-orange-600",
  indigo: "text-indigo-600",
  rose: "text-rose-600",
  pink: "text-pink-600",
  sky: "text-sky-600",
  gray: "text-gray-600",
};

/** Resolve display metadata for any node type from the registry */
function resolveNodeMeta(nodeType: string) {
  const def = getNodeDef(nodeType);
  if (def) {
    const categoryDef = Object.values(CATEGORIES).find(
      (c) => c.id === def.category,
    );
    const color = (def.color ?? categoryDef?.color ?? "gray") as FlowNodeColor;
    return { label: def.label, icon: def.icon, color: COLOR_TEXT[color] };
  }
  return { label: nodeType, icon: "⚙", color: "text-gray-600" };
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function NodeConfigPanel({
  node,
  onUpdateData,
  workspaceId,
  flowId,
}: Props) {
  const handleChange = useCallback(
    (newData: Record<string, unknown>) => {
      if (node) onUpdateData(node.id, newData);
    },
    [node, onUpdateData],
  );

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="text-4xl mb-3">👆</div>
        <p className="text-sm font-medium text-gray-500">
          Clique em um node para configurá-lo
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Cada node tem configurações específicas
        </p>
      </div>
    );
  }

  const meta = resolveNodeMeta(node.type ?? "");
  const data = (node.data || {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h3 className={`font-semibold text-sm ${meta.color}`}>
            {meta.label}
          </h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          ID: {node.id.slice(0, 8)}
        </p>
      </div>

      {/* Config form */}
      <div className="flex-1 overflow-y-auto p-4">
        {node.type === "triggerNode" && (
          <TriggerNodeConfig
            nodeId={node.id}
            workspaceId={workspaceId}
            flowId={flowId}
            data={data}
            onChange={handleChange}
          />
        )}
        {node.type === "gmailNode" && (
          <GmailNodeConfig
            nodeId={node.id}
            workspaceId={workspaceId}
            flowId={flowId}
            data={data as GmailNodeData}
            onChange={handleChange}
          />
        )}
        {node.type === "httpRequestNode" && (
          <HttpRequestNodeConfig
            nodeId={node.id}
            workspaceId={workspaceId}
            flowId={flowId}
            data={data as HttpRequestNodeData}
            onChange={handleChange}
          />
        )}
        {node.type === "httpResponseNode" && (
          <HttpResponseNodeConfig
            nodeId={node.id}
            workspaceId={workspaceId}
            flowId={flowId}
            data={data as HttpResponseNodeData}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
}
