"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Check,
} from "lucide-react";
import { useInstallTemplate } from "@/hooks/useTemplates";
import type { FlowTemplate } from "@/types";
import { cn } from "@/lib/utils";

// ── Cron presets ─────────────────────────────────────────────────────────────
const CRON_PRESETS = [
  { label: "Diário às 08:00", value: "0 8 * * *" },
  { label: "Seg-sex às 08:00", value: "0 8 * * 1-5" },
  { label: "Semanal (seg às 09:00)", value: "0 9 * * 1" },
  { label: "Mensal (dia 1 às 09:00)", value: "0 9 1 * *" },
  { label: "Personalizado", value: "custom" },
];

// ── Zod schemas por step ──────────────────────────────────────────────────────
const step1Schema = z.object({
  cronExpression: z.string().min(1, "Agendamento obrigatório"),
  emailSubject: z.string().min(1, "Assunto obrigatório"),
  flowName: z.string().optional(),
});

const step2Schema = z.object({
  recipientsJson: z
    .string()
    .min(1, "Lista de destinatários obrigatória")
    .refine((val) => {
      try {
        const parsed = JSON.parse(val);
        return (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (r: unknown) =>
              typeof r === "object" && r !== null && "email" in (r as object),
          )
        );
      } catch {
        return false;
      }
    }, 'JSON inválido. Use o formato: [{"email":"a@b.com","message":"Olá!"}]'),
});

