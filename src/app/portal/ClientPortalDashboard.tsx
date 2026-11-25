"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  MessageCircle,
  PenTool,
  Upload,
  User,
  X,
} from "lucide-react";
import type {
  AgencyFileRecord,
  AgencyOrderRecord,
  AgencyStageRecord,
  AgencySurveyRecord,
} from "@/lib/agency-db";
import type { SurveyQuestion } from "@/lib/agency-presets";
import { formatBytes, formatPen, formatShortDate, TickBar } from "@/components/BentoWidgets";
import {
  clientChangePasswordAction,
  clientLogoutAction,
  clientSaveSurveyAction,
  clientUploadFileAction,
} from "./actions";

interface ClientPortalDashboardProps {
  clientEmail: string;
  clientName: string;
  mustChangePassword: boolean;
  orders: AgencyOrderRecord[];
  stages: AgencyStageRecord[];
  files: AgencyFileRecord[];
  surveys: AgencySurveyRecord[];
}

type PortalTab = "overview" | "stages" | "files" | "survey" | "contract" | "account";

export default function ClientPortalDashboard({
  clientEmail,
  clientName,
  mustChangePassword: initialMustChange,
  orders,
  stages,
  files,
  surveys,
}: ClientPortalDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || "");
  const [mustChangePwd, setMustChangePwd] = useState(initialMustChange);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const orderStages = useMemo(
    () =>
      selectedOrder
        ? stages
            .filter((s) => s.order_id === selectedOrder.id)
            .sort((a, b) => a.sort_order - b.sort_order)
        : [],
    [stages, selectedOrder]
  );

  const orderFiles = useMemo(
    () => (selectedOrder ? files.filter((f) => f.order_id === selectedOrder.id) : []),
    [files, selectedOrder]
  );

  const orderSurvey = useMemo(
    () => (selectedOrder ? surveys.find((s) => s.order_id === selectedOrder.id) || null : null),
    [surveys, selectedOrder]
  );

  const surveyQuestions: SurveyQuestion[] = useMemo(() => {
    if (!orderSurvey?.questions_json) return [];
    return Array.isArray(orderSurvey.questions_json) ? orderSurvey.questions_json : [];
  }, [orderSurvey]);

  const [surveyDrafts, setSurveyDrafts] = useState<Record<string, Record<string, string>>>({});
  const currentAnswers: Record<string, string> = useMemo(() => {
    if (!selectedOrder) return {};
    const saved =
      orderSurvey?.answers_json && typeof orderSurvey.answers_json === "object"
        ? (orderSurvey.answers_json as Record<string, string>)
        : {};
    return { ...saved, ...(surveyDrafts[selectedOrder.id] || {}) };
  }, [selectedOrder, orderSurvey, surveyDrafts]);

  const [savingSurvey, setSavingSurvey] = useState(false);
  const [surveyNotice, setSurveyNotice] = useState<string>("");

  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileNotice, setFileNotice] = useState<string>("");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const doneCount = orderStages.filter((s) => s.status === "DONE").length;
  const totalStages = orderStages.length || 1;
  const progressPct = Math.round((doneCount / totalStages) * 100);
  const nextPendingStage =
    orderStages.find((s) => s.status === "IN_PROGRESS") ||
    orderStages.find((s) => s.status === "PENDING") ||
    orderStages[orderStages.length - 1];

  const handleAnswerChange = (qId: string, val: string) => {
    if (!selectedOrder) return;
    setSurveyDrafts((prev) => ({
      ...prev,
      [selectedOrder.id]: {
        ...(prev[selectedOrder.id] || {}),
        [qId]: val,
      },
    }));
  };

  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingSurvey(true);
    setSurveyNotice("");
    const res = await clientSaveSurveyAction(selectedOrder.id, currentAnswers);
    setSavingSurvey(false);
    if (res.success) {
      setSurveyNotice("Encuesta guardada. Nuestro equipo recibió tus requerimientos.");
      router.refresh();
    } else {
      setSurveyNotice(res.error || "No se pudo guardar.");
    }
  };

  const handleClientUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder) return;
    setUploadingFile(true);
    setFileNotice("");
    const fd = new FormData();
    fd.append("orderId", selectedOrder.id);
    fd.append("file", file);
    const res = await clientUploadFileAction(fd);
    setUploadingFile(false);
    e.target.value = "";
    if (res.success) {
      setFileNotice(`Archivo "${file.name}" enviado correctamente.`);
      router.refresh();
    } else {
      setFileNotice(res.error || "Error subiendo archivo.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 6) {
      setPwdMsg({ type: "err", text: "Usa al menos 6 caracteres para tu nueva clave." });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "err", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setPwdLoading(true);
    const res = await clientChangePasswordAction(currentPwd, newPwd);
    setPwdLoading(false);
    if (res.success) {
      setMustChangePwd(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdMsg({ type: "ok", text: "Tu contraseña personal se actualizó correctamente." });
      router.refresh();
    } else {
      setPwdMsg({ type: "err", text: res.error || "No se pudo actualizar." });
    }
  };

  const handleLogout = async () => {
    await clientLogoutAction();
    router.refresh();
  };

  const navItems: Array<{ id: PortalTab; label: string; icon: React.ReactNode; pill?: string }> = [
    { id: "overview", label: "Resumen & Avance", icon: <LayoutGrid className="w-4 h-4" /> },
    {
      id: "stages",
      label: "Etapas y Fechas",
      icon: <Calendar className="w-4 h-4" />,
      pill: orderStages.length ? `${doneCount}/${totalStages}` : undefined,
    },
    {
      id: "files",
      label: "Mis Entregables",
      icon: <FolderOpen className="w-4 h-4" />,
      pill: orderFiles.length ? String(orderFiles.length) : undefined,
    },
    {
      id: "survey",
      label: "Encuesta Brief",
      icon: <ClipboardList className="w-4 h-4" />,
      pill: orderSurvey?.status === "SUBMITTED" ? "Lista" : "Pend.",
    },
    { id: "contract", label: "Contrato & SUNAT", icon: <PenTool className="w-4 h-4" /> },
    { id: "account", label: "Mi Cuenta y Clave", icon: <User className="w-4 h-4" /> },
  ];

  const renderStagesBlock = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Etapas, Fechas y Lo Que Falta</h2>
          <p className="text-xs text-slate-500">Seguimiento transparente por hitos de tu servicio</p>
        </div>
        <span className="text-xs font-bold text-indigo-600 font-mono">{progressPct}% completado</span>
      </div>

      {orderStages.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">Tu cronograma se está inicializando.</p>
      ) : (
        <div className="space-y-2.5">
          {orderStages.map((st) => {
            const isDone = st.status === "DONE";
            const isNow = st.status === "IN_PROGRESS";
            return (
              <div
                key={st.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  isDone
                    ? "border-emerald-200 bg-emerald-50/70"
                    : isNow
                      ? "border-indigo-300 bg-indigo-50/70"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isNow
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : st.sort_order}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-extrabold ${
                        isNow ? "text-indigo-950" : isDone ? "text-emerald-950" : "text-slate-700"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isDone ? "text-emerald-700" : isNow ? "text-indigo-700" : "text-slate-500"
                    }`}
                  >
                    {isDone
                      ? `Hecho · ${formatShortDate(st.completed_at || st.due_date)}`
                      : isNow
                        ? `En curso · Meta ${formatShortDate(st.due_date)}`
                        : `Falta · ${formatShortDate(st.due_date)}`}
                  </span>
                </div>
                {(st.deliverable_note || st.description) && (
                  <p
                    className={`text-xs mt-1.5 pl-7 ${
                      isDone ? "text-emerald-800" : isNow ? "text-indigo-900" : "text-slate-500"
                    }`}
                  >
                    {st.deliverable_note || st.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderFilesBlock = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Bóveda de Archivos y Entregables</h2>
          <p className="text-xs text-slate-500">Descarga avances, entregables finales y adjunta insumos</p>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
          Retención nube: 180 días
        </span>
      </div>

      {fileNotice && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          {fileNotice}
        </div>
      )}

      <div className="space-y-2.5 mb-3">
        {selectedOrder?.contract_id && (
          <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  Contrato_MSA_{selectedOrder.order_code}.pdf
                </div>
                <div className="text-[11px] text-slate-500">
                  Permanente · Estado: {selectedOrder.contract_status === "SIGNED" ? "Firmado ✓" : "Pendiente firma"}
                </div>
              </div>
            </div>
            <Link
              href={`/sign/${selectedOrder.contract_id}`}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-[11px] font-bold text-slate-800 shrink-0 inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Abrir A4
            </Link>
          </div>
        )}

        {orderFiles.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
            Aún no hay archivos adicionales subidos para este pedido. Apenas el equipo cargue los avances aparecerán aquí.
          </div>
        ) : (
          orderFiles.map((f) => (
            <div key={f.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{f.file_name}</div>
                  <div className="text-[11px] text-slate-500">
                    {f.uploaded_by === "CLIENT" ? "Enviado por ti" : f.category.replace("_", " ")} ·{" "}
                    {formatBytes(f.size_bytes)} ·{" "}
                    {f.pinned_forever || !f.expires_at
                      ? "Permanente"
                      : `Disponible hasta ${formatShortDate(f.expires_at)}`}
                  </div>
                </div>
              </div>
              <a
                href={`/api/agency/files/${f.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#0B0F19] text-[#00E076] hover:bg-slate-800 text-[11px] font-extrabold shrink-0 inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Bajar
              </a>
            </div>
          ))
        )}
      </div>

      <label className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer bg-slate-50/70 transition-colors">
        <span className="text-xs text-slate-600 font-medium">
          {uploadingFile
            ? "Subiendo tu archivo a la bóveda..."
            : "¿Deseas enviar tu logotipo, fotos o catálogo PDF al equipo?"}
        </span>
        <span className="text-xs font-extrabold text-indigo-600 inline-flex items-center gap-1 shrink-0">
          <Upload className="w-3.5 h-3.5" /> Subir archivo
        </span>
        <input type="file" className="hidden" onChange={handleClientUpload} disabled={uploadingFile} />
      </label>
    </div>
  );

  const renderSurveyBlock = (expanded = false) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">
            {orderSurvey?.title || "Encuesta de Requerimientos (Brief)"}
          </h2>
          <p className="text-xs text-slate-500">Cuestionario personalizado según el servicio contratado</p>
        </div>
        <span
          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
            orderSurvey?.status === "SUBMITTED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {orderSurvey?.status === "SUBMITTED" ? "Respondida ✓" : "Por completar"}
        </span>
      </div>

      {surveyNotice && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          {surveyNotice}
        </div>
      )}

      <form onSubmit={handleSaveSurvey} className="space-y-3">
        {(expanded ? surveyQuestions : surveyQuestions.slice(0, 2)).map((q, idx) => (
          <div key={q.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Pregunta {idx + 1} de {surveyQuestions.length}
            </div>
            <label className="block text-xs font-bold text-slate-900 mb-2">{q.label}</label>

            {q.type === "choice" && q.options ? (
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((opt) => {
                  const selected = currentAnswers[q.id] === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleAnswerChange(q.id, opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        selected
                          ? "bg-[#0B0F19] text-[#00E076]"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : q.type === "textarea" ? (
              <textarea
                rows={2}
                value={currentAnswers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder={q.placeholder || "Escribe tu respuesta..."}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            ) : (
              <input
                type="text"
                value={currentAnswers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder={q.placeholder || "Escribe tu respuesta..."}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            )}
          </div>
        ))}

        <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
          {!expanded && surveyQuestions.length > 2 ? (
            <button
              type="button"
              onClick={() => setActiveTab("survey")}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Ver las {surveyQuestions.length} preguntas completas &rarr;
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Tus respuestas inician la fase de diseño</span>
          )}
          <button
            type="submit"
            disabled={savingSurvey}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-colors disabled:opacity-60"
          >
            {savingSurvey ? "Guardando..." : "Guardar Encuesta"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-slate-900">
      {/* Dark Sidebar matching Propuesta 1 */}
      <aside
        className={`bg-[#0B0F19] text-slate-200 lg:w-64 shrink-0 flex flex-col justify-between p-4 ${
          mobileMenuOpen ? "block" : "hidden lg:flex"
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <img src="/img/miam-cat-white.png" alt="Miam" className="w-8 h-8 object-contain" />
              <div>
                <div className="text-sm font-extrabold text-white leading-tight">Mi Portal Miam</div>
                <div className="text-[11px] text-slate-400 truncate max-w-[155px]">{clientEmail}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Mi Proyecto
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === item.id
                    ? "bg-white/10 text-white font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className={activeTab === item.id ? "text-[#00E076]" : "text-slate-400"}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.pill && (
                  <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00E076]/15 text-[#00E076]">
                    {item.pill}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-2.5 pt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[11px] font-extrabold text-[#00E076]">Cuenta Permanente</div>
            <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
              Tu cuenta nunca caduca. Entregables pesados disponibles 180 días post-cierre.
            </p>
          </div>
          <a
            href="https://wa.me/51936400058"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-[#00E076] hover:bg-[#00c869] text-[#052E16] text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Hablar por WhatsApp
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#0B0F19] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/img/miam-cat-white.png" alt="Miam" className="w-7 h-7" />
            <span className="font-extrabold text-sm">Portal Miam</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-white/10"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {mustChangePwd && (
            <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-amber-900">
                <strong>Recomendación de seguridad:</strong> Ingresaste con tu clave inicial generada. Te sugerimos cambiarla por una contraseña personal.
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className="px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-bold"
              >
                Cambiar clave ahora
              </button>
            </div>
          )}

          {/* Top Bar */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Hola, {clientName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {selectedOrder
                  ? `Orden ${selectedOrder.order_code} · ${selectedOrder.service_name}`
                  : "Bienvenido a tu espacio privado en Miam Digital Studio"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {orders.length > 1 && (
                <select
                  value={selectedOrder?.id || ""}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_code} — {o.service_name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Cambiar clave
              </button>

              {selectedOrder?.contract_id && (
                <Link
                  href={`/sign/${selectedOrder.contract_id}`}
                  className="px-4 py-2 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-[#00E076] text-xs font-extrabold inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Ver Contrato A4
                </Link>
              )}
            </div>
          </div>

          {!selectedOrder ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-sm font-bold text-slate-800">Aún no tienes órdenes registradas con {clientEmail}.</p>
              <p className="text-xs text-slate-500 mt-1">Cuando adquieras un servicio en miam.com.pe aparecerá aquí automáticamente.</p>
            </div>
          ) : (
            <>
              {/* Unified 4-Tile Hairline KPI Strip with 48-tick bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-2xl mb-6 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-4">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Avance del Proyecto</span>
                    <span className="font-mono text-emerald-600">{progressPct}%</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">
                    Etapa {Math.min(doneCount + 1, totalStages)}{" "}
                    <span className="text-xs font-semibold text-slate-500">de {totalStages}</span>
                  </div>
                  <TickBar pct={progressPct} total={44} />
                  <div className="text-[11px] text-slate-500">
                    Entrega estimada: {formatShortDate(selectedOrder.delivery_due_at)}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-[11px] font-bold text-slate-500">Próxima Fecha Clave</div>
                  <div className="text-xl font-black text-indigo-600 mt-1 tabular-nums">
                    {nextPendingStage ? formatShortDate(nextPendingStage.due_date) : "Completado"}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-2 truncate">
                    {nextPendingStage ? nextPendingStage.title : "Proyecto finalizado"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {nextPendingStage?.status === "IN_PROGRESS" ? "Etapa actualmente en curso" : "Próximo hito programado"}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-[11px] font-bold text-slate-500">Estado Económico</div>
                  <div className="text-xl font-black text-emerald-600 mt-1 tabular-nums">
                    {selectedOrder.total_pen > 0
                      ? formatPen(selectedOrder.paid_pen)
                      : `$ ${(selectedOrder.paid_usd || 0).toFixed(2)} USD`}
                  </div>
                  <div className="text-xs font-bold text-amber-700 mt-2 tabular-nums">
                    {selectedOrder.balance_pen > 0
                      ? `Saldo al entregar: ${formatPen(selectedOrder.balance_pen)}`
                      : "Pago 100% liquidado"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedOrder.sunat_type} · {selectedOrder.sunat_number || "En emisión"}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-[11px] font-bold text-slate-500">Bóveda &amp; Encuesta</div>
                  <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                    {orderFiles.length}{" "}
                    <span className="text-xs font-semibold text-slate-500">archivos subidos</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-2">
                    Encuesta: {orderSurvey?.status === "SUBMITTED" ? "Completada ✓" : "Pendiente de respuesta"}
                  </div>
                  <div className="text-[11px] text-slate-500">Vigencia nube: 180 días post-cierre</div>
                </div>
              </div>

              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7">{renderStagesBlock()}</div>
                  <div className="lg:col-span-5 space-y-5">
                    {renderFilesBlock()}
                    {renderSurveyBlock(false)}
                  </div>
                </div>
              )}

              {activeTab === "stages" && renderStagesBlock()}
              {activeTab === "files" && renderFilesBlock()}
              {activeTab === "survey" && renderSurveyBlock(true)}

              {activeTab === "contract" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900">Contrato Digital MSA &amp; Detalle SUNAT</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Código de Orden</div>
                      <div className="text-base font-extrabold font-mono mt-1">{selectedOrder.order_code}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Comprobante Solicitado</div>
                      <div className="text-base font-extrabold mt-1">
                        {selectedOrder.sunat_type} · {selectedOrder.sunat_number || "Por emitir"}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Contrato MiamSign</div>
                      <div className="text-base font-extrabold mt-1">
                        {selectedOrder.contract_status === "SIGNED" ? "Firmado Digitalmente ✓" : "Pendiente de Firma"}
                      </div>
                    </div>
                  </div>
                  {selectedOrder.contract_id && (
                    <Link
                      href={`/sign/${selectedOrder.contract_id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B0F19] text-[#00E076] text-xs font-extrabold"
                    >
                      <PenTool className="w-4 h-4" /> Abrir Documento A4 Oficial / Descargar PDF
                    </Link>
                  )}
                </div>
              )}

              {activeTab === "account" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl">
                  <h2 className="text-base font-extrabold text-slate-900 mb-1">Mi Cuenta Permanente &amp; Contraseña</h2>
                  <p className="text-xs text-slate-500 mb-5">
                    Tu correo <strong>{clientEmail}</strong> es válido siempre para ingresar a tus proyectos, contratos y archivos.
                  </p>
                  {pwdMsg && (
                    <div
                      className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        pwdMsg.type === "ok"
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                          : "bg-red-50 border border-red-200 text-red-800"
                      }`}
                    >
                      {pwdMsg.text}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña actual</label>
                      <input
                        type="password"
                        required
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nueva contraseña personal</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        required
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="px-5 py-2.5 rounded-xl bg-[#0B0F19] text-[#00E076] text-xs font-extrabold disabled:opacity-60"
                    >
                      {pwdLoading ? "Actualizando..." : "Guardar Nueva Contraseña"}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
