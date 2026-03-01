"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plug,
  Plus,
  Copy,
  Check,
  Loader2,
  Activity,
  Pause,
  Play,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  useIntegrations,
  useIntegrationUsage,
  useUpdateIntegration,
  useDeleteIntegration,
} from "@/hooks/useIntegrations";
import type { Integration, PlanSummary } from "@/types";

export default function IntegrationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const router = useRouter();

  const { data: integrations = [], isLoading } = useIntegrations(workspaceId);
  const { data: usage } = useIntegrationUsage(workspaceId) as {
    data: PlanSummary | undefined;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Plug className="w-5 h-5 text-purple-400" />
            Integrações
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Seus webhooks de automação prontos para disparar
          </p>
        </div>
        <button
          onClick={() => router.push(`/workspaces/${workspaceId}/templates`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova integração
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Quota summary */}
        {usage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuotaCard
              label="Emails este mês"
              used={usage.emailsSent}
              limit={usage.emailLimit}
              color="#6366f1"
            />
            <QuotaCard
              label="WhatsApp este mês"
              used={usage.whatsappSent}
              limit={usage.whatsappLimit}
              color="#25d366"
            />
          </div>
        )}

        {/* Integrations list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-40"
              />
            ))}
          </div>
        ) : integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Plug className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-medium">
              Nenhuma integração ainda
            </p>
            <p className="text-gray-600 text-sm mt-1 mb-5">
              Escolha um template do marketplace para começar
            </p>
            <button
              onClick={() =>
                router.push(`/workspaces/${workspaceId}/templates`)
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar primeira integração
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {integrations.map((integration: Integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                workspaceId={workspaceId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuotaCard({
  label,
  used,
  limit,
  color,
}: {
  label: string;
  used: number;
  limit: number;
  color: string;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <span
          className={`text-sm font-semibold ${isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-white"}`}
        >
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: isDanger
              ? "#ef4444"
              : isWarning
                ? "#f59e0b"
                : color,
          }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-2">{Math.round(pct)}% utilizado</p>
    </div>
  );
}

function IntegrationCard({
  integration,
  workspaceId,
}: {
  integration: Integration;
  workspaceId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateMutation = useUpdateIntegration(workspaceId, integration.id);
  const deleteMutation = useDeleteIntegration(workspaceId);

  const triggerUrl =
    integration.triggerUrl ??
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/integrations/trigger/${integration.webhookToken}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(triggerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStatus = () => {
    updateMutation.mutate({
      status: integration.status === "active" ? "paused" : "active",
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteMutation.mutate(integration.id);
  };

  const channelEmoji: Record<string, string> = {
    email: "📧",
    whatsapp: "💬",
    custom: "🔗",
  };

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    paused: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    draft: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  };

  const statusLabels: Record<string, string> = {
    active: "Ativo",
    paused: "Pausado",
    draft: "Rascunho",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl">
            {channelEmoji[integration.channel] ?? "⚡"}
          </span>
          <div className="min-w-0">
            <h3 className="font-medium text-white text-sm truncate">
              {integration.name}
            </h3>
            <span className="text-xs text-gray-500">
              {integration.templateSlug}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${statusColors[integration.status]}`}
        >
          {statusLabels[integration.status]}
        </span>
      </div>

      {/* Webhook URL */}
      <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 mb-4">
        <code className="flex-1 text-xs text-gray-400 truncate">
          {triggerUrl}
        </code>
        <button
          onClick={copyUrl}
          className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
          title="Copiar URL"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={toggleStatus}
          disabled={updateMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
          title={integration.status === "active" ? "Pausar" : "Ativar"}
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : integration.status === "active" ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {integration.status === "active" ? "Pausar" : "Ativar"}
        </button>

        <a
          href={`/workspaces/${workspaceId}/integrations/${integration.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <Activity className="w-3.5 h-3.5" />
          Execuções
          <ChevronRight className="w-3 h-3" />
        </a>

        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className={`ml-auto p-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 ${
            confirmDelete
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "text-gray-600 hover:text-red-400 hover:bg-red-500/10"
          }`}
          title={confirmDelete ? "Clique novamente para confirmar" : "Excluir"}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
