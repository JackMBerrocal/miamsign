"use client";

import { useEffect, useRef, useState } from "react";
import { getContract, signContract } from "./actions";
import SignatureCanvas from "react-signature-canvas";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";

export default function SignContractPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const sigCanvas = useRef<any>(null);
  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await getContract(params.id);
      if (res.success && res.contract) {
        setContract(res.contract);
      } else {
        setError("Contrato no encontrado o no válido.");
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSign = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, dibuje su firma antes de aceptar.");
      return;
    }
    setSaving(true);
    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    
    // Simulate getting IP (normally from headers in server components)
    const clientIp = "Capturada digitalmente"; 
    
    const res = await signContract(contract.id, signatureBase64, clientIp);
    if (res.success) {
      setContract({ ...contract, status: "SIGNED", signatureData: signatureBase64 });
    } else {
      alert("Error al firmar: " + res.error);
    }
    setSaving(false);
  };

  const downloadPDF = async () => {
    if (!contractRef.current) return;
    
    const canvas = await html2canvas(contractRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Contrato_${contract.clientName.replace(" ", "_")}.pdf`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Preparando documento legal...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="glass-panel p-8 rounded-2xl text-center max-w-md">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Error de Acceso</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Header Corporativo */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <img src="/img/LOGO1.png" alt="Miam Logo" className="h-14 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Portal de Firmas Digitales</h1>
          <p className="text-indigo-300 font-medium tracking-wide">DOCUMENTO LEGAL VINCULANTE</p>
        </div>

        {/* Visor del Contrato (El "Papel") */}
        <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border border-gray-300 relative" ref={contractRef}>
          {/* Marca de agua sutil */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <img src="/img/LOGO1.png" alt="Watermark" className="w-96 grayscale" />
          </div>
          
          <div className="p-10 md:p-16 relative z-10">
            {/* Texto del contrato en formato legal */}
            <div className="legal-doc">
              <ReactMarkdown>{contract.content}</ReactMarkdown>
            </div>
            
            {/* Detalles del firmante y sellos */}
            <div className="mt-16 pt-8 border-t-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wider">Firmantes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-800">
                <div className="bg-gray-50 p-6 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">El Cliente</p>
                  <p className="font-bold text-lg">{contract.clientName}</p>
                  <p className="text-gray-600">{contract.clientEmail}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p><strong>Fecha:</strong> {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                    <p><strong>IP:</strong> {contract.clientIp || "Por registrar..."}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">La Agencia</p>
                  <p className="font-bold text-lg">Miam Digital Studio S.A.C.</p>
                  <p className="text-gray-600">Representante Legal</p>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center">
                    {/* Placeholder para firma de Miam */}
                    <div className="text-gray-400 font-serif italic border-b border-gray-300 pb-1">Miam Digital Studio</div>
                  </div>
                </div>
              </div>

              {/* Mostrar firma si ya está firmado */}
              {contract.status === "SIGNED" && contract.signatureData && (
                <div className="mt-8 p-6 bg-white rounded border-2 border-green-100 flex flex-col items-center">
                  <p className="text-xs text-green-600 mb-2 font-bold tracking-widest">FIRMA ELECTRÓNICA CERTIFICADA</p>
                  <img src={contract.signatureData} alt="Firma del cliente" className="h-32 object-contain" />
                  <p className="text-xs text-gray-400 mt-2">Documento validado criptográficamente por MiamSign.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Caja de Firma Interactiva (Solo si no está firmado) */}
        {contract.status !== "SIGNED" && (
          <div className="mt-8 glass-panel p-8 shadow-2xl rounded-2xl border border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Firme su documento</h2>
                <p className="text-sm text-gray-400">Utilice el ratón o su dedo para dibujar su firma en el recuadro blanco.</p>
              </div>
              <button 
                onClick={clearSignature}
                className="mt-4 md:mt-0 text-sm text-gray-400 hover:text-white font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                ↻ Limpiar lienzo
              </button>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-inner cursor-crosshair">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#0f172a" /* slate-900 */
                canvasProps={{ className: "w-full h-56" }}
              />
            </div>
            
            <div className="mt-8">
              <button 
                onClick={handleSign}
                disabled={saving}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 text-lg flex justify-center items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando firma segura...
                  </>
                ) : "Aceptar Términos y Firmar Contrato"}
              </button>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Al hacer clic en "Aceptar Términos y Firmar Contrato", usted consiente legalmente de acuerdo a la Ley de Firmas y Certificados Digitales y vincula su identidad a este documento.
              </p>
            </div>
          </div>
        )}

        {/* Panel de Éxito y Descarga */}
        {contract.status === "SIGNED" && (
          <div className="mt-8 glass-panel p-8 text-center rounded-2xl border border-green-500/20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 text-green-400 rounded-full mb-4 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">¡Contrato firmado con éxito!</h3>
            <p className="text-gray-400 mb-8">El documento ha sido sellado. Una copia certificada ha sido enviada a Miam Digital Studio.</p>
            
            <button 
              onClick={downloadPDF}
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>📥</span> Descargar PDF Certificado
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
