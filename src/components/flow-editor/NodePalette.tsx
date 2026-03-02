"use client";
import { useMemo, useState } from "react";
import type { FlowNodeColor, FlowNodeVariant } from "./FlowNode";
import { NODE_REGISTRY, getRegistryGrouped } from "@/lib/node-registry";
import type { NodeDefinition } from "@/lib/node-registry";

// ── Color / shape maps (mirrors FlowNode Tailwind classes) ─────────────────────
const COLOR_BG: Record<FlowNodeColor, string> = {
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  sky: "bg-sky-500",
  gray: "bg-gray-500",
};

const COLOR_TEXT: Record<FlowNodeColor, string> = {
  emerald: "text-emerald-700",
  violet: "text-violet-700",
  blue: "text-blue-700",
  orange: "text-orange-700",
  indigo: "text-indigo-700",
  rose: "text-rose-700",
  pink: "text-pink-700",
  sky: "text-sky-700",
  gray: "text-gray-700",
};

const COLOR_BG_LIGHT: Record<FlowNodeColor, string> = {
  emerald: "bg-emerald-50",
  violet: "bg-violet-50",
  blue: "bg-blue-50",
  orange: "bg-orange-50",
  indigo: "bg-indigo-50",
  rose: "bg-rose-50",
  pink: "bg-pink-50",
  sky: "bg-sky-50",
  gray: "bg-gray-50",
};

const SHAPE_CLASS: Record<FlowNodeVariant, string> = {
  start: "rounded-l-[999px] rounded-r-lg",
  work: "rounded-lg",
  end: "rounded-l-lg rounded-r-[999px]",
};

// ── Draggable Node Item ────────────────────────────────────────────────────────
function DraggableNode({ def }: { def: NodeDefinition }) {
  const color = (def.color ?? "gray") as FlowNodeColor;

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/cortex-node-type", def.type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={def.description}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-gray-50 group"
    >
      <div
        className={`w-7 h-7 shrink-0 ${COLOR_BG[color]} ${SHAPE_CLASS[def.variant]} flex items-center justify-center text-white text-xs shadow-sm group-hover:scale-105 transition-transform`}
      >
        {def.icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-700 leading-tight truncate">
          {def.label}
        </span>
        <span className="text-[10px] text-gray-400 leading-tight truncate">
          {def.description}
        </span>
      </div>
    </div>
  );
}

// ── Category Accordion Section ─────────────────────────────────────────────────
function CategorySection({
  category,
  providers,
  defaultOpen,
}: {
  category: ReturnType<typeof getRegistryGrouped>[number]["category"];
  providers: ReturnType<typeof getRegistryGrouped>[number]["providers"];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const color = category.color as FlowNodeColor;
  const totalNodes = providers.reduce((acc, p) => acc + p.nodes.length, 0);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${open ? COLOR_BG_LIGHT[color] : ""}`}
      >
        <span className="text-sm">{category.icon}</span>
        <span
          className={`flex-1 text-xs font-bold uppercase tracking-wider ${open ? COLOR_TEXT[color] : "text-gray-500"}`}
        >
          {category.label}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          {totalNodes}
        </span>
        <span
          className={`text-gray-400 text-xs transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="pb-1">
          {providers.map(({ provider, nodes }) => (
            <div key={provider.id}>
              {providers.length > 1 && (
                <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {provider.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              {nodes.map((def) => (
                <DraggableNode key={def.type} def={def} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Search Results ─────────────────────────────────────────────────────────────
function SearchResults({ query }: { query: string }) {
  const q = query.toLowerCase();
  const results = useMemo(
    () =>
      NODE_REGISTRY.filter(
        (def) =>
          def.label.toLowerCase().includes(q) ||
          def.description.toLowerCase().includes(q) ||
          def.product.toLowerCase().includes(q) ||
          def.type.toLowerCase().includes(q),
      ),
    [q],
  );

  if (results.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs text-gray-400">
        Nenhum node encontrado para{" "}
        <span className="font-medium">"{query}"</span>
      </div>
    );
  }

  return (
    <div className="py-1">
      {results.map((def) => (
        <DraggableNode key={def.type} def={def} />
      ))}
    </div>
  );
}

// ── Palette Root ───────────────────────────────────────────────────────────────
export default function NodePalette() {
  const [search, setSearch] = useState("");
  const grouped = useMemo(() => getRegistryGrouped(), []);

  return (
    <aside className="w-64 border-l border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 shrink-0">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Nodes
        </h2>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nodes..."
            className="w-full pl-7 pr-6 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 placeholder-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {search.trim() ? (
          <SearchResults query={search.trim()} />
        ) : (
          grouped.map(({ category, providers }, idx) => (
            <CategorySection
              key={category.id}
              category={category}
              providers={providers}
              defaultOpen={idx === 0}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-gray-100 shrink-0">
        <p className="text-[10px] text-gray-400 text-center">
          Arraste para o canvas
        </p>
      </div>
    </aside>
  );
}
