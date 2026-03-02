"use client";
import { Handle, Position } from "@xyflow/react";

// ── Color themes ───────────────────────────────────────────────────────────────
// All class strings written in full so Tailwind doesn't purge them.
const COLORS = {
  emerald: {
    iconBg: "bg-emerald-500",
    iconBgOff: "bg-emerald-300",
    ring: "ring-emerald-400",
    shadow: "shadow-emerald-200",
  },
  violet: {
    iconBg: "bg-violet-500",
    iconBgOff: "bg-violet-300",
    ring: "ring-violet-400",
    shadow: "shadow-violet-200",
  },
  blue: {
    iconBg: "bg-blue-500",
    iconBgOff: "bg-blue-300",
    ring: "ring-blue-400",
    shadow: "shadow-blue-200",
  },
  orange: {
    iconBg: "bg-orange-500",
    iconBgOff: "bg-orange-300",
    ring: "ring-orange-400",
    shadow: "shadow-orange-200",
  },
  indigo: {
    iconBg: "bg-indigo-500",
    iconBgOff: "bg-indigo-300",
    ring: "ring-indigo-400",
    shadow: "shadow-indigo-200",
  },
  rose: {
    iconBg: "bg-rose-500",
    iconBgOff: "bg-rose-300",
    ring: "ring-rose-400",
    shadow: "shadow-rose-200",
  },
  pink: {
    iconBg: "bg-pink-500",
    iconBgOff: "bg-pink-300",
    ring: "ring-pink-400",
    shadow: "shadow-pink-200",
  },
  sky: {
    iconBg: "bg-sky-500",
    iconBgOff: "bg-sky-300",
    ring: "ring-sky-400",
    shadow: "shadow-sky-200",
  },
  gray: {
    iconBg: "bg-gray-500",
    iconBgOff: "bg-gray-300",
    ring: "ring-gray-400",
    shadow: "shadow-gray-200",
  },
} as const;

// ── Shape per variant ──────────────────────────────────────────────────────────
const SHAPE: Record<FlowNodeVariant, string> = {
  start: "rounded-l-[999px] rounded-r-2xl",
  work: "rounded-2xl",
  end: "rounded-l-2xl rounded-r-[999px]",
};

// ── Public types ───────────────────────────────────────────────────────────────
export type FlowNodeColor = keyof typeof COLORS;
export type FlowNodeVariant = "start" | "work" | "end";

/** Defines a single handle (input or output). Use `id` to distinguish multiple handles. */
export interface HandleDef {
  id: string;
  /** Small pill label shown beside the handle dot */
  label?: string;
}

export interface FlowNodeProps {
  /** Shape: start (only output), work (input + output), end (only input) */
  variant: FlowNodeVariant;
  /** Accent color applied to the icon block */
  color: FlowNodeColor;
  /** Icon content — emoji, React element or SVG */
  icon: React.ReactNode;
  /** Short label shown below the icon */
  label: string;
  /**
   * When false, the icon block appears muted and a warning badge (!) is shown.
   * Defaults to true.
   */
  configured?: boolean;
  /** When true, node is visually dimmed and skipped in execution. */
  disabled?: boolean;
  /** Forwarded from ReactFlow's NodeProps.selected */
  selected?: boolean;
  /**
   * Input handle definitions (applies to "work" and "end" variants).
   * Defaults to a single handle [{ id: "input" }].
   */
  inputs?: HandleDef[];
  /**
   * Output handle definitions (applies to "start" and "work" variants).
   * Defaults to a single handle [{ id: "output" }].
   */
  outputs?: HandleDef[];
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FlowNode({
  variant,
  color,
  icon,
  label,
  configured = true,
  disabled = false,
  selected = false,
  inputs,
  outputs,
}: FlowNodeProps) {
  const theme = COLORS[color];
  const shape = SHAPE[variant];

  // Resolve handles based on variant defaults
  const resolvedInputs: HandleDef[] =
    variant !== "start" ? (inputs ?? [{ id: "input" }]) : [];
  const resolvedOutputs: HandleDef[] =
    variant !== "end" ? (outputs ?? [{ id: "output" }]) : [];

  return (
    /* Outer wrapper: just stacks icon row + label — no background */
    <div
      className="flex flex-col items-center gap-1.5 select-none"
      style={{ overflow: "visible" }}
    >
      {/* ── Icon block: this is the visual "body" of the node ── */}
      <div
        className={`relative flex items-center justify-center w-18 h-18 text-white text-2xl transition-all cursor-pointer ${shape} ${
          configured ? theme.iconBg : theme.iconBgOff
        } ${
          selected
            ? `ring-2 ring-offset-2 ${theme.ring} shadow-lg ${theme.shadow}`
            : "shadow-md hover:brightness-110"
        } ${disabled ? "opacity-40 grayscale" : ""}`}
        style={{ overflow: "visible" }}
      >
        {/* Icon */}
        {icon}

        {/* Unconfigured badge */}
        {!configured && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[9px] font-bold leading-none z-10">
            !
          </span>
        )}

        {/* Disabled badge */}
        {disabled && (
          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-[9px] leading-none z-10 text-white">
            ⊘
          </span>
        )}

        {/* ── Input handles (left side) — small gray dot, one per handle ── */}
        {resolvedInputs.map((h, i) => {
          const pct =
            resolvedInputs.length === 1
              ? 50
              : ((i + 1) / (resolvedInputs.length + 1)) * 100;
          return (
            <Handle
              key={h.id}
              type="target"
              position={Position.Left}
              id={h.id}
              style={{
                top: `${pct}%`,
                left: "-5px",
                transform: "translateY(-50%)",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#d1d5db",
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                cursor: "crosshair",
              }}
            />
          );
        })}

        {/* ── Output handles (right side) — small gray dot, one per handle ── */}
        {resolvedOutputs.map((h, i) => {
          const pct =
            resolvedOutputs.length === 1
              ? 50
              : ((i + 1) / (resolvedOutputs.length + 1)) * 100;
          return (
            <Handle
              key={h.id}
              type="source"
              position={Position.Right}
              id={h.id}
              style={{
                top: `${pct}%`,
                right: "-5px",
                transform: "translateY(-50%)",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: h.id === "error" ? "#f87171" : "#9ca3af",
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                cursor: "crosshair",
              }}
            >
              {h.label && (
                <span
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    whiteSpace: "nowrap",
                    fontSize: "9px",
                    fontWeight: 600,
                    lineHeight: 1,
                    padding: "2px 5px",
                    borderRadius: "999px",
                    background: h.id === "error" ? "#fee2e2" : "#f3f4f6",
                    color: h.id === "error" ? "#dc2626" : "#6b7280",
                    pointerEvents: "none",
                  }}
                >
                  {h.label}
                </span>
              )}
            </Handle>
          );
        })}
      </div>

      {/* ── Label below the node ── */}
      <p
        className={`text-[12px] font-semibold text-center leading-tight max-w-30 wrap-break-word ${disabled ? "text-gray-400 line-through" : "text-gray-600"}`}
      >
        {label}
      </p>
    </div>
  );
}
