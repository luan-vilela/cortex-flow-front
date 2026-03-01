import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Workspace } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  activeWorkspace: Workspace | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string, refreshToken: string) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      activeWorkspace: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("cortex_flow_token", token);
          localStorage.setItem("cortex_flow_refresh", refreshToken);
        }
        set({ user, token, refreshToken, isAuthenticated: true });
      },

      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cortex_flow_token");
          localStorage.removeItem("cortex_flow_refresh");
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          activeWorkspace: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "cortex-flow-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        activeWorkspace: state.activeWorkspace,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
