"use client";

import { use } from "react";
import { useWorkspace } from "@/hooks/useWorkspaces";
import { ExternalLink } from "lucide-react";
import type { Workspace } from "@/types";

interface ExternalApi {
  id: string;
  name: string;
  description: string;
  logo: string;
  docsUrl: string;
  comingSoon?: boolean;
}

const EXTERNAL_APIS: ExternalApi[] = [
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    description: "Sincronize anúncios, pedidos e mensagens do Mercado Livre.",
    logo: "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadolibre/logo__large_plus@2x.png",
    docsUrl: "https://developers.mercadolivre.com.br/",
    comingSoon: true,
  },
  {
    id: "meta",
    name: "Meta (Facebook & Instagram)",
    description: "Capture leads de formulários do Facebook e Instagram Ads.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/320px-Meta_Platforms_Inc._logo.svg.png",
    docsUrl: "https://developers.facebook.com/",
    comingSoon: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Envie e receba mensagens via API oficial do WhatsApp.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/240px-WhatsApp.svg.png",
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
    comingSoon: true,
  },
  {
    id: "google",
    name: "Google (Gmail & Sheets)",
    description:
      "Envie e-mails via Gmail e leia/escreva dados em planilhas Google Sheets.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png",
    docsUrl: "https://developers.google.com/",
    comingSoon: true,
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Sincronize pedidos e produtos da sua loja Shopify.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/320px-Shopify_logo_2018.svg.png",
    docsUrl: "https://shopify.dev/",
    comingSoon: true,
  },
  {
    id: "asaas",
    name: "Asaas",
    description: "Gerencie cobranças, boletos e Pix direto da sua conta Asaas.",
    logo: "https://www.asaas.com/assets/images/asaas-logo-blue.svg",
    docsUrl: "https://docs.asaas.com/",
    comingSoon: true,
  },
];

export default function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const { data: workspace } = useWorkspace(workspaceId) as {
    data: Workspace | undefined;
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">{workspace?.name}</p>
      </div>

      {/* APIs Externas */}
      <div className="mb-6">
        <h2 className="text-white font-semibold mb-1">Integrações externas</h2>
        <p className="text-gray-500 text-sm mb-5">
          Conecte sua conta a plataformas externas para usar em automações.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {EXTERNAL_APIS.map((api) => (
            <div
              key={api.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={api.logo}
                  alt={api.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    {api.name}
                  </span>
                  {api.comingSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                      Em breve
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">
                  {api.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={api.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                  title="Ver documentação"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  disabled={api.comingSoon}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white disabled:hover:bg-gray-800 disabled:hover:text-gray-400"
                >
                  Conectar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace info */}
      <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
        <h2 className="text-white font-semibold mb-4">
          Informações do workspace
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">ID</dt>
            <dd className="text-gray-300 font-mono text-xs">
              {workspace?.id ?? "-"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Slug</dt>
            <dd className="text-gray-300">{workspace?.slug ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Criado em</dt>
            <dd className="text-gray-300">
              {workspace?.createdAt
                ? new Intl.DateTimeFormat("pt-BR").format(
                    new Date(workspace.createdAt),
                  )
                : "-"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
