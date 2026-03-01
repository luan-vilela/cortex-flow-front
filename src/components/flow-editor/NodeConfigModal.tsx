"use client";
import { useCallback, useEffect } from "react";
import type { Node } from "@xyflow/react";
import NodeConfigPanel from "./NodeConfigPanel";

interface Props {
  node: Node | null;
  onClose: () => void;
  onUpdateData: (id: string, newData: Record<string, unknown>) => void;
  workspaceId: string;
  flowId: string;
}

export default function NodeConfigModal({
  node,
  onClose,
  onUpdateData,
  workspaceId,
  flowId,
}: Props) {
  // Fecha ao pressionar Escape
  useEffect(() => {
    if (!node) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [node, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Configuração do Node
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body — reusa o NodeConfigPanel */}
        <div className="flex-1 overflow-y-auto">
          <NodeConfigPanel
            node={node}
            onUpdateData={onUpdateData}
            workspaceId={workspaceId}
            flowId={flowId}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            As alterações são aplicadas automaticamente · Salve o flow para persistir
          </p>
        </div>
      </div>
    </div>
  );
}
