"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useFlow,
  useActivateFlow,
  useDeactivateFlow,
  useApplyTemplate,
} from "@/hooks/useFlows";
import { flowsApi } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Pause,
  Loader2,
  Mail,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  Users,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flow } from "@/types";

// ─── Tipos do wizard ─────────────────────────────────────────────────────────

type WizardData = {
  cronExpression: string;
  emailSubject: string;
  flowName: string;
  recipientsJson: string;
  credentialId: string;
};

const CRON_PRESETS = [
  { label: "Seg–Sex às 8h", value: "0 8 * * 1-5" },
  { label: "Todo dia às 8h", value: "0 8 * * *" },
  { label: "Segunda às 9h", value: "0 9 * * 1" },
  { label: "Dia 1 de cada mês", value: "0 8 1 * *" },
  { label: "Personalizado", value: "custom" },
];

const DEFAULT_RECIPIENTS = JSON.stringify(
  [
    {
      email: "contato@empresa.com",
      message: "<p>Olá! Aqui vai seu conteúdo.</p>",
    },
  ],
  null,
  2,
);

// ─── Componente principal ────────────────────────────────────────────────────

export default function FlowDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; flowId: string }>;
}) {
  const { workspaceId, flowId } = use(params);
  const router = useRouter();

  const {
    data: flow,
    isLoading,
    refetch,
  } = useFlow(workspaceId, flowId) as {
    data: Flow | undefined;
    isLoading: boolean;
    refetch: () => void;
  };

  const activateFlow = useActivateFlow(workspaceId);
  const deactivateFlow = useDeactivateFlow(workspaceId);
  const applyTemplate = useApplyTemplate(workspaceId, flowId);

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0); // 0=template pick, 1=cron+subject, 2=recipients, 3=credential
  const [cronPreset, setCronPreset] = useState(CRON_PRESETS[0].value);
  const [data, setData] = useState<WizardData>({
    cronExpression: CRON_PRESETS[0].value,
    emailSubject: "",
    flowName: "",
    recipientsJson: DEFAULT_RECIPIENTS,
    credentialId: "",
  });
  const [recipientsError, setRecipientsError] = useState<string | null>(null);

  // Pré-popula nome do flow
  useEffect(() => {
    if (flow && !data.flowName) {
      setData((d) => ({ ...d, flowName: flow.name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow?.name]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = async () => {
    if (!flow) return;
    try {
      if (flow.status === "active") {
        await deactivateFlow.mutateAsync(flowId);
        toast.success("Flow desativado");
      } else {
        await activateFlow.mutateAsync(flowId);
        toast.success("Flow ativado!");
      }
      refetch();
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleOpenInN8n = async () => {
    try {
      const { url } = await flowsApi.editorUrl(workspaceId, flowId);
      window.open(url, "_blank");
    } catch {
      toast.error("Não foi possível obter a URL do editor");
    }
  };

  const validateRecipients = () => {
    try {
      const parsed = JSON.parse(data.recipientsJson);
      if (!Array.isArray(parsed)) {
        setRecipientsError("Deve ser um array JSON: [{email, message}, ...]");
        return false;
      }
      const invalid = parsed.find(
        (r: any) =>
          typeof r.email !== "string" || typeof r.message !== "string",
      );
      if (invalid) {
        setRecipientsError(
          'Cada item precisa ter "email" e "message" como strings',
        );
        return false;
      }
      setRecipientsError(null);
      return true;
    } catch {
      setRecipientsError("JSON inválido");
      return false;
    }
  };

  const handleApply = async () => {
    if (!validateRecipients()) return;

    try {
      await applyTemplate.mutateAsync({
        templateId: 1,
        flowName: data.flowName || undefined,
        params: {
          CRON_EXPRESSION: data.cronExpression,
          EMAIL_SUBJECT: data.emailSubject,
          RECIPIENTS_JSON: data.recipientsJson,
          CREDENTIAL_ID: data.credentialId.trim(),
        },
      });
      toast.success("Template aplicado!", {
        description: "O flow foi criado e sincronizado com o Node-RED.",
      });
      setWizardOpen(false);
      setStep(0);
      refetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao aplicar template";
      toast.error("Falha ao aplicar template", { description: msg });
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="p-8 text-center text-gray-400">
        Flow não encontrado.{" "}
        <Link
          href={`/workspaces/${workspaceId}/flows`}
          className="text-purple-400 hover:underline"
        >
          Voltar
        </Link>
      </div>
    );
  }

  const isConfigured = !!flow.n8nWorkflowId;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/workspaces/${workspaceId}/flows`}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{flow.name}</h1>
          {flow.description && (
            <p className="text-gray-400 text-sm mt-0.5">{flow.description}</p>
          )}
        </div>
        <StatusBadge status={flow.status} />
      </div>

      {/* ── ESTADO CONFIGURADO ────────────────────────────────────────────── */}
      {isConfigured && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">
                Workflow configurado
              </span>
            </div>
            <dl className="space-y-3 text-sm mb-6">
              {flow.triggerType === "cron" && flow.cronExpression && (
                <InfoRow label="Agendamento" value={flow.cronExpression} />
              )}
              <InfoRow label="Tipo de trigger" value={flow.triggerType} />
              <InfoRow
                label="ID no Node-RED"
                value={flow.n8nWorkflowId ?? "-"}
                mono
              />
            </dl>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenInN8n}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Node-RED
              </button>
              <button
                onClick={handleToggle}
                disabled={activateFlow.isPending || deactivateFlow.isPending}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                  flow.status === "active"
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30",
                )}
              >
                {activateFlow.isPending || deactivateFlow.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : flow.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4" /> Desativar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Ativar automação
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setWizardOpen(true);
                  setStep(0);
                }}
                className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Reconfigurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ESTADO VAZIO ──────────────────────────────────────────────────── */}
      {!isConfigured && !wizardOpen && (
        <div className="text-center py-16 rounded-xl bg-gray-900 border border-dashed border-gray-700">
          <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-gray-300 font-medium mb-1">
            Nenhuma automação configurada
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Escolha um template para começar a desenhar o fluxo
          </p>
          <button
            onClick={() => {
              setWizardOpen(true);
              setStep(0);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Configurar com template
          </button>
        </div>
      )}

      {/* ── WIZARD ────────────────────────────────────────────────────────── */}
      {wizardOpen && (
        <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
          {/* Progress */}
          <div className="flex border-b border-gray-800">
            {[
              { icon: Mail, label: "Template" },
              { icon: Clock, label: "Agendamento" },
              { icon: Users, label: "Destinatários" },
              { icon: Key, label: "Credencial" },
            ].map((s, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors",
                  step === i
                    ? "border-purple-500 text-purple-400"
                    : step > i
                      ? "border-green-600 text-green-500"
                      : "border-transparent text-gray-600",
                )}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="p-6">
            {/* ── PASSO 0: Selecionar template ──────────────────────────── */}
            {step === 0 && (
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Escolha um template
                </h3>
                <p className="text-gray-500 text-sm mb-5">
                  Templates disponíveis para este flow
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-750 transition-colors text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                      Email Marketing por Cron
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Envia e-mails personalizados por lista de destinatários em
                      horário agendado
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                        email
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                        cron
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                        gmail
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </button>
              </div>
            )}

            {/* ── PASSO 1: Agendamento e assunto ────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Agendamento & Assunto
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Configure quando e o que será enviado
                  </p>
                </div>

                {/* Nome do flow */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Nome do flow
                  </label>
                  <input
                    value={data.flowName}
                    onChange={(e) =>
                      setData((d) => ({ ...d, flowName: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                {/* Cron presets */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Frequência de envio
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {CRON_PRESETS.filter((p) => p.value !== "custom").map(
                      (p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            setCronPreset(p.value);
                            setData((d) => ({ ...d, cronExpression: p.value }));
                          }}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left",
                            cronPreset === p.value
                              ? "bg-purple-600/20 border-purple-500 text-purple-300"
                              : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600",
                          )}
                        >
                          {p.label}
                        </button>
                      ),
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Expressão cron personalizada
                    </label>
                    <input
                      value={data.cronExpression}
                      onChange={(e) => {
                        setCronPreset("custom");
                        setData((d) => ({
                          ...d,
                          cronExpression: e.target.value,
                        }));
                      }}
                      placeholder="0 8 * * 1-5"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Assunto */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Assunto do e-mail <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={data.emailSubject}
                    onChange={(e) =>
                      setData((d) => ({ ...d, emailSubject: e.target.value }))
                    }
                    placeholder="Ex: Novidades da semana"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                <WizardNav
                  onBack={() => setStep(0)}
                  onNext={() => {
                    if (!data.emailSubject.trim()) {
                      toast.error("Informe o assunto do e-mail");
                      return;
                    }
                    if (!data.cronExpression.trim()) {
                      toast.error("Informe a expressão cron");
                      return;
                    }
                    setStep(2);
                  }}
                />
              </div>
            )}

            {/* ── PASSO 2: Destinatários ────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Destinatários
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Lista JSON com e-mail e mensagem personalizada por
                    destinatário
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Lista de destinatários (JSON){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={data.recipientsJson}
                    onChange={(e) => {
                      setData((d) => ({
                        ...d,
                        recipientsJson: e.target.value,
                      }));
                      setRecipientsError(null);
                    }}
                    rows={8}
                    className={cn(
                      "w-full px-3 py-2 bg-gray-800 border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono resize-none",
                      recipientsError ? "border-red-500" : "border-gray-700",
                    )}
                    placeholder='[{"email": "fulano@email.com", "message": "<p>Olá Fulano!</p>"}]'
                  />
                  {recipientsError && (
                    <p className="text-red-400 text-xs mt-1">
                      {recipientsError}
                    </p>
                  )}
                  <p className="text-gray-600 text-xs mt-1.5">
                    Cada item:{" "}
                    <code className="text-gray-500">
                      {'{ "email": "...", "message": "<html>..." }'}
                    </code>
                  </p>
                </div>

                {/* Preview */}
                <RecipientsPreview json={data.recipientsJson} />

                <WizardNav
                  onBack={() => setStep(1)}
                  onNext={() => {
                    if (validateRecipients()) setStep(3);
                  }}
                />
              </div>
            )}

            {/* ── PASSO 3: Credencial Gmail ─────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Conta Google (Gmail)
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Conecte sua conta Gmail via OAuth2. Você pode fazer isso
                    abrindo o editor do flow e clicando em{" "}
                    <strong className="text-gray-300">
                      Email Connection → Conectar Gmail
                    </strong>
                    .
                  </p>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                  <p className="font-medium mb-1">
                    Como obter o ID da credencial
                  </p>
                  <ol className="space-y-1 text-blue-400 text-xs list-decimal list-inside">
                    <li>Abra o editor do flow após salvar este wizard</li>
                    <li>
                      Clique no nó <strong>Email Connection</strong> e conecte
                      sua conta Gmail
                    </li>
                    <li>Após conectar, o ID será preenchido automaticamente</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    ID da credencial Gmail{" "}
                    <span className="text-gray-600">(opcional)</span>
                  </label>
                  <input
                    value={data.credentialId}
                    onChange={(e) =>
                      setData((d) => ({ ...d, credentialId: e.target.value }))
                    }
                    placeholder="UUID da credencial (preenchido pelo editor)"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <p className="text-gray-600 text-xs mt-1">
                    Disponível após conectar conta Gmail no editor do flow
                  </p>
                </div>

                {/* Nav final */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWizardOpen(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={applyTemplate.isPending}
                      className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {applyTemplate.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Aplicar template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-700 text-gray-300",
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={cn(
        "text-xs px-3 py-1.5 rounded-full font-medium",
        map[status] ?? "bg-gray-700 text-gray-300",
      )}
    >
      {status}
    </span>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn("text-gray-300", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Próximo <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function RecipientsPreview({ json }: { json: string }) {
  let items: Array<{ email: string; message: string }> = [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) items = parsed.slice(0, 3);
  } catch {
    return null;
  }

  if (!items.length) return null;

  return (
    <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
      <p className="text-xs text-gray-500 mb-2">
        Preview — {items.length} de{" "}
        {(() => {
          try {
            return JSON.parse(json).length;
          } catch {
            return "?";
          }
        })()}{" "}
        destinatários
      </p>
      <div className="space-y-1.5">
        {items.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 shrink-0">
              {r.email[0]?.toUpperCase()}
            </div>
            <span className="text-gray-300 text-xs truncate">{r.email}</span>
            <span className="text-gray-600 text-xs truncate flex-1">
              {r.message.replace(/<[^>]*>/g, "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
