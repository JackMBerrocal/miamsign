"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { clientLoginAction } from "./actions";

export default function ClientLoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await clientLoginAction(email, password);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Credenciales inválidas.");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-[#8A4FFF] via-[#6366F1] to-[#00E076]" />
          <div className="p-7 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <img src="/img/miam-cat-white.png" alt="Miam" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white">Portal Cliente Miam</h1>
                <p className="text-xs text-slate-400">Seguimiento, archivos y encuestas de tu proyecto</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/35 text-xs text-red-200 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Correo registrado en tu compra</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#00E076]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Contraseña de acceso</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ej. MIAM-1234 o tu clave personal"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#00E076]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#00E076] hover:bg-[#00c869] text-[#052E16] font-extrabold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {loading ? "Verificando acceso..." : "Ingresar a Mi Portal"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-[11.5px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Cuenta permanente para ver tus proyectos y contratos</span>
              </div>
              <p>
                ¿Olvidaste tu clave inicial? Escríbenos a{" "}
                <a href="https://wa.me/51936400058" target="_blank" rel="noopener noreferrer" className="text-white underline">
                  WhatsApp +51 936 400 058
                </a>{" "}
                o revisa el correo de bienvenida de tu compra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
