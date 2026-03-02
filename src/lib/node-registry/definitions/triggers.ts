import type { NodeDefinition } from "../types";
import { CATEGORIES, PROVIDERS, PRODUCTS } from "../taxonomy";
import TriggerNode from "@/components/flow-editor/nodes/triggers/native/TriggerNode";

export const TRIGGER_NODES: NodeDefinition[] = [
  {
    type: "triggerNode",
    label: "Gatilho",
    icon: "⚡",
    description:
      "Ponto de entrada do flow. Suporta acionamento manual, webhook HTTP ou agendamento cron.",
    category: CATEGORIES.TRIGGERS.id,
    provider: PROVIDERS.NATIVE.id,
    product: PRODUCTS.TRIGGER,
    variant: "start",
    color: CATEGORIES.TRIGGERS.color,
    component: TriggerNode,
  },
];
