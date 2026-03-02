"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

export interface GmailNodeData {
  // Credencial OAuth
  credentialId?: string; // UUID → compilador busca token
  credentialName?: string; // email da conta (exibição)
  gmailCredentialId?: string; // UUID interno (rastrear seleção na UI)
  // Destinatários
  toEmail?: string;
  ccEmail?: string;
  bccEmail?: string;
  // Conteúdo
  subject?: string;
  body?: string;
  [key: string]: unknown;
}

// Ícone Gmail SVG (G colorido)
const GmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
    <path
      fill="#fff"
      d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
    />
  </svg>
);

function GmailNode({ data, selected }: NodeProps) {
  const d = data as GmailNodeData;
  const isConfigured = !!(d.credentialId && d.toEmail && d.subject);
  const label = d.subject || d.credentialName || "Gmail";

  return (
    <FlowNode
      variant="work"
      color="rose"
      icon={<GmailIcon />}
      label={label}
      configured={isConfigured}
      selected={selected}
      disabled={!!d.disabled}
    />
  );
}

export default memo(GmailNode);
