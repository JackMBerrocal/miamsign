"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileSignature,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Home,
  KeyRound,
  Layers,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Plus,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import AdminAgencyWorkspace, { AgencyAdminSection } from "@/components/AdminAgencyWorkspace";
import { formatBytes } from "@/components/BentoWidgets";
import {
  changeAdminPasswordAction,
  createContract,
  deleteContract,
  getContracts,
  logoutAdminAction,
  resendContractEmail,
  updateAdminProfileAction,
  updateContractClient,
} from "./actions";
import { BRANDING_CONTRACT, MIAMBOT_CONTRACT, WEB_CONTRACT, generateTemplate } from "./templates";
import { CATALOG } from "./services";
import ContractDocumentPreview from "@/components/ContractDocumentPreview";
import { splitContractIntoPages } from "@/lib/contract-format";
import { buildContractInviteEmailHtml, buildContractSignedEmailHtml } from "@/lib/email-templates";

const COMPANY_ID = "63d76e71-460d-4560-af33-b1d5bf59cc28";

const TEMPLATES: Record<string, { title: string; content: string; paymentHint: string }> = {
  BRANDING: {
    title: "Contrato de Branding, Papelería y Diseño (Vista Previa)",
    content: generateTemplate(
      "BRANDING",
      "Empresa Cliente S.A.C.",
      "20601234567",
      "Av. Javier Prado Este 1234, San Borja, Lima",
      "531.00 PEN",
      "50_50",
      "Diseño de Logotipo",
      "✔️ 2 a 3 propuestas conceptuales\n✔️ Diseño vectorial minimalista\n✔️ Archivos editables (AI, EPS, PNG, SVG)",
      "5 a 7 días hábiles"
    ),
    paymentHint: "50% Inicio / 50% Entrega",
  },
  WEB: {
    title: "Contrato de Desarrollo Web y Arquitectura Digital (Vista Previa)",
    content: generateTemplate(
      "WEB",
      "Empresa Cliente S.A.C.",
      "20601234567",
      "Av. Javier Prado Este 1234, San Borja, Lima",
      "2,360.00 PEN",
      "50_50",
      "Sitio Web Corporativo Básico (5 Páginas)",
      "✔️ 5 Páginas completas responsivas\n✔️ Certificado SSL e indexación Google\n✔️ Garantía técnica 90 días",
      "15 a 20 días hábiles"
    ),
    paymentHint: "50% Inicio / 50% Entrega",
  },
  MIAMBOT: {
    title: "Contrato de Marketing Digital y Automatización MiamBot IA (Vista Previa)",
    content: generateTemplate(
      "MIAMBOT",
      "Empresa Cliente S.A.C.",
      "20601234567",
      "Av. Javier Prado Este 1234, San Borja, Lima",
      "99.00 USD / mes",
      "MONTHLY",
      "MiamBot Plan Negocio",
      "✔️ WhatsApp Cloud API, TikTok, Instagram y Messenger\n✔️ Motor IA RAG + flujos No-Code\n✔️ 0% comisiones en cobros",
      "Mensual (Activación en 24–72 h)"
    ),
    paymentHint: "100% Prepago Mensual",
  },
};

