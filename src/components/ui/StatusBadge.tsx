"use client";

import { cn } from "@/lib/utils";
import type { ExecutionStatus } from "@/types";

const statusConfig: Record<
  ExecutionStatus,
  { label: string; className: string }
> = {
  queued: { label: "Na fila", className: "bg-gray-100 text-gray-600" },
  running: { label: "Rodando", className: "bg-blue-100 text-blue-700" },
  success: { label: "Sucesso", className: "bg-green-100 text-green-700" },
  error: { label: "Erro", className: "bg-red-100 text-red-700" },
  canceled: { label: "Cancelado", className: "bg-orange-100 text-orange-700" },
};

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.queued;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
