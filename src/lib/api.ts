import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Interceptor: injeta JWT ────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cortex_flow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Interceptor: trata 401 ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("cortex_flow_token");
      localStorage.removeItem("cortex_flow_refresh");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  ssoValidate: (token: string) =>
    api.post("/auth/sso/validate", { token }).then((r) => r.data),
};

// ── Workspaces ───────────────────────────────────────────────────────────────
export const workspacesApi = {
  list: () => api.get("/workspaces").then((r) => r.data),
  create: (data: { name: string; slug: string }) =>
    api.post("/workspaces", data).then((r) => r.data),
  get: (id: string) => api.get(`/workspaces/${id}`).then((r) => r.data),
  update: (id: string, data: object) =>
    api.patch(`/workspaces/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/workspaces/${id}`).then((r) => r.data),
  members: (id: string) =>
    api.get(`/workspaces/${id}/members`).then((r) => r.data),
  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post(`/workspaces/${id}/members`, data).then((r) => r.data),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/workspaces/${id}/members/${memberId}`).then((r) => r.data),
  n8nStatus: (id: string) =>
    api.get(`/workspaces/${id}/n8n/status`).then((r) => r.data),
  configureN8n: (
    id: string,
    data: { n8nBaseUrl?: string; n8nApiKey?: string },
  ) => api.patch(`/workspaces/${id}/n8n`, data).then((r) => r.data),
};

// ── Flows ─────────────────────────────────────────────────────────────────────
export const flowsApi = {
  list: (workspaceId: string, params?: { status?: string; search?: string }) =>
    api.get(`/workspaces/${workspaceId}/flows`, { params }).then((r) => r.data),
  create: (workspaceId: string, data: object) =>
    api.post(`/workspaces/${workspaceId}/flows`, data).then((r) => r.data),
  get: (workspaceId: string, flowId: string) =>
    api.get(`/workspaces/${workspaceId}/flows/${flowId}`).then((r) => r.data),
  update: (workspaceId: string, flowId: string, data: object) =>
    api
      .patch(`/workspaces/${workspaceId}/flows/${flowId}`, data)
      .then((r) => r.data),
  delete: (workspaceId: string, flowId: string) =>
    api
      .delete(`/workspaces/${workspaceId}/flows/${flowId}`)
      .then((r) => r.data),
  activate: (workspaceId: string, flowId: string) =>
    api
      .post(`/workspaces/${workspaceId}/flows/${flowId}/activate`)
      .then((r) => r.data),
  deactivate: (workspaceId: string, flowId: string) =>
    api
      .post(`/workspaces/${workspaceId}/flows/${flowId}/deactivate`)
      .then((r) => r.data),
  execute: (workspaceId: string, flowId: string, inputData?: object) =>
    api
      .post(`/workspaces/${workspaceId}/flows/${flowId}/execute`, { inputData })
      .then((r) => r.data),
  test: (
    workspaceId: string,
    flowId: string,
    inputData?: object,
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    enableUrl?: string;
  }> =>
    api
      .post(`/workspaces/${workspaceId}/flows/${flowId}/test`, { inputData })
      .then((r) => r.data),
  duplicate: (workspaceId: string, flowId: string) =>
    api
      .post(`/workspaces/${workspaceId}/flows/${flowId}/duplicate`)
      .then((r) => r.data),
  editorUrl: (workspaceId: string, flowId: string) =>
    api
      .get(`/workspaces/${workspaceId}/flows/${flowId}/editor-url`)
      .then((r) => r.data),
  applyTemplate: (
    workspaceId: string,
    flowId: string,
    data: {
      templateId: number;
      params: Record<string, string>;
      flowName?: string;
    },
  ) =>
    api
      .post(`/workspaces/${workspaceId}/flows/${flowId}/apply-template`, data)
      .then((r) => r.data),
  saveNodes: (
    workspaceId: string,
    flowId: string,
    data: { nodes: object[]; edges: object[] },
  ) =>
    api
      .patch(`/workspaces/${workspaceId}/flows/${flowId}/nodes`, data)
      .then((r) => r.data),
  getWebhookInfo: (workspaceId: string, flowId: string) =>
    api
      .get(`/workspaces/${workspaceId}/flows/${flowId}/webhook-info`)
      .then((r) => r.data),
  exportFlow: (workspaceId: string, flowId: string) =>
    api
      .get(`/workspaces/${workspaceId}/flows/${flowId}/export`)
      .then(
        (r) =>
          r.data as {
            cortexFlowVersion: string;
            exportedAt: string;
            flow: object;
          },
      ),
  importFlow: (
    workspaceId: string,
    data: { cortexFlowVersion: string; flow: object },
  ) =>
    api
      .post(`/workspaces/${workspaceId}/flows/import`, data)
      .then((r) => r.data),
};

// ── Executions ───────────────────────────────────────────────────────────────
export const executionsApi = {
  list: (
    workspaceId: string,
    params?: {
      flowId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) =>
    api
      .get(`/workspaces/${workspaceId}/executions`, { params })
      .then((r) => r.data),
  listByFlow: (
    workspaceId: string,
    flowId: string,
    params?: { page?: number; limit?: number },
  ) =>
    api
      .get(`/workspaces/${workspaceId}/flows/${flowId}/executions`, { params })
      .then((r) => r.data),
  stats: (workspaceId: string, flowId: string) =>
    api
      .get(`/workspaces/${workspaceId}/flows/${flowId}/executions/stats`)
      .then((r) => r.data),
  get: (workspaceId: string, flowId: string, executionId: string) =>
    api
      .get(
        `/workspaces/${workspaceId}/flows/${flowId}/executions/${executionId}`,
      )
      .then((r) => r.data),
  cancel: (workspaceId: string, flowId: string, executionId: string) =>
    api
      .post(
        `/workspaces/${workspaceId}/flows/${flowId}/executions/${executionId}/cancel`,
      )
      .then((r) => r.data),
  reExecute: (workspaceId: string, flowId: string, executionId: string) =>
    api
      .post(
        `/workspaces/${workspaceId}/flows/${flowId}/executions/${executionId}/re-execute`,
      )
      .then((r) => r.data),
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const templatesApi = {
  list: () => api.get("/templates").then((r) => r.data),
  get: (id: number) => api.get(`/templates/${id}`).then((r) => r.data),
  install: (workspaceId: string, data: object) =>
    api
      .post(`/workspaces/${workspaceId}/flows/from-template`, data)
      .then((r) => r.data),
};

// ── Credentials ──────────────────────────────────────────────────────────────
export const credentialsApi = {
  list: (workspaceId: string) =>
    api.get(`/workspaces/${workspaceId}/credentials`).then((r) => r.data),
  delete: (workspaceId: string, credentialId: string) =>
    api
      .delete(`/workspaces/${workspaceId}/credentials/${credentialId}`)
      .then((r) => r.data),
};

// ── Gmail Credentials ────────────────────────────────────────────────────────
export const gmailCredentialsApi = {
  list: (workspaceId: string) =>
    api
      .get(`/workspaces/${workspaceId}/credentials/gmail`)
      .then((r) => r.data as GmailCredential[]),
  connect: (workspaceId: string, flowId: string, nodeId: string) =>
    api
      .post(
        `/workspaces/${workspaceId}/credentials/gmail/connect`,
        {},
        {
          params: { flowId, nodeId },
        },
      )
      .then((r) => r.data as { authUrl: string }),
  delete: (workspaceId: string, credId: string) =>
    api
      .delete(`/workspaces/${workspaceId}/credentials/gmail/${credId}`)
      .then((r) => r.data),
};

export interface GmailCredential {
  id: string;
  workspaceId: string;
  email: string;
  displayName: string | null;
  n8nCredentialId: string | null;
  createdAt: string;
}

// ── Integrations ─────────────────────────────────────────────────────────────
export const integrationsApi = {
  list: (workspaceId: string) =>
    api.get(`/workspaces/${workspaceId}/integrations`).then((r) => r.data),
  get: (workspaceId: string, id: string) =>
    api
      .get(`/workspaces/${workspaceId}/integrations/${id}`)
      .then((r) => r.data),
  create: (workspaceId: string, data: object) =>
    api
      .post(`/workspaces/${workspaceId}/integrations`, data)
      .then((r) => r.data),
  update: (workspaceId: string, id: string, data: object) =>
    api
      .patch(`/workspaces/${workspaceId}/integrations/${id}`, data)
      .then((r) => r.data),
  delete: (workspaceId: string, id: string) =>
    api
      .delete(`/workspaces/${workspaceId}/integrations/${id}`)
      .then((r) => r.data),
  usage: (workspaceId: string) =>
    api
      .get(`/workspaces/${workspaceId}/integrations/usage`)
      .then((r) => r.data),
  executions: (workspaceId: string, id: string) =>
    api
      .get(`/workspaces/${workspaceId}/integrations/${id}/executions`)
      .then((r) => r.data),
};
