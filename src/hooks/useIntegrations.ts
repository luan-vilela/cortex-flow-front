import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsApi } from "@/lib/api";
import type { CreateIntegrationDto, UpdateIntegrationDto } from "@/types";

export const integrationKeys = {
  all: (workspaceId: string) => ["integrations", workspaceId] as const,
  list: (workspaceId: string) =>
    [...integrationKeys.all(workspaceId), "list"] as const,
  detail: (workspaceId: string, id: string) =>
    [...integrationKeys.all(workspaceId), id] as const,
  usage: (workspaceId: string) =>
    [...integrationKeys.all(workspaceId), "usage"] as const,
  executions: (workspaceId: string, id: string) =>
    [...integrationKeys.detail(workspaceId, id), "executions"] as const,
};

export function useIntegrations(workspaceId: string) {
  return useQuery({
    queryKey: integrationKeys.list(workspaceId),
    queryFn: () => integrationsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useIntegration(workspaceId: string, id: string) {
  return useQuery({
    queryKey: integrationKeys.detail(workspaceId, id),
    queryFn: () => integrationsApi.get(workspaceId, id),
    enabled: !!workspaceId && !!id,
  });
}

export function useIntegrationUsage(workspaceId: string) {
  return useQuery({
    queryKey: integrationKeys.usage(workspaceId),
    queryFn: () => integrationsApi.usage(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useIntegrationExecutions(workspaceId: string, id: string) {
  return useQuery({
    queryKey: integrationKeys.executions(workspaceId, id),
    queryFn: () => integrationsApi.executions(workspaceId, id),
    enabled: !!workspaceId && !!id,
  });
}

export function useCreateIntegration(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIntegrationDto) =>
      integrationsApi.create(workspaceId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: integrationKeys.all(workspaceId) }),
  });
}

export function useUpdateIntegration(workspaceId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIntegrationDto) =>
      integrationsApi.update(workspaceId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: integrationKeys.detail(workspaceId, id),
      });
      qc.invalidateQueries({ queryKey: integrationKeys.list(workspaceId) });
    },
  });
}

export function useDeleteIntegration(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationsApi.delete(workspaceId, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: integrationKeys.all(workspaceId) }),
  });
}
