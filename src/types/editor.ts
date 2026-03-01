// ── Editor Node Types ─────────────────────────────────────────────────────────
export type CortexNodeType =
  | "triggerNode"
  | "emailConnectionNode"
  | "emailBodyNode"
  | "sendEmailNode";

// ── Node Data Shapes ──────────────────────────────────────────────────────────
export interface TriggerNodeData {
  label?: string;
  triggerType: "manual" | "webhook" | "cron";
  cronExpression?: string;
  webhookPath?: string;
}

export interface EmailConnectionNodeData {
  label?: string;
  credentialId?: string;
  credentialName?: string;
}

export interface EmailBodyNodeData {
  label?: string;
  subject: string;
  body: string;
}

export interface SendEmailNodeData {
  label?: string;
  toEmail: string;
  ccEmail?: string;
  bccEmail?: string;
}

export type CortexNodeData =
  | ({ nodeType: "triggerNode" } & TriggerNodeData)
  | ({ nodeType: "emailConnectionNode" } & EmailConnectionNodeData)
  | ({ nodeType: "emailBodyNode" } & EmailBodyNodeData)
  | ({ nodeType: "sendEmailNode" } & SendEmailNodeData);

// ── Serialized node (stored in DB / sent to API) ──────────────────────────────
export interface SerializedCortexNode {
  id: string;
  type: CortexNodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface SerializedCortexEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}
