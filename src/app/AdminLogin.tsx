"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Lock, AlertTriangle } from "lucide-react";
import { loginAdminAction } from "./actions";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await loginAdminAction(email, password);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "No se pudo iniciar sesión.");
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MiamSign Admin</h1>
              <p className="text-xs text-slate-400">Miam Digital Studio S.A.C. · RUC 20615782344</p>
            </div>
          </div>
          <Lock className="w-4 h-4 text-slate-400" />
        </div>

        <div className="p-8">
          {!configured && (
            <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Configuración pendiente en el servidor:</strong> Define{" "}
                <code>MIAMSIGN_ADMIN_EMAIL</code>, <code>MIAMSIGN_ADMIN_PASSWORD</code> y{" "}
                <code>MIAMSIGN_SESSION_SECRET</code> en las variables de entorno de Vercel para habilitar el acceso.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Correo de Administrador
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin@miam.com.pe"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !configured}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors shadow-sm"
            >
              {submitting ? "Verificando..." : "Ingresar al Panel"}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-center text-gray-400">
            Si eres cliente con enlace de firma, abre directamente la URL <code>/sign/...</code> enviada a tu correo o WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
