// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  crmUserId?: string;
  crmSource?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

// ── Workspace ─────────────────────────────────────────────────────────────────
export type WorkspaceMemberRole = "admin" | "operator" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  crmWorkspaceId?: string;
  crmApiUrl?: string;
  n8nBaseUrl?: string;
  n8nTagId?: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  invitedBy?: string;
  createdAt: string;
  user?: Partial<User>;
}

// ── Flows ─────────────────────────────────────────────────────────────────────
export type FlowStatus = "draft" | "active" | "inactive";
export type FlowTriggerType = "manual" | "webhook" | "cron" | "event";

export interface Flow {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  n8nWorkflowId?: string;
  n8nTagId?: string;
  status: FlowStatus;
  triggerType: FlowTriggerType;
  webhookToken?: string;
  cronExpression?: string;
  tags?: string[];
  icon?: string;
  color?: string;
  nodes?: object[];
  edges?: object[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowDto {
  name: string;
  description?: string;
  triggerType: FlowTriggerType;
  cronExpression?: string;
  tags?: string[];
  icon?: string;
  color?: string;
}

// ── Executions ──────────────────────────────────────────────────────────────
export type ExecutionStatus =
  | "queued"
  | "running"
  | "success"
  | "error"
  | "canceled";
export type ExecutionTrigger = "manual" | "webhook" | "cron" | "api";

export interface Execution {
  id: string;
  flowId: string;
  workspaceId: string;
  n8nExecutionId?: string;
  status: ExecutionStatus;
  triggeredBy: ExecutionTrigger;
  triggeredByUserId?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  createdAt: string;
}

export interface ExecutionStats {
  total: number;
  success: number;
  error: number;
  running: number;
  queued: number;
  canceled: number;
}

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Templates ───────────────────────────────────────────────────────────────
export interface TemplateParameter {
  key: string;
  label: string;
  type: "string" | "cron" | "json" | "credential";
  required: boolean;
  default?: string;
  description?: string;
  credentialType?: string;
}

export interface FlowTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  triggerType: string;
  icon?: string;
  color?: string;
  parametersSchema: TemplateParameter[];
  templateNodes?: object[];
  templateEdges?: object[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstallTemplateDto {
  templateId: number;
  params: Record<string, string>;
  flowName?: string;
}

// ── Credentials ─────────────────────────────────────────────────────────────
export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Integrations ─────────────────────────────────────────────────────────────
export type IntegrationChannel = "email" | "whatsapp" | "custom";
export type IntegrationStatus = "active" | "paused" | "draft";

export interface Integration {
  id: string;
  workspaceId: string;
  name: string;
  templateSlug: string;
  channel: IntegrationChannel;
  credentialId?: string;
  defaultVars?: Record<string, string>;
  webhookToken: string;
  nodeRedFlowId?: string;
  status: IntegrationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** extras adicionados pelo formatResponse */
  triggerUrl?: string;
  examplePayload?: object;
}

export interface BulkExecution {
  id: string;
  integrationId: string;
  workspaceId: string;
  totalRecipients: number;
  accepted: number;
  delivered: number;
  failed: number;
  status: "processing" | "done" | "partial";
  triggeredAt: string;
  finishedAt?: string;
}

export interface CreateIntegrationDto {
  name: string;
  templateSlug: string;
  channel: IntegrationChannel;
  credentialId?: string;
  defaultVars?: Record<string, string>;
}

export interface UpdateIntegrationDto {
  name?: string;
  status?: IntegrationStatus;
  credentialId?: string;
  defaultVars?: Record<string, string>;
}

export interface PlanSummary {
  plan: { id: string; name: string; slug: string };
  period: string;
  emailLimit: number;
  emailsSent: number;
  emailRemaining: number;
  whatsappLimit: number;
  whatsappSent: number;
  whatsappRemaining: number;
}
