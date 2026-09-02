"use client";
import { useState, useEffect } from "react";
import { createContract, getContracts } from "./actions";

const COMPANY_ID = "63d76e71-460d-4560-af33-b1d5bf59cc28";

const CONTRACT_TEMPLATES: Record<string, string> = {
  BRANDING: `# CONTRATO DE PRESTACIÓN DE SERVICIOS DE BRANDING Y DISEÑO ESTRATÉGICO\n\nConste por el presente documento, el Contrato de Prestación de Servicios (en adelante, el "Contrato"), que celebran por una parte MIAM DIGITAL STUDIO S.A.C. (en adelante, "LA AGENCIA"), y por la otra parte, EL CLIENTE abajo firmante.\n\n## CLÁUSULA PRIMERA: DEL OBJETO DEL CONTRATO\nEL CLIENTE contrata a LA AGENCIA para el diseño y desarrollo de la Identidad Visual Corporativa, la cual incluye pero no se limita a: diseño de logotipo, manual de marca, paleta de colores corporativa y aplicaciones visuales predefinidas en la propuesta comercial.\n\n## CLÁUSULA SEGUNDA: DE LOS HONORARIOS Y FORMA DE PAGO\nEl valor total de los servicios será fraccionado de la siguiente manera:\n- Cincuenta por ciento (50%) como anticipo no reembolsable para dar inicio al proyecto.\n- Cincuenta por ciento (50%) restante al momento de la entrega de los artes finales y previo a la cesión de derechos de autor.\nEn caso de retraso en el pago final mayor a siete (7) días calendario, se aplicará una penalidad del 1% diario sobre el saldo adeudado.\n\n## CLÁUSULA TERCERA: PLAZOS Y ENTREGABLES\nLA AGENCIA se compromete a entregar las propuestas iniciales en el plazo acordado. EL CLIENTE contará con un plazo de tres (3) días hábiles para emitir comentarios. La falta de respuesta en dicho plazo será considerada como aprobación tácita.\n\n## CLÁUSULA CUARTA: PROPIEDAD INTELECTUAL\nLA AGENCIA retiene todos los derechos de autor sobre las propuestas rechazadas. La propiedad intelectual de la propuesta final aprobada será cedida a EL CLIENTE única y exclusivamente cuando se haya cancelado el 100% de los honorarios.\n\n## CLÁUSULA QUINTA: CONFIDENCIALIDAD Y JURISDICCIÓN\nAmbas partes mantendrán estricta confidencialidad sobre las estrategias comerciales. Cualquier disputa derivada del presente contrato se someterá a la jurisdicción de los jueces del Cercado de Lima, Perú.\n\nEn señal de conformidad, EL CLIENTE firma electrónicamente el presente documento.`,
  WEB: `# CONTRATO DE DESARROLLO DE SOFTWARE Y DISEÑO WEB\n\nConste por el presente documento, el Contrato de Desarrollo (en adelante, el "Contrato"), que celebran por una parte MIAM DIGITAL STUDIO S.A.C. (en adelante, "LA AGENCIA"), y por la otra parte, EL CLIENTE abajo firmante.\n\n## CLÁUSULA PRIMERA: DEL OBJETO DEL CONTRATO\nEL CLIENTE contrata a LA AGENCIA para el desarrollo, diseño y despliegue de un sitio web/e-commerce, cuyas características técnicas y funcionalidades se detallan en la propuesta técnica adjunta y aprobada por las partes.\n\n## CLÁUSULA SEGUNDA: HONORARIOS Y CONDICIONES ECONÓMICAS\nEl pago por el desarrollo se realizará en dos armadas:\n- Cincuenta por ciento (50%) como anticipo de inicio de obra.\n- Cincuenta por ciento (50%) contra-entrega y antes de la migración al servidor de producción definitivo.\n\n## CLÁUSULA TERCERA: OBLIGACIONES DEL CLIENTE Y ABANDONO\nEL CLIENTE se obliga a proporcionar textos, imágenes, credenciales y cualquier material necesario para el desarrollo en un plazo máximo de quince (15) días. Si EL CLIENTE detiene la comunicación o no entrega los materiales por más de treinta (30) días, el proyecto se considerará en estado de "Abandono", liberando a LA AGENCIA de toda obligación y reteniendo el anticipo por daños y perjuicios.\n\n## CLÁUSULA CUARTA: PROPIEDAD INTELECTUAL Y CÓDIGO FUENTE\nLA AGENCIA cederá los derechos de explotación del software una vez el pago total haya sido efectuado. LA AGENCIA se reserva el derecho de utilizar componentes genéricos de código abierto en el desarrollo.\n\n## CLÁUSULA QUINTA: GARANTÍA Y SOPORTE\nLA AGENCIA brindará una garantía técnica de treinta (30) días posteriores a la salida en vivo para corregir errores de programación (bugs). Cualquier nueva funcionalidad o rediseño estará sujeto a un nuevo presupuesto.\n\nEn señal de conformidad, EL CLIENTE firma electrónicamente el presente documento.`,
  MIAMBOT: `# CONTRATO DE LICENCIA DE USO Y SERVICIOS TECNOLÓGICOS (SaaS) - MIAMBOT\n\nConste por el presente documento, el Contrato de Suscripción (en adelante, el "Contrato"), que celebran por una parte MIAM DIGITAL STUDIO S.A.C. (en adelante, "LA AGENCIA"), y por la otra parte, EL CLIENTE abajo firmante.\n\n## CLÁUSULA PRIMERA: DEL OBJETO DEL CONTRATO\nLA AGENCIA otorga a EL CLIENTE una licencia de uso no exclusiva, intransferible y revocable para utilizar la plataforma tecnológica e inteligencia artificial denominada "MiamBot" (Software as a Service), para la automatización de su atención al cliente.\n\n## CLÁUSULA SEGUNDA: CONDICIONES DE SUSCRIPCIÓN\nEl presente servicio opera bajo una modalidad de pago recurrente mensual o anual. El impago de la suscripción dentro de los primeros tres (3) días del ciclo de facturación resultará en la suspensión automática e inmediata del servicio, sin responsabilidad para LA AGENCIA por pérdida de ventas o interrupción operativa de EL CLIENTE.\n\n## CLÁUSULA TERCERA: RESPONSABILIDAD SOBRE LAS RESPUESTAS (IA)\nAl utilizar algoritmos de Inteligencia Artificial Generativa, EL CLIENTE entiende y acepta que el "MiamBot" puede en ocasiones generar respuestas impredecibles. LA AGENCIA no se hace responsable por perjuicios económicos o de reputación derivados de interacciones del bot con los usuarios finales. Es responsabilidad de EL CLIENTE monitorear las conversaciones.\n\n## CLÁUSULA CUARTA: CONFIDENCIALIDAD DE DATOS\nLA AGENCIA tratará los datos personales capturados por el bot conforme a la Ley de Protección de Datos Personales del Perú (Ley 29733). Los datos recolectados pertenecen a EL CLIENTE.\n\nEn señal de conformidad, EL CLIENTE firma electrónicamente el presente documento.`
};

