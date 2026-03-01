"use client";

import { use } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar workspaceId={workspaceId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
