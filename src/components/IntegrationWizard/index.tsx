"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  Loader2,
  Plug,
} from "lucide-react";
import { useGmailCredentials } from "@/hooks/useCredentials";
import { integrationsApi } from "@/lib/api";
import { integrationKeys } from "@/hooks/useIntegrations";
import type { Integration } from "@/types";

interface Props {
  workspaceId: string;
  templateSlug: string;
  templateName: string;
  templateIcon?: string;
  templateColor?: string;
  onClose: () => void;
}

type ChannelType = "email" | "whatsapp" | "custom";

const channelForTemplate: Record<string, ChannelType> = {
  "email-blast": "email",
  "email-single": "email",
  "whatsapp-agent": "whatsapp",
  "custom-webhook": "custom",
  "asaas-charge": "custom",
};

const defaultVarsForTemplate: Record<string, Record<string, string>> = {
  "email-blast": {
    subject: "Olá, {{name}}!",
    body: "<p>Olá <strong>{{name}}</strong>,</p><p>{{message}}</p>",
    from_name: "Cortex Flow",
  },
};

const steps = ["Nome", "Credencial", "Mensagem", "Endpoint"];

export function IntegrationWizard({
  workspaceId,
  templateSlug,
  templateName,
  templateIcon = "⚡",
  templateColor = "#6366f1",
  onClose,
}: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(`Meu ${templateName}`);
  const [credentialId, setCredentialId] = useState<string>("");
  const [vars, setVars] = useState<Record<string, string>>(
    defaultVarsForTemplate[templateSlug] ?? {},
  );
  const [createdIntegration, setCreatedIntegration] =
    useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const channel = channelForTemplate[templateSlug] ?? "custom";
  const needsCredential = channel === "email";

  const { data: gmailCredentials = [], isLoading: credsLoading } =
    useGmailCredentials(workspaceId);

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return !needsCredential || credentialId !== "";
    if (step === 2) return true;
    return false;
  };

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await integrationsApi.create(workspaceId, {
        name: name.trim(),
        templateSlug,
        channel,
        credentialId: credentialId || undefined,
        defaultVars: vars,
      });
      setCreatedIntegration(result);
      qc.invalidateQueries({ queryKey: integrationKeys.all(workspaceId) });
      setStep(3);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Erro ao criar integração";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      handleCreate();
    } else {
      setStep((s) => s + 1);
    }
  };

  const copyUrl = () => {
    if (createdIntegration?.triggerUrl) {
      navigator.clipboard.writeText(createdIntegration.triggerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${templateColor}22` }}
            >
              {templateIcon}
            </div>
            <div>
              <p className="text-xs text-gray-500">Configurando</p>
              <h2 className="text-sm font-semibold text-white">
                {templateName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-6 py-3 bg-gray-900/50 border-b border-gray-800/50">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < step
                      ? "bg-emerald-600 text-white"
                      : i === step
                        ? "text-white"
                        : "bg-gray-800 text-gray-600"
                  }`}
                  style={i === step ? { backgroundColor: templateColor } : {}}
                >
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${i === step ? "text-white" : "text-gray-600"}`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-800 mx-3" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[260px]">
          {step === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome da integração
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Email Marketing Mensal"
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Dê um nome descritivo para identificar esta integração.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Conta Gmail
              </label>
              {credsLoading ? (
                <div className="flex items-center gap-2 text-gray-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Carregando credenciais...</span>
                </div>
              ) : gmailCredentials.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-center">
                  <Plug className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-2">
                    Nenhuma conta Gmail conectada
                  </p>
                  <a
                    href={`/workspaces/${workspaceId}/settings`}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Conectar conta Gmail →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {gmailCredentials.map((cred) => (
                    <button
                      key={cred.id}
                      onClick={() => setCredentialId(cred.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                        credentialId === cred.id
                          ? "border-purple-500 bg-purple-500/10 text-white"
                          : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-sm">
                        📧
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cred.email}
                        </p>
                        {cred.displayName && (
                          <p className="text-xs text-gray-500 truncate">
                            {cred.displayName}
                          </p>
                        )}
                      </div>
                      {credentialId === cred.id && (
                        <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Assunto padrão
                </label>
                <input
                  type="text"
                  value={vars.subject ?? ""}
                  onChange={(e) =>
                    setVars((v) => ({ ...v, subject: e.target.value }))
                  }
                  placeholder="Olá, {{name}}!"
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Corpo do email (HTML)
                </label>
                <textarea
                  value={vars.body ?? ""}
                  onChange={(e) =>
                    setVars((v) => ({ ...v, body: e.target.value }))
                  }
                  rows={5}
                  placeholder="<p>Olá <strong>{{name}}</strong></p>"
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 font-mono resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Nome do remetente
                </label>
                <input
                  type="text"
                  value={vars.from_name ?? ""}
                  onChange={(e) =>
                    setVars((v) => ({ ...v, from_name: e.target.value }))
                  }
                  placeholder="Cortex Flow"
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-xs text-gray-600">
                Use <code className="text-purple-400">{`{{variavel}}`}</code>{" "}
                para campos dinâmicos fornecidos por recipient.
              </p>
            </div>
          )}

          {step === 3 && createdIntegration && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Integração criada!
                  </p>
                  <p className="text-xs text-gray-500">
                    Seu endpoint está pronto para receber requisições
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  URL do webhook
                </label>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5">
                  <code className="flex-1 text-xs text-emerald-400 truncate">
                    {createdIntegration.triggerUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="shrink-0 text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Exemplo de requisição
                </label>
                <pre className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-32">
                  {`curl -X POST ${createdIntegration.triggerUrl} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    createdIntegration.examplePayload ?? {
      recipients: [{ email: "joao@empresa.com", name: "João" }],
      vars: { subject: "Olá!", message: "Mensagem de exemplo" },
    },
    null,
    2,
  )}'`}
                </pre>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          {step < 3 ? (
            <>
              <button
                onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                {step > 0 && <ChevronLeft className="w-4 h-4" />}
                {step === 0 ? "Cancelar" : "Voltar"}
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canProceed() ? templateColor : undefined,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : step === 2 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Criar integração
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-lg text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
