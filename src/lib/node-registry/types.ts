import type { ComponentType } from "react";
import type {
  FlowNodeColor,
  FlowNodeVariant,
} from "@/components/flow-editor/FlowNode";

// ── Dimension ID types ─────────────────────────────────────────────────────────
// Kept as `string` to avoid circular imports with taxonomy.ts.
// In practice, only values defined in CATEGORIES / PROVIDERS are valid.
export type CategoryId = string;
export type ProviderId = string;

// ── Category Definition ────────────────────────────────────────────────────────
export interface CategoryDef {
  id: CategoryId;
  label: string;
  /** Emoji or character icon shown in the palette section header */
  icon: string;
  /** Tailwind color token — drives node color on the canvas */
  color: FlowNodeColor;
  /** Order in the palette */
  order: number;
}

// ── Provider Definition ────────────────────────────────────────────────────────
export interface ProviderDef {
  id: ProviderId;
  label: string;
  /** Optional logo URL or base64 — shown as small badge in palette */
  logoUrl?: string;
}

// ── Node Definition ────────────────────────────────────────────────────────────
/**
 * The single source of truth for every node in the system.
 *
 * Dimensions:
 *   category  → macro functional domain  (e.g. COMMUNICATION)
 *   provider  → service owner / brand    (e.g. GOOGLE)
 *   product   → specific tool / API name (e.g. "gmail")
 *
 * Adding a new node = adding a new NodeDefinition to a definitions/*.ts file.
 * No other file needs to be touched.
 */
export interface NodeDefinition {
  /** ReactFlow node `type` key — must be unique across the entire registry */
  type: string;

  /** Human-readable name shown in palette and config panel */
  label: string;

  /** Emoji or short character icon */
  icon: string;

  /** One-line description shown in palette tooltip / search results */
  description: string;

  // ── Taxonomy ──────────────────────────────────────────────────────────────
  category: CategoryId;
  provider: ProviderId;
  /**
   * Product/tool string — free-form, lowercase, kebab-case.
   * E.g.: "gmail", "google-sheets", "whatsapp", "gpt-4"
   */
  product: string;

  // ── Visual ────────────────────────────────────────────────────────────────
  /**
   * Canvas node shape variant.
   * - "start"  → pill left (entry points / triggers)
   * - "work"   → rectangle (processing nodes)
   * - "end"    → pill right (output / action nodes)
   */
  variant: FlowNodeVariant;

  /**
   * Color is typically inherited from the category.
   * Can be overridden per node when needed.
   */
  color?: FlowNodeColor;

  // ── Runtime ───────────────────────────────────────────────────────────────
  /** The actual React component rendered inside the ReactFlow canvas */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
}
