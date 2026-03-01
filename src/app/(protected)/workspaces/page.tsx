"use client";

import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspaces";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Zap, Plus, Loader2, Building2 } from "lucide-react";
import { slugify } from "@/lib/utils";

export default function WorkspacesPage() {
  const router = useRouter();
  const { setActiveWorkspace, logout } = useAuthStore();
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const handleSelect = (workspace: {
    id: string;
    name: string;
    slug: string;
  }) => {
    setActiveWorkspace(workspace as never);
    router.push(`/workspaces/${workspace.id}/flows`);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const ws = await createWorkspace.mutateAsync({
        name,
        slug: slugify(name),
      });
      setActiveWorkspace(ws);
      router.push(`/workspaces/${ws.id}/flows`);
    } catch {
      toast.error("Erro ao criar workspace. Slug já em uso?");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Zap className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Selecione um workspace
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Escolha onde deseja trabalhar
          </p>
        </div>

        {/* Workspace list */}
        <div className="space-y-3 mb-6">
          {(workspaces ?? []).map(
            (ws: { id: string; name: string; slug: string }) => (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 hover:bg-gray-800 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-lg font-bold text-purple-300">
                  {ws.name[0].toUpperCase()}
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-medium">{ws.name}</p>
                  <p className="text-gray-500 text-xs">{ws.slug}</p>
                </div>
                <Building2 className="w-4 h-4 text-gray-500" />
              </button>
            ),
          )}
        </div>

        {/* Create new */}
        {creating ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nome do workspace..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={handleCreate}
              disabled={createWorkspace.isPending}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {createWorkspace.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar"
              )}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-700 hover:border-purple-500/50 text-gray-400 hover:text-purple-300 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo workspace
          </button>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
