"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  HardDrive,
  KeyRound,
  Link2,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { CATALOG } from "@/app/services";
import type {
  AgencyFileRecord,
  AgencyOrderRecord,
  AgencyStageRecord,
  AgencySurveyRecord,
} from "@/lib/agency-db";
import type { SurveyQuestion } from "@/lib/agency-presets";
import {
  addExternalFileLinkAction,
  createManualPurchaseAction,
  deleteAgencyFileAction,
  deleteProjectStageAction,
  getAgencyWorkspaceAction,
  purgeExpiredFilesAction,
  resetClientPasswordAction,
  togglePinFileAction,
  updateAgencyOrderPaymentAction,
  updateSurveyTemplateAction,
  uploadAdminFileAction,
  upsertProjectStageAction,
} from "@/app/agency-actions";
import {
  formatBytes,
  formatPen,
  formatShortDate,
  MonthlyRevenueBucket,
  RevenueBarsSvg,
  TickBar,
} from "./BentoWidgets";

export type AgencyAdminSection = "ledger" | "stages" | "vault" | "surveys" | "storage";

interface AdminAgencyWorkspaceProps {
  section: AgencyAdminSection;
  onSectionChange: (next: AgencyAdminSection) => void;
  onStorageSummary?: (summary: { usedBytes: number; totalOrders: number }) => void;
}

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
];

