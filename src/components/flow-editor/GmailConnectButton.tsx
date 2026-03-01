"use client";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { gmailCredentialsApi, type GmailCredential } from "@/lib/api";

interface Props {
  workspaceId: string;
  flowId: string;
  /** ID do nó que possui a EmailConnection */
  nodeId: string;
  /** Credencial atualmente selecionada no nó */
  selectedCredentialId?: string;
  /** Chamado quando o usuário escolhe/conecta uma conta.
   * credentialId = UUID interno da credencial (usado pelo compilador via token endpoint)
   * email        = email da conta (exibição)
   * internalId   = UUID no banco local (mesmo que credentialId, mantido por compat)
   */
  onSelect: (credentialId: string, email: string, internalId: string) => void;
}

export default function GmailConnectButton({
  workspaceId,
  flowId,
  nodeId,
  selectedCredentialId,
  onSelect,
}: Props) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Lista de contas já conectadas neste workspace
  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["gmailCredentials", workspaceId],
    queryFn: () => gmailCredentialsApi.list(workspaceId),
  });

  // Inicia conexão OAuth Google
  const { mutate: startConnect, isPending: isConnecting } = useMutation({
    mutationFn: () => gmailCredentialsApi.connect(workspaceId, flowId, nodeId),
    onSuccess: ({ authUrl }) => {
      // Redireciona na mesma aba (window.open seria bloqueado pelo browser em callback async)
      window.location.href = authUrl;
    },
  });

  // Remove conta conectada
  const { mutate: deleteCred } = useMutation({
    mutationFn: (credId: string) =>
      gmailCredentialsApi.delete(workspaceId, credId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gmailCredentials", workspaceId],
      });
    },
  });

  // Processa retorno do OAuth (URL params injetados pelo backend após callback)
  useEffect(() => {
    const gmailCredId = searchParams.get("gmailCredId");
    const gmailEmail = searchParams.get("gmailEmail");
    const gmailNodeId = searchParams.get("gmailNodeId");

    if (gmailCredId && gmailEmail && gmailNodeId === nodeId) {
      // Seleciona automaticamente a credencial recém-conectada
      // Usa o UUID interno como credentialId — o compilador busca token pelo endpoint interno
      onSelect(gmailCredId, decodeURIComponent(gmailEmail), gmailCredId);

      // Remove os query params da URL sem recarregar a página
      queryClient.invalidateQueries({
        queryKey: ["gmailCredentials", workspaceId],
      });
      const params = new URLSearchParams(searchParams.toString());
      params.delete("gmailCredId");
      params.delete("gmailEmail");
      params.delete("gmailNodeId");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // selectedCredentialId é o UUID interno (gmailCredentialId no node data)
  const selectedCred = credentials.find((c) => c.id === selectedCredentialId);

  return (
    <div className="space-y-3">
      {/* Conta atualmente selecionada */}
      {selectedCred && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-green-600 text-sm">✓</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">
              {selectedCred.email}
            </p>
            {selectedCred.displayName && (
              <p className="text-xs text-green-600 truncate">
                {selectedCred.displayName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lista de outras contas disponíveis */}
      {isLoading ? (
        <p className="text-xs text-gray-400">Carregando contas...</p>
      ) : credentials.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Contas conectadas
          </p>
          {credentials.map((cred: GmailCredential) => (
            <div
              key={cred.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                cred.id === selectedCredentialId
                  ? "border-violet-400 bg-violet-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
              onClick={() => onSelect(cred.id, cred.email, cred.id)}
            >
              <span className="text-base">✉</span>
              <span className="flex-1 text-sm truncate">{cred.email}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Desconectar ${cred.email}?`)) {
                    deleteCred(cred.id);
                  }
                }}
                className="shrink-0 text-xs text-red-400 hover:text-red-600 px-1"
                title="Desconectar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Nenhuma conta Gmail conectada.</p>
      )}

      {/* Botão conectar nova conta */}
      <button
        type="button"
        disabled={isConnecting}
        onClick={() => startConnect()}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-violet-300 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"
      >
        {isConnecting ? (
          "Abrindo Google..."
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Conectar conta Gmail
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        A janela do Google será aberta para autorização. Após concluir, volte
        aqui.
      </p>
    </div>
  );
}
