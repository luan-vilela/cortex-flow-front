/**
 * Node Registry — Single source of truth for all nodes in Cortex Flow.
 *
 * To add a new node:
 *   1. Create (or edit) the appropriate file in definitions/
 *   2. Import and spread it into NODE_REGISTRY below
 *   3. That's it — palette, editor, and config panel pick it up automatically
 */
import type { NodeDefinition } from "./types";
import { CATEGORIES, PROVIDERS } from "./taxonomy";
import { TRIGGER_NODES } from "./definitions/triggers";
import { COMMUNICATION_NODES } from "./definitions/communication";
import { AUTOMATION_NODES } from "./definitions/automation";
import { withNodeShell } from "@/components/flow-editor/NodeShell";

// ── Registry ───────────────────────────────────────────────────────────────────
export const NODE_REGISTRY: NodeDefinition[] = [
  ...TRIGGER_NODES,
  ...COMMUNICATION_NODES,
  ...AUTOMATION_NODES,
];

// ── NODE_TYPES_MAP ─────────────────────────────────────────────────────────────
export const NODE_TYPES_MAP: Record<string, NodeDefinition["component"]> =
  Object.fromEntries(
    NODE_REGISTRY.map((def) => [def.type, withNodeShell(def.component)]),
  );

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getNodeDef(type: string): NodeDefinition | undefined {
  return NODE_REGISTRY.find((def) => def.type === type);
}

export function getByCategory(categoryId: string): NodeDefinition[] {
  return NODE_REGISTRY.filter((def) => def.category === categoryId).sort(
    (a, b) => a.label.localeCompare(b.label),
  );
}

export function getByProvider(providerId: string): NodeDefinition[] {
  return NODE_REGISTRY.filter((def) => def.provider === providerId).sort(
    (a, b) => a.label.localeCompare(b.label),
  );
}

type CategoryDef = (typeof CATEGORIES)[keyof typeof CATEGORIES];
type ProviderDef = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export interface GroupedCategory {
  category: CategoryDef;
  providers: Array<{
    provider: ProviderDef;
    nodes: NodeDefinition[];
  }>;
}

/**
 * Returns the registry grouped by category (in display order),
 * sub-grouped by provider within each category.
 */
export function getRegistryGrouped(): GroupedCategory[] {
  const sortedCategories = Object.values(CATEGORIES).sort(
    (a, b) => a.order - b.order,
  );

  const result: GroupedCategory[] = [];

  for (const category of sortedCategories) {
    const categoryNodes = getByCategory(category.id);
    if (categoryNodes.length === 0) continue;

    const providerMap = new Map<string, NodeDefinition[]>();
    for (const node of categoryNodes) {
      const existing = providerMap.get(node.provider) ?? [];
      existing.push(node);
      providerMap.set(node.provider, existing);
    }

    const providers = Array.from(providerMap.entries()).map(
      ([providerId, nodes]) => ({
        provider: (PROVIDERS as Record<string, ProviderDef>)[providerId] ?? {
          id: providerId,
          label: providerId,
        },
        nodes,
      }),
    );

    result.push({ category, providers });
  }

  return result;
}

// ── Re-exports ─────────────────────────────────────────────────────────────────
export { CATEGORIES, PROVIDERS, PRODUCTS } from "./taxonomy";
export type { NodeDefinition } from "./types";
