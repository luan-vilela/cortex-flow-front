"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { flowsApi } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CronBuilder, { parseCron } from "@/components/flow-editor/CronBuilder";

const NODERED_URL =
  process.env.NEXT_PUBLIC_NODERED_URL || "http://localhost:5679";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}

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

export default function TriggerNodeConfig({
  nodeId,
  workspaceId,
  flowId,
  data,
  onChange,
}: Props) {
  const isWebhook = data.triggerType === "webhook";
  const { data: webhookInfo, isLoading: loadingInfo } = useQuery({
    queryKey: ["webhookInfo", workspaceId, flowId],
    queryFn: () => flowsApi.getWebhookInfo(workspaceId, flowId),
    enabled: isWebhook && !!workspaceId && !!flowId,
    staleTime: 30_000,
  });

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
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
            Agendamento
          </label>
          <Tabs
            defaultValue={
              parseCron((data.cronExpression as string) || "")
                ? "visual"
                : "expression"
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="visual" className="flex-1 gap-1">
                🎛️ Visual
              </TabsTrigger>
              <TabsTrigger value="expression" className="flex-1 gap-1">
                ⌨️ Expressão cron
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual">
              <CronBuilder
                value={(data.cronExpression as string) || "0 8 * * *"}
                onChange={(expr) => onChange({ ...data, cronExpression: expr })}
              />
            </TabsContent>

            <TabsContent value="expression">
              <div>
                <input
                  type="text"
                  placeholder="0 8 * * 1-5"
                  value={(data.cronExpression as string) || ""}
                  onChange={(e) =>
                    onChange({ ...data, cronExpression: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Formato:{" "}
                  <code className="bg-gray-100 rounded px-0.5">
                    minuto hora dia mês dia-semana
                  </code>
                  <br />
                  Ex:{" "}
                  <code className="bg-gray-100 rounded px-0.5">
                    0 8 * * 1-5
                  </code>{" "}
                  → Seg–Sex às 8h
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
