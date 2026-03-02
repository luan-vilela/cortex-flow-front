import type { NodeDefinition } from "../types";
import { CATEGORIES, PROVIDERS, PRODUCTS } from "../taxonomy";
import GmailNode from "@/components/flow-editor/nodes/communication/google/GmailNode";

export const COMMUNICATION_NODES: NodeDefinition[] = [
  {
    type: "gmailNode",
    label: "Gmail",
    icon: "✉",
    description:
      "Envia e-mails via conta Gmail conectada por OAuth. Suporta assunto, corpo HTML, CC e BCC.",
    category: CATEGORIES.COMMUNICATION.id,
    provider: PROVIDERS.GOOGLE.id,
    product: PRODUCTS.GOOGLE_GMAIL,
    variant: "work",
    color: CATEGORIES.COMMUNICATION.color,
    component: GmailNode,
  },
];
