"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface EmailBodyData {
  subject?: string;
  body?: string;
  label?: string;
  [key: string]: unknown;
}

function EmailBodyNode({ data, selected }: NodeProps) {
  const d = data as EmailBodyData;
  const hasContent = !!(d.subject || d.body);
  return (
    <div
      className={`group flex flex-col items-center gap-2 p-3 w-24 rounded-2xl bg-white transition-all cursor-pointer ${
        selected
          ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg shadow-blue-100"
          : "ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:ring-blue-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-white !shadow-sm"
      />
      {/* Icon block */}
      <div
        className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-sm ${
          hasContent ? "bg-blue-500" : "bg-blue-300"
        }`}
      >
        📝
        {!hasContent && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[8px]">
            !
          </span>
        )}
      </div>
      {/* Label */}
      <p className="text-[11px] font-semibold text-gray-600 text-center leading-tight w-full truncate">
        {d.subject || "Email Body"}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-white !shadow-sm"
      />
    </div>
  );
}

export default memo(EmailBodyNode);
