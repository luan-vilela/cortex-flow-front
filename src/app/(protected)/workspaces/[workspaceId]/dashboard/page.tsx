"use client";

import { use } from "react";
import { useFlows } from "@/hooks/useFlows";
import { useExecutions } from "@/hooks/useExecutions";
import { useWorkspace, useN8nStatus } from "@/hooks/useWorkspaces";
import {
  Zap,
  GitBranch,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flow, Execution } from "@/types";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: flows } = useFlows(workspaceId);
  const { data: executionsData } = useExecutions(workspaceId, {
    limit: 5,
  } as never);
  const { data: n8nStatus } = useN8nStatus(workspaceId);

  const allFlows: Flow[] = flows ?? [];
  const recentExecutions: Execution[] =
    executionsData?.data ?? executionsData ?? [];
  const activeFlows = allFlows.filter((f) => f.status === "active").length;

  const stats = [
    {
      label: "Flows ativos",
      value: activeFlows,
      icon: GitBranch,
      color: "text-purple-400",
    },
    {
      label: "Total de flows",
      value: allFlows.length,
      icon: Zap,
      color: "text-blue-400",
    },
    {
      label: "Execuções recentes",
      value: recentExecutions.length,
      icon: Activity,
      color: "text-green-400",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {workspace?.name ?? "Dashboard"}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral do workspace</p>
      </div>

      {/* Node-RED Status */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border mb-8",
          n8nStatus?.connected
            ? "bg-green-500/5 border-green-500/20"
            : "bg-orange-500/5 border-orange-500/20",
        )}
      >
        {n8nStatus?.connected ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-orange-400" />
        )}
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              n8nStatus?.connected ? "text-green-300" : "text-orange-300",
            )}
          >
            {n8nStatus?.connected
              ? "Node-RED conectado"
              : "Node-RED não configurado"}
          </p>
          <p className="text-xs text-gray-500">
            {n8nStatus?.connected
              ? "Engine de automação operacional"
              : "Configure nas configurações do workspace"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="p-5 rounded-xl bg-gray-900 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{label}</span>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent flows */}
      <div className="mb-8">
        <h2 className="text-white font-semibold mb-4">Flows recentes</h2>
        {!allFlows.length ? (
          <p className="text-gray-500 text-sm">Nenhum flow criado ainda</p>
        ) : (
          <div className="space-y-2">
            {allFlows.slice(0, 5).map((flow) => (
              <div
                key={flow.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"
              >
                <span className="text-xl">{flow.icon ?? "⚡"}</span>
                <span className="text-gray-200 text-sm flex-1">
                  {flow.name}
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    flow.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700 text-gray-400",
                  )}
                >
                  {flow.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