function getInitials(name: string): string {
  return (name || "CL")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function AdminAgencyWorkspace({
  section,
  onSectionChange,
  onStorageSummary,
}: AdminAgencyWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AgencyOrderRecord[]>([]);
  const [stages, setStages] = useState<AgencyStageRecord[]>([]);
  const [files, setFiles] = useState<AgencyFileRecord[]>([]);
  const [surveys, setSurveys] = useState<AgencySurveyRecord[]>([]);
  const [blobConfigured, setBlobConfigured] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string>("");

  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [searchQ, setSearchQ] = useState("");
  const [filterOrigin, setFilterOrigin] = useState<"ALL" | "WEB_AUTO" | "MANUAL" | "PAID_50" | "PAID_100">("ALL");

  // Manual Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [mServiceId, setMServiceId] = useState(CATALOG[0].id);
  const [mServiceName, setMServiceName] = useState(CATALOG[0].name);
  const [mFamily, setMFamily] = useState<"BRANDING" | "WEB" | "MIAMBOT" | "MIXED">(CATALOG[0].baseTemplate);
  const [mClientName, setMClientName] = useState("");
  const [mClientEmail, setMClientEmail] = useState("");
  const [mClientPhone, setMClientPhone] = useState("");
  const [mClientDoc, setMClientDoc] = useState("");
  const [mRazon, setMRazon] = useState("");
  const [mAddress, setMAddress] = useState("");
  const [mTotalPen, setMTotalPen] = useState(531);
  const [mPaidPen, setMPaidPen] = useState(265.5);
  const [mPayMode, setMPayMode] = useState<"50_50" | "100_UPFRONT" | "MONTHLY">("50_50");
  const [mPayMethod, setMPayMethod] = useState("YAPE");
  const [mOpCode, setMOpCode] = useState("");
  const [mSunatType, setMSunatType] = useState<"BOLETA" | "FACTURA">("BOLETA");
  const [mSunatNumber, setMSunatNumber] = useState("");
  const [mInitialPwd, setMInitialPwd] = useState("");
  const [mSendEmails, setMSendEmails] = useState(true);

  // Payment / SUNAT Quick Modal
  const [editingOrder, setEditingOrder] = useState<AgencyOrderRecord | null>(null);
  const [editPaidPen, setEditPaidPen] = useState(0);
  const [editSunatNum, setEditSunatNum] = useState("");
  const [editPayStatus, setEditPayStatus] = useState<"PENDING_VERIFY" | "PAID_50" | "PAID_100">("PAID_50");
  const [editDueAt, setEditDueAt] = useState("");

  // Add Stage Form
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageDue, setNewStageDue] = useState("");
  const [newStageNote, setNewStageNote] = useState("");

  // External Link Form
  const [extLinkName, setExtLinkName] = useState("");
  const [extLinkUrl, setExtLinkUrl] = useState("");
  const [uploadCat, setUploadCat] = useState("ENTREGABLE_FINAL");
  const [uploadPin, setUploadPin] = useState(false);

  // Survey Question Builder State
  const [newQLabel, setNewQLabel] = useState("");
  const [newQType, setNewQType] = useState<"text" | "textarea" | "choice">("textarea");
  const [newQOptions, setNewQOptions] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    const res = await getAgencyWorkspaceAction();
    if (res.success) {
      setOrders(res.orders || []);
      setStages(res.stages || []);
      setFiles(res.files || []);
      setSurveys(res.surveys || []);
      setBlobConfigured(Boolean(res.blobConfigured));
      if (!selectedOrderId && res.orders?.length) {
        setSelectedOrderId(res.orders[0].id);
      }
      const totalBytes = (res.files || []).reduce((acc, f) => acc + Number(f.size_bytes || 0), 0);
      onStorageSummary?.({ usedBytes: totalBytes, totalOrders: (res.orders || []).length });
    }
    setLoading(false);
  }, [onStorageSummary, selectedOrderId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  );

  const activeStages = useMemo(
    () =>
      activeOrder
        ? stages
            .filter((s) => s.order_id === activeOrder.id)
            .sort((a, b) => a.sort_order - b.sort_order)
        : [],
    [stages, activeOrder]
  );

  const activeFiles = useMemo(
    () => (activeOrder ? files.filter((f) => f.order_id === activeOrder.id) : []),
    [files, activeOrder]
  );

  const activeSurvey = useMemo(
    () => (activeOrder ? surveys.find((s) => s.order_id === activeOrder.id) || null : null),
    [surveys, activeOrder]
  );

  // Financial Metrics
  const totalCollected = useMemo(
    () => orders.reduce((acc, o) => acc + Number(o.paid_pen || 0), 0),
    [orders]
  );
  const totalBalance = useMemo(
    () => orders.reduce((acc, o) => acc + Number(o.balance_pen || 0), 0),
    [orders]
  );
  const webAutoCount = orders.filter((o) => o.source === "WEB_AUTO").length;
  const manualCount = orders.filter((o) => o.source === "MANUAL").length;
  const pendingSurveysCount = surveys.filter((s) => s.status !== "SUBMITTED").length;
  const totalStorageBytes = files.reduce((acc, f) => acc + Number(f.size_bytes || 0), 0);

  const monthlyBuckets: MonthlyRevenueBucket[] = useMemo(() => {
    const map = new Map<string, MonthlyRevenueBucket>();
    const ordered = [...orders].reverse();
    for (const o of ordered) {
      const d = new Date(o.created_at);
      const label = Number.isNaN(d.getTime())
        ? "Mes"
        : d.toLocaleDateString("es-PE", { month: "short" });
      const prev = map.get(label) || { label, collected: 0, pending: 0 };
      prev.collected += Number(o.paid_pen || 0);
      prev.pending += Number(o.balance_pen || 0);
      map.set(label, prev);
    }
    const list = Array.from(map.values());
    if (!list.length) {
      const currMonth = new Date().toLocaleDateString("es-PE", { month: "short" });
      return [{ label: currMonth, collected: 0, pending: 0 }];
    }
    return list.slice(-6);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterOrigin === "WEB_AUTO" && o.source !== "WEB_AUTO") return false;
      if (filterOrigin === "MANUAL" && o.source !== "MANUAL") return false;
      if (filterOrigin === "PAID_50" && o.payment_status !== "PAID_50") return false;
      if (filterOrigin === "PAID_100" && o.payment_status !== "PAID_100") return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.client_name.toLowerCase().includes(q) ||
        o.client_email.toLowerCase().includes(q) ||
        (o.client_document || "").toLowerCase().includes(q) ||
        o.service_name.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQ, filterOrigin]);

  const handleManualServiceSelect = (id: string) => {
    setMServiceId(id);
    const svc = CATALOG.find((s) => s.id === id);
    if (!svc) return;
    setMServiceName(svc.name);
    setMFamily(svc.baseTemplate);
    const numMatch = svc.price.match(/([\d,]+\.?\d*)/);
    const priceVal = numMatch ? parseFloat(numMatch[1].replace(/,/g, "")) : 0;
    const isUsd = svc.price.toUpperCase().includes("USD");
    const penVal = isUsd ? Number((priceVal * 3.75).toFixed(2)) : priceVal;
    setMTotalPen(penVal);
    if (svc.defaultPaymentType === "50_50") {
      setMPayMode("50_50");
      setMPaidPen(Number((penVal / 2).toFixed(2)));
    } else {
      setMPayMode(svc.defaultPaymentType === "MONTHLY" ? "MONTHLY" : "100_UPFRONT");
      setMPaidPen(penVal);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrder(true);
    setBannerMsg("");
    const res = await createManualPurchaseAction({
      clientName: mClientName,
      clientEmail: mClientEmail,
      clientPhone: mClientPhone,
      clientDocument: mClientDoc,
      clientAddress: mAddress,
      razonSocial: mRazon,
      serviceName: mServiceName,
      contractFamily: mFamily === "MIXED" ? "BRANDING" : mFamily,
      totalPen: mTotalPen,
      paidPen: mPaidPen,
      paymentMode: mPayMode,
      paymentMethod: mPayMethod,
      operationCode: mOpCode,
      sunatType: mSunatType,
      sunatNumber: mSunatNumber,
      customInitialPassword: mInitialPwd || undefined,
      sendEmails: mSendEmails,
    });
    setCreatingOrder(false);
    if (res.success) {
      setShowNewOrderModal(false);
      setMClientName("");
      setMClientEmail("");
      setMClientPhone("");
      setMClientDoc("");
      setMRazon("");
      setMAddress("");
      setMOpCode("");
      setMSunatNumber("");
      setMInitialPwd("");
      setBannerMsg(
        `Compra ${res.orderCode} registrada. Portal cliente: ${res.clientEmail} / Clave inicial: ${res.initialPassword || "(ya tiene clave)"}`
      );
      await loadWorkspace();
      if (res.orderId) setSelectedOrderId(res.orderId);
    } else {
      alert(res.error || "Error registrando compra");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Codigo Orden",
      "Fecha",
      "Origen",
      "Cliente",
      "Correo",
      "DNI/RUC",
      "Servicio",
      "Medio Pago",
      "Estado Pago",
      "Total PEN",
      "Cobrado PEN",
      "Saldo PEN",
      "Tipo SUNAT",
      "Comprobante",
    ];
    const rows = orders.map((o) => [
      o.order_code,
      formatShortDate(o.created_at),
      o.source,
      `"${o.client_name.replace(/"/g, '""')}"`,
      o.client_email,
      o.client_document || "",
      `"${o.service_name.replace(/"/g, '""')}"`,
      o.payment_method,
      o.payment_status,
      o.total_pen.toFixed(2),
      o.paid_pen.toFixed(2),
      o.balance_pen.toFixed(2),
      o.sunat_type,
      o.sunat_number || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `libro-contable-miam-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStageStatusCycle = async (stage: AgencyStageRecord, nextStatus: "DONE" | "IN_PROGRESS" | "PENDING") => {
    await upsertProjectStageAction({
      stageId: stage.id,
      orderId: stage.order_id,
      sortOrder: stage.sort_order,
      title: stage.title,
      description: stage.description || undefined,
      status: nextStatus,
      dueDate: stage.due_date || undefined,
      deliverableNote: stage.deliverable_note || undefined,
    });
    await loadWorkspace();
  };

  const handleStageDateOrNoteUpdate = async (
    stage: AgencyStageRecord,
    dueDate: string,
    deliverableNote: string
  ) => {
    await upsertProjectStageAction({
      stageId: stage.id,
      orderId: stage.order_id,
      sortOrder: stage.sort_order,
      title: stage.title,
      description: stage.description || undefined,
      status: stage.status,
      dueDate,
      completedAt: stage.completed_at,
      deliverableNote,
    });
    setBannerMsg(`Etapa "${stage.title}" actualizada.`);
    await loadWorkspace();
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !newStageTitle.trim()) return;
    await upsertProjectStageAction({
      orderId: activeOrder.id,
      sortOrder: activeStages.length + 1,
      title: newStageTitle,
      status: "PENDING",
      dueDate: newStageDue || new Date().toISOString().slice(0, 10),
      deliverableNote: newStageNote || "Pendiente",
    });
    setNewStageTitle("");
    setNewStageDue("");
    setNewStageNote("");
    await loadWorkspace();
  };

  const handleAdminUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;
    const fd = new FormData();
    fd.append("orderId", activeOrder.id);
    fd.append("category", uploadCat);
    fd.append("pinnedForever", String(uploadPin));
    fd.append("file", file);
    const res = await uploadAdminFileAction(fd);
    e.target.value = "";
    if (res.success) {
      setBannerMsg(`Archivo "${file.name}" subido para ${activeOrder.client_name}.`);
      await loadWorkspace();
    } else {
      alert(res.error || "Error subiendo archivo");
    }
  };

  const handleAddExternalLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !extLinkName.trim() || !extLinkUrl.trim()) return;
    const res = await addExternalFileLinkAction({
      orderId: activeOrder.id,
      fileName: extLinkName,
      externalUrl: extLinkUrl,
      category: uploadCat,
      pinnedForever: true,
    });
    if (res.success) {
      setExtLinkName("");
      setExtLinkUrl("");
      setBannerMsg("Enlace guardado en la bóveda del cliente (0 bytes ocupados).");
      await loadWorkspace();
    }
  };

  const handleAddSurveyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !activeSurvey || !newQLabel.trim()) return;
    const existing = Array.isArray(activeSurvey.questions_json) ? activeSurvey.questions_json : [];
    const nextQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      label: newQLabel.trim(),
      type: newQType,
      options:
        newQType === "choice"
          ? newQOptions
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    };
    await updateSurveyTemplateAction({
      orderId: activeOrder.id,
      title: activeSurvey.title,
      questions: [...existing, nextQ],
    });
    setNewQLabel("");
    setNewQOptions("");
    await loadWorkspace();
  };

  const handleRemoveSurveyQuestion = async (qId: string) => {
    if (!activeOrder || !activeSurvey) return;
    const next = (activeSurvey.questions_json || []).filter((q) => q.id !== qId);
    await updateSurveyTemplateAction({
      orderId: activeOrder.id,
      title: activeSurvey.title,
      questions: next,
    });
    await loadWorkspace();
  };

  const renderOrderSelectorHeader = (title: string, subtitle: string) => (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
      </div>
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Proyecto activo:</span>
          <select
            value={activeOrder?.id || ""}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_code} — {o.client_name} ({o.service_name})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {bannerMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-emerald-950 font-semibold">
          <span>{bannerMsg}</span>
          <button type="button" onClick={() => setBannerMsg("")} className="p-1 text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* SECTION 1: LIBRO CONTABLE & CONTROL DE COMPRAS                    */}
      {/* ================================================================= */}
      {section === "ledger" && (
        <>
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Libro Contable &amp; Control de Compras
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sincronización automática desde miam.com.pe + registro manual con código correlativo{" "}
                <span className="font-mono font-bold text-slate-700">MIAM-{new Date().getFullYear()}-0001</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadWorkspace}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Exportar SUNAT CSV
              </button>
              <button
                type="button"
                onClick={() => setShowNewOrderModal(true)}
                className="px-4 py-2 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-[#00E076] text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nueva Compra Manual
              </button>
            </div>
          </div>

          {/* 4-Tile Hairline KPI Strip matching Propuesta 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-4">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Cobrado vs Meta Mensual</span>
                <span className="font-mono text-emerald-600">{Math.min(100, Math.round((totalCollected / 20000) * 100))}%</span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">
                {formatPen(totalCollected)}{" "}
                <span className="text-xs font-semibold text-slate-400">de S/ 20,000</span>
              </div>
              <TickBar pct={Math.min(100, Math.round((totalCollected / 20000) * 100))} total={44} />
              <div className="text-[11px] text-slate-500">Total acumulado en compras registradas</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-slate-500">Saldo 50% Contra Entrega</div>
              <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">{formatPen(totalBalance)}</div>
              <div className="h-1.5 rounded-full bg-amber-100 mt-3 mb-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${totalCollected + totalBalance > 0 ? Math.round((totalBalance / (totalCollected + totalBalance)) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-slate-500">
                {orders.filter((o) => o.balance_pen > 0).length} proyecto(s) con saldo por cobrar
              </div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-slate-500">Origen de Órdenes</div>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {orders.length} <span className="text-xs font-semibold text-slate-500">órdenes</span>
              </div>
              <div className="flex gap-1.5 mt-3 mb-1.5">
                <span className="bg-emerald-50 text-emerald-800 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md">
                  {webAutoCount} Web Auto
                </span>
                <span className="bg-indigo-50 text-indigo-800 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md">
                  {manualCount} Manual
                </span>
              </div>
              <div className="text-[11px] text-slate-500">Secuencia automática 0001+</div>
            </div>

            <div className="p-4">
              <div className="text-[11px] font-bold text-slate-500">Encuestas &amp; Bóveda 180d</div>
              <div className="text-2xl font-black text-indigo-600 mt-1 tabular-nums">
                {pendingSurveysCount}{" "}
                <span className="text-xs font-semibold text-slate-500">brief pendientes</span>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-2">
                Storage usado: {formatBytes(totalStorageBytes)}
              </div>
              <div className="text-[11px] text-slate-500">
                {blobConfigured ? "Vercel Blob privado activo" : "Modo DB hasta 3.5 MB + Links"}
              </div>
            </div>
          </div>

          {/* Main Grid: Ledger Table + SVG Revenue Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["ALL", "Todas"],
                      ["WEB_AUTO", "Web Auto"],
                      ["MANUAL", "Manual"],
                      ["PAID_50", "Saldo 50%"],
                      ["PAID_100", "Pagado 100%"],
                    ] as const
                  ).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFilterOrigin(val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        filterOrigin === val
                          ? "bg-[#0B0F19] text-[#00E076]"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Buscar orden, cliente o RUC..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10.5px] font-bold uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4">Cliente &amp; Orden</th>
                      <th className="py-2.5 px-3">Servicio</th>
                      <th className="py-2.5 px-3">SUNAT / Pago</th>
                      <th className="py-2.5 px-3 text-right">Cobrado / Saldo</th>
                      <th className="py-2.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          Cargando libro contable...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          Aún no hay compras registradas. Crea tu primera venta manual arriba o prueba el checkout de{" "}
                          <strong>miam.com.pe</strong> (empezará en <span className="font-mono font-bold">MIAM-2026-0001</span>).
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o, idx) => {
                        const isSelected = activeOrder?.id === o.id;
                        return (
                          <tr
                            key={o.id}
                            onClick={() => setSelectedOrderId(o.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10.5px] font-extrabold shrink-0 ${
                                    AVATAR_TONES[idx % AVATAR_TONES.length]
                                  }`}
                                >
                                  {getInitials(o.client_name)}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900">{o.client_name}</div>
                                  <div className="font-mono text-[10px] text-slate-500">
                                    {o.order_code} · {o.source === "WEB_AUTO" ? "Auto Web" : "Manual"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium">
                              <div>{o.service_name}</div>
                              <div className="text-[10px] text-slate-400">{o.client_document || o.client_email}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {o.payment_method}
                              </span>
                              <div className="text-[10.5px] text-slate-500 mt-0.5">
                                {o.sunat_type} {o.sunat_number || "Por emitir"}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums">
                              <div className="font-extrabold text-slate-900">{formatPen(o.paid_pen)}</div>
                              <div
                                className={`text-[10px] font-bold ${
                                  o.balance_pen > 0 ? "text-amber-700" : "text-emerald-600"
                                }`}
                              >
                                {o.balance_pen > 0 ? `Saldo ${formatPen(o.balance_pen)}` : "100% Liquidado"}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrder(o);
                                    setEditPaidPen(o.paid_pen);
                                    setEditPayStatus(
                                      (o.payment_status as "PENDING_VERIFY" | "PAID_50" | "PAID_100") || "PAID_50"
                                    );
                                    setEditSunatNum(o.sunat_number || "");
                                    setEditDueAt(o.delivery_due_at ? String(o.delivery_due_at).slice(0, 10) : "");
                                  }}
                                  className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:border-emerald-400 text-[10.5px] font-bold text-slate-700"
                                >
                                  Cobro/SUNAT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderId(o.id);
                                    onSectionChange("stages");
                                  }}
                                  className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10.5px] font-bold"
                                >
                                  Etapas
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: SVG Revenue Chart + Selected Order Portal Access */}
            <div className="xl:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">Ingresos Cobrados vs Saldo</div>
                    <div className="text-sm font-extrabold text-slate-900">Flujo Mensual (PEN)</div>
                  </div>
                  <div className="flex gap-2.5 text-[10px] font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-emerald-600" /> Cobrado
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm border border-dashed border-amber-500" /> Saldo
                    </span>
                  </div>
                </div>
                <RevenueBarsSvg buckets={monthlyBuckets} />
              </div>

              {activeOrder && (
                <div className="bg-[#0B0F19] text-white border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#00E076]">
                        Ficha Rápida · {activeOrder.order_code}
                      </div>
                      <div className="text-sm font-extrabold mt-0.5">{activeOrder.client_name}</div>
                      <div className="text-xs text-slate-400">{activeOrder.client_email}</div>
                    </div>
                    {activeOrder.contract_id && (
                      <a
                        href={`/sign/${activeOrder.contract_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10.5px] font-bold inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Contrato
                      </a>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Clave inicial portal:</span>
                      <span className="font-mono font-bold text-[#00E076]">
                        {activeOrder.initial_code || "Ya cambiada por cliente"}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await resetClientPasswordAction(activeOrder.client_email);
                          if (r.success) {
                            setBannerMsg(
                              `Nueva clave generada para ${activeOrder.client_email}: ${r.newPassword}`
                            );
                            await loadWorkspace();
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold inline-flex items-center justify-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" /> Restablecer Clave
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const txt = `Portal Miam: https://firmas.miam.com.pe/portal\nCorreo: ${activeOrder.client_email}\nClave: ${activeOrder.initial_code || "(tu contraseña personal)"}`;
                          navigator.clipboard.writeText(txt);
                          setBannerMsg("Acceso del cliente copiado al portapapeles.");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#00E076] text-[#052E16] text-[11px] font-extrabold inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copiar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onSectionChange("stages")}
                      className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold"
                    >
                      Etapas ({activeStages.filter((s) => s.status === "DONE").length}/{activeStages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => onSectionChange("vault")}
                      className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold"
                    >
                      Archivos ({activeFiles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => onSectionChange("surveys")}
                      className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold"
                    >
                      Encuesta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* SECTION 2: GESTOR DE ETAPAS & FECHAS                              */}
      {/* ================================================================= */}
      {section === "stages" && (
        <>
          {renderOrderSelectorHeader(
            "Proyectos, Etapas y Fechas Comprometidas",
            "Define lo ya realizado, la etapa en curso y las fechas límite visibles en el Portal Cliente"
          )}

          {!activeOrder ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              Crea primero una compra en el Libro Contable para gestionar sus etapas.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="space-y-3">
                {activeStages.map((st) => (
                  <StageEditorRow
                    key={st.id}
                    stage={st}
                    onStatusChange={handleStageStatusCycle}
                    onSaveMeta={handleStageDateOrNoteUpdate}
                    onDelete={async (id) => {
                      await deleteProjectStageAction(id);
                      await loadWorkspace();
                    }}
                  />
                ))}
              </div>

              <form onSubmit={handleAddStage} className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nueva etapa personalizada</label>
                  <input
                    type="text"
                    required
                    value={newStageTitle}
                    onChange={(e) => setNewStageTitle(e.target.value)}
                    placeholder="Ej. 6. Sesión de entrega y capacitación"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha meta</label>
                  <input
                    type="date"
                    value={newStageDue}
                    onChange={(e) => setNewStageDue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-[#0B0F19] text-[#00E076] text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Agregar Etapa
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* SECTION 3: BÓVEDA DE ARCHIVOS DEL CLIENTE                         */}
      {/* ================================================================= */}
      {section === "vault" && (
        <>
          {renderOrderSelectorHeader(
            "Bóveda de Entregables & Archivos",
            "Sube diseños, ZIP editables, manuales PDF o enlaces Google Drive (retención estándar 180 días)"
          )}

          {!activeOrder ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              Selecciona o crea una orden en el Libro Contable.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900">Subir Archivo para {activeOrder.client_name}</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoría</label>
                    <select
                      value={uploadCat}
                      onChange={(e) => setUploadCat(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    >
                      <option value="AVANCE">Avance / Propuesta</option>
                      <option value="ENTREGABLE_FINAL">Entregable Final</option>
                      <option value="COMPROBANTE">Boleta / Factura SUNAT</option>
                      <option value="CONTRATO">Anexo Contractual</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uploadPin}
                        onChange={(e) => setUploadPin(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      Conservar siempre
                    </label>
                  </div>
                </div>

                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 text-center">
                  <Upload className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Seleccionar archivo (PDF, ZIP, PNG, SVG, AI)</span>
                  <span className="text-[11px] text-slate-500">
                    {blobConfigured ? "Se guardará en Vercel Blob privado" : "Hasta 3.5 MB directo o usa Link Drive abajo"}
                  </span>
                  <input type="file" className="hidden" onChange={handleAdminUploadFile} />
                </label>

                <form onSubmit={handleAddExternalLink} className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" /> O adjuntar enlace Google Drive / Figma (0 bytes)
                  </div>
                  <input
                    type="text"
                    required
                    value={extLinkName}
                    onChange={(e) => setExtLinkName(e.target.value)}
                    placeholder="Nombre visible (ej. Carpeta Editables AI)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={extLinkUrl}
                      onChange={(e) => setExtLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-sm font-extrabold text-slate-900 mb-3">
                  Archivos en Bóveda ({activeFiles.length})
                </h2>
                {activeFiles.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    Todavía no hay archivos para {activeOrder.order_code}.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeFiles.map((f) => (
                      <div key={f.id} className="border border-slate-200 rounded-xl p-3 flex flex-wrap justify-between items-center gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{f.file_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {f.uploaded_by === "CLIENT" ? "Subido por Cliente" : f.category} · {formatBytes(f.size_bytes)} ·{" "}
                            {f.pinned_forever || !f.expires_at
                              ? "Permanente"
                              : `Vence ${formatShortDate(f.expires_at)}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/api/agency/files/${f.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Abrir
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              await togglePinFileAction(f.id, !f.pinned_forever);
                              await loadWorkspace();
                            }}
                            title="Fijar permanente"
                            className={`p-1.5 rounded-lg border ${
                              f.pinned_forever
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 text-slate-500"
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("¿Eliminar este archivo?")) {
                                await deleteAgencyFileAction(f.id);
                                await loadWorkspace();
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* SECTION 4: ENCUESTAS BRIEF PERSONALIZADAS                        */}
      {/* ================================================================= */}
      {section === "surveys" && (
        <>
          {renderOrderSelectorHeader(
            "Encuestas de Requerimientos (Brief por Servicio)",
            "Personaliza las preguntas que el cliente ve en su portal y revisa sus respuestas"
          )}

          {!activeOrder || !activeSurvey ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              Selecciona una orden con encuesta asignada.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-extrabold text-slate-900">{activeSurvey.title}</h2>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      activeSurvey.status === "SUBMITTED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {activeSurvey.status === "SUBMITTED" ? "Respondida ✓" : "Esperando respuesta"}
                  </span>
                </div>

                {(activeSurvey.questions_json || []).map((q, idx) => {
                  const ans = (activeSurvey.answers_json as Record<string, string>)?.[q.id];
                  return (
                    <div key={q.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500">
                            Pregunta {idx + 1} · {q.type}
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">{q.label}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSurveyQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Quitar pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                        {ans ? (
                          <strong className="text-emerald-800">{ans}</strong>
                        ) : (
                          <span className="text-slate-400 italic">Sin responder aún por el cliente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" /> Agregar Pregunta al Cuestionario
                </h2>
                <form onSubmit={handleAddSurveyQuestion} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto de la pregunta</label>
                    <input
                      type="text"
                      required
                      value={newQLabel}
                      onChange={(e) => setNewQLabel(e.target.value)}
                      placeholder="Ej. ¿Deseas integrar pasarela Culqi o solo Yape?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo de respuesta</label>
                    <select
                      value={newQType}
                      onChange={(e) => setNewQType(e.target.value as "text" | "textarea" | "choice")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    >
                      <option value="textarea">Párrafo amplio</option>
                      <option value="text">Texto corto (1 línea)</option>
                      <option value="choice">Botones de selección múltiple</option>
                    </select>
                  </div>
                  {newQType === "choice" && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Opciones (separadas por coma)
                      </label>
                      <input
                        type="text"
                        required
                        value={newQOptions}
                        onChange={(e) => setNewQOptions(e.target.value)}
                        placeholder="Opción A, Opción B, Opción C"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0B0F19] text-[#00E076] text-xs font-extrabold"
                  >
                    + Añadir Pregunta al Portal Cliente
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* SECTION 5: CONTROL DE ALMACENAMIENTO & RETENCIÓN 180 DÍAS         */}
      {/* ================================================================= */}
      {section === "storage" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" /> Almacenamiento R2 / Vercel Blob &amp; Política 180 Días
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Cuentas, contratos PDF firmados, encuestas y libro contable se conservan siempre. Los descargables pesados expiran a los 180 días salvo que los fijes manualmente.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await purgeExpiredFilesAction();
                if (res.success) {
                  setBannerMsg(`Limpieza ejecutada: ${res.purgedCount} archivo(s) vencidos eliminados.`);
                  await loadWorkspace();
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#0B0F19] text-[#00E076] text-xs font-extrabold shrink-0"
            >
              Depurar Expirados (&gt;180d)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10.5px] font-bold text-slate-500 uppercase">Espacio en Archivos</div>
              <div className="text-2xl font-black mt-1 tabular-nums">{formatBytes(totalStorageBytes)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10.5px] font-bold text-slate-500 uppercase">Motor Activo</div>
              <div className="text-sm font-extrabold mt-2 text-indigo-700">
                {blobConfigured ? "Vercel Blob Privado ✓" : "DB Inline (≤3.5MB) + Drive"}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10.5px] font-bold text-slate-500 uppercase">Archivos Totales</div>
              <div className="text-2xl font-black mt-1 tabular-nums">{files.length}</div>
            </div>
          </div>

          {!blobConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
              <strong>Tip para archivos pesados (&gt;3.5 MB):</strong> cuando quieras subir `.zip` o videos pesados directo a la nube, activa <strong>Vercel Blob</strong> en el panel de Vercel (`BLOB_READ_WRITE_TOKEN`) o pega el enlace de Google Drive en la Bóveda (ocupa 0 bytes).
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: NUEVA COMPRA MANUAL                                        */}
      {/* ================================================================= */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-[#0B0F19] text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-extrabold">Registrar Compra Manual en Libro Contable</h2>
                <p className="text-[11px] text-slate-400">
                  Genera orden correlativa, cuenta permanente en /portal, contrato MiamSign, etapas y encuesta.
                </p>
              </div>
              <button type="button" onClick={() => setShowNewOrderModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Servicio del Catálogo</label>
                  <select
                    value={mServiceId}
                    onChange={(e) => handleManualServiceSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    {CATALOG.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre personalizado del servicio</label>
                  <input
                    type="text"
                    required
                    value={mServiceName}
                    onChange={(e) => setMServiceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre completo del cliente *</label>
                  <input type="text" required value={mClientName} onChange={(e) => setMClientName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo electrónico (Usuario portal) *</label>
                  <input type="email" required value={mClientEmail} onChange={(e) => setMClientEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input type="text" value={mClientPhone} onChange={(e) => setMClientPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DNI / RUC</label>
                  <input type="text" value={mClientDoc} onChange={(e) => setMClientDoc(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Razón Social / Marca</label>
                  <input type="text" value={mRazon} onChange={(e) => setMRazon(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dirección fiscal</label>
                  <input type="text" value={mAddress} onChange={(e) => setMAddress(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total (S/)</label>
                  <input type="number" step="0.01" required value={mTotalPen} onChange={(e) => setMTotalPen(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Abonado hoy (S/)</label>
                  <input type="number" step="0.01" required value={mPaidPen} onChange={(e) => setMPaidPen(parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medio</label>
                  <select value={mPayMethod} onChange={(e) => setMPayMethod(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="YAPE">Yape</option>
                    <option value="PLIN">Plin</option>
                    <option value="BCP">Transferencia BCP</option>
                    <option value="VISA_CULQI">Culqi / Tarjeta</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SUNAT</label>
                  <select value={mSunatType} onChange={(e) => setMSunatType(e.target.value as "BOLETA" | "FACTURA")} className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="BOLETA">Boleta</option>
                    <option value="FACTURA">Factura</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Comprobante SUNAT</label>
                  <input type="text" value={mSunatNumber} onChange={(e) => setMSunatNumber(e.target.value)} placeholder="Ej. F001-001" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Operación Yape/BCP</label>
                  <input type="text" value={mOpCode} onChange={(e) => setMOpCode(e.target.value)} placeholder="Opcional" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clave portal (Opcional)</label>
                  <input type="text" value={mInitialPwd} onChange={(e) => setMInitialPwd(e.target.value)} placeholder="Auto: MIAM-XXXX" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
              </div>

              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={mSendEmails} onChange={(e) => setMSendEmails(e.target.checked)} className="rounded border-slate-300" />
                Enviar Correo 1 (Comprobante + Clave Portal) y Correo 2 (Firma Contrato) automáticamente
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700">
                  Cancelar
                </button>
                <button type="submit" disabled={creatingOrder} className="px-5 py-2 rounded-xl bg-[#0B0F19] text-[#00E076] font-extrabold disabled:opacity-60">
                  {creatingOrder ? "Registrando..." : "Guardar Orden y Crear Portal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ACTUALIZAR COBRO & SUNAT                                   */}
      {/* ================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900">Actualizar Cobro &amp; SUNAT ({editingOrder.order_code})</h3>
              <button type="button" onClick={() => setEditingOrder(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estado de Pago</label>
              <select
                value={editPayStatus}
                onChange={(e) => {
                  const v = e.target.value as "PENDING_VERIFY" | "PAID_50" | "PAID_100";
                  setEditPayStatus(v);
                  if (v === "PAID_100") setEditPaidPen(editingOrder.total_pen);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              >
                <option value="PENDING_VERIFY">Pendiente de verificar</option>
                <option value="PAID_50">50% Abonado</option>
                <option value="PAID_100">100% Liquidado</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Cobrado (S/)</label>
              <input
                type="number"
                step="0.01"
                value={editPaidPen}
                onChange={(e) => setEditPaidPen(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Serie/Número Comprobante SUNAT</label>
              <input
                type="text"
                value={editSunatNum}
                onChange={(e) => setEditSunatNum(e.target.value)}
                placeholder="Ej. F001-00012"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Entrega Final Estimada</label>
              <input
                type="date"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 rounded-xl border border-slate-300 font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const nextBal = Math.max(0, Number((editingOrder.total_pen - editPaidPen).toFixed(2)));
                  await updateAgencyOrderPaymentAction({
                    orderId: editingOrder.id,
                    paidPen: editPaidPen,
                    balancePen: nextBal,
                    paymentStatus: editPayStatus,
                    sunatNumber: editSunatNum,
                    deliveryDueAt: editDueAt || undefined,
                  });
                  setEditingOrder(null);
                  setBannerMsg(`Orden ${editingOrder.order_code} actualizada.`);
                  await loadWorkspace();
                }}
                className="px-4 py-2 rounded-xl bg-[#0B0F19] text-[#00E076] font-extrabold"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageEditorRow({
  stage,
  onStatusChange,
  onSaveMeta,
  onDelete,
}: {
  stage: AgencyStageRecord;
  onStatusChange: (s: AgencyStageRecord, next: "DONE" | "IN_PROGRESS" | "PENDING") => Promise<void>;
  onSaveMeta: (s: AgencyStageRecord, dueDate: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [due, setDue] = useState(stage.due_date || "");
  const [note, setNote] = useState(stage.deliverable_note || "");

  return (
    <div
      className={`rounded-xl border p-4 space-y-2.5 ${
        stage.status === "DONE"
          ? "border-emerald-200 bg-emerald-50/50"
          : stage.status === "IN_PROGRESS"
            ? "border-indigo-300 bg-indigo-50/50"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="font-extrabold text-xs sm:text-sm text-slate-900">{stage.title}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["DONE", "IN_PROGRESS", "PENDING"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusChange(stage, st)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${
                stage.status === st
                  ? st === "DONE"
                    ? "bg-emerald-600 text-white"
                    : st === "IN_PROGRESS"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {st === "DONE" ? "✓ Hecho" : st === "IN_PROGRESS" ? "● En curso" : "Pendiente"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onDelete(stage.id)}
            className="p-1 text-slate-400 hover:text-red-600"
            title="Eliminar etapa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        <div className="md:col-span-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
          />
        </div>
        <div className="md:col-span-7">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota para el cliente (qué ya se hizo o qué falta)..."
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
          />
        </div>
        <div className="md:col-span-2 text-right">
          <button
            type="button"
            onClick={() => onSaveMeta(stage, due, note)}
            className="w-full py-1.5 px-3 rounded-lg bg-[#0B0F19] text-[#00E076] text-xs font-extrabold inline-flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
