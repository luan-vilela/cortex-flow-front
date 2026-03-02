"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

export type HttpStatusCode =
  | "200"
  | "201"
  | "204"
  | "400"
  | "401"
  | "403"
  | "404"
  | "422"
  | "500";

export type ResponseContentType =
  | "application/json"
  | "text/plain"
  | "text/html";

export interface HttpResponseNodeData {
  statusCode?: HttpStatusCode;
  contentType?: ResponseContentType;
  body?: string;
  [key: string]: unknown;
}

const STATUS_LABEL: Record<HttpStatusCode, string> = {
  "200": "200 OK",
  "201": "201 Created",
  "204": "204 No Content",
  "400": "400 Bad Request",
  "401": "401 Unauthorized",
  "403": "403 Forbidden",
  "404": "404 Not Found",
  "422": "422 Unprocessable",
  "500": "500 Server Error",
};

function HttpResponseNode({ data, selected }: NodeProps) {
  const d = data as HttpResponseNodeData;
  const status = d.statusCode ?? "200";
  const isConfigured = !!d.statusCode;

  return (
    <FlowNode
      variant="end"
      color="orange"
      icon="↩️"
      label={STATUS_LABEL[status]}
      configured={isConfigured}
      selected={selected}
      disabled={!!d.disabled}
    />
  );
}

export default memo(HttpResponseNode);
