import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flowsApi } from "@/lib/api";
import type { CreateFlowDto } from "@/types";

export const flowKeys = {
  all: (workspaceId: string) => ["flows", workspaceId] as const,
  list: (workspaceId: string, filters?: object) =>
    [...flowKeys.all(workspaceId), "list", filters] as const,
  detail: (workspaceId: string, flowId: string) =>
    [...flowKeys.all(workspaceId), flowId] as const,
};

export function useFlows(
  workspaceId: string,
  filters?: { status?: string; search?: string },
) {
  return useQuery({
    queryKey: flowKeys.list(workspaceId, filters),
    queryFn: () => flowsApi.list(workspaceId, filters),
    enabled: !!workspaceId,
  });
}

export function useFlow(workspaceId: string, flowId: string) {
  return useQuery({
    queryKey: flowKeys.detail(workspaceId, flowId),
    queryFn: () => flowsApi.get(workspaceId, flowId),
    enabled: !!workspaceId && !!flowId,
  });
}

export function useCreateFlow(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlowDto) => flowsApi.create(workspaceId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) }),
  });
}

export function useUpdateFlow(workspaceId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => flowsApi.update(workspaceId, flowId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: flowKeys.detail(workspaceId, flowId) });
      qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) });
    },
  });
}

export function useDeleteFlow(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.delete(workspaceId, flowId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) }),
  });
}

export function useActivateFlow(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.activate(workspaceId, flowId),
    onSuccess: (_, flowId) =>
      qc.invalidateQueries({ queryKey: flowKeys.detail(workspaceId, flowId) }),
  });
}

export function useDeactivateFlow(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.deactivate(workspaceId, flowId),
    onSuccess: (_, flowId) =>
      qc.invalidateQueries({ queryKey: flowKeys.detail(workspaceId, flowId) }),
  });
}

export function useExecuteFlow(workspaceId: string) {
  return useMutation({
    mutationFn: ({
      flowId,
      inputData,
    }: {
      flowId: string;
      inputData?: object;
    }) => flowsApi.execute(workspaceId, flowId, inputData),
  });
}

export function useDuplicateFlow(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowId: string) => flowsApi.duplicate(workspaceId, flowId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) }),
  });
}

export function useApplyTemplate(workspaceId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      templateId: number;
      params: Record<string, string>;
      flowName?: string;
    }) => flowsApi.applyTemplate(workspaceId, flowId, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: flowKeys.detail(workspaceId, flowId),
      });
      qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) });
    },
  });
}
