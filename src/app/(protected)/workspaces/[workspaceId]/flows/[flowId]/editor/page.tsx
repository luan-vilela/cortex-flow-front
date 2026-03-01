"use client";
import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlowEditor } from "@/hooks/useFlowEditor";
import TriggerNode from "@/components/flow-editor/nodes/TriggerNode";
import EmailConnectionNode from "@/components/flow-editor/nodes/EmailConnectionNode";
import EmailBodyNode from "@/components/flow-editor/nodes/EmailBodyNode";
import SendEmailNode from "@/components/flow-editor/nodes/SendEmailNode";
import NodeConfigModal from "@/components/flow-editor/NodeConfigModal";
import NodePalette from "@/components/flow-editor/NodePalette";

const NODE_TYPES = {
  triggerNode: TriggerNode,
  emailConnectionNode: EmailConnectionNode,
  emailBodyNode: EmailBodyNode,
  sendEmailNode: SendEmailNode,
};

// ── Inner component (needs to be inside ReactFlowProvider to use useReactFlow) ──
function EditorContent({
  workspaceId,
  flowId,
}: {
  workspaceId: string;
  flowId: string;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTestInput, setShowTestInput] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const testInputRef = useRef<HTMLInputElement>(null);

  const {
    flow,
    isLoading,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    updateNodeData,
    saveNodes,
    isSaving,
    publishFlow,
    isPublishing,
    testFlow,
    isTesting,
    testResult,
    clearTestResult,
  } = useFlowEditor(workspaceId, flowId);

  const onConnect = useCallback(
    (connection: Connection) => {
      onEdgesChange([
        {
          type: "add",
          item: {
            ...connection,
            id: `e-${connection.source}-${connection.target}`,
          } as Edge,
        },
      ]);
    },
    [onEdgesChange],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleUpdateNodeData = useCallback(
    (id: string, data: Record<string, unknown>) => {
      updateNodeData(id, data);
      setSelectedNode((prev) =>
        prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev,
      );
    },
    [updateNodeData],
  );

  // ── Drag-and-drop from palette ──────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/cortex-node-type");
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: Node = {
        id: crypto.randomUUID(),
        type: nodeType,
        position,
        data: {},
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-500">Flow não encontrado</p>
        <Link
          href={`/workspaces/${workspaceId}/flows`}
          className="text-indigo-600 underline text-sm"
        >
          Voltar
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    draft: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm">
        <Link
          href={`/workspaces/${workspaceId}/flows`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <span>←</span>
          <span>Flows</span>
        </Link>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{flow.icon || "⚡"}</span>
          <h1 className="font-semibold text-gray-900 truncate">{flow.name}</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[flow.status] || "bg-gray-100 text-gray-600"}`}
          >
            {flow.status === "active"
              ? "Ativo"
              : flow.status === "draft"
                ? "Rascunho"
                : "Inativo"}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* ── Botão Testar com dropdown de email ── */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTestInput((v) => !v);
                clearTestResult();
                setTimeout(() => testInputRef.current?.focus(), 50);
              }}
              disabled={isTesting || isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
            >
              {isTesting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>▶️</span>
              )}
              {isTesting ? "Testando..." : "Testar"}
            </button>

            {showTestInput && !isTesting && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Email de destino (teste)
                </p>
                <div className="flex gap-2">
                  <input
                    ref={testInputRef}
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && testEmail) {
                        setShowTestInput(false);
                        testFlow({ to: testEmail });
                      }
                    }}
                    placeholder="destino@email.com"
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => {
                      if (!testEmail) return;
                      setShowTestInput(false);
                      testFlow({ to: testEmail });
                    }}
                    disabled={!testEmail}
                    className="px-3 py-1.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    ▶
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Os campos{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {"{{variavel}}"}
                  </code>{" "}
                  serão substituídos pelos dados de teste.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => saveNodes()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>💾</span>
            )}
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={() => publishFlow()}
            disabled={isPublishing || flow.status === "active"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPublishing ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>🚀</span>
            )}
            {isPublishing
              ? "Publicando..."
              : flow.status === "active"
                ? "Publicado"
                : "Publicar"}
          </button>
        </div>
      </header>

      {/* ── Painel resultado do teste ──────────────────────────────────────────── */}
      {testResult && (
        <div
          className={`flex items-start gap-3 px-4 py-3 border-b text-sm ${
            testResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="text-lg mt-0.5">
            {testResult.success ? "✅" : "❌"}
          </span>
          <div className="flex-1 min-w-0">
            {testResult.success ? (
              <p className="font-medium">
                Flow executado com sucesso!{" "}
                {testResult.data?.to && (
                  <span className="font-normal opacity-75">
                    → Email enviado para <strong>{testResult.data.to}</strong>
                  </span>
                )}
              </p>
            ) : (
              <div>
                <p className="font-medium">Erro na execução</p>
                <p className="mt-0.5 opacity-90 break-words">
                  {testResult.error}
                </p>
                {testResult.enableUrl && (
                  <a
                    href={testResult.enableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors text-xs"
                  >
                    🔗 Clique aqui para habilitar a API no Google Cloud
                  </a>
                )}
              </div>
            )}
          </div>
          <button
            onClick={clearTestResult}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Editor Layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Canvas ──────────────────────────────────────────────────────── */}
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2, stroke: "#a5b4fc" },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls
              position="bottom-left"
              className="!border-gray-200 !shadow-sm"
            />
            <MiniMap
              position="bottom-right"
              nodeStrokeWidth={3}
              className="!border-gray-200 !shadow-sm !rounded-xl"
            />
          </ReactFlow>
        </div>

        {/* ── Node Palette (right) ─────────────────────────────────────────── */}
        <NodePalette />
      </div>

      {/* ── Node Config Modal ────────────────────────────────────────────────── */}
      <NodeConfigModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onUpdateData={handleUpdateNodeData}
        workspaceId={workspaceId}
        flowId={flowId}
      />
    </div>
  );
}

// ── Outer page (provides ReactFlowProvider context) ──────────────────────────
export default function FlowEditorPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const flowId = params.flowId as string;

  return (
    <ReactFlowProvider>
      <EditorContent workspaceId={workspaceId} flowId={flowId} />
    </ReactFlowProvider>
  );
}
