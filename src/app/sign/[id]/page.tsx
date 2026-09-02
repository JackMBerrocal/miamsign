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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">Cargando documento...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 text-slate-800 font-sans py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de la marca */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img src="/img/LOGO1.png" alt="Miam Logo" className="h-12 object-contain mb-4 bg-slate-900 p-2 rounded" />
          <h1 className="text-2xl font-bold text-gray-900">MiamSign - Portal de Firmas</h1>
          <p className="text-gray-500 text-sm">Contrato de Prestación de Servicios</p>
        </div>

        {/* Visor del Contrato */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200" ref={contractRef}>
          <div className="p-8 prose prose-slate max-w-none">
            <ReactMarkdown>{contract.content}</ReactMarkdown>
            
            {/* Detalles del firmante */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Firmado por:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Cliente:</strong> {contract.clientName}</div>
                <div><strong>Email:</strong> {contract.clientEmail}</div>
                <div><strong>Fecha:</strong> {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div><strong>IP de Firma:</strong> {contract.clientIp || "Pendiente"}</div>
              </div>

              {/* Mostrar firma si ya está firmado */}
              {contract.status === "SIGNED" && contract.signatureData && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 inline-block">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">FIRMA ELECTRÓNICA REGISTRADA</p>
                  <img src={contract.signatureData} alt="Firma del cliente" className="h-24" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Caja de Firma (Solo si no está firmado) */}
        {contract.status !== "SIGNED" && (
          <div className="mt-8 bg-white p-6 shadow-lg rounded-lg border-2 border-indigo-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Firme aquí</h2>
            <p className="text-sm text-gray-500 mb-4">Utilice su ratón o dedo para dibujar su firma en el recuadro blanco.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: "w-full h-48 rounded-lg", style: { cursor: 'crosshair' } }}
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <button 
                onClick={clearSignature}
                className="text-sm text-gray-500 hover:text-red-500 font-medium"
              >
                Limpiar firma
              </button>
              
              <button 
                onClick={handleSign}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {saving ? "Procesando..." : "Aceptar y Firmar Contrato"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Al hacer clic en "Aceptar y Firmar Contrato", usted consiente legalmente y vincula su firma electrónica a este documento.</p>
          </div>
        )}

        {/* Botón de Descarga (Si ya está firmado) */}
        {contract.status === "SIGNED" && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">¡El contrato ha sido firmado exitosamente!</p>
              <p className="text-sm">Una copia certificada ha sido enviada a LA AGENCIA.</p>
            </div>
            <br />
            <button 
              onClick={downloadPDF}
              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg shadow transition-all"
            >
              Descargar PDF
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
