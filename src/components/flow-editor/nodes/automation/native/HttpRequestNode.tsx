"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type AuthType = "none" | "bearer" | "basic" | "apikey";

export interface HeaderEntry {
  key: string;
  value: string;
}

export interface HttpRequestNodeData {
  url?: string;
  method?: HttpMethod;
  authType?: AuthType;
  bearerToken?: string;
  basicUser?: string;
  basicPassword?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
  headers?: HeaderEntry[];
  body?: string;
  responseVariable?: string;
  /** When true, renders a second output handle (error path) */
  enableErrorOutput?: boolean;
  [key: string]: unknown;
}

function HttpRequestNode({ data, selected }: NodeProps) {
  const d = data as HttpRequestNodeData;
  const method = d.method ?? "GET";
  const isConfigured = !!d.url;

  const raw = d.url ? d.url.replace(/^https?:\/\//, "") : "";
  const shortUrl = raw
    ? raw.slice(0, 22) + (raw.length > 22 ? "…" : "")
    : "HTTP Request";

  const outputs = d.enableErrorOutput
    ? [
        { id: "output", label: "ok" },
        { id: "error", label: "erro" },
      ]
    : undefined; // undefined → FlowNode defaults to single [{ id: "output" }]

  return (
    <FlowNode
      variant="work"
      color="orange"
      icon="🌐"
      label={`${method} ${shortUrl}`}
      configured={isConfigured}
      selected={selected}
      outputs={outputs}
      disabled={!!d.disabled}
    />
  );
}

export default memo(HttpRequestNode);
