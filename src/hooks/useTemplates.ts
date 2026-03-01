import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api";
import type { InstallTemplateDto } from "@/types";

export const templateKeys = {
  all: () => ["templates"] as const,
  detail: (id: number) => ["templates", id] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.all(),
    queryFn: () => templatesApi.list(),
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templatesApi.get(id),
    enabled: !!id,
  });
}

export function useInstallTemplate(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InstallTemplateDto) =>
      templatesApi.install(workspaceId, data),
    onSuccess: () => {
      // Invalida lista de flows para que o novo flow apareça
      qc.invalidateQueries({ queryKey: ["flows", workspaceId] });
    },
  });
}
