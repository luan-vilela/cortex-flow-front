"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/lib/api";

export default function SsoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("Token SSO não fornecido");
      return;
    }

    authApi
      .ssoValidate(token)
      .then((res) => {
        setAuth(res.user, res.accessToken, res.refreshToken);
        // Redirect to workspaces (or specific workspace if provided)
        const redirect = searchParams.get("redirect") || "/workspaces";
        router.replace(redirect);
      })
      .catch((err) => {
        console.error("SSO validation failed:", err);
        setError(
          err?.response?.data?.message ||
            "Falha na autenticação SSO. Tente novamente.",
        );
      });
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-md space-y-6 px-8 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Erro na autenticação</h1>
          <p className="text-gray-400 text-sm">{error}</p>
          <div className="flex gap-3 justify-center">
            <a
              href="/login"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              Ir para login
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001"}`}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              Voltar ao Cortex Control
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md space-y-6 px-8 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">Cortex Flow</h1>
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Autenticando via Cortex Control...</span>
        </div>
      </div>
    </div>
  );
}
