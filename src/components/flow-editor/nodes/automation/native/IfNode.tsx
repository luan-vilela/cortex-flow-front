"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

export type IfOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

export interface IfNodeData {
  /** Left-hand value or variable (e.g. {{payload.status}}) */
  leftValue?: string;
  /** Comparison operator */
  operator?: IfOperator;
  /** Right-hand value to compare against */
  rightValue?: string;
  [key: string]: unknown;
}

function IfNode({ data, selected }: NodeProps) {
  const d = data as IfNodeData;
  const isConfigured = !!d.leftValue?.trim() && !!d.operator;

  const label = isConfigured
    ? `${(d.leftValue ?? "").slice(0, 14)} ${OPERATOR_SHORT[d.operator!]}`
    : "If";

  return (
    <FlowNode
      variant="work"
      color="orange"
      icon="🔀"
      label={label}
      configured={isConfigured}
      selected={selected}
      disabled={!!d.disabled}
      outputs={[
        { id: "true", label: "sim" },
        { id: "false", label: "não" },
      ]}
    />
  );
}

const OPERATOR_SHORT: Record<IfOperator, string> = {
  equals: "==",
  not_equals: "!=",
  contains: "∋",
  not_contains: "∌",
  greater_than: ">",
  less_than: "<",
  is_empty: "vazio",
  is_not_empty: "preenchido",
};

export default memo(IfNode);
