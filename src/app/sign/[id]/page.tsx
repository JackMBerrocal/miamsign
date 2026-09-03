"use client";

import { useEffect, useRef, useState } from "react";
import { getContract, signContract } from "./actions";
import SignatureCanvas from "react-signature-canvas";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import { PenTool, CheckCircle, X, ShieldCheck, Download, HelpCircle, AlertCircle } from "lucide-react";

export default function SignContractPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const sigCanvas = useRef<any>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const signHereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await getContract(params.id);
      if (res.success && res.contract) {
        setContract(res.contract);
      } else {
        setError("Documento no encontrado o enlace inválido.");
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const scrollToSign = () => {
    setHasStarted(true);
    signHereRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Highlight effect
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
    if (!contractRef.current) return;
    
    alert("Generando documento oficial en formato PDF...");
    
    const canvas = await html2canvas(contractRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "letter"); // Using letter format 612x792 pt
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Contrato_${contract.clientName.replace(/\\s+/g, "_")}_Firmado.pdf`);
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

  return (
    <div className="min-h-screen bg-[#ececec] font-sans text-gray-900 flex flex-col relative selection:bg-yellow-200 selection:text-gray-900">
      
      {/* 1. TOP NAVBAR (DocuSign Style - Primary) */}
      <div className="h-[60px] bg-[#1e1e1e] text-white flex items-center justify-between px-6 z-40 fixed top-0 w-full shadow-md">
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
          <button className="text-gray-300 hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. SECONDARY ACTION BAR */}
      <div className={`h-[50px] flex items-center justify-between px-6 z-30 fixed top-[60px] w-full shadow-sm transition-colors duration-500 ${contract.status === "SIGNED" ? "bg-green-600" : "bg-[#f9f9f9] border-b border-gray-300"}`}>
         {contract.status === "SIGNED" ? (
            <div className="flex items-center gap-2 text-white mx-auto">
               <CheckCircle className="w-5 h-5" />
               <span className="font-semibold text-sm">Has completado la firma de este documento.</span>
            </div>
         ) : (
            <>
               <div className="text-[13px] font-semibold text-gray-700 hidden sm:block">
                  Por favor, revise detenidamente los documentos a continuación.
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
            className="fixed left-0 top-[200px] bg-[#ffc820] text-[#1e1e1e] font-black text-sm uppercase px-4 py-2 cursor-pointer shadow-lg hover:pr-6 transition-all duration-300 z-40 rounded-r flex items-center gap-2 group"
         >
            INICIAR
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#ffc820] absolute -right-2 top-1/2 -translate-y-1/2"></div>
         </div>
      )}

      {/* 3. MAIN DOCUMENT AREA (PDF Simulator) */}
      <div className="flex-1 flex justify-center pt-[150px] pb-24 px-4 sm:px-8">
        
        {/* Document Container - A4/Letter Aspect */}
        <div className="relative">
          
          <div 
             ref={contractRef}
             className="bg-white w-full max-w-[816px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] min-h-[1056px] p-[60px] sm:p-[80px] relative mx-auto"
          >
            {/* Header Formato Legal */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-10">
              <div>
                 <h2 className="text-[28px] font-serif font-bold tracking-tight text-black leading-none">MASTER SERVICES AGREEMENT</h2>
                 <p className="text-[11px] font-mono text-gray-600 uppercase tracking-widest mt-2">ID: {contract.id}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                 <img src="https://miam.com.pe/img/LOGO1.png" alt="Miam Logo" className="h-8 mb-2 grayscale opacity-90" />
                 <p className="font-bold text-black text-sm font-serif">Miam Digital Studio S.A.C.</p>
                 <p className="text-xs text-gray-700 font-serif">RUC: 20615782344</p>
              </div>
            </div>

            {/* Texto del Contrato (Serif Font for Legal feel) */}
            <div className="prose prose-sm max-w-none text-black font-serif leading-[1.8] text-[14px]">
               <ReactMarkdown>{contract.content}</ReactMarkdown>
            </div>

            {/* SECCIÓN DE FIRMAS */}
            <div className="mt-16 pt-8 border-t border-gray-300">
               <h3 className="text-[15px] font-bold text-black mb-10 uppercase tracking-wider font-sans">Cuadro de Firmas Oficiales</h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                  {/* Firma Agencia (Estático) */}
                  <div>
                     <p className="text-[13px] font-bold text-black mb-1">Miam Digital Studio</p>
                     <p className="text-[11px] text-gray-600 mb-6">Representante Legal Autorizado</p>
                     
                     <div className="border-b border-black pb-1 relative h-[70px] flex items-end">
                        <span className="font-serif italic text-4xl text-black px-2 mb-1">Miam Digital</span>
                     </div>
                  </div>

                  {/* Firma Cliente (Interactivo) */}
                  <div>
                     <p className="text-[13px] font-bold text-black mb-1">{contract.clientName}</p>
                     <p className="text-[11px] text-gray-600 mb-1">{contract.clientEmail}</p>
                     <p className="text-[11px] text-gray-600 mb-4">{contract.clientDocument ? `DNI/RUC: ${contract.clientDocument}` : ""}</p>
                     
                     {contract.status === "SIGNED" && contract.signatureData ? (
                        <div className="border-b border-black pb-1 relative h-[70px] flex items-end justify-center">
                           <div className="absolute top-1 left-0 text-[9px] text-blue-700 font-sans font-bold uppercase tracking-widest flex items-center gap-1 border border-blue-200 bg-blue-50 px-1 rounded-sm">
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
                           <div className="absolute -left-[90px] top-1/2 -translate-y-1/2 bg-[#ffc820] text-[#1e1e1e] font-bold text-[11px] px-3 py-1.5 shadow-md flex items-center gap-1 uppercase">
                              Firmar
                              <div className="w-0 h-0 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent border-l-[10px] border-l-[#ffc820] absolute -right-[9px] top-0"></div>
                           </div>
                           
                           <span className="text-[#1e1e1e] font-bold text-sm flex items-center gap-2 font-sans opacity-80">
                             <PenTool className="w-4 h-4" /> 
                             Haga clic para firmar
                           </span>
                        </div>
                     )}
                     
                     {contract.status === "SIGNED" && (
                        <div className="mt-2 text-[10px] text-gray-600 font-mono leading-tight">
                           <p>IP Registrada: {contract.clientIp}</p>
                           <p>Fecha Criptográfica: {new Date(contract.signedAt).toLocaleString()}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            
            {/* Footer de Papel */}
            <div className="absolute bottom-[30px] left-[80px] right-[80px] flex justify-between items-center border-t border-gray-200 pt-3">
               <span className="text-[9px] text-gray-400 font-mono">{contract.id}</span>
               <span className="text-[9px] text-gray-400 font-sans uppercase">Página 1 de 1</span>
            </div>
          </div>
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
                     <button className="text-sm font-semibold text-gray-500 hover:text-gray-700 pb-1">SUBIR</button>
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
         <div className="fixed bottom-8 right-8 z-50">
            <button 
               onClick={downloadPDF}
               className="bg-[#005cb9] hover:bg-[#004a94] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm transition-transform hover:scale-105"
            >
               <Download className="w-5 h-5" />
               Descargar Documento Legal PDF
            </button>
         </div>
      )}
    </div>
  );
}
