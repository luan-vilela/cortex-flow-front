import { useCallback, useEffect, useRef, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flowsApi } from "@/lib/api";
import { toast } from "sonner";
import type { Flow } from "@/types";
import { flowKeys } from "./useFlows";

interface UseFlowEditorReturn {
  flow: Flow | undefined;
  isLoading: boolean;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  saveNodes: () => void;
  /** Replace all nodes+edges and immediately persist (used by import). */
  replaceNodesAndSave: (nodes: object[], edges: object[]) => Promise<void>;
  isSaving: boolean;
  publishFlow: () => void;
  isPublishing: boolean;
  isDirty: boolean;
  testFlow: (inputData?: object) => void;
  isTesting: boolean;
  testResult: {
    success: boolean;
    data?: any;
    error?: string;
    enableUrl?: string;
  } | null;
  clearTestResult: () => void;
}

export function useFlowEditor(
  workspaceId: string,
  flowId: string,
): UseFlowEditorReturn {
  const qc = useQueryClient();

  // ── Load flow ───────────────────────────────────────────────────────────────
  const { data: flow, isLoading } = useQuery<Flow>({
    queryKey: flowKeys.detail(workspaceId, flowId),
    queryFn: () => flowsApi.get(workspaceId, flowId),
    enabled: !!workspaceId && !!flowId,
  });

  // ── React Flow state ────────────────────────────────────────────────────────
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const isDirty = useRef(false);

  // Hydrate nodes/edges when flow loads
  useEffect(() => {
    if (flow) {
      const loadedNodes = (flow as any).nodes as Node[] | undefined;
      const loadedEdges = (flow as any).edges as Edge[] | undefined;
      if (loadedNodes && loadedNodes.length > 0) {
        setNodes(loadedNodes);
      }
      if (loadedEdges && loadedEdges.length > 0) {
        setEdges(loadedEdges);
      }
    }
  }, [flow?.id]); // Only re-hydrate when the flow ID changes

  // Track dirty state when nodes/edges change after initial load
  const onNodesChangeTracked = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Mark as dirty only on meaningful changes (not just selection)
      const meaningful = changes.filter(
        (c) => c.type !== "select" && c.type !== "dimensions",
      );
      if (meaningful.length > 0) isDirty.current = true;
    },
    [onNodesChange],
  );

  const onEdgesChangeTracked = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      const meaningful = changes.filter((c) => c.type !== "select");
      if (meaningful.length > 0) isDirty.current = true;
    },
    [onEdgesChange],
  );

  // Update a single node's data (from config panel)
  const updateNodeData = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
        ),
      );
      isDirty.current = true;
    },
    [setNodes],
  );

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveNodesMutation = useMutation({
    mutationFn: () =>
      flowsApi.saveNodes(workspaceId, flowId, {
        nodes: nodes as unknown as object[],
        edges: edges as unknown as object[],
      }),
    onSuccess: (updatedFlow) => {
      isDirty.current = false;
      qc.setQueryData(flowKeys.detail(workspaceId, flowId), updatedFlow);
      toast.success("Flow salvo e sincronizado com Node-RED");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Erro ao salvar flow");
    },
  });

  // ── Publish mutation ────────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: async () => {
      // Save first, then activate
      await flowsApi.saveNodes(workspaceId, flowId, {
        nodes: nodes as unknown as object[],
        edges: edges as unknown as object[],
      });
      return flowsApi.activate(workspaceId, flowId);
    },
    onSuccess: (updatedFlow) => {
      isDirty.current = false;
      qc.setQueryData(flowKeys.detail(workspaceId, flowId), updatedFlow);
      qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) });
      toast.success("Flow publicado! Está ativo no Node-RED.");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Erro ao publicar flow");
    },
  });

  // ── Test mutation ─────────────────────────────────────────────────────────
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    enableUrl?: string;
  } | null>(null);

  const testMutation = useMutation({
    mutationFn: (inputData?: object) =>
      flowsApi.test(workspaceId, flowId, inputData),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.success) {
        toast.success("Flow executado com sucesso!");
      } else {
        toast.error("Erro ao executar flow. Veja os detalhes.");
      }
    },
    onError: (e: any) => {
      const error =
        e?.response?.data?.message || e.message || "Erro desconhecido";
      setTestResult({ success: false, error });
      toast.error("Erro ao testar flow");
    },
  });

  return {
    flow,
    isLoading,
    nodes,
    edges,
    onNodesChange: onNodesChangeTracked,
    onEdgesChange: onEdgesChangeTracked,
    updateNodeData,
    saveNodes: saveNodesMutation.mutate,
    replaceNodesAndSave: async (newNodes: object[], newEdges: object[]) => {
      setNodes(newNodes as unknown as Node[]);
      setEdges(newEdges as unknown as Edge[]);
      isDirty.current = false;
      // Save directly with the incoming data (bypasses stale closure in mutationFn)
      const updatedFlow = await flowsApi.saveNodes(workspaceId, flowId, {
        nodes: newNodes,
        edges: newEdges,
      });
      qc.setQueryData(flowKeys.detail(workspaceId, flowId), updatedFlow);
    },
    isSaving: saveNodesMutation.isPending,
    publishFlow: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
    isDirty: isDirty.current,
    testFlow: testMutation.mutate,
    isTesting: testMutation.isPending,
    testResult,
    clearTestResult: () => setTestResult(null),
  };
}
