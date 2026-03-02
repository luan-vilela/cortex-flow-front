import type { NodeDefinition } from "../types";
import { CATEGORIES, PROVIDERS, PRODUCTS } from "../taxonomy";
import HttpRequestNode from "@/components/flow-editor/nodes/automation/native/HttpRequestNode";
import HttpResponseNode from "@/components/flow-editor/nodes/automation/native/HttpResponseNode";

export const AUTOMATION_NODES: NodeDefinition[] = [
  {
    type: "httpRequestNode",
    label: "HTTP Request",
    icon: "🌐",
    description:
      "Faz chamadas HTTP GET, POST, PUT, PATCH ou DELETE para qualquer endpoint. Suporta autenticação Bearer, Basic Auth e API Key, headers customizados e corpo JSON.",
    category: CATEGORIES.AUTOMATION.id,
    provider: PROVIDERS.NATIVE.id,
    product: PRODUCTS.WEBHOOK_OUT,
    variant: "work",
    color: CATEGORIES.AUTOMATION.color,
    component: HttpRequestNode,
  },
  {
    type: "httpResponseNode",
    label: "HTTP Response",
    icon: "↩️",
    description:
      "Encerra o fluxo enviando uma resposta HTTP com status code, Content-Type e corpo configuráveis. Suporta variáveis dinâmicas no corpo.",
    category: CATEGORIES.AUTOMATION.id,
    provider: PROVIDERS.NATIVE.id,
    product: PRODUCTS.WEBHOOK_OUT,
    variant: "end",
    color: CATEGORIES.AUTOMATION.color,
    component: HttpResponseNode,
  },
];