export default function MiamSignDashboard({
  userEmail,
  initialDisplayName,
  initialMustChangePassword,
}: {
  userEmail: string;
  initialDisplayName: string;
  initialMustChangePassword: boolean;
}) {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<
    AgencyAdminSection | "home" | "manage" | "templates" | "settings"
  >("ledger");
  const [agencySummary, setAgencySummary] = useState<{ usedBytes: number; totalOrders: number }>({
    usedBytes: 0,
    totalOrders: 0,
  });

  // Profile & Security State
  const [displayName, setDisplayName] = useState(initialDisplayName || "Jack M. Berrocal");
  const [mustChangePassword, setMustChangePassword] = useState(initialMustChangePassword);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwdFields, setShowPwdFields] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Create Modal State + Live Client Preview Tabs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createPreviewTab, setCreatePreviewTab] = useState<"client-a4" | "email" | "markdown">("client-a4");
  const [emailDeviceMode, setEmailDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [simulateSignedPreview, setSimulateSignedPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState(`Contrato de ${CATALOG[0].name} - Miam`);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(CATALOG[0].id);
  const [serviceName, setServiceName] = useState(CATALOG[0].name);
  const [serviceDeliverables, setServiceDeliverables] = useState(
    CATALOG[0].deliverables.map((d) => `✔️ ${d}`).join("\n\n")
  );
  const [deliveryTime, setDeliveryTime] = useState(CATALOG[0].deliveryTime);
  const [paymentAmount, setPaymentAmount] = useState(CATALOG[0].price);
  const [paymentType, setPaymentType] = useState(CATALOG[0].defaultPaymentType);
  const [type, setType] = useState(CATALOG[0].baseTemplate);
  const [content, setContent] = useState(
    generateTemplate(
      CATALOG[0].baseTemplate,
      "",
      "",
      "",
      CATALOG[0].price,
      CATALOG[0].defaultPaymentType,
      CATALOG[0].name,
      CATALOG[0].deliverables.map((d) => `✔️ ${d}`).join("\n\n"),
      CATALOG[0].deliveryTime
    )
  );

  // Template Preview Modal (A4 or Raw)
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [templatePreviewMode, setTemplatePreviewMode] = useState<"a4" | "raw">("a4");

  // Existing Contract Client-View Modal
  const [viewingContract, setViewingContract] = useState<any | null>(null);
  const [viewContractTab, setViewContractTab] = useState<"a4" | "email">("a4");

  // Edit Client Modal
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDocument, setEditDocument] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadContracts = async () => {
    setLoading(true);
    const res = await getContracts(COMPANY_ID);
    if (res.success) setContracts(res.contracts || []);
    setLoading(false);
  };

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    setContent(
      generateTemplate(
        type,
        clientName,
        clientDocument,
        clientAddress,
        paymentAmount,
        paymentType,
        serviceName,
        serviceDeliverables,
        deliveryTime
      )
    );
  }, [clientName, clientDocument, clientAddress, type, paymentAmount, paymentType, serviceName, serviceDeliverables, deliveryTime]);

  const handleServiceChange = (newId: string) => {
    const service = CATALOG.find((s) => s.id === newId);
    if (!service) return;

    setSelectedServiceId(newId);
    setServiceName(service.name);
    setServiceDeliverables(service.deliverables.map((d) => `✔️ ${d}`).join("\n\n"));
    setDeliveryTime(service.deliveryTime);
    setPaymentAmount(service.price);
    setPaymentType(service.defaultPaymentType);
    setType(service.baseTemplate);
    setTitle(`Contrato de ${service.name} - Miam`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!clientName || !clientEmail) return alert("Faltan datos del cliente");

    setIsCreating(true);
    try {
      const res = await createContract({
        title,
        clientName,
        clientEmail,
        clientDocument,
        clientAddress,
        clientPhone,
        paymentAmount,
        paymentType,
        type,
        content,
        companyId: COMPANY_ID,
      });

      if (res.success) {
        alert(
          res.emailSent
            ? "¡Contrato creado y enviado al correo del cliente exitosamente!"
            : "Contrato creado en MiamSign (falta configurar EMAIL_PASS en Vercel para envío automático por correo; puedes copiar el enlace /sign/... y enviarlo por WhatsApp)."
        );
        setClientName("");
        setClientEmail("");
        setClientDocument("");
        setClientAddress("");
        setClientPhone("");
        setPaymentAmount(CATALOG[0].price);
        setPaymentType(CATALOG[0].defaultPaymentType);
        setIsModalOpen(false);
        loadContracts();
      } else {
        alert("Error al crear contrato: " + res.error);
      }
    } catch (err: any) {
      alert("Error inesperado: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/sign/${id}`;
    navigator.clipboard.writeText(url);
    alert("¡Enlace copiado! Envíalo por WhatsApp al cliente.");
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este contrato permanentemente? El enlace y el documento dejarán de existir.")) {
      const res = await deleteContract(id);
      if (res.success) {
        alert("Contrato eliminado correctamente.");
        loadContracts();
      } else {
        alert("Error al eliminar: " + res.error);
      }
    }
  };

  const handleResend = async (id: string) => {
    if (confirm("¿Deseas volver a disparar el correo electrónico hacia este cliente?")) {
      const res = await resendContractEmail(id);
      if (res.success) {
        alert("¡Correo reenviado exitosamente!");
      } else {
        alert("Error al reenviar: " + res.error);
      }
    }
  };

  const openEditModal = (contract: any) => {
    setEditingContract(contract);
    setEditName(contract.clientName);
    setEditEmail(contract.clientEmail || "");
    setEditDocument(contract.clientDocument || "");
    setEditAddress(contract.clientAddress || "");
    setEditPhone(contract.clientPhone || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    const res = await updateContractClient(
      editingContract.id,
      editName,
      editEmail,
      editPhone,
      editDocument,
      editAddress
    );
    if (res.success) {
      alert("Datos del cliente actualizados.");
      setEditingContract(null);
      loadContracts();
    } else {
      alert("Error al actualizar: " + res.error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (newPwd.length < 8) {
      setPwdFeedback({ type: "err", msg: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdFeedback({ type: "err", msg: "La confirmación no coincide con la nueva contraseña." });
      return;
    }

    setPwdSaving(true);
    try {
      const res = await changeAdminPasswordAction(currentPwd, newPwd, displayName);
      if (res.success) {
        setMustChangePassword(false);
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setPwdFeedback({
          type: "ok",
          msg: "Contraseña actualizada y cifrada correctamente. La clave genérica inicial ha quedado desactivada.",
        });
        router.refresh();
      } else {
        setPwdFeedback({ type: "err", msg: res.error || "No se pudo actualizar la contraseña." });
      }
    } catch (err: any) {
      setPwdFeedback({ type: "err", msg: err?.message || "Error inesperado." });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleSaveProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    const res = await updateAdminProfileAction(displayName);
    if (res.success) {
      setDisplayName(res.displayName || displayName);
      setProfileMsg("Nombre de perfil actualizado.");
      router.refresh();
    } else {
      setProfileMsg(res.error || "Error al guardar.");
    }
    setProfileSaving(false);
  };

  const handleLogout = async () => {
    await logoutAdminAction();
    router.refresh();
  };

  const filteredContracts = contracts.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.clientName || "").toLowerCase().includes(q) ||
      (c.clientEmail || "").toLowerCase().includes(q) ||
      (c.clientDocument || "").toLowerCase().includes(q)
    );
  });

  const passwordStrength =
    newPwd.length >= 12 && /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) && /[^A-Za-z0-9]/.test(newPwd)
      ? { label: "Muy fuerte", color: "bg-emerald-500", pct: "100%" }
      : newPwd.length >= 8 && (/[A-Z]/.test(newPwd) || /[0-9]/.test(newPwd))
        ? { label: "Aceptable", color: "bg-amber-500", pct: "65%" }
        : newPwd.length > 0
          ? { label: "Débil (mínimo 8 caracteres)", color: "bg-red-500", pct: "30%" }
          : null;

  const livePageCount = splitContractIntoPages(content).length;
  const liveEmailMeta = {
    serviceName,
    clientDocument: clientDocument || "20608812345",
    paymentAmount,
    paymentType,
    deliveryTime,
    content,
    pageCount: livePageCount,
  };
  const liveEmailHtml = simulateSignedPreview
    ? buildContractSignedEmailHtml({
        clientName: clientName || "Andrea Mendoza Quispe",
        contractTitle: title,
        contractUrl: "https://firmas.miam.com.pe/sign/vista-previa-cliente",
        signedAt: new Date(),
        clientIp: "190.237.48.12",
        ...liveEmailMeta,
      })
    : buildContractInviteEmailHtml({
        clientName: clientName || "Andrea Mendoza Quispe",
        contractTitle: title,
        contractUrl: "https://firmas.miam.com.pe/sign/vista-previa-cliente",
        ...liveEmailMeta,
      });

  const initials = (displayName || userEmail || "JA")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-900">
      {/* Dark Propuesta 1 Sidebar */}
      <aside className={`bg-[#0B0F19] text-slate-200 transition-[width] duration-200 flex flex-col shrink-0 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Alternar barra lateral"
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <div className="ml-2 flex items-center gap-2.5">
              <img src="/img/miam-cat-white.png" alt="Miam" className="w-7 h-7 object-contain" />
              <div className="leading-tight">
                <div className="font-extrabold text-sm text-white tracking-tight">MiamOS</div>
                <div className="text-[10px] text-slate-400">Digital Studio S.A.C.</div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto" aria-label="Navegación principal">
          <NavItem icon={<BookOpen className="w-4 h-4" />} label="Libro Contable" badge={agencySummary.totalOrders ? String(agencySummary.totalOrders) : undefined} active={activeTab === "ledger"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("ledger")} />
          <NavItem icon={<Layers className="w-4 h-4" />} label="Proyectos y Etapas" active={activeTab === "stages"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("stages")} />
          <NavItem icon={<FolderOpen className="w-4 h-4" />} label="Bóveda Archivos" active={activeTab === "vault"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("vault")} />
          <NavItem icon={<ClipboardList className="w-4 h-4" />} label="Encuestas Brief" active={activeTab === "surveys"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("surveys")} />
          <NavItem icon={<HardDrive className="w-4 h-4" />} label="Storage 180d" active={activeTab === "storage"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("storage")} />

          <div className="my-2 border-t border-white/10" />

          <NavItem icon={<Home className="w-4 h-4" />} label="MiamSign Inicio" active={activeTab === "home"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("home")} />
          <NavItem icon={<Folder className="w-4 h-4" />} label="Gestionar Contratos" active={activeTab === "manage"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("manage")} />
          <NavItem icon={<LayoutTemplate className="w-4 h-4" />} label="Plantillas Legales" active={activeTab === "templates"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("templates")} />
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          {sidebarOpen && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px]">
              <div className="flex justify-between font-bold text-slate-300">
                <span>Bóveda 180d</span>
                <span className="font-mono text-[#00E076]">{formatBytes(agencySummary.usedBytes)}</span>
              </div>
              <a
                href="/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-indigo-300 hover:text-white"
              >
                <ExternalLink className="w-3 h-3" /> Abrir Portal Cliente
              </a>
            </div>
          )}
          <NavItem
            icon={<KeyRound className="w-4 h-4" />}
            label="Perfil y Clave"
            badge={mustChangePassword ? "!" : undefined}
            active={activeTab === "settings"}
            sidebarOpen={sidebarOpen}
            onClick={() => setActiveTab("settings")}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 gap-4">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-full max-w-md border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-colors">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar documentos, cliente, correo o DNI/RUC..."
              className="bg-transparent border-none outline-none ml-2 text-sm w-full text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("settings")}
              className="hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
              title="Ir a Mi Perfil y Cambiar Contraseña"
            >
              <div className="w-8 h-8 bg-blue-50 border border-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-gray-900">{displayName}</div>
                <div className="text-[11px] text-gray-500">{userEmail}</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              title={mustChangePassword ? "Recomendado: cambia tu contraseña inicial" : "Perfil y Seguridad"}
            >
              <Bell className="w-4 h-4" />
              {mustChangePassword && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>}
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {(activeTab === "ledger" ||
              activeTab === "stages" ||
              activeTab === "vault" ||
              activeTab === "surveys" ||
              activeTab === "storage") && (
              <AdminAgencyWorkspace
                section={activeTab}
                onSectionChange={(next) => setActiveTab(next)}
                onStorageSummary={setAgencySummary}
              />
            )}

            {/* Banner de Primer Ingreso / Contraseña Temporal */}
            {mustChangePassword && activeTab !== "settings" && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-950">Están usando una contraseña inicial genérica</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Para proteger el acceso de <strong>{userEmail}</strong>, cambia la clave desde tu perfil. Una vez guardada, la clave temporal quedará desactivada.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0"
                >
                  Cambiar contraseña ahora →
                </button>
              </div>
            )}

            {activeTab === "home" && (
              <>
                <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel Ejecutivo · MiamSign</h1>
                    <p className="text-sm text-gray-500">
                      Contratos blindados bajo normativa peruana (Ley N° 29571, Ley N° 27269, D.L. 822) con vista previa A4 exacta para el cliente.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCreatePreviewTab("client-a4");
                      setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Documento
                  </button>
                </div>

                {/* KPIs sobrios tabular-nums */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <StatCard title="Contratos Activos Totales" count={contracts.length.toString()} sub="Emitidos en plataforma" />
                  <StatCard
                    title="Esperando firma del cliente"
                    count={contracts.filter((c) => c.status !== "SIGNED").length.toString()}
                    sub="Pendientes en /sign/[id]"
                    accent="amber"
                  />
                  <StatCard
                    title="Firmados y Perfeccionados"
                    count={contracts.filter((c) => c.status === "SIGNED").length.toString()}
                    sub="Con IP y fecha registrada"
                    accent="green"
                  />
                </div>
              </>
            )}

            {(activeTab === "home" || activeTab === "manage") && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3 bg-gray-50/70">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {activeTab === "home" ? "Documentos Recientes" : "Todos los Documentos"}
                    </h2>
                    <p className="text-xs text-gray-500">Haz clic en el ojo para ver el contrato y correo tal como le llegan al cliente.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeTab === "manage" && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition-colors"
                      >
                        + Crear Nuevo
                      </button>
                    )}
                    <button
                      onClick={loadContracts}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Asunto &amp; Modalidad</th>
                        <th className="px-6 py-3.5">Estado</th>
                        <th className="px-6 py-3.5">Destinatario</th>
                        <th className="px-6 py-3.5">Fecha</th>
                        <th className="px-6 py-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                            Cargando documentos...
                          </td>
                        </tr>
                      ) : filteredContracts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2.5" />
                            <p className="text-sm font-medium">No hay documentos que mostrar.</p>
                            <p className="text-xs text-gray-400 mt-1">Crea tu primer contrato o previsualiza tus plantillas A4 blindadas.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredContracts.map((contract) => (
                          <tr key={contract.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-sm text-gray-900">{contract.title}</div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{contract.type}</span>
                                {contract.paymentAmount && (
                                  <span className="text-[11px] font-mono text-gray-600 tabular-nums">{contract.paymentAmount}</span>
                                )}
                                <span className="text-[11px] text-gray-500">
                                  {contract.paymentType === "MONTHLY" ? "· 100% Mensual" : contract.paymentType === "100_UPFRONT" ? "· 100% Adelanto" : "· 50/50"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {contract.status === "SIGNED" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Completado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Esperando firma
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{contract.clientName}</div>
                              <div className="text-xs text-gray-500">{contract.clientEmail}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 font-mono tabular-nums">
                              {new Date(contract.createdAt).toLocaleDateString("es-PE")}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewContractTab("a4");
                                    setViewingContract(contract);
                                  }}
                                  title="Ver contrato y correo tal como le llega al cliente"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-2.5 py-1.5 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden lg:inline">Vista Cliente</span>
                                </button>
                                <a
                                  href={`/sign/${contract.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir enlace oficial de firma"
                                  className="text-gray-600 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 rounded-md p-1.5 transition-colors"
                                >
                                  <FileSignature className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => copyLink(contract.id)}
                                  title="Copiar enlace para WhatsApp"
                                  className="text-gray-600 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 rounded-md p-1.5 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                {contract.status !== "SIGNED" && (
                                  <>
                                    <button
                                      onClick={() => handleResend(contract.id)}
                                      title="Reenviar Correo"
                                      className="text-gray-600 hover:text-green-600 bg-white border border-gray-200 hover:border-green-200 rounded-md p-1.5 transition-colors"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => openEditModal(contract)}
                                      title="Editar Datos"
                                      className="text-gray-600 hover:text-amber-600 bg-white border border-gray-200 hover:border-amber-200 rounded-md p-1.5 transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => handleDelete(contract.id)}
                                  title="Eliminar Documento"
                                  className="text-gray-600 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 rounded-md p-1.5 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "templates" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Tus Plantillas Legales Blindadas (INDECOPI / Perú)</h1>
                  <p className="text-sm text-gray-500">
                    Actualizadas con Arts. 49°–51° Ley N° 29571, Libro de Reclamaciones D.S. 011-2011-PCM, D.L. 822, Ley N° 29733 y reglas 50/50 + 100%.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <TemplateCard
                    title="Branding, Papelería y Diseño"
                    desc="Acuerdo MSA para identidad corporativa, papelería, banners, posts y brandbooks (50/50, D.L. 822)."
                    type="BRANDING"
                    badge="50% Inicio / 50% Entrega"
                    onPreview={() => {
                      setTemplatePreviewMode("a4");
                      setPreviewType("BRANDING");
                    }}
                  />
                  <TemplateCard
                    title="Desarrollo Web & E-Commerce"
                    desc="Acuerdo MSA para landing pages, sitios corporativos, tiendas y sistemas a medida (UAT, 90 días garantía)."
                    type="WEB"
                    badge="50% Inicio / 50% Entrega"
                    onPreview={() => {
                      setTemplatePreviewMode("a4");
                      setPreviewType("WEB");
                    }}
                  />
                  <TemplateCard
                    title="Marketing Digital & MiamBot IA"
                    desc="Contrato para planes mensuales de redes y suscripción MiamBot IA sin penalidades abusivas de cancelación."
                    type="MIAMBOT"
                    badge="100% Prepago Mensual"
                    onPreview={() => {
                      setTemplatePreviewMode("a4");
                      setPreviewType("MIAMBOT");
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi Perfil y Seguridad</h1>
                  <p className="text-sm text-gray-500">Administra tu contraseña de acceso en MiamSign y los datos oficiales emisores.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cambio de Contraseña */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                          <KeyRound className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900">Cambiar Contraseña de Acceso</h2>
                          <p className="text-xs text-gray-500">Se cifra con scrypt en base de datos segura.</p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          mustChangePassword ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {mustChangePassword ? "Clave temporal activa" : "Clave personalizada"}
                      </span>
                    </div>

                    {pwdFeedback && (
                      <div
                        className={`mb-4 rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                          pwdFeedback.type === "ok"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {pwdFeedback.msg}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                          Contraseña actual
                        </label>
                        <div className="relative">
                          <input
                            type={showPwdFields ? "text" : "password"}
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            required
                            placeholder="Ingresa tu contraseña actual o temporal"
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwdFields(!showPwdFields)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                            aria-label="Mostrar u ocultar contraseñas"
                          >
                            {showPwdFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                          Nueva contraseña (mínimo 8 caracteres)
                        </label>
                        <input
                          type={showPwdFields ? "text" : "password"}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          required
                          placeholder="Usa letras, números y símbolos"
                          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                        {passwordStrength && (
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${passwordStrength.color} transition-[width] duration-200`} style={{ width: passwordStrength.pct }}></div>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">{passwordStrength.label}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                          Confirmar nueva contraseña
                        </label>
                        <input
                          type={showPwdFields ? "text" : "password"}
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          required
                          placeholder="Repite tu nueva contraseña"
                          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 text-sm transition-colors"
                      >
                        {pwdSaving ? "Guardando clave segura..." : "Actualizar Contraseña"}
                      </button>
                    </form>
                  </div>

                  {/* Perfil y Datos de Empresa */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-slate-700" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900">Perfil de Administrador</h2>
                          <p className="text-xs text-gray-500">Cuenta vinculada a {userEmail}</p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveProfileName} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                            Nombre visible
                          </label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                            Correo administrador
                          </label>
                          <input
                            type="email"
                            disabled
                            value={userEmail}
                            className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-sm text-gray-500"
                          />
                        </div>
                        {profileMsg && <p className="text-xs font-medium text-emerald-700">{profileMsg}</p>}
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 text-xs transition-colors"
                        >
                          {profileSaving ? "Guardando..." : "Guardar Nombre"}
                        </button>
                      </form>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Entidad Emisora en Contratos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 font-semibold block">RAZÓN SOCIAL</span>
                          <strong className="text-gray-800">Miam Digital Studio S.A.C.</strong>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-gray-400 font-semibold block">RUC</span>
                          <strong className="text-gray-800 font-mono">20615782344</strong>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 sm:col-span-2">
                          <span className="text-gray-400 font-semibold block">REPRESENTANTE LEGAL</span>
                          <strong className="text-gray-800">Jack Michael Berrocal Espinoza</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL: CREAR NUEVO DOCUMENTO CON VISTA PREVIA REAL A4 Y EMAIL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Enviar Nuevo Documento</h2>
                <p className="text-xs text-gray-500">Revisa en tiempo real el contrato A4 y el correo exacto tal como le llegarán al cliente.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Cerrar">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Formulario Izquierdo */}
              <div className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-r border-gray-200 p-5 overflow-y-auto shrink-0">
                <form id="create-form" onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Servicio a Contratar (37 opciones)</label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Array.from(new Set(CATALOG.map((s) => s.category))).map((category) => (
                        <optgroup key={category} label={category}>
                          {CATALOG.filter((s) => s.category === category).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} - {s.price}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre o Razón Social del Cliente *</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      placeholder="Ej. Andrea Mendoza / Café Sierra S.A.C."
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">DNI / RUC *</label>
                      <input
                        type="text"
                        value={clientDocument}
                        onChange={(e) => setClientDocument(e.target.value)}
                        required
                        placeholder="20608812345"
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Teléfono</label>
                      <input
                        type="text"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+51 987 654 321"
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Domicilio Legal / Fiscal *</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      required
                      placeholder="Av. Javier Prado Este 1420, Lima"
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Monto Total *</label>
                      <input
                        type="text"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Modalidad de Pago</label>
                      <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value as any)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="50_50">50% Adelanto / 50% Final</option>
                        <option value="100_UPFRONT">100% Adelanto</option>
                        <option value="MONTHLY">100% Mensual (Prepago)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Correo del Cliente *</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                      placeholder="cliente@empresa.pe"
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </form>
              </div>

              {/* Visor Derecho en 3 Pestañas */}
              <div className="flex-1 flex flex-col bg-[#eef1f5] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCreatePreviewTab("client-a4")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        createPreviewTab === "client-a4" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      📄 Contrato A4 Cliente ({livePageCount} págs)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatePreviewTab("email")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        createPreviewTab === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      ✉️ Correo al Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatePreviewTab("markdown")}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        createPreviewTab === "markdown" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      📝 Editar Texto Base
                    </button>
                  </div>

                  {(createPreviewTab === "client-a4" || createPreviewTab === "email") && (
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simulateSignedPreview}
                        onChange={(e) => setSimulateSignedPreview(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Simular firmado
                    </label>
                  )}

                  {createPreviewTab === "email" && (
                    <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setEmailDeviceMode("desktop")}
                        className={`p-1.5 rounded ${emailDeviceMode === "desktop" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
                        title="Vista Desktop"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailDeviceMode("mobile")}
                        className={`p-1.5 rounded ${emailDeviceMode === "mobile" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
                        title="Vista Móvil"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {createPreviewTab === "client-a4" && (
                    <div className="origin-top mx-auto max-w-[800px]">
                      <ContractDocumentPreview
                        mode="preview"
                        simulatedSigned={simulateSignedPreview}
                        contract={{
                          title,
                          content,
                          clientName: clientName || "[NOMBRE DEL CLIENTE]",
                          clientEmail: clientEmail || "[CORREO DEL CLIENTE]",
                          clientDocument: clientDocument || "[DNI/RUC]",
                        }}
                      />
                    </div>
                  )}

                  {createPreviewTab === "email" && (
                    <div className="flex justify-center">
                      <div
                        className={`bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden transition-[width] duration-200 ${
                          emailDeviceMode === "mobile" ? "w-[375px]" : "w-full max-w-[660px]"
                        }`}
                      >
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 space-y-0.5">
                          <div>
                            <strong>De:</strong> &quot;MiamSign - Legal&quot; &lt;noreply@miam.com.pe&gt;
                          </div>
                          <div>
                            <strong>Para:</strong> {clientEmail || "cliente@empresa.pe"}
                          </div>
                          <div>
                            <strong>Asunto:</strong>{" "}
                            {simulateSignedPreview
                              ? `✅ Contrato Firmado y PDF A4 Listo: ${title} - Miam Digital Studio`
                              : `Firma Requerida: ${title} - Miam Digital Studio`}
                          </div>
                        </div>
                        <iframe
                          title="Vista previa del correo para el cliente"
                          srcDoc={liveEmailHtml}
                          sandbox=""
                          className="w-full h-[560px] border-0 bg-[#f1f5f9]"
                        />
                      </div>
                    </div>
                  )}

                  {createPreviewTab === "markdown" && (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-full min-h-[460px] bg-white border border-gray-200 outline-none resize-none font-mono text-xs text-gray-800 p-4 rounded-xl focus:ring-2 focus:ring-blue-200"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">
                Al enviar, se guarda el contrato en BD y se genera el enlace seguro <code>/sign/[id]</code>.
              </span>
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="create-form"
                  disabled={isCreating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isCreating ? "Generando y Enviando..." : "Crear y Enviar al Cliente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISTA PREVIA DE CONTRATO EXISTENTE COMO LO VE EL CLIENTE */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3 bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900">{viewingContract.title}</h2>
                <p className="text-xs text-gray-500">
                  Vista exacta del cliente: {viewingContract.clientName} ({viewingContract.clientEmail})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex bg-gray-200/70 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setViewContractTab("a4")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      viewContractTab === "a4" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    📄 Documento A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewContractTab("email")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      viewContractTab === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    ✉️ Correo enviado
                  </button>
                </div>

                <button
                  onClick={() => setViewingContract(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Cerrar vista cliente"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#ececec] p-4 sm:p-6">
              {viewContractTab === "a4" ? (
                <ContractDocumentPreview contract={viewingContract} mode="preview" />
              ) : (
                <div className="max-w-[640px] mx-auto bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm">
                  <iframe
                    title="Vista del correo al cliente"
                    srcDoc={
                      viewingContract.status === "SIGNED"
                        ? buildContractSignedEmailHtml({
                            clientName: viewingContract.clientName || "Cliente",
                            contractTitle: viewingContract.title || "Contrato Miam",
                            contractUrl: `${typeof window !== "undefined" ? window.location.origin : "https://firmas.miam.com.pe"}/sign/${viewingContract.id}`,
                            signedAt: viewingContract.signedAt ? new Date(viewingContract.signedAt) : new Date(),
                            clientIp: viewingContract.clientIp || "Registrada por servidor",
                            clientDocument: viewingContract.clientDocument || undefined,
                            paymentAmount: viewingContract.paymentAmount || undefined,
                            paymentType: viewingContract.paymentType || undefined,
                            content: viewingContract.content || undefined,
                          })
                        : buildContractInviteEmailHtml({
                            clientName: viewingContract.clientName || "Cliente",
                            contractTitle: viewingContract.title || "Contrato Miam",
                            contractUrl: `${typeof window !== "undefined" ? window.location.origin : "https://firmas.miam.com.pe"}/sign/${viewingContract.id}`,
                            clientDocument: viewingContract.clientDocument || undefined,
                            paymentAmount: viewingContract.paymentAmount || undefined,
                            paymentType: viewingContract.paymentType || undefined,
                            content: viewingContract.content || undefined,
                          })
                    }
                    sandbox=""
                    className="w-full h-[640px] border-0 bg-[#eef2f7]"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(viewingContract.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar enlace /sign
                </button>
                <a
                  href={`/sign/${viewingContract.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
                >
                  Abrir URL real de firma ↗
                </a>
              </div>
              <button
                onClick={() => setViewingContract(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISTA PREVIA DE PLANTILLA EN FORMATO A4 OFICIAL */}
      {previewType && TEMPLATES[previewType] && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3 bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900">{TEMPLATES[previewType].title}</h2>
                <p className="text-xs text-gray-500">Modalidad configurada: {TEMPLATES[previewType].paymentHint}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-gray-200/70 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTemplatePreviewMode("a4")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      templatePreviewMode === "a4" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    📄 Vista Cliente (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplatePreviewMode("raw")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      templatePreviewMode === "raw" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    📝 Texto Base Markdown
                  </button>
                </div>
                <button onClick={() => setPreviewType(null)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Cerrar lectura">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#ececec]">
              {templatePreviewMode === "a4" ? (
                <ContractDocumentPreview
                  mode="preview"
                  contract={{
                    title: TEMPLATES[previewType].title,
                    content: TEMPLATES[previewType].content,
                    clientName: "Empresa Cliente S.A.C.",
                    clientEmail: "gerencia@cliente.pe",
                    clientDocument: "20601234567",
                  }}
                />
              ) : (
                <div className="bg-white p-6 rounded-xl border border-gray-200 font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {previewType === "BRANDING" ? BRANDING_CONTRACT : previewType === "WEB" ? WEB_CONTRACT : MIAMBOT_CONTRACT}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setPreviewType(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cerrar Lectura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DESTINATARIO */}
      {editingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">Editar Datos del Destinatario</h2>
              <button onClick={() => setEditingContract(null)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">DNI / RUC</label>
                  <input
                    type="text"
                    value={editDocument}
                    onChange={(e) => setEditDocument(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Domicilio Legal</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  sidebarOpen,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  sidebarOpen: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex items-center">
        <span className={active ? "text-[#00E076]" : "text-slate-400"}>{icon}</span>
        {sidebarOpen && <span className={`ml-3 text-xs font-semibold ${active ? "text-white font-bold" : ""}`}>{label}</span>}
      </span>
      {badge && sidebarOpen && (
        <span className="px-1.5 py-0.5 rounded-full bg-[#00E076]/20 text-[#00E076] text-[10px] font-extrabold">
          {badge}
        </span>
      )}
    </button>
  );
}

function TemplateCard({
  title,
  desc,
  type,
  badge,
  onPreview,
}: {
  title: string;
  desc: string;
  type: string;
  badge: string;
  onPreview?: () => void;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">{badge}</span>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{type}</span>
        {onPreview && (
          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver como Cliente (A4)
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  count,
  sub,
  accent,
}: {
  title: string;
  count: string;
  sub: string;
  accent?: "amber" | "green";
}) {
  const numColor = accent === "amber" ? "text-amber-700" : accent === "green" ? "text-emerald-700" : "text-gray-900";
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <span className={`text-3xl font-bold font-mono tabular-nums ${numColor}`}>{count}</span>
      <span className="text-xs text-gray-400 mt-1">{sub}</span>
    </div>
  );
}
