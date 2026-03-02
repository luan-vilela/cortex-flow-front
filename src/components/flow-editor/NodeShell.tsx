"use client";

/**
 * NodeShell — "casca" compartilhada por todos os nós do canvas.
 *
 * Responsabilidades:
 *  - Exibir toolbar de ações ao passar o mouse (habilitar/desabilitar + excluir)
 *  - Gerenciar o estado de hover com tolerância ao gap entre nó e toolbar
 *
 * Uso: aplicado automaticamente em NODE_TYPES_MAP via withNodeShell().
 * Nenhum nó precisa importar ou conhecer este componente diretamente.
 */

import { useState, useRef, useCallback, memo } from "react";
import { type NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import type { ComponentType } from "react";

export function withNodeShell<P extends NodeProps>(Inner: ComponentType<P>) {
  function NodeShellWrapper(props: P) {
    const nodeId = useNodeId();
    const { deleteElements, setNodes } = useReactFlow();
    const [hovered, setHovered] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToolbar = useCallback(() => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setHovered(true);
    }, []);

    const hideToolbar = useCallback(() => {
      hoverTimer.current = setTimeout(() => setHovered(false), 150);
    }, []);

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeId) deleteElements({ nodes: [{ id: nodeId }] });
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeId) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, disabled: !n.data.disabled } }
              : n,
          ),
        );
      }
    };

    const disabled = !!(props.data as Record<string, unknown>).disabled;

    return (
      <div
        style={{ overflow: "visible", position: "relative" }}
        onMouseEnter={showToolbar}
        onMouseLeave={hideToolbar}
      >
        {/* ── Hover action toolbar ── */}
        {hovered && (
          <div
            className="absolute flex items-center gap-0.5 bg-white rounded-full shadow-lg border border-gray-100 px-1.5 py-1 z-50"
            style={{
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={showToolbar}
            onMouseLeave={hideToolbar}
          >
            {/* Toggle habilitar/desabilitar */}
            <button
              type="button"
              title={disabled ? "Habilitar nó" : "Desabilitar nó"}
              onClick={handleToggle}
              className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                disabled
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              {disabled ? (
                /* play → reabilitar */
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                >
                  <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.532L5.305 13.533A1.5 1.5 0 0 1 3 12.267z" />
                </svg>
              ) : (
                /* power → desabilitar */
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M8 2v4M5.07 4.07a5 5 0 1 0 5.86 0" />
                </svg>
              )}
            </button>

            <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

            {/* Excluir */}
            <button
              type="button"
              title="Excluir nó"
              onClick={handleDelete}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3.5 4l.9 8.1a.5.5 0 0 0 .5.4h6.2a.5.5 0 0 0 .5-.4L12.5 4" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Conteúdo do nó ── */}
        <Inner {...props} />
      </div>
    );
  }

  NodeShellWrapper.displayName = `NodeShell(${Inner.displayName ?? Inner.name ?? "Node"})`;
  return memo(NodeShellWrapper);
}
