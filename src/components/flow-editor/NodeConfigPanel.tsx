"use client";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Node } from "@xyflow/react";
import { flowsApi } from "@/lib/api";
import GmailConnectButton from "./GmailConnectButton";

const NODERED_URL =
  process.env.NEXT_PUBLIC_NODERED_URL || "http://localhost:5679";

interface Props {
  node: Node | null;
  onUpdateData: (id: string, newData: Record<string, unknown>) => void;
  workspaceId: string;
  flowId: string;
}

// ── Copy Button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

// ── Trigger Config ─────────────────────────────────────────────────────────────
function TriggerConfig({
  nodeId,
  workspaceId,
  flowId,
  data,
  onChange,
}: {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  // Busca as URLs reais do backend (respeita a configuração do workspace)
  const isWebhook = data.triggerType === "webhook";
  const { data: webhookInfo, isLoading: loadingInfo } = useQuery({
    queryKey: ["webhookInfo", workspaceId, flowId],
    queryFn: () => flowsApi.getWebhookInfo(workspaceId, flowId),
    enabled: isWebhook && !!workspaceId && !!flowId,
    staleTime: 30_000,
  });

  // Fallback client-side enquanto não há dados do back (antes do primeiro Salvar)
  const webhookPath = (data.webhookPath as string) || nodeId;
  const fallbackTestUrl = `${NODERED_URL}/webhook/${webhookPath}`;
  const fallbackProdUrl = `${NODERED_URL}/webhook/${webhookPath}`;

  const testUrl = webhookInfo?.testUrl || fallbackTestUrl;
  const prodUrl = webhookInfo?.prodUrl || fallbackProdUrl;
  const method = (data.httpMethod as string) || "POST";
  const isActive = webhookInfo?.isActive ?? false;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Tipo de acionamento
        </label>
        <select
          value={(data.triggerType as string) || "manual"}
          onChange={(e) => onChange({ ...data, triggerType: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="manual">Manual (botão)</option>
          <option value="webhook">Webhook (chamada HTTP)</option>
          <option value="cron">Agendamento (Cron)</option>
        </select>
      </div>

      {data.triggerType === "webhook" && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Método HTTP
            </label>
            <div className="flex gap-2">
              {(["POST", "GET"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...data, httpMethod: m })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    ((data.httpMethod as string) || "POST") === m
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">
              URL de Teste
            </label>
            {loadingInfo ? (
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="flex-1 text-xs font-mono text-gray-700 break-all">
                  {testUrl}
                </span>
                <CopyButton text={testUrl} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">
              URL de Produção
            </label>
            {loadingInfo ? (
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="flex-1 text-xs font-mono text-gray-700 break-all">
                    {prodUrl}
                  </span>
                  <CopyButton text={prodUrl} />
                </div>
                {!isActive && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Ativa somente após{" "}
                    <span className="font-semibold">Publicar</span> o flow.
                  </p>
                )}
                {isActive && (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ Flow ativo — URL de produção funcionando
                  </p>
                )}
              </>
            )}
          </div>

          <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-700">
            <p className="font-semibold mb-1">Como usar</p>
            <ol className="list-decimal list-inside space-y-1 text-emerald-600">
              <li>Copie a URL de teste acima</li>
              <li>
                Faça uma chamada <span className="font-mono">{method}</span>{" "}
                para ela
              </li>
              <li>O flow será acionado automaticamente</li>
            </ol>
            {!webhookInfo?.hasTrigger && (
              <p className="mt-2 text-amber-600 text-xs">
                ⚠️ Salve o flow para ativar as URLs definitivas do Node-RED.
              </p>
            )}
          </div>
        </>
      )}

      {data.triggerType === "cron" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Expressão Cron
          </label>
          <input
            type="text"
            placeholder="0 8 * * 1-5"
            value={(data.cronExpression as string) || ""}
            onChange={(e) =>
              onChange({ ...data, cronExpression: e.target.value })
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Exemplo: 0 8 * * 1-5 → Seg-Sex às 8h
          </p>
        </div>
      )}
    </div>
  );
}

// ── Email Connection Config ────────────────────────────────────────────────────
function EmailConnectionConfig({
  nodeId,
  workspaceId,
  flowId,
  data,
  onChange,
}: {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
          Conta Gmail
        </label>
        <GmailConnectButton
          workspaceId={workspaceId}
          flowId={flowId}
          nodeId={nodeId}
          selectedCredentialId={(data.gmailCredentialId as string) || undefined}
          onSelect={(credentialId, email, internalId) =>
            onChange({
              ...data,
              credentialId, // UUID → compilador busca token via endpoint interno
              credentialName: email,
              gmailCredentialId: internalId, // UUID interno → rastrear seleção na UI
            })
          }
        />
      </div>
    </div>
  );
}

// ── Email Body Config ──────────────────────────────────────────────────────────
function EmailBodyConfig({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Assunto
        </label>
        <input
          type="text"
          placeholder="Ex: Olá, {{nome}}!"
          value={(data.subject as string) || ""}
          onChange={(e) => onChange({ ...data, subject: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Corpo do Email (HTML)
        </label>
        <textarea
          rows={8}
          placeholder={`<p>Olá <strong>{{nome}}</strong>,</p>\n<p>Sua mensagem aqui.</p>`}
          value={(data.body as string) || ""}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
        <p className="font-semibold mb-1">Variáveis disponíveis</p>
        <p className="font-mono">
          {"{{nome}}"} {"{{email}}"} {"{{empresa}}"}
        </p>
        <p className="text-blue-500 mt-1">
          Insira variáveis nos dados de entrada ao executar o flow
        </p>
      </div>
    </div>
  );
}

// ── Send Email Config ──────────────────────────────────────────────────────────
function SendEmailConfig({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Para (destinatário) *
        </label>
        <input
          type="text"
          placeholder="{{email}} ou email@exemplo.com"
          value={(data.toEmail as string) || ""}
          onChange={(e) => onChange({ ...data, toEmail: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Use {"{{email}}"} para preenchimento dinâmico
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          CC (opcional)
        </label>
        <input
          type="text"
          placeholder="cc@exemplo.com"
          value={(data.ccEmail as string) || ""}
          onChange={(e) => onChange({ ...data, ccEmail: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          BCC (opcional)
        </label>
        <input
          type="text"
          placeholder="bcc@exemplo.com"
          value={(data.bccEmail as string) || ""}
          onChange={(e) => onChange({ ...data, bccEmail: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
    </div>
  );
}

// ── Panel Titles ───────────────────────────────────────────────────────────────
const titles: Record<string, { label: string; icon: string; color: string }> = {
  triggerNode: { label: "Início", icon: "▶", color: "text-emerald-600" },
  emailConnectionNode: {
    label: "Conexão Gmail",
    icon: "🔌",
    color: "text-violet-600",
  },
  emailBodyNode: {
    label: "Corpo do Email",
    icon: "📝",
    color: "text-blue-600",
  },
  sendEmailNode: {
    label: "Enviar Email",
    icon: "📨",
    color: "text-orange-600",
  },
};

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function NodeConfigPanel({
  node,
  onUpdateData,
  workspaceId,
  flowId,
}: Props) {
  const handleChange = useCallback(
    (newData: Record<string, unknown>) => {
      if (node) onUpdateData(node.id, newData);
    },
    [node, onUpdateData],
  );

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="text-4xl mb-3">👆</div>
        <p className="text-sm font-medium text-gray-500">
          Clique em um node para configurá-lo
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Cada node tem configurações específicas
        </p>
      </div>
    );
  }

  const meta = titles[node.type || ""] || {
    label: node.type,
    icon: "⚙",
    color: "text-gray-600",
  };
  const data = (node.data || {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h3 className={`font-semibold text-sm ${meta.color}`}>
            {meta.label}
          </h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          ID: {node.id.slice(0, 8)}
        </p>
      </div>

      {/* Config form */}
      <div className="flex-1 overflow-y-auto p-4">
        {node.type === "triggerNode" && (
          <TriggerConfig
            nodeId={node.id}
            workspaceId={workspaceId}
            flowId={flowId}
            data={data}
            onChange={handleChange}
          />
        )}
        {node.type === "emailConnectionNode" && (
          <EmailConnectionConfig
            nodeId={node.id}
            workspaceId={workspaceId}
            flowId={flowId}
            data={data}
            onChange={handleChange}
          />
        )}
        {node.type === "emailBodyNode" && (
          <EmailBodyConfig data={data} onChange={handleChange} />
        )}
        {node.type === "sendEmailNode" && (
          <SendEmailConfig data={data} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}
