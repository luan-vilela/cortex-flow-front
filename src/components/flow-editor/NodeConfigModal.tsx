"use client";
import { useCallback, useEffect, useState } from "react";
import type { Node } from "@xyflow/react";
import NodeConfigPanel from "./NodeConfigPanel";

interface Props {
  node: Node | null;
  onClose: () => void;
  onUpdateData: (id: string, newData: Record<string, unknown>) => void;
  onDeleteNode: (id: string) => void;
  workspaceId: string;
  flowId: string;
}

export default function NodeConfigModal({
  node,
  onClose,
  onUpdateData,
  onDeleteNode,
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

  const [showPreview, setShowPreview] = useState(true);

  if (!node) return null;

  const isGmail = node.type === "gmailNode";
  const gmailBody = isGmail
    ? String((node.data as Record<string, unknown>).body ?? "")
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center gap-4"
      onClick={handleBackdropClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl mx-0 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Configuração do Node
          </span>
          <div className="flex items-center gap-2">
            {isGmail && (
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  showPreview
                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span>{showPreview ? "◼" : "◻"}</span>
                Preview
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
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
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onDeleteNode(node.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <span>🗑</span>
            Remover node
          </button>
          <p className="text-xs text-gray-400 text-right">
            Salve o flow para persistir
          </p>
        </div>
      </div>

      {/* Preview HTML — só para gmailNode, painel externo à direita */}
      {isGmail && showPreview && (
        <div
          className="relative z-10 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[85vh]"
          style={{ width: 420 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Preview do Email
            </span>
            <span className="text-[11px] text-gray-300">
              HTML em tempo real
            </span>
          </div>
          <div className="flex-1 overflow-hidden rounded-b-2xl">
            <iframe
              srcDoc={
                gmailBody ||
                `<p style="color:#ccc;font-family:sans-serif;padding:24px;margin:0">Escreva o HTML no campo ao lado...</p>`
              }
              sandbox="allow-same-origin"
              className="w-full h-full border-0"
              style={{ minHeight: 400 }}
              title="Preview do email"
            />
          </div>
        </div>
      )}
    </div>
  );
}
