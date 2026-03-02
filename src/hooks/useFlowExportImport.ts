import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { flowsApi } from "@/lib/api";
import { flowKeys } from "./useFlows";
import { toast } from "sonner";
import type { Flow } from "@/types";

interface CortexFlowEnvelope {
  cortexFlowVersion: string;
  exportedAt: string;
  flow: {
    name: string;
    description?: string;
    triggerType?: string;
    cronExpression?: string;
    tags?: string[];
    icon?: string;
    color?: string;
    nodes?: object[];
    edges?: object[];
  };
}

function isValidEnvelope(data: unknown): data is CortexFlowEnvelope {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.cortexFlowVersion === "string" &&
    typeof obj.flow === "object" &&
    obj.flow !== null &&
    typeof (obj.flow as Record<string, unknown>).name === "string"
  );
}

// ── Export a single flow (triggers browser download) ──────────────────────────
export function useExportFlow(workspaceId: string) {
  const [isExporting, setIsExporting] = useState(false);

  const exportFlow = useCallback(
    async (flowId: string, flowName?: string) => {
      setIsExporting(true);
      try {
        const envelope = await flowsApi.exportFlow(workspaceId, flowId);
        const json = JSON.stringify(envelope, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (flowName ?? "flow")
          .replace(/[^a-z0-9_\- ]/gi, "")
          .trim()
          .replace(/\s+/g, "_");
        a.href = url;
        a.download = `${safeName}.cortexflow.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Flow exportado com sucesso!");
      } catch {
        toast.error("Erro ao exportar flow");
      } finally {
        setIsExporting(false);
      }
    },
    [workspaceId],
  );

  return { exportFlow, isExporting };
}

// ── Import a flow from a .json file (creates a new flow) ──────────────────────
export function useImportFlow(workspaceId: string) {
  const qc = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const importFlow = useCallback(
    async (file: File): Promise<Flow | null> => {
      setIsImporting(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;

        if (!isValidEnvelope(parsed)) {
          toast.error(
            "Arquivo inválido: não é um export do Cortex Flow (.cortexflow.json)",
          );
          return null;
        }

        const newFlow = await flowsApi.importFlow(workspaceId, {
          cortexFlowVersion: parsed.cortexFlowVersion,
          flow: parsed.flow,
        });

        qc.invalidateQueries({ queryKey: flowKeys.all(workspaceId) });
        toast.success(`Flow "${newFlow.name}" importado com sucesso!`);
        return newFlow as Flow;
      } catch (err) {
        if (err instanceof SyntaxError) {
          toast.error("Arquivo JSON inválido");
        } else {
          toast.error("Erro ao importar flow");
        }
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    [workspaceId, qc],
  );

  return { importFlow, isImporting };
}

// ── Overwrite current flow's nodes/edges from a .json file ────────────────────
export function useImportIntoFlow() {
  const [isImporting, setIsImporting] = useState(false);

  const importIntoFlow = useCallback(
    async (
      file: File,
      saveNodes: (nodes: object[], edges: object[]) => Promise<void> | void,
    ): Promise<boolean> => {
      setIsImporting(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;

        if (!isValidEnvelope(parsed)) {
          toast.error(
            "Arquivo inválido: não é um export do Cortex Flow (.cortexflow.json)",
          );
          return false;
        }

        const { nodes = [], edges = [] } = parsed.flow;
        await saveNodes(nodes, edges);
        toast.success("Flow importado — conteúdo substituído!");
        return true;
      } catch (err) {
        if (err instanceof SyntaxError) {
          toast.error("Arquivo JSON inválido");
        } else {
          toast.error("Erro ao importar flow");
        }
        return false;
      } finally {
        setIsImporting(false);
      }
    },
    [],
  );

  return { importIntoFlow, isImporting };
}
