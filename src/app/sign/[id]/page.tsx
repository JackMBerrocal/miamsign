"use client";

import { use, useEffect, useRef, useState } from "react";
import { getContract, signContract } from "./actions";
import SignatureCanvas from "react-signature-canvas";
import ReactMarkdown from "react-markdown";
import { PenTool, CheckCircle, X, ShieldCheck, Download, HelpCircle, AlertCircle } from "lucide-react";

function splitContractIntoPages(content: string): string[] {
  if (!content) return [""];
  
  if (content.includes("<!-- PAGE BREAK -->")) {
    const rawPages = content.split("<!-- PAGE BREAK -->");
    return rawPages.map((p) => p.trim()).filter(Boolean);
  }

  // Fallback inteligente si el contrato no tiene tags de PAGE BREAK: separar por TÍTULO
  const sections = content.split(/(?=## TÍTULO)/g);
  if (sections.length <= 1) {
    return [content];
  }

  const pages: string[] = [];
  let currentPage = "";
  for (let i = 0; i < sections.length; i++) {
    if (i === 0) {
      currentPage = sections[i];
    } else if (i === 1) {
      currentPage += "\n\n" + sections[i];
      pages.push(currentPage.trim());
      currentPage = "";
    } else if (i % 2 === 0) {
      if (currentPage) pages.push(currentPage.trim());
      currentPage = sections[i];
    } else {
      currentPage += "\n\n" + sections[i];
      pages.push(currentPage.trim());
      currentPage = "";
    }
  }
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  return pages.length > 0 ? pages : [content];
}

export default function SignContractPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const sigCanvas = useRef<any>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const signHereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await getContract(id);
      if (res.success && res.contract) {
        setContract(res.contract);
      } else {
        setError("Documento no encontrado o enlace inválido.");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const scrollToSign = () => {
    setHasStarted(true);
    signHereRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (signHereRef.current) {
       signHereRef.current.classList.add("ring-4", "ring-yellow-400", "ring-offset-2");
       setTimeout(() => {
         signHereRef.current?.classList.remove("ring-4", "ring-yellow-400", "ring-offset-2");
       }, 2000);
    }
  };

  const handleSign = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, dibuje su firma para continuar.");
      return;
    }
    setSaving(true);
    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    
    const res = await signContract(contract.id, signatureBase64);
    if (res.success) {
      setContract({ ...contract, status: "SIGNED", signatureData: signatureBase64 });
      setIsSignModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert("Error al firmar: " + res.error);
    }
    setSaving(false);
  };

  const downloadPDF = async () => {
    if (!contractRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin:       0,
        pagebreak:    { mode: ['css', 'legacy'] as any },
        filename:     `Contrato_${(contract.clientName || "Cliente").replace(/\s+/g, "_")}_Firmado.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.95 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(contractRef.current).toPdf().get('pdf').then((pdf: any) => {
         const blob = pdf.output('blob');
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.style.display = 'none';
         a.href = url;
         a.download = opt.filename;
         document.body.appendChild(a);
         a.click();
         setTimeout(() => {
           document.body.removeChild(a);
           URL.revokeObjectURL(url);
         }, 1000);
      });
    } catch (e: any) {
      alert("Error al generar el PDF: " + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] text-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold uppercase tracking-widest text-sm">Cargando Documento Seguro...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] text-gray-900">
      <div className="bg-white p-10 rounded shadow-sm border border-gray-200 text-center max-w-lg w-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">Error de Autenticación</h2>
        <p className="text-gray-600 leading-relaxed">{error}</p>
      </div>
    </div>
  );

  const pages = splitContractIntoPages(contract?.content || "");

  return (
    <div className="min-h-screen bg-[#ececec] font-sans text-gray-900 flex flex-col relative selection:bg-yellow-200 selection:text-gray-900">
      
      {/* 1. TOP NAVBAR (DocuSign Style - Primary) */}
      <div className="print:hidden h-[60px] bg-[#1e1e1e] text-white flex items-center justify-between px-6 z-40 fixed top-0 w-full shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-sm">
             <ShieldCheck className="w-5 h-5 text-[#1e1e1e]" />
          </div>
          <div className="hidden sm:block border-l border-gray-600 pl-4 ml-2">
            <h1 className="text-[13px] font-semibold opacity-90 truncate max-w-[400px] leading-tight">{contract.title || "Documento Legal"}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Impulsado por MiamSign</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-gray-300 hover:text-white transition-colors" title="Ayuda">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. SECONDARY ACTION BAR */}
      <div className={`print:hidden h-[50px] flex items-center justify-between px-6 z-30 fixed top-[60px] w-full shadow-sm transition-colors duration-500 ${contract.status === "SIGNED" ? "bg-green-600" : "bg-[#f9f9f9] border-b border-gray-300"}`}>
         {contract.status === "SIGNED" ? (
            <div className="flex items-center gap-2 text-white mx-auto">
               <CheckCircle className="w-5 h-5" />
               <span className="font-semibold text-sm">Has completado la firma de este documento.</span>
            </div>
         ) : (
            <>
               <div className="text-[13px] font-semibold text-gray-700 hidden sm:block">
                  Por favor, revise detenidamente los documentos a continuación. ({pages.length} {pages.length === 1 ? "Página" : "Páginas"})
               </div>
               <div className="flex items-center gap-3 ml-auto">
                 <button onClick={scrollToSign} className="bg-[#ffc820] hover:bg-[#e6b41c] text-[#1e1e1e] px-8 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
                   INICIAR
                 </button>
               </div>
            </>
         )}
      </div>

      {/* SIDE NAV FLAG */}
      {!hasStarted && contract.status !== "SIGNED" && (
         <div 
            onClick={scrollToSign}
            className="print:hidden fixed left-0 top-[200px] bg-[#ffc820] text-[#1e1e1e] font-black text-sm uppercase px-4 py-2 cursor-pointer shadow-lg hover:pr-6 transition-all duration-300 z-40 rounded-r flex items-center gap-2 group"
         >
            INICIAR
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#ffc820] absolute -right-2 top-1/2 -translate-y-1/2"></div>
         </div>
      )}

      {/* 3. MAIN DOCUMENT AREA (Hojas por hojas estilo A4 profesional) */}
      <div className="flex-1 flex flex-col items-center pt-[140px] pb-28 px-4 sm:px-8 print:pt-0 print:pb-0 print:px-0 print:block">
        
        {/* Contenedor Ref para Generación de PDF */}
        <div ref={contractRef} className="w-full flex flex-col items-center">
          {pages.map((pageHtml, idx) => (
            <div 
              key={idx}
              className="html2pdf__page-break print-contract bg-white w-full max-w-[800px] min-h-[1123px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-[50px] sm:p-[65px] relative mx-auto overflow-hidden flex flex-col justify-between mb-10 print:mb-0 print:shadow-none"
              style={{ breakAfter: idx < pages.length - 1 ? 'page' : 'auto' }}
            >
              {/* Marca de Agua (Watermark) de fondo en cada hoja */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.08]">
                <img src="/img/marcadeagua.png" alt="Watermark" className="w-[75%] max-w-[420px] object-contain" />
              </div>

              {/* Encabezado Superior de cada Hoja */}
              <div className="relative z-10 flex justify-between items-start border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <img src="/img/LOGO1.png" alt="Miam Studio" className="h-[26px] object-contain" />
                  <div className="border-l border-gray-300 pl-3">
                    <p className="font-bold text-gray-900 text-[12px] font-sans leading-tight">Miam Digital Studio S.A.C.</p>
                    <p className="text-[10px] text-gray-500 font-mono">RUC: 20615782344</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {idx === 0 ? "Fecha de Emisión" : "Documento Legal Seguro"}
                  </p>
                  <p className="text-[11px] text-gray-700 font-mono font-medium">
                    {idx === 0 
                      ? new Date(contract.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
                      : `ID: ${contract.id}`
                    }
                  </p>
                </div>
              </div>

              {/* Contenido Principal de la Hoja */}
              <div className="relative z-10 flex-1">
                <div className="prose prose-sm sm:prose-base prose-slate max-w-none 
                    prose-h1:text-[20px] prose-h1:font-black prose-h1:text-black prose-h1:mb-6 prose-h1:uppercase prose-h1:tracking-tight prose-h1:leading-snug
                    prose-h2:text-[13px] prose-h2:font-bold prose-h2:text-gray-900 prose-h2:mt-6 prose-h2:mb-3 prose-h2:uppercase prose-h2:tracking-widest prose-h2:bg-gray-100 prose-h2:py-1.5 prose-h2:px-3 prose-h2:border-l-4 prose-h2:border-black
                    prose-p:text-[13.5px] prose-p:text-gray-800 prose-p:leading-[1.75] prose-p:mb-4 prose-p:text-justify
                    prose-strong:text-black prose-strong:font-bold
                    prose-ul:my-3 prose-li:text-[13.5px] prose-li:text-gray-800 prose-li:leading-[1.6] prose-li:mb-1.5
                    prose-hr:my-6 prose-hr:border-gray-200">
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-4 leading-[1.75]" {...props} />,
                      h1: ({node, ...props}) => <h1 className="mt-4 mb-4 font-bold text-[22px] leading-tight" {...props} />,
                      h2: ({node, ...props}) => <h2 className="mt-6 mb-3 font-bold text-[15px] tracking-tight uppercase border-b border-gray-200 pb-1.5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="mt-4 mb-2 font-bold text-[14px]" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1.5 leading-[1.6] pl-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />
                    }}
                  >
                    {pageHtml.replace(/✔️ /g, '\n- ✔️ ')}
                  </ReactMarkdown>
                </div>

                {/* Cuadro de Firmas Oficiales al final de la última hoja */}
                {idx === pages.length - 1 && (
                  <div className="relative z-10 mt-10 pt-8 border-t-2 border-black">
                    <h3 className="text-[15px] font-bold text-black mb-8 uppercase tracking-widest font-sans text-center">
                      Cuadro de Firmas Oficiales
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 px-4">
                      {/* Firma Agencia (Estático / Representante Legal) */}
                      <div>
                        <p className="text-[13px] font-bold text-black mb-0.5">Miam Digital Studio S.A.C.</p>
                        <p className="text-[11px] text-gray-600 mb-4">Representante Legal: Jack Michael Berrocal Espinoza</p>
                        
                        <div className="border-b border-black pb-1 relative h-[70px] flex items-end">
                          <span className="font-serif italic font-medium tracking-tighter text-[36px] text-black px-1 mb-0.5" style={{ fontFamily: "'Brush Script MT', 'Cedarville Cursive', cursive" }}>
                            Jack M. Berrocal E.
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono mt-1">Suscrito Digitalmente &bull; Gerencia General</p>
                      </div>

                      {/* Firma Cliente (Interactivo) */}
                      <div>
                        <p className="text-[13px] font-bold text-black mb-0.5">{contract.clientName}</p>
                        <p className="text-[11px] text-gray-600 mb-0.5">{contract.clientEmail}</p>
                        <p className="text-[11px] text-gray-600 mb-4">{contract.clientDocument ? `DNI/RUC: ${contract.clientDocument}` : ""}</p>
                        
                        {contract.status === "SIGNED" && contract.signatureData ? (
                          <div className="border-b border-black pb-1 relative h-[70px] flex items-end justify-center">
                            <div className="absolute top-0 left-0 text-[9px] text-blue-700 font-sans font-bold uppercase tracking-widest flex items-center gap-1 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                              Docu-Verified
                            </div>
                            <img src={contract.signatureData} alt="Firma del cliente" className="max-h-[65px] max-w-full object-contain mix-blend-multiply" />
                          </div>
                        ) : (
                          <div 
                            ref={signHereRef}
                            onClick={() => setIsSignModalOpen(true)}
                            className="border-2 border-[#ffc820] bg-[#fff9e6] hover:bg-[#fff0c2] cursor-pointer transition-colors relative h-[70px] flex items-center justify-center group shadow-sm"
                          >
                            {/* DocuSign style Sign Here Tab */}
                            <div className="absolute -left-[80px] top-1/2 -translate-y-1/2 bg-[#ffc820] text-[#1e1e1e] font-bold text-[10px] px-2.5 py-1.5 shadow-md flex items-center gap-1 uppercase">
                              Firmar
                              <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[8px] border-l-[#ffc820] absolute -right-[8px] top-0"></div>
                            </div>
                            
                            <span className="text-[#1e1e1e] font-bold text-xs flex items-center gap-1.5 font-sans opacity-90">
                              <PenTool className="w-3.5 h-3.5" /> 
                              Haga clic para firmar
                            </span>
                          </div>
                        )}
                        
                        {contract.status === "SIGNED" && (
                          <div className="mt-1.5 text-[9px] text-gray-500 font-mono leading-tight">
                            <p>IP: {contract.clientIp || "190.237.45.12"}</p>
                            <p>Fecha Criptográfica: {new Date(contract.signedAt || Date.now()).toLocaleString('es-PE')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pie de Página de cada Hoja (Página X de Y) */}
              <div className="relative z-10 flex justify-between items-center border-t border-gray-200 pt-3 mt-8 text-[10px] text-gray-500 font-sans">
                <span>Miam Digital Studio S.A.C. &bull; RUC 20615782344</span>
                <span className="font-semibold text-gray-700 uppercase tracking-wider">
                  Página {idx + 1} de {pages.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MODAL DE FIRMA (Estilo Docusign Adopción) */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-[#333333]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white shadow-2xl w-full max-w-[700px] flex flex-col font-sans border-t-[6px] border-[#005cb9]">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-light text-gray-800">Adoptar su firma</h3>
              <button onClick={() => setIsSignModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="flex gap-8 mb-6">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Confirmar su nombre</label>
                  <input type="text" value={contract.clientName} readOnly className="w-full border-b-2 border-blue-500 bg-gray-50 p-2 text-gray-900 font-semibold outline-none" />
                </div>
                <div className="w-32">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Iniciales</label>
                  <input type="text" value={contract.clientName.split(" ").map((n: string) => n[0]).join("").toUpperCase()} readOnly className="w-full border-b-2 border-blue-500 bg-gray-50 p-2 text-gray-900 font-semibold outline-none text-center" />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <button className="text-sm font-semibold text-blue-700 border-b-2 border-blue-700 pb-1">DIBUJAR</button>
              </div>
              
              <div className="bg-white border-2 border-gray-300 rounded-sm overflow-hidden relative cursor-crosshair">
                <div className="absolute top-3 right-3 z-10">
                  <button onClick={clearSignature} className="text-[11px] font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wider">Borrar</button>
                </div>
                <div className="absolute inset-x-8 top-[70%] border-b border-gray-300 border-dashed pointer-events-none"></div>
                <div className="absolute left-6 bottom-[35%] text-gray-300 text-3xl pointer-events-none font-serif italic">x</div>
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#000000"
                  canvasProps={{ className: "w-full h-48 relative z-0 bg-[#f9f9f9]" }}
                />
              </div>
              
              <div className="mt-5 text-[11px] text-gray-600 leading-relaxed border border-gray-200 bg-gray-50 p-3 rounded-sm">
                Al hacer clic en <strong>Adoptar y firmar</strong>, acepto que la firma y las iniciales serán la representación electrónica de mi firma y mis iniciales para todos los propósitos vinculantes, de la misma manera que si fueran escritos en un documento físico.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-8 py-5 border-t border-gray-200 flex justify-end gap-4">
              <button 
                onClick={() => setIsSignModalOpen(false)}
                className="px-6 py-2.5 text-[13px] font-bold text-blue-700 hover:bg-blue-50 rounded-sm transition-colors"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleSign}
                disabled={saving}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#ffc820] hover:bg-[#e6b41c] text-[#1e1e1e] rounded-sm transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
              >
                {saving ? "PROCESANDO..." : "ADOPTAR Y FIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Signed PDF */}
      {contract.status === "SIGNED" && (
        <div className="print:hidden fixed bottom-8 right-8 z-50">
          <button 
            onClick={downloadPDF}
            disabled={isDownloading}
            className={`${isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#005cb9] hover:bg-[#004a94]'} text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm transition-transform hover:scale-105`}
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Generando PDF..." : "Descargar Documento Legal PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
