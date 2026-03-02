import type { CategoryDef, ProviderDef } from "./types";
import type { FlowNodeColor } from "@/components/flow-editor/FlowNode";

// ── Categories ─────────────────────────────────────────────────────────────────
// Macro functional domains. Each category gets a color — nodes on the canvas
// inherit this color unless overridden in the NodeDefinition.
//
// Add new categories here as the platform grows.
// Never use a provider name (e.g. "Google") or tool name (e.g. "Gmail") as category.
// ──────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = {
  TRIGGERS: {
    id: "TRIGGERS",
    label: "Gatilhos",
    icon: "⚡",
    color: "emerald" satisfies FlowNodeColor,
    order: 0,
  },
  COMMUNICATION: {
    id: "COMMUNICATION",
    label: "Comunicação",
    icon: "✉️",
    color: "rose" satisfies FlowNodeColor,
    order: 1,
  },
  SOCIAL: {
    id: "SOCIAL",
    label: "Social",
    icon: "📱",
    color: "pink" satisfies FlowNodeColor,
    order: 2,
  },
  AI: {
    id: "AI",
    label: "Inteligência Artificial",
    icon: "🤖",
    color: "violet" satisfies FlowNodeColor,
    order: 3,
  },
  DATA: {
    id: "DATA",
    label: "Dados",
    icon: "🗄️",
    color: "blue" satisfies FlowNodeColor,
    order: 4,
  },
  AUTOMATION: {
    id: "AUTOMATION",
    label: "Automação",
    icon: "⚙️",
    color: "orange" satisfies FlowNodeColor,
    order: 5,
  },
  FINANCIAL: {
    id: "FINANCIAL",
    label: "Financeiro",
    icon: "💳",
    color: "sky" satisfies FlowNodeColor,
    order: 6,
  },
  CRM: {
    id: "CRM",
    label: "CRM",
    icon: "👥",
    color: "indigo" satisfies FlowNodeColor,
    order: 7,
  },
} as const satisfies Record<string, CategoryDef>;

// ── Providers ──────────────────────────────────────────────────────────────────
// Service owners / brands. A provider can span multiple categories.
// E.g. Google has nodes in COMMUNICATION (Gmail), DATA (Sheets), AI (Gemini).
// ──────────────────────────────────────────────────────────────────────────────

export const PROVIDERS = {
  NATIVE: {
    id: "NATIVE",
    label: "Cortex Flow",
  },
  GOOGLE: {
    id: "GOOGLE",
    label: "Google",
  },
  META: {
    id: "META",
    label: "Meta",
  },
  MICROSOFT: {
    id: "MICROSOFT",
    label: "Microsoft",
  },
  OPENAI: {
    id: "OPENAI",
    label: "OpenAI",
  },
  ANTHROPIC: {
    id: "ANTHROPIC",
    label: "Anthropic",
  },
  WHATSAPP: {
    id: "WHATSAPP",
    label: "WhatsApp",
  },
  TWILIO: {
    id: "TWILIO",
    label: "Twilio",
  },
  STRIPE: {
    id: "STRIPE",
    label: "Stripe",
  },
  HUBSPOT: {
    id: "HUBSPOT",
    label: "HubSpot",
  },
  SALESFORCE: {
    id: "SALESFORCE",
    label: "Salesforce",
  },
} as const satisfies Record<string, ProviderDef>;

// ── Products ───────────────────────────────────────────────────────────────────
// Specific tools/APIs. Use these constants to avoid typos in NodeDefinitions.
// Pattern: PROVIDER_PRODUCT (e.g. GOOGLE_GMAIL, META_INSTAGRAM)
// ──────────────────────────────────────────────────────────────────────────────

export const PRODUCTS = {
  // Native
  TRIGGER: "trigger",
  DELAY: "delay",
  CONDITION: "condition",
  LOOP: "loop",
  WEBHOOK_IN: "webhook-in",
  WEBHOOK_OUT: "webhook-out",
  CODE: "code",
  // Google
  GOOGLE_GMAIL: "gmail",
  GOOGLE_SHEETS: "google-sheets",
  GOOGLE_DRIVE: "google-drive",
  GOOGLE_CALENDAR: "google-calendar",
  GOOGLE_GEMINI: "gemini",
  // Meta
  META_INSTAGRAM: "instagram",
  META_FACEBOOK: "facebook",
  META_WHATSAPP: "whatsapp-business",
  // Microsoft
  MS_OUTLOOK: "outlook",
  MS_TEAMS: "teams",
  MS_EXCEL: "excel",
  // OpenAI
  OPENAI_GPT: "gpt",
  OPENAI_ASSISTANT: "openai-assistant",
  OPENAI_WHISPER: "whisper",
  // Anthropic
  CLAUDE: "claude",
  // Twilio
  TWILIO_SMS: "sms",
  TWILIO_VOICE: "voice",
  // Stripe
  STRIPE_PAYMENT: "stripe-payment",
  STRIPE_SUBSCRIPTION: "stripe-subscription",
  // HubSpot
  HUBSPOT_CONTACT: "hubspot-contact",
  HUBSPOT_DEAL: "hubspot-deal",
} as const;

export type ProductId = (typeof PRODUCTS)[keyof typeof PRODUCTS];
