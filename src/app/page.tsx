"use client";
import { useState, useEffect } from "react";
import { createContract, getContracts, deleteContract, updateContractClient, resendContractEmail } from "./actions";
import { BRANDING_CONTRACT, WEB_CONTRACT, MIAMBOT_CONTRACT, generateTemplate } from "./templates";
import { FileSignature, Folder, LayoutTemplate, Settings, Home, Search, Bell, Menu, Plus, FileText, CheckCircle2, Clock, Trash2, Send, Edit } from "lucide-react";

const COMPANY_ID = "63d76e71-460d-4560-af33-b1d5bf59cc28";

const TEMPLATES: Record<string, string> = {
  BRANDING: BRANDING_CONTRACT,
  WEB: WEB_CONTRACT,
  MIAMBOT: MIAMBOT_CONTRACT
};

export default function MiamSignDashboard() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("home"); // home, manage, templates, settings
  const [previewType, setPreviewType] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("Contrato de Branding - Miam");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [type, setType] = useState("BRANDING");
  const [content, setContent] = useState(generateTemplate("BRANDING", "", "", ""));

  // Edit State
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(generateTemplate(type, clientName, clientDocument, clientAddress));
  }, [clientName, clientDocument, clientAddress, type]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "BRANDING") setTitle("Contrato de Branding y Diseño - Miam");
    if (newType === "WEB") setTitle("Contrato de Desarrollo Web - Miam");
    if (newType === "MIAMBOT") setTitle("Suscripción MiamBot (SaaS) - Miam");
  };


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return alert("Faltan datos del cliente");

    const res = await createContract({
      title,
      clientName,
      clientEmail,
      clientDocument,
      clientAddress,
      clientPhone,
      type,
      content,
      companyId: COMPANY_ID
    });

    if (res.success) {
      alert("¡Contrato creado exitosamente!");
      setClientName("");
      setClientEmail("");
      setClientDocument("");
      setClientAddress("");
      setClientPhone("");
      setIsModalOpen(false);
      loadContracts();
    } else {
      alert("Error al crear contrato: " + res.error);
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
    const res = await updateContractClient(editingContract.id, editName, editEmail, editPhone, editDocument, editAddress);
    if (res.success) {
      alert("Datos del cliente actualizados.");
      setEditingContract(null);
      loadContracts();
    } else {
      alert("Error al actualizar: " + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <div className="ml-3 flex items-center font-bold text-lg tracking-tight text-blue-900">
              <FileSignature className="w-5 h-5 mr-2 text-blue-600" />
              MiamSign
            </div>
          )}
        </div>
        <div className="flex-1 py-4 flex flex-col gap-1 px-3">
          <NavItem icon={<Home className="w-5 h-5" />} label="Inicio" active={activeTab === "home"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("home")} />
          <NavItem icon={<Folder className="w-5 h-5" />} label="Gestionar" active={activeTab === "manage"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("manage")} />
          <NavItem icon={<LayoutTemplate className="w-5 h-5" />} label="Plantillas" active={activeTab === "templates"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("templates")} />
        </div>
        <div className="p-4 border-t border-gray-200">
          <NavItem icon={<Settings className="w-5 h-5" />} label="Configuración" active={activeTab === "settings"} sidebarOpen={sidebarOpen} onClick={() => setActiveTab("settings")} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md w-96 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar documentos, destinatarios..." className="bg-transparent border-none outline-none ml-2 text-sm w-full text-gray-700 placeholder:text-gray-400" />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
              JA
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === "home" && (
              <>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido a MiamSign</h1>
                    <p className="text-gray-500">Gestiona y envía tus documentos para firma electrónica.</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-md transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Documento
                  </button>
                </div>

                {/* Quick Stats or Overview */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <StatCard title="Requiere tu acción" count="0" />
                  <StatCard title="Esperando a otros" count={contracts.filter(c => c.status !== "SIGNED").length.toString()} />
                  <StatCard title="Completados" count={contracts.filter(c => c.status === "SIGNED").length.toString()} />
                </div>
              </>
            )}

            {(activeTab === "home" || activeTab === "manage") && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-900">{activeTab === "home" ? "Documentos Recientes" : "Todos los Documentos"}</h2>
                  <div className="flex gap-4">
                    {activeTab === "manage" && (
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-4 rounded-md transition-colors"
                      >
                        Crear Nuevo
                      </button>
                    )}
                    <button onClick={loadContracts} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mt-1.5">
                      Actualizar
                    </button>
                  </div>
                </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4 w-1/3">Asunto</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Destinatario</th>
                      <th className="px-6 py-4">Último Cambio</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Cargando documentos...</td>
                      </tr>
                    ) : contracts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No hay documentos recientes.</p>
                        </td>
                      </tr>
                    ) : (
                      contracts.map(contract => (
                        <tr key={contract.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{contract.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{contract.type}</div>
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
                                Esperando a otros
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{contract.clientName}</div>
                            <div className="text-xs text-gray-500">{contract.clientEmail}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(contract.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={`/sign/${contract.id}`} target="_blank" title="Ver Documento" className="text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 rounded p-1.5 shadow-sm transition-colors">
                                <Search className="w-4 h-4" />
                              </a>
                              <button onClick={() => copyLink(contract.id)} title="Copiar Enlace" className="text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 rounded p-1.5 shadow-sm transition-colors">
                                <FileSignature className="w-4 h-4" />
                              </button>
                              
                              {contract.status !== "SIGNED" && (
                                <>
                                  <button onClick={() => handleResend(contract.id)} title="Reenviar Correo" className="text-gray-500 hover:text-green-600 bg-white border border-gray-200 hover:border-green-200 rounded p-1.5 shadow-sm transition-colors">
                                    <Send className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => openEditModal(contract)} title="Editar Datos" className="text-gray-500 hover:text-amber-600 bg-white border border-gray-200 hover:border-amber-200 rounded p-1.5 shadow-sm transition-colors">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              <button onClick={() => handleDelete(contract.id)} title="Eliminar Documento" className="text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 rounded p-1.5 shadow-sm transition-colors">
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
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Tus Plantillas Legales</h1>
                    <p className="text-gray-500">Contratos oficiales de Miam Digital Studio listos para enviar.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <TemplateCard title="Contrato de Branding y Diseño" desc="Acuerdo (MSA) de diseño de identidad corporativa y brandbooks." type="BRANDING" onPreview={() => setPreviewType("BRANDING")} />
                  <TemplateCard title="Contrato de Desarrollo Web" desc="Acuerdo (MSA) para páginas informativas y tiendas virtuales E-commerce." type="WEB" onPreview={() => setPreviewType("WEB")} />
                  <TemplateCard title="Suscripción MiamBot (SaaS)" desc="Contrato para marketing digital, pauta y automatización en WhatsApp." type="MIAMBOT" onPreview={() => setPreviewType("MIAMBOT")} />
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuración</h1>
                  <p className="text-gray-500">Ajustes de la empresa y plataforma.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
                  <h3 className="text-lg font-semibold mb-4">Datos de la Empresa</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                      <input type="text" disabled value="Miam Digital Studio S.A.C." className="w-full bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                      <input type="text" disabled value="20615782344" className="w-full bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Enviar Nuevo Documento</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex gap-6">
              <div className="w-1/3 border-r border-gray-100 pr-6">
                <form id="create-form" onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plantilla de Contrato</label>
                    <select 
                      value={type} 
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    >
                      <option value="BRANDING">Acuerdo de Servicios - Branding (MSA)</option>
                      <option value="WEB">Acuerdo de Servicios - Desarrollo Web (MSA)</option>
                      <option value="MIAMBOT">Suscripción SaaS y Marketing - MiamBot</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Cliente</label>
                    <input 
                      type="text" 
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      required 
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">DNI / RUC</label>
                      <input 
                        type="text" 
                        value={clientDocument}
                        onChange={e => setClientDocument(e.target.value)}
                        required 
                        placeholder="Ej. 72345678"
                        className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                      <input 
                        type="text" 
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        placeholder="Ej. 999888777"
                        className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Domicilio Legal</label>
                    <input 
                      type="text" 
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      required 
                      placeholder="Ej. Av. Javier Prado Este 1234, Lima"
                      className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      required
                      placeholder="juan@empresa.com"
                      className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </form>
              </div>

              <div className="w-2/3 flex flex-col bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-100 rounded-t-lg flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">Vista Previa del Documento</span>
                </div>
                <div className="p-4 flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full min-h-[300px] bg-white border-0 outline-none resize-none font-mono text-sm text-gray-700 p-2 shadow-inner rounded-md focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="create-form"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm flex items-center gap-2"
              >
                Enviar Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Lectura Completa del Contrato</h2>
              <button onClick={() => setPreviewType(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {TEMPLATES[previewType]}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setPreviewType(null)} 
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors shadow-sm"
              >
                Cerrar Lectura
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900">Editar Datos del Destinatario</h2>
              <button onClick={() => setEditingContract(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Cliente</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required 
                  className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">DNI / RUC</label>
                  <input 
                    type="text" 
                    value={editDocument}
                    onChange={e => setEditDocument(e.target.value)}
                    required 
                    className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Domicilio Legal</label>
                <input 
                  type="text" 
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  required 
                  className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingContract(null)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors shadow-sm">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
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

function NavItem({ icon, label, active = false, sidebarOpen, onClick }: { icon: React.ReactNode, label: string, active?: boolean, sidebarOpen: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-3 py-2.5 rounded-md transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
      <span className={`${active ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</span>
      {sidebarOpen && <span className={`ml-3 text-sm font-semibold ${active ? 'text-blue-800' : ''}`}>{label}</span>}
    </button>
  );
}

function TemplateCard({ title, desc, type, onPreview }: { title: string, desc: string, type: string, onPreview?: () => void }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
          <FileText className="w-5 h-5" />
        </div>
        <h3 className="text-md font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{type}</span>
        {onPreview && (
          <button onClick={onPreview} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            Ver Documento
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, count }: { title: string, count: string }) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">{title}</h3>
      <span className="text-3xl font-bold text-gray-900">{count}</span>
    </div>
  );
}
