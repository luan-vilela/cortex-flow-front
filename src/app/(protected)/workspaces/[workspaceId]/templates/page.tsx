"use client";

import { use, useState } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { Layout, Zap, Plug } from "lucide-react";
import type { FlowTemplate } from "@/types";
import { InstallTemplateModal } from "@/components/InstallTemplateModal";
import { IntegrationWizard } from "@/components/IntegrationWizard";

// Slugs que são "integrações SaaS" (wizard) vs "templates de flow" (install modal)
const INTEGRATION_SLUGS = new Set([
  "email-blast",
  "whatsapp-agent",
  "custom-webhook",
  "asaas-charge",
]);

/** Se o template não tem slug, tenta inferir pelo nome */
function getSlug(t: FlowTemplate): string {
  return (
    (t as FlowTemplate & { slug?: string }).slug ??
    t.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

/** Integrações são templates com triggerType webhook OU slug conhecido */
function isIntegrationTemplate(t: FlowTemplate): boolean {
  const slug = getSlug(t);
  return t.triggerType === "webhook" || INTEGRATION_SLUGS.has(slug);
}

const categoryIcons: Record<string, string> = {
  email: "📧",
  whatsapp: "💬",
  crm: "🤝",
  automation: "⚡",
  general: "🔧",
  financeiro: "💰",
  custom: "🔗",
};

const categoryLabels: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  crm: "CRM",
  automation: "Automação",
  general: "Geral",
  financeiro: "Financeiro",
  custom: "Personalizado",
};

interface WizardTarget {
  slug: string;
  name: string;
  icon?: string;
  color?: string;
}

export default function TemplatesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [selectedFlowTemplate, setSelectedFlowTemplate] =
    useState<FlowTemplate | null>(null);
  const [wizardTarget, setWizardTarget] = useState<WizardTarget | null>(null);

  const { data: templates, isLoading } = useTemplates();

  const integrationTemplates =
    templates?.filter((t: FlowTemplate) => isIntegrationTemplate(t)) ?? [];
  const flowTemplates =
    templates?.filter((t: FlowTemplate) => !isIntegrationTemplate(t)) ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Marketplace
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure automações prontas em minutos
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-44"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Integrations section */}
            {integrationTemplates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Plug className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Integrações via Webhook
                  </h2>
                  <span className="text-xs text-gray-600 ml-1">
                    — configure e receba um endpoint pronto
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrationTemplates.map((template: FlowTemplate) => (
                    <IntegrationCard
                      key={template.id}
                      template={template}
                      onConfigure={() =>
                        setWizardTarget({
                          slug: getSlug(template),
                          name: template.name,
                          icon: template.icon,
                          color: template.color,
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Flow templates section */}
            {flowTemplates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Templates de Flow
                  </h2>
                  <span className="text-xs text-gray-600 ml-1">
                    — instale e edite no editor visual
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flowTemplates.map((template: FlowTemplate) => (
                    <FlowTemplateCard
                      key={template.id}
                      template={template}
                      onInstall={() => setSelectedFlowTemplate(template)}
                    />
                  ))}
                </div>
              </section>
            )}

            {(templates?.length ?? 0) === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Zap className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-400 text-lg font-medium">
                  Nenhum template disponível
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Templates serão adicionados em breve
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Flow Install Modal */}
      {selectedFlowTemplate && (
        <InstallTemplateModal
          workspaceId={workspaceId}
          template={selectedFlowTemplate}
          onClose={() => setSelectedFlowTemplate(null)}
        />
      )}

      {/* Integration Wizard */}
      {wizardTarget && (
        <IntegrationWizard
          workspaceId={workspaceId}
          templateSlug={wizardTarget.slug}
          templateName={wizardTarget.name}
          templateIcon={wizardTarget.icon}
          templateColor={wizardTarget.color}
          onClose={() => setWizardTarget(null)}
        />
      )}
    </div>
  );
}

function IntegrationCard({
  template,
  onConfigure,
}: {
  template: FlowTemplate;
  onConfigure: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${template.color ?? "#6366f1"}22` }}
        >
          {template.icon ?? categoryIcons[template.category] ?? "⚡"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight">
            {template.name}
          </h3>
          <span className="text-xs text-gray-500 mt-0.5">
            {categoryLabels[template.category] ?? template.category}
            {" · "}
            Webhook
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed flex-1 mb-4 line-clamp-3">
        {template.description ?? "Sem descrição"}
      </p>

      <button
        onClick={onConfigure}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: template.color ?? "#6366f1" }}
      >
        Configurar
      </button>
    </div>
  );
}

function FlowTemplateCard({
  template,
  onInstall,
}: {
  template: FlowTemplate;
  onInstall: () => void;
}) {
  const paramsCount = template.parametersSchema?.length ?? 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${template.color}22` }}
        >
          {template.icon ?? categoryIcons[template.category] ?? "⚡"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm leading-tight truncate">
            {template.name}
          </h3>
          <span className="text-xs text-gray-500 mt-0.5">
            {categoryLabels[template.category] ?? template.category}
            {" · "}
            {paramsCount} parâmetro{paramsCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed flex-1 mb-4 line-clamp-3">
        {template.description ?? "Sem descrição"}
      </p>

      <div className="flex items-center gap-2 mb-4">
        {template.triggerType === "cron" && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
            🕐 Agendado
          </span>
        )}
        {template.triggerType === "webhook" && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
            🔗 Webhook
          </span>
        )}
        {template.triggerType === "manual" && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20">
            ▶ Manual
          </span>
        )}
      </div>

      <button
        onClick={onInstall}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: template.color ?? "#6366f1" }}
      >
        Instalar template
      </button>
    </div>
  );
}
