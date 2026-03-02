"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useFlows,
  useCreateFlow,
  useActivateFlow,
  useDeactivateFlow,
  useDeleteFlow,
  useExecuteFlow,
  useDuplicateFlow,
} from "@/hooks/useFlows";
import { useExportFlow, useImportFlow } from "@/hooks/useFlowExportImport";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Play,
  Pause,
  Trash2,
  Copy,
  GitBranch,
  ExternalLink,
  MoreHorizontal,
  Upload,
  Download,
} from "lucide-react";
import type { Flow, FlowStatus, FlowTriggerType } from "@/types";
import { cn } from "@/lib/utils";

const statusColors: Record<FlowStatus, string> = {
  draft: "bg-gray-700 text-gray-300",
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-red-500/20 text-red-400",
};

const triggerLabels: Record<FlowTriggerType, string> = {
  manual: "Manual",
  webhook: "Webhook",
  cron: "Agendado",
  event: "Evento",
};

const createSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  triggerType: z.enum(["manual", "webhook", "cron", "event"]).default("manual"),
  description: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export default function FlowsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const importFileRef = useRef<HTMLInputElement>(null);

  const { data: flows, isLoading } = useFlows(workspaceId, {
    search: search || undefined,
  });
  const createFlow = useCreateFlow(workspaceId);
  const activateFlow = useActivateFlow(workspaceId);
  const deactivateFlow = useDeactivateFlow(workspaceId);
  const deleteFlow = useDeleteFlow(workspaceId);
  const executeFlow = useExecuteFlow(workspaceId);
  const duplicateFlow = useDuplicateFlow(workspaceId);
  const { exportFlow, isExporting } = useExportFlow(workspaceId);
  const { importFlow, isImporting } = useImportFlow(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { triggerType: "manual" },
  });

  const onCreate = async (data: CreateForm) => {
    try {
      const newFlow = await createFlow.mutateAsync(data);
      toast.success(`Flow "${data.name}" criado!`);
      reset();
      setShowCreate(false);
      // Redireciona para o editor
      router.push(`/workspaces/${workspaceId}/flows/${newFlow.id}/editor`);
    } catch {
      toast.error("Erro ao criar flow");
    }
  };

  const handleExecute = async (flow: Flow) => {
    try {
      await executeFlow.mutateAsync({ flowId: flow.id });
      toast.success("Execução iniciada!");
    } catch {
      toast.error("Erro ao executar flow");
    }
  };

  const handleToggle = async (flow: Flow) => {
    try {
      if (flow.status === "active") {
        await deactivateFlow.mutateAsync(flow.id);
        toast.success("Flow desativado");
      } else {
        await activateFlow.mutateAsync(flow.id);
        toast.success("Flow ativado!");
      }
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (flow: Flow) => {
    if (!confirm(`Deletar "${flow.name}"?`)) return;
    try {
      await deleteFlow.mutateAsync(flow.id);
      toast.success("Flow deletado");
    } catch {
      toast.error("Erro ao deletar flow");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Flows</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie suas automações</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspaces/${workspaceId}/templates`}
            className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:text-purple-300 border border-purple-800 rounded-lg text-sm font-medium transition-colors"
          >
            Usar Template
          </Link>

          {/* ── Importar flow ── */}
          <input
            ref={importFileRef}
            type="file"
            accept=".json,.cortexflow.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              const newFlow = await importFlow(file);
              if (newFlow) {
                router.push(
                  `/workspaces/${workspaceId}/flows/${newFlow.id}/editor`,
                );
              }
            }}
          />
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Importar
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Flow
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar flows..."
          className="w-full max-w-sm px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-6 rounded-xl bg-gray-900 border border-gray-800">
          <h3 className="text-white font-medium mb-4">Novo Flow</h3>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Nome *
                </label>
                <input
                  {...register("name")}
                  placeholder="Ex: Notificar novo lead"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Tipo de trigger
                </label>
                <select
                  {...register("triggerType")}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="webhook">Webhook</option>
                  <option value="cron">Agendado (cron)</option>
                  <option value="event">Evento</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Descrição
              </label>
              <input
                {...register("description")}
                placeholder="Opcional..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Flows list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : !flows?.length ? (
        <div className="text-center py-20">
          <GitBranch className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum flow criado ainda</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Criar primeiro flow
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((flow: Flow) => (
            <div
              key={flow.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors group"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{
                  backgroundColor: `${flow.color ?? "#6366f1"}20`,
                  border: `1px solid ${flow.color ?? "#6366f1"}40`,
                }}
              >
                {flow.icon ?? "⚡"}
              </div>

              {/* Info — abre o editor */}
              <Link
                href={`/workspaces/${workspaceId}/flows/${flow.id}/editor`}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                    {flow.name}
                  </p>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      statusColors[flow.status],
                    )}
                  >
                    {flow.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">
                  {triggerLabels[flow.triggerType]}
                  {flow.description && ` · ${flow.description}`}
                </p>
              </Link>

              {/* Tags */}
              <div className="hidden md:flex gap-1">
                {flow.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleExecute(flow)}
                  disabled={flow.status !== "active"}
                  title="Executar"
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-green-400 disabled:opacity-30 transition-colors"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggle(flow)}
                  title={flow.status === "active" ? "Desativar" : "Ativar"}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    duplicateFlow
                      .mutateAsync(flow.id)
                      .then(() => toast.success("Duplicado!"))
                  }
                  title="Duplicar"
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportFlow(flow.id, flow.name)}
                  disabled={isExporting}
                  title="Exportar"
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-emerald-400 disabled:opacity-40 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(flow)}
                  title="Deletar"
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
