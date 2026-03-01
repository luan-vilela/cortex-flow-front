import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesApi } from "@/lib/api";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspaceKeys.all, "list"] as const,
  detail: (id: string) => [...workspaceKeys.all, id] as const,
  members: (id: string) => [...workspaceKeys.detail(id), "members"] as const,
  n8nStatus: (id: string) =>
    [...workspaceKeys.detail(id), "n8n-status"] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: workspacesApi.list,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => workspacesApi.get(id),
    enabled: !!id,
  });
}

export function useWorkspaceMembers(id: string) {
  return useQuery({
    queryKey: workspaceKeys.members(id),
    queryFn: () => workspacesApi.members(id),
    enabled: !!id,
  });
}

export function useN8nStatus(id: string) {
  return useQuery({
    queryKey: workspaceKeys.n8nStatus(id),
    queryFn: () => workspacesApi.n8nStatus(id),
    enabled: !!id,
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useConfigureN8n(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { n8nBaseUrl?: string; n8nApiKey?: string }) =>
      workspacesApi.configureN8n(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: workspaceKeys.n8nStatus(id) });
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      workspacesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.list() }),
  });
}

export function useUpdateWorkspace(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => workspacesApi.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(id) }),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workspacesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: workspaceKeys.list() }),
  });
}
