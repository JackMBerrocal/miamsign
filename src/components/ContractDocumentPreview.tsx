"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { PenTool } from "lucide-react";
import { splitContractIntoPages } from "@/lib/contract-format";

export interface ContractPreviewData {
  id?: string;
  title?: string;
  content: string;
  type?: string;
  paymentAmount?: string | null;
  paymentType?: string | null;
  clientName?: string;
  clientEmail?: string;
  clientDocument?: string;
  clientAddress?: string | null;
  clientPhone?: string | null;
  createdAt?: string | Date;
  status?: string;
  signatureData?: string | null;
  clientIp?: string | null;
  signedAt?: string | Date | null;
}

interface ContractDocumentPreviewProps {
  contract: ContractPreviewData;
  mode?: "sign" | "preview";
  isDownloading?: boolean;
  simulatedSigned?: boolean;
  contractRef?: React.RefObject<HTMLDivElement | null>;
  signHereRef?: React.RefObject<HTMLDivElement | null>;
  onRequestSign?: () => void;
}

export default function ContractDocumentPreview({
  contract,
  mode = "preview",
  isDownloading = false,
  simulatedSigned = false,
  contractRef,
  signHereRef,
  onRequestSign,
}: ContractDocumentPreviewProps) {
  const pages = splitContractIntoPages(contract.content || "");
  const isSigned = mode === "sign" ? contract.status === "SIGNED" : simulatedSigned || contract.status === "SIGNED";
  const emittedLabel = contract.createdAt
    ? new Date(contract.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div ref={contractRef} className="w-full flex flex-col items-center">
      {pages.map((pageHtml, idx) => (
        <div
          key={idx}
          className="print-contract bg-white w-full max-w-[800px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] px-[32px] py-[26px] sm:px-[44px] sm:py-[32px] relative mx-auto flex flex-col justify-between print:shadow-none"
          style={{
            minHeight: "1060px",
            marginBottom: isDownloading ? "0px" : "28px",
            pageBreakAfter: idx < pages.length - 1 ? "always" : "avoid",
            breakAfter: idx < pages.length - 1 ? "page" : "avoid",
          }}
        >
          {/* Marca de Agua (idéntica al PDF oficial) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 z-0 opacity-[0.055] -rotate-[28deg]">
            <img src="/img/LOGO1.png" alt="Watermark" className="w-[280px] h-auto object-contain grayscale" />
            <span className="font-mono text-[10px] font-extrabold tracking-[0.16em] uppercase text-[#0B0F19]">
              MIAM DIGITAL STUDIO S.A.C. &middot; RUC 20615782344
            </span>
          </div>

          {/* Encabezado Superior (Unificado con PDF y MIAM Web) */}
          <div className="relative z-10 flex justify-between items-center border-b-2 border-[#0B0F19] pb-2.5 mb-3.5">
            <div className="flex items-center gap-2.5">
              <img src="/img/LOGO1.png" alt="Miam Studio" className="h-[34px] sm:h-[38px] w-auto object-contain" />
              <div className="border-l-2 border-slate-300 pl-2.5 py-0.5">
                <p className="font-extrabold text-[#0B0F19] text-[12px] font-sans leading-tight">MIAM DIGITAL STUDIO S.A.C.</p>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5 tabular-nums">R.U.C. N° 20615782344 &middot; Lima, Perú</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-bold text-[#0B0F19] tabular-nums">
                {idx === 0 ? emittedLabel : `Contrato ID: ${contract.id || "VISTA-PREVIA"}`}
              </p>
              <p className="text-[9.5px] text-slate-600 font-mono mt-0.5">
                Arts. 141 y 141-A CC &middot; Art. 1° Ley N° 27269
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="relative z-10 flex-1">
            {idx === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[10px] leading-[1.48] text-[#0F172A]">
                    <p className="text-[9.5px] font-extrabold uppercase tracking-[0.05em] text-[#047857] mb-1">
                      La Agencia (Prestador)
                    </p>
                    <p className="font-bold text-[#0B0F19]">MIAM DIGITAL STUDIO S.A.C.</p>
                    <p>R.U.C. N° 20615782344</p>
                    <p>Rep. Legal: Jack Michael Berrocal Espinoza</p>
                    <p>Jr. José de San Martín Mz. 131, Lote A4 - Urb. José Gálvez, VMT, Lima</p>
                    <p className="text-slate-600">contacto@miam.com.pe</p>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[10px] leading-[1.48] text-[#0F172A]">
                    <p className="text-[9.5px] font-extrabold uppercase tracking-[0.05em] text-[#047857] mb-1">
                      El Cliente (Contratante)
                    </p>
                    <p className="font-bold text-[#0B0F19]">{contract.clientName || "[NOMBRE / RAZÓN SOCIAL]"}</p>
                    <p>{contract.clientDocument ? `DNI / RUC: ${contract.clientDocument}` : "DNI / RUC: [Por completar]"}</p>
                    {contract.clientAddress && <p>Domicilio: {contract.clientAddress}</p>}
                    <p>
                      {contract.clientEmail || "[CORREO ELECTRÓNICO]"}
                      {contract.clientPhone ? ` · ${contract.clientPhone}` : ""}
                    </p>
                    <p className="text-slate-600">Firma Electrónica Simple (Ley N° 27269)</p>
                  </div>
                </div>

                {(contract.paymentAmount || contract.paymentType === "MIXED" || contract.type === "MIXED") && (
                  <div
                    className={`grid gap-2 mb-3.5 ${
                      contract.paymentType === "MIXED" || contract.type === "MIXED"
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {contract.paymentType === "MIXED" || contract.type === "MIXED" ? (
                      <>
                        <div className="border border-[#CBD5E1] rounded-[8px] px-2.5 py-2 bg-white text-[10px] leading-[1.45]">
                          <p className="text-[9.5px] font-extrabold uppercase text-[#047857] mb-0.5">
                            Apartado A · Proyecto Único (50/50)
                          </p>
                          <p className="text-slate-700">
                            <b>Modalidad:</b> 50% adelanto al inicio y 50% contra entrega final + Factura/Boleta SUNAT.
                          </p>
                        </div>
                        <div className="border border-[#CBD5E1] rounded-[8px] px-2.5 py-2 bg-white text-[10px] leading-[1.45]">
                          <p className="text-[9.5px] font-extrabold uppercase text-[#6D28D9] mb-0.5">
                            Apartado B · Suscripción Mensual (100%)
                          </p>
                          <p className="text-slate-700">
                            <b>Modalidad:</b> Prepago mensual 100% adelantado · Baja libre sin penalidades (INDECOPI).
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="border border-[#CBD5E1] rounded-[8px] px-3 py-2 bg-white text-[10px] flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <b className="text-[#047857] uppercase">Resumen Económico:</b>{" "}
                          <span className="font-mono font-bold text-[#0B0F19]">{contract.paymentAmount}</span>
                        </span>
                        <span className="font-mono text-[9.5px] text-slate-600">
                          {contract.paymentType === "50_50"
                            ? "Modalidad: 50% Adelanto / 50% Entrega"
                            : contract.paymentType === "MONTHLY"
                              ? "Modalidad: 100% Prepago Mensual"
                              : "Modalidad: 100% Adelantado"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div
              className="prose prose-sm max-w-none
                prose-h1:text-[14.5px] prose-h1:font-extrabold prose-h1:text-[#0B0F19] prose-h1:mb-2.5 prose-h1:uppercase prose-h1:tracking-tight prose-h1:leading-snug
                prose-p:text-[11px] prose-p:text-[#1E293B] prose-p:leading-[1.56] prose-p:mb-1.5 prose-p:text-justify
                prose-strong:text-[#0B0F19] prose-strong:font-bold
                prose-ul:my-1.5 prose-li:text-[11px] prose-li:text-[#1E293B] prose-li:leading-[1.5] prose-li:mb-1
                prose-hr:my-3 prose-hr:border-slate-200"
            >
              <ReactMarkdown
                components={{
                  p: ({ ...props }) => <p className="mb-1.5 leading-[1.56] text-[#1E293B]" {...props} />,
                  h1: ({ ...props }) => <h1 className="mt-0.5 mb-2 font-extrabold text-[14.5px] leading-snug text-[#0B0F19] uppercase tracking-tight" {...props} />,
                  h2: ({ ...props }) => (
                    <h2
                      className="mt-3.5 mb-1.5 font-extrabold text-[11px] tracking-wide uppercase text-[#0B0F19] bg-[#F1F5F9] border-l-[3.5px] border-[#0B0F19] px-2.5 py-1 rounded-r-[5px]"
                      {...props}
                    />
                  ),
                  h3: ({ ...props }) => <h3 className="mt-2.5 mb-1 font-bold text-[11px] text-[#0B0F19]" {...props} />,
                  li: ({ ...props }) => <li className="mb-1 leading-[1.5] pl-0.5 text-[#1E293B]" {...props} />,
                  strong: ({ ...props }) => <strong className="font-bold text-[#0B0F19]" {...props} />,
                }}
              >
                {pageHtml}
              </ReactMarkdown>
            </div>

            {idx === pages.length - 1 && (
              <div className="relative z-10 mt-6 pt-5 border-t-2 border-black">
                <h3 className="text-[13px] font-bold text-black mb-5 uppercase tracking-widest font-sans text-center">
                  Cuadro de Firmas Oficiales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-2">
                  <div>
                    <p className="text-[12px] font-bold text-black mb-0.5">Miam Digital Studio S.A.C.</p>
                    <p className="text-[10.5px] text-gray-600 mb-3">Representante Legal: Jack Michael Berrocal Espinoza</p>

                    <div className="border-b border-black pb-1 relative h-[64px] flex items-end justify-start">
                      <img
                        src="/img/firma-jack.png"
                        alt="Firma del Representante Legal - Jack Michael Berrocal Espinoza"
                        className="max-h-[60px] w-auto object-contain mix-blend-multiply"
                      />
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono mt-1">Suscrito Digitalmente &bull; Gerencia General</p>
                  </div>

                  <div>
                    <p className="text-[12px] font-bold text-black mb-0.5">{contract.clientName || "[NOMBRE DEL CLIENTE]"}</p>
                    <p className="text-[10.5px] text-gray-600 mb-0.5">{contract.clientEmail || "[CORREO DEL CLIENTE]"}</p>
                    <p className="text-[10.5px] text-gray-600 mb-3">
                      {contract.clientDocument ? `DNI/RUC: ${contract.clientDocument}` : "DNI/RUC: [Por completar]"}
                    </p>

                    {isSigned ? (
                      <div className="border-b border-black pb-1 relative h-[60px] flex items-end justify-center">
                        <div className="absolute top-0 left-0 text-[8.5px] text-blue-700 font-sans font-bold uppercase tracking-widest flex items-center gap-1 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                          Docu-Verified
                        </div>
                        {contract.signatureData ? (
                          <img src={contract.signatureData} alt="Firma del cliente" className="max-h-[55px] max-w-full object-contain mix-blend-multiply" />
                        ) : (
                          <span
                            className="font-serif italic text-[24px] text-blue-950"
                            style={{ fontFamily: "'Brush Script MT', 'Cedarville Cursive', cursive" }}
                          >
                            {contract.clientName || "Firma del Cliente"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        ref={signHereRef}
                        onClick={onRequestSign}
                        className={`border-2 border-[#ffc820] bg-[#fff9e6] ${
                          mode === "sign" ? "hover:bg-[#fff0c2] cursor-pointer" : ""
                        } transition-colors relative h-[60px] flex items-center justify-center group shadow-sm`}
                      >
                        <div className="absolute -left-[75px] top-1/2 -translate-y-1/2 bg-[#ffc820] text-[#1e1e1e] font-bold text-[9.5px] px-2 py-1.5 shadow-md hidden sm:flex items-center gap-1 uppercase">
                          Firmar
                          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[7px] border-l-[#ffc820] absolute -right-[7px] top-0"></div>
                        </div>

                        <span className="text-[#1e1e1e] font-bold text-xs flex items-center gap-1.5 font-sans opacity-90">
                          <PenTool className="w-3.5 h-3.5" />
                          {mode === "sign" ? "Haga clic para firmar" : "Recuadro interactivo de firma del cliente"}
                        </span>
                      </div>
                    )}

                    {isSigned && (
                      <div className="mt-1 text-[8.5px] text-gray-500 font-mono leading-tight">
                        <p>IP: {contract.clientIp || "Registrada en servidor"}</p>
                        <p>
                          Fecha y Hora de Registro:{" "}
                          {contract.signedAt ? new Date(contract.signedAt).toLocaleString("es-PE") : "Al momento de firmar"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer A4 */}
          <div className="relative z-10 flex justify-between items-center border-t border-slate-200 pt-2.5 mt-5 text-[9.5px] text-slate-500 font-sans">
            <span>MIAM DIGITAL STUDIO S.A.C. &bull; R.U.C. 20615782344 &bull; Libro de Reclamaciones: miam.com.pe/libro-de-reclamaciones.php</span>
            <span className="font-semibold text-slate-700 uppercase tracking-wider tabular-nums shrink-0 ml-3">
              Página {idx + 1} de {pages.length}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