const step3Schema = z.object({
  credentialId: z.string().min(1, "ID da credencial obrigatório"),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;

interface Props {
  workspaceId: string;
  template: FlowTemplate;
  onClose: () => void;
}

const NODERED_URL =
  process.env.NEXT_PUBLIC_NODERED_URL || "http://localhost:5679";

// ── Simple Install Modal (para templates sem parâmetros) ──────────────────────
function SimpleInstallModal({ workspaceId, template, onClose }: Props) {
  const router = useRouter();
  const installTemplate = useInstallTemplate(workspaceId);
  const [flowName, setFlowName] = useState(template.name);

  const handleInstall = async () => {
    try {
      const newFlow = await installTemplate.mutateAsync({
        templateId: template.id,
        flowName: flowName || template.name,
        params: {},
      });
      toast.success("Template instalado!", {
        description: "Abrindo editor...",
      });
      onClose();
      router.push(
        `/workspaces/${workspaceId}/flows/${(newFlow as any).id}/editor`,
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Erro ao instalar template";
      toast.error("Falha na instalação", { description: message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${template.color}33` }}
            >
              {template.icon}
            </span>
            <h2 className="text-white font-semibold text-sm">
              {template.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">{template.description}</p>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Nome do flow
            </label>
            <input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder={template.name}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300">
            <p className="font-medium mb-1">O que vai acontecer</p>
            <ul className="space-y-0.5 text-indigo-400">
              <li>✓ Flow criado com 4 nodes pré-configurados</li>
              <li>✓ Editor visual abre automaticamente</li>
              <li>✓ Configure cada node e publique quando pronto</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInstall}
              disabled={installTemplate.isPending}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {installTemplate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                </>
              ) : (
                "Criar e Editar →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Modal (templates com parâmetros) ─────────────────────────────────────

export function InstallTemplateModal({
  workspaceId,
  template,
  onClose,
}: Props) {
  const router = useRouter();

  // Templates sem parâmetros → instalação simples (1 passo)
  if (!template.parametersSchema || template.parametersSchema.length === 0) {
    return (
      <SimpleInstallModal
        workspaceId={workspaceId}
        template={template}
        onClose={onClose}
      />
    );
  }
  const [step, setStep] = useState(1);
  const [cronPreset, setCronPreset] = useState(CRON_PRESETS[1].value); // seg-sex 08:00
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Form | null>(null);

  const installTemplate = useInstallTemplate(workspaceId);

  // ── Step 1 form ────────────────────────────────────────────
  const form1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      cronExpression: CRON_PRESETS[1].value,
      emailSubject: "Mensagem personalizada para você",
      flowName: "",
    },
  });

  // ── Step 2 form ────────────────────────────────────────────
  const form2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: { recipientsJson: "" },
  });

  // ── Step 3 form ────────────────────────────────────────────
  const form3 = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: { credentialId: "" },
  });

  // ── Handlers ────────────────────────────────────────────────
  const goStep1 = form1.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const goStep2 = form2.handleSubmit((data) => {
    setStep2Data(data);
    setStep(3);
  });

  const onInstall = form3.handleSubmit(async (data) => {
    if (!step1Data || !step2Data) return;
    try {
      const newFlow = await installTemplate.mutateAsync({
        templateId: template.id,
        flowName: step1Data.flowName || undefined,
        params: {
          CRON_EXPRESSION: step1Data.cronExpression,
          EMAIL_SUBJECT: step1Data.emailSubject,
          RECIPIENTS_JSON: step2Data.recipientsJson,
          CREDENTIAL_ID: data.credentialId,
        },
      });
      toast.success("Template instalado!", {
        description: "Abrindo editor...",
      });
      onClose();
      router.push(`/workspaces/${workspaceId}/flows/${newFlow.id}/editor`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Erro ao instalar template";
      toast.error("Falha na instalação", { description: message });
    }
  });

  // ── Parsed recipients for preview ─────────────────────────
  const rawJson = form2.watch("recipientsJson");
  let recipientsPreview: Array<{ email: string; message?: string }> = [];
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) recipientsPreview = parsed.slice(0, 3);
  } catch {
    // invalid json while typing — no preview
  }

  const cronValue = form1.watch("cronExpression");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${template.color}33` }}
            >
              {template.icon}
            </span>
            <div>
              <h2 className="text-white font-semibold text-sm">
                {template.name}
              </h2>
              <p className="text-gray-500 text-xs">Passo {step} de 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 py-3 border-b border-gray-800 gap-2">
          {[
            { n: 1, label: "Agendamento" },
            { n: 2, label: "Destinatários" },
            { n: 3, label: "Conta Google" },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  n < step
                    ? "bg-green-500 text-white"
                    : n === step
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-500",
                )}
              >
                {n < step ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span
                className={cn(
                  "text-xs",
                  n === step ? "text-gray-200" : "text-gray-600",
                )}
              >
                {label}
              </span>
              {n < 3 && <div className="flex-1 h-px bg-gray-800 ml-1" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Agendamento ───────────────────────────── */}
        {step === 1 && (
          <form onSubmit={goStep1} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Agendamento
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {CRON_PRESETS.filter((p) => p.value !== "custom").map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setCronPreset(p.value);
                      form1.setValue("cronExpression", p.value);
                    }}
                    className={cn(
                      "text-xs px-3 py-2 rounded-lg border transition-colors text-left",
                      cronPreset === p.value && cronValue === p.value
                        ? "border-purple-500 bg-purple-500/15 text-purple-300"
                        : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCronPreset("custom");
                    form1.setValue("cronExpression", "");
                  }}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border transition-colors text-left",
                    cronPreset === "custom"
                      ? "border-purple-500 bg-purple-500/15 text-purple-300"
                      : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300",
                  )}
                >
                  Personalizado
                </button>
              </div>

              {cronPreset === "custom" && (
                <input
                  {...form1.register("cronExpression")}
                  placeholder="ex: 0 8 * * 1-5"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              )}
              {form1.formState.errors.cronExpression && (
                <p className="text-red-400 text-xs mt-1">
                  {form1.formState.errors.cronExpression.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Assunto do email <span className="text-red-400">*</span>
              </label>
              <input
                {...form1.register("emailSubject")}
                placeholder="ex: Novidades da semana"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {form1.formState.errors.emailSubject && (
                <p className="text-red-400 text-xs mt-1">
                  {form1.formState.errors.emailSubject.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Nome do flow (opcional)
              </label>
              <input
                {...form1.register("flowName")}
                placeholder={`${template.name} (${new Date().toLocaleDateString("pt-BR")})`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Destinatários ─────────────────────────── */}
        {step === 2 && (
          <form onSubmit={goStep2} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Lista de destinatários (JSON){" "}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                {...form2.register("recipientsJson")}
                rows={5}
                placeholder={`[\n  {"email": "joao@email.com", "message": "Olá João!"},\n  {"email": "maria@email.com", "message": "Olá Maria!"}\n]`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono resize-none"
              />
              {form2.formState.errors.recipientsJson && (
                <p className="text-red-400 text-xs mt-1">
                  {form2.formState.errors.recipientsJson.message}
                </p>
              )}
            </div>

            {/* Preview */}
            {recipientsPreview.length > 0 && (
              <div className="bg-gray-800/60 rounded-lg p-3 space-y-1.5">
                <p className="text-xs text-gray-500 mb-2">
                  Preview ({recipientsPreview.length} de{" "}
                  {(() => {
                    try {
                      return JSON.parse(rawJson).length;
                    } catch {
                      return 0;
                    }
                  })()}{" "}
                  destinatários):
                </p>
                {recipientsPreview.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300 truncate">{r.email}</span>
                    {r.message && (
                      <span className="text-gray-600 truncate">
                        — {r.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Conta Google ──────────────────────────── */}
        {step === 3 && (
          <form onSubmit={onInstall} className="p-6 space-y-4">
            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
              <p className="text-blue-300 text-xs font-medium">
                Como configurar a conta Gmail:
              </p>
              <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                <li>Clique em "Conectar Gmail" no editor do flow</li>
                <li>Autorize com sua conta Google</li>
                <li>O ID da credencial será preenchido automaticamente</li>
              </ol>
              <a
                href={`${NODERED_URL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Abrir Node-RED
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                ID da credencial Gmail <span className="text-red-400">*</span>
              </label>
              <input
                {...form3.register("credentialId")}
                placeholder="ex: 12"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-gray-600 text-xs mt-1">
                ID da credencial Gmail criado via OAuth2
              </p>
              {form3.formState.errors.credentialId && (
                <p className="text-red-400 text-xs mt-1">
                  {form3.formState.errors.credentialId.message}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                type="submit"
                disabled={installTemplate.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {installTemplate.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Instalar flow
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