export default function MiamSignDashboard() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("Contrato de Branding - Miam");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [type, setType] = useState("BRANDING");
  const [content, setContent] = useState(CONTRACT_TEMPLATES.BRANDING);

  useEffect(() => {
    loadContracts();
  }, []);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setContent(CONTRACT_TEMPLATES[newType] || "");
    
    // Auto-update title
    if (newType === "BRANDING") setTitle("Contrato de Branding y Diseño - Miam");
    if (newType === "WEB") setTitle("Contrato de Desarrollo Web - Miam");
    if (newType === "MIAMBOT") setTitle("Suscripción MiamBot (SaaS) - Miam");
  };

  const loadContracts = async () => {
    setLoading(true);
    const res = await getContracts(COMPANY_ID);
    if (res.success) setContracts(res.contracts || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return alert("Faltan datos del cliente");

    const res = await createContract({
      title,
      clientName,
      clientEmail,
      type,
      content,
      companyId: COMPANY_ID
    });

    if (res.success) {
      alert("¡Contrato creado exitosamente!");
      setClientName("");
      setClientEmail("");
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

  return (
    <div className="min-h-screen p-6 md:p-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/img/LOGO1.png" alt="Miam" className="h-8" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MiamSign</h1>
            </div>
            <p className="text-gray-400">Gestión Inteligente de Contratos Legales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <span className="text-indigo-400">✦</span> Emitir Documento
              </h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Servicio</label>
                  <select 
                    value={type} 
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="glass-input block w-full rounded-xl p-3"
                  >
                    <option value="BRANDING" className="text-black">Branding & Logotipos</option>
                    <option value="WEB" className="text-black">Desarrollo Web & E-Commerce</option>
                    <option value="MIAMBOT" className="text-black">MiamBot / Retainer Mensual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Cliente / Empresa</label>
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    className="glass-input block w-full rounded-xl p-3"
                    placeholder="Ej. Acme Corp S.A.C."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email del Representante</label>
                  <input 
                    type="email" 
                    value={clientEmail} 
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="glass-input block w-full rounded-xl p-3" 
                    placeholder="ceo@empresa.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Título del Documento</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-input block w-full rounded-xl p-3" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Plantilla Legal (Editable)</label>
                  <textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="glass-input block w-full rounded-xl p-3 text-sm font-mono text-gray-300" 
                  />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/30">
                  Generar y Sellar Documento
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Lista de Contratos */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-2xl overflow-hidden h-full flex flex-col">
              <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">❖</span> Registro de Contratos
                </h3>
                <button onClick={loadContracts} className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                  Actualizar Lista
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-gray-400">Sincronizando contratos...</div>
                ) : contracts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">Ningún contrato emitido aún.</div>
                ) : (
                  <ul className="space-y-4">
                    {contracts.map(contract => (
                      <li key={contract.id} className="glass-input p-6 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <h4 className="font-bold text-lg text-white mb-1">{contract.title}</h4>
                            <p className="text-sm text-gray-400">
                              <span className="text-gray-300">{contract.clientName}</span> &bull; {contract.clientEmail}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded">
                                {contract.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(contract.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-start md:items-end gap-3">
                            {contract.status === "SIGNED" ? (
                              <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span> FIRMADO
                              </span>
                            ) : (
                              <span className="bg-yellow-500/20 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-500/30 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span> PENDIENTE
                              </span>
                            )}
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => copyLink(contract.id)}
                                className="text-xs bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
                              >
                                Copiar Link
                              </button>
                              <a 
                                href={`/sign/${contract.id}`}
                                target="_blank"
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                              >
                                Visualizar
                              </a>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
