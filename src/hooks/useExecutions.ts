import { useQuery, useMutation } from "@tanstack/react-query";
import { executionsApi } from "@/lib/api";

export const executionKeys = {
  list: (workspaceId: string, filters?: object) =>
    ["executions", workspaceId, "list", filters] as const,
  byFlow: (workspaceId: string, flowId: string) =>
    ["executions", workspaceId, flowId] as const,
  stats: (workspaceId: string, flowId: string) =>
    ["executions", workspaceId, flowId, "stats"] as const,
  detail: (workspaceId: string, flowId: string, executionId: string) =>
    ["executions", workspaceId, flowId, executionId] as const,
};

export function useExecutions(
  workspaceId: string,
  params?: { flowId?: string; status?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: executionKeys.list(workspaceId, params),
    queryFn: () => executionsApi.list(workspaceId, params),
    enabled: !!workspaceId,
    refetchInterval: 15_000,
  });
}

export function useFlowExecutions(
  workspaceId: string,
  flowId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: executionKeys.byFlow(workspaceId, flowId),
    queryFn: () => executionsApi.listByFlow(workspaceId, flowId, params),
    enabled: !!workspaceId && !!flowId,
    refetchInterval: 10_000,
  });
}

export function useExecutionStats(workspaceId: string, flowId: string) {
  return useQuery({
    queryKey: executionKeys.stats(workspaceId, flowId),
    queryFn: () => executionsApi.stats(workspaceId, flowId),
    enabled: !!workspaceId && !!flowId,
    refetchInterval: 15_000,
  });
}

export function useCancelExecution(workspaceId: string, flowId: string) {
  return useMutation({
    mutationFn: (executionId: string) =>
      executionsApi.cancel(workspaceId, flowId, executionId),
  });
}

export function useReExecute(workspaceId: string, flowId: string) {
  return useMutation({
    mutationFn: (executionId: string) =>
      executionsApi.reExecute(workspaceId, flowId, executionId),
  });
}
