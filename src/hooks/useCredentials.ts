import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { credentialsApi, gmailCredentialsApi } from "@/lib/api";

export const credentialKeys = {
  all: (workspaceId: string) => ["credentials", workspaceId] as const,
  gmail: (workspaceId: string) =>
    [...credentialKeys.all(workspaceId), "gmail"] as const,
};

export function useCredentials(workspaceId: string) {
  return useQuery({
    queryKey: credentialKeys.all(workspaceId),
    queryFn: () => credentialsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useGmailCredentials(workspaceId: string) {
  return useQuery({
    queryKey: credentialKeys.gmail(workspaceId),
    queryFn: () => gmailCredentialsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useDeleteCredential(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) =>
      credentialsApi.delete(workspaceId, credentialId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: credentialKeys.all(workspaceId) }),
  });
}
