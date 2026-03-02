"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { gmailCredentialsApi } from "@/lib/api";
import type { GmailNodeData } from "./GmailNode";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: GmailNodeData;
  onChange: (d: GmailNodeData) => void;
}

// ── Gmail SVG logo ─────────────────────────────────────────────────────────────
function GmailLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </svg>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

// ── Input base ─────────────────────────────────────────────────────────────────
function Input({
  placeholder,
  value,
  onChange,
  required,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <input
      type="text"
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-shadow"
    />
  );
}

// ── Main config component ──────────────────────────────────────────────────────
export default function GmailNodeConfig({
  nodeId,
  workspaceId,
  flowId,
  data,
  onChange,
}: Props) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showCcBcc, setShowCcBcc] = useState(!!(data.ccEmail || data.bccEmail));

  // Credenciais disponíveis
  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["gmailCredentials", workspaceId],
    queryFn: () => gmailCredentialsApi.list(workspaceId),
  });

  // Iniciar OAuth
  const { mutate: startConnect, isPending: isConnecting } = useMutation({
    mutationFn: () => gmailCredentialsApi.connect(workspaceId, flowId, nodeId),
    onSuccess: ({ authUrl }) => {
      window.location.href = authUrl;
    },
  });

  // Processar retorno OAuth
  useEffect(() => {
    const gmailCredId = searchParams.get("gmailCredId");
    const gmailEmail = searchParams.get("gmailEmail");
    const gmailNodeId = searchParams.get("gmailNodeId");

    if (gmailCredId && gmailEmail && gmailNodeId === nodeId) {
      onChange({
        ...data,
        credentialId: gmailCredId,
        credentialName: decodeURIComponent(gmailEmail),
        gmailCredentialId: gmailCredId,
      });
      queryClient.invalidateQueries({
        queryKey: ["gmailCredentials", workspaceId],
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("gmailCredId");
      params.delete("gmailEmail");
      params.delete("gmailNodeId");
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const set = useCallback(
    (patch: Partial<GmailNodeData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );

  const selectedCred = credentials.find((c) => c.id === data.gmailCredentialId);

  return (
    <div className="space-y-5">
      {/* ── 1. Credencial ──────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Conta Gmail</SectionLabel>

        {/* Select de credenciais */}
        {isLoading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-2">
            {credentials.length > 0 && (
              <div className="relative">
                <select
                  value={data.gmailCredentialId || ""}
                  onChange={(e) => {
                    const cred = credentials.find(
                      (c) => c.id === e.target.value,
                    );
                    if (cred) {
                      set({
                        credentialId: cred.id,
                        credentialName: cred.email,
                        gmailCredentialId: cred.id,
                      });
                    } else {
                      set({
                        credentialId: undefined,
                        credentialName: undefined,
                        gmailCredentialId: undefined,
                      });
                    }
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-200 pl-8 pr-10 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-shadow cursor-pointer"
                >
                  <option value="">Selecione uma conta...</option>
                  {credentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.email}
                      {cred.displayName ? ` (${cred.displayName})` : ""}
                    </option>
                  ))}
                </select>
                {/* Gmail icon inside select */}
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                  <GmailLogo size={14} />
                </span>
                {/* Chevron */}
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  ▾
                </span>
              </div>
            )}

            {/* Badge conta selecionada */}
            {selectedCred && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
                <span className="text-rose-500 text-xs">✓</span>
                <span className="text-sm text-rose-700 font-medium truncate flex-1">
                  {selectedCred.email}
                </span>
              </div>
            )}

            {/* Conectar nova conta */}
            <button
              type="button"
              disabled={isConnecting}
              onClick={() => startConnect()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              {isConnecting ? (
                "Abrindo Google..."
              ) : (
                <>
                  <GmailLogo size={12} />
                  Conectar nova conta Gmail
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />

      {/* ── 2. Para ─────────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Para *</SectionLabel>
        <Input
          required
          placeholder="{{email}} ou destinatario@exemplo.com"
          value={data.toEmail || ""}
          onChange={(v) => set({ toEmail: v })}
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Use <code className="bg-gray-100 rounded px-0.5">{"{{email}}"}</code>{" "}
          para preenchimento dinâmico
        </p>
      </div>

      {/* ── 3. CC / BCC collapsible ──────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowCcBcc((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span
            className={`transition-transform ${showCcBcc ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          {showCcBcc ? "Ocultar" : "Adicionar"} CC / BCC
        </button>

        {showCcBcc && (
          <div className="mt-3 space-y-3 pl-3 border-l-2 border-gray-100">
            <div>
              <SectionLabel>CC</SectionLabel>
              <Input
                placeholder="cc@exemplo.com"
                value={data.ccEmail || ""}
                onChange={(v) => set({ ccEmail: v })}
              />
            </div>
            <div>
              <SectionLabel>BCC</SectionLabel>
              <Input
                placeholder="bcc@exemplo.com"
                value={data.bccEmail || ""}
                onChange={(v) => set({ bccEmail: v })}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100" />

      {/* ── 4. Assunto ──────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Assunto</SectionLabel>
        <Input
          placeholder="Ex: Olá, {{nome}}!"
          value={data.subject || ""}
          onChange={(v) => set({ subject: v })}
        />
      </div>

      {/* ── 5. Corpo ────────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Corpo do Email (HTML)</SectionLabel>
        <textarea
          rows={8}
          placeholder={
            "<p>Olá <strong>{{nome}}</strong>,</p>\n<p>Sua mensagem aqui.</p>"
          }
          value={data.body || ""}
          onChange={(e) => set({ body: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none transition-shadow"
        />
        <div className="mt-1.5 bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-400">
          Variáveis disponíveis:{" "}
          <code className="text-gray-600">{"{{nome}}"}</code>{" "}
          <code className="text-gray-600">{"{{email}}"}</code>{" "}
          <code className="text-gray-600">{"{{empresa}}"}</code>
        </div>
      </div>
    </div>
  );
}
