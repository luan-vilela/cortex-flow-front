"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  Zap,
  LayoutDashboard,
  GitBranch,
  Activity,
  Settings,
  ChevronDown,
  LogOut,
  Plus,
  Layout,
  Plug,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Flows", href: "/flows", icon: GitBranch },
  { label: "Integrações", href: "/integrations", icon: Plug },
  { label: "Execuções", href: "/executions", icon: Activity },
  { label: "Templates", href: "/templates", icon: Layout },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const { user, activeWorkspace, logout } = useAuthStore();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-950 text-gray-100 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
        <Zap className="w-6 h-6 text-purple-400" />
        <span className="font-bold text-lg text-white">Cortex Flow</span>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-3 border-b border-gray-800">
        <button className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
              {activeWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
            </div>
            <span className="truncate text-gray-200">
              {activeWorkspace?.name ?? "Workspace"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const fullHref = `/workspaces/${workspaceId}${href}`;
          const isActive = pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                isActive
                  ? "bg-purple-600/20 text-purple-300"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Quick Create */}
      <div className="px-3 pb-3">
        <Link
          href={`/workspaces/${workspaceId}/flows?create=1`}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Flow
        </Link>
      </div>

      {/* User */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
