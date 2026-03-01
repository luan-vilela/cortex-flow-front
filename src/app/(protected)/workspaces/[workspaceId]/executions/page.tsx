"use client";

import { use } from "react";
import { useExecutions } from "@/hooks/useExecutions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDuration } from "@/lib/utils";
import { Loader2, Activity } from "lucide-react";
import type { Execution } from "@/types";

export default function ExecutionsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const { data, isLoading } = useExecutions(workspaceId);
  const executions: Execution[] = data?.data ?? data ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Execuções</h1>
        <p className="text-gray-400 text-sm mt-1">
          Histórico de todas as execuções do workspace
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : !executions.length ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma execução ainda</p>
          <p className="text-gray-600 text-sm mt-1">
            Execute um flow para ver o histórico aqui
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Flow
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Trigger
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Iniciado em
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Duração
                </th>
              </tr>
            </thead>
            <tbody>
              {executions.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-gray-300 font-mono text-xs">
                      {ex.flowId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ex.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 capitalize">
                      {ex.triggeredBy}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {ex.startedAt ? formatDate(ex.startedAt) : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {formatDuration(ex.durationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
