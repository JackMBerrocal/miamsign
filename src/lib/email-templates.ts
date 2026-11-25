import { splitContractIntoPages } from "@/lib/contract-format";

export function escapeHtml(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ContractEmailMeta {
  serviceName?: string;
  clientDocument?: string;
  paymentAmount?: string;
  paymentType?: string;
  deliveryTime?: string;
  content?: string;
  pageCount?: number;
}

interface ResolvedEmailMeta {
  serviceLabel: string;
  investmentDisplay: string;
  deliveryDisplay: string;
  documentDisplay: string;
}

function formatPaymentModeLabel(paymentType?: string): string {
  switch ((paymentType || "").toUpperCase()) {
    case "50_50":
      return "50% / 50%";
    case "100":
    case "100_PREPAGO":
      return "100% Adelanto";
    case "MONTHLY":
      return "Mensual";
    default:
      return "";
  }
}

function formatAmountDisplay(paymentAmount?: string, paymentType?: string): string {
  const raw = (paymentAmount || "").trim();
  const modeLabel = formatPaymentModeLabel(paymentType);
  if (!raw) {
    return modeLabel ? `Según acuerdo (${modeLabel})` : "Según cláusula económica MSA";
  }

  let formattedAmount = raw;
  const penMatch = raw.match(/^([\d,]+(?:\.\d{1,2})?)\s*PEN$/i);
  const usdMatch = raw.match(/^([\d,]+(?:\.\d{1,2})?)\s*USD(.*)$/i);

  if (penMatch) {
    formattedAmount = `S/ ${penMatch[1]}`;
  } else if (usdMatch) {
    formattedAmount = `$ ${usdMatch[1]} USD${usdMatch[2] || ""}`.trim();
  }

  return modeLabel ? `${formattedAmount} (${modeLabel})` : formattedAmount;
}

function cleanServiceTitle(contractTitle?: string): string {
  const cleaned = (contractTitle || "")
    .replace(/^Contrato\s+(?:de\s+)?/i, "")
    .replace(/\s*-\s*Miam(?:\s+Digital\s+Studio)?$/i, "")
    .replace(/\s*\(Vista Previa\)$/i, "")
    .trim();
  return cleaned || contractTitle || "Servicios Digitales Miam";
}

function extractAmountFromContent(content?: string): string {
  if (!content) return "";
  const match =
    content.match(/ascendente\s+a\s+\*\*([^*]+)\*\*/i) ||
    content.match(/contraprestaci[oó]n(?:\s+total)?(?:\s+mensual)?(?:\s+ascendente)?\s+a\s+\*\*([^*]+)\*\*/i);
  return match ? match[1].trim() : "";
}

function extractDeliveryFromContent(content?: string): string {
  if (!content) return "";
  const match =
    content.match(/Plazo de Ejecuci[oó]n[^:]*:[\s\S]{0,80}?es de\s+\*\*([^*]+)\*\*/i) ||
    content.match(/Tiempo de entrega estimado:?\s*\*?\*?([^*\n]+)\*?\*?/i);
  return match ? match[1].trim() : "";
}

function resolveContractEmailMeta(
  contractTitle: string,
  meta?: ContractEmailMeta
): ResolvedEmailMeta {
  const serviceLabel = (meta?.serviceName || "").trim() || cleanServiceTitle(contractTitle);
  const rawAmount = (meta?.paymentAmount || "").trim() || extractAmountFromContent(meta?.content);
  const investmentDisplay = formatAmountDisplay(rawAmount, meta?.paymentType);
  const deliveryDisplay =
    (meta?.deliveryTime || "").trim() ||
    extractDeliveryFromContent(meta?.content) ||
    "Según cronograma MSA";

  const pages =
    typeof meta?.pageCount === "number" && meta.pageCount > 0
      ? meta.pageCount
      : meta?.content
        ? splitContractIntoPages(meta.content).length
        : 4;

  const docNumber = (meta?.clientDocument || "").trim();
  const docPrefix = docNumber
    ? `${/^\d{11}$/.test(docNumber) ? "RUC" : "DNI/RUC"} ${docNumber} · `
    : "";
  const documentDisplay = `${docPrefix}${pages} ${pages === 1 ? "pág" : "págs"} A4`;

  return {
    serviceLabel,
    investmentDisplay,
    deliveryDisplay,
    documentDisplay,
  };
}

function resolveAssetBaseUrl(contractUrl: string): string {
  try {
    const parsed = new URL(contractUrl);
    if (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !/localhost|127\.0\.0\.1/i.test(parsed.hostname)
    ) {
      return parsed.origin;
    }
  } catch {
    // Fallback to production origin
  }
  return "https://firmas.miam.com.pe";
}

interface BentoShellOptions {
  pageTitle: string;
  headerBadge: string;
  headerBadgeStyle: "pending" | "signed";
  eyebrow: string;
  headingHtml: string;
  leadHtml: string;
  steps: Array<{
    kicker: string;
    label: string;
    state: "done" | "active" | "pending";
  }>;
  bentoTiles: Array<{
    label: string;
    value: string;
  }>;
  ctaUrl: string;
  ctaLabel: string;
  ctaTag: string;
  trustItems: Array<{
    title: string;
    body: string;
  }>;
  fallbackText: string;
  footerYear: number;
  logoUrl: string;
}

function renderBentoNoirShell(opts: BentoShellOptions): string {
  const safeUrl = escapeHtml(opts.ctaUrl);
  const badgeCss =
    opts.headerBadgeStyle === "signed"
      ? "background-color:#052e16;border:1px solid #00e076;color:#6ee7b7;"
      : "background-color:#0c2920;border:1px solid rgba(0,224,118,0.45);color:#00e076;";

  const stepCells = opts.steps
    .map((step, index) => {
      const boxStyles =
        step.state === "done"
          ? "background-color:#ecfdf5;border:1px solid #6ee7b7;"
          : step.state === "active"
            ? "background-color:#eef2ff;border:1.5px solid #818cf8;"
            : "background-color:#f8fafc;border:1px solid #e2e8f0;";
      const kickerColor =
        step.state === "done"
          ? "#059669"
          : step.state === "active"
            ? "#4f46e5"
            : "#64748b";
      const labelColor =
        step.state === "done"
          ? "#065f46"
          : step.state === "active"
            ? "#1e1b4b"
            : "#475569";

      const spacer =
        index < opts.steps.length - 1
          ? '<td class="step-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>'
          : "";

      return `<td class="step-col" width="32%" valign="top" style="${boxStyles}border-radius:12px;padding:11px 12px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.9px;text-transform:uppercase;color:${kickerColor};margin:0 0 4px 0;">${escapeHtml(step.kicker)}</div>
        <div style="font-size:12px;font-weight:800;color:${labelColor};line-height:1.25;">${escapeHtml(step.label)}</div>
      </td>${spacer}`;
    })
    .join("");

  const renderTile = (tile: { label: string; value: string }) =>
    `<td class="bento-col" width="49%" valign="top" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#64748b;margin:0 0 4px 0;">${escapeHtml(tile.label)}</div>
      <div style="font-size:13.5px;font-weight:800;color:#0f172a;line-height:1.35;">${escapeHtml(tile.value)}</div>
    </td>`;

  const trustCells = opts.trustItems
    .map((item, index) => {
      const spacer =
        index < opts.trustItems.length - 1
          ? '<td class="trust-gap" width="14" style="width:14px;font-size:0;line-height:0;">&nbsp;</td>'
          : "";
      return `<td class="trust-col" width="32%" valign="top" style="padding:2px 0;">
        <div style="font-size:12px;font-weight:800;color:#0f172a;margin:0 0 4px 0;line-height:1.3;">${escapeHtml(item.title)}</div>
        <div style="font-size:11.5px;color:#475569;line-height:1.45;">${escapeHtml(item.body)}</div>
      </td>${spacer}`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.pageTitle)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #eef2f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 560px) {
      .outer-pad { padding: 14px 10px !important; }
      .body-pad { padding: 24px 18px !important; }
      .header-pad { padding: 18px 18px !important; }
      .step-col, .bento-col, .trust-col {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 10px !important;
      }
      .step-gap, .bento-gap, .trust-gap { display: none !important; }
      .header-badge-cell { display: block !important; text-align: left !important; padding-top: 12px !important; }
      .header-logo-cell { display: block !important; width: 100% !important; }
      .footer-right { display: block !important; text-align: left !important; padding-top: 8px !important; }
      .footer-left { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eef2f7;">
    <tr>
      <td class="outer-pad" align="center" style="padding:28px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:610px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 18px 42px rgba(15,23,42,0.10);">
          <!-- Top Brand Accent Bar -->
          <tr>
            <td style="height:5px;font-size:0;line-height:0;background:linear-gradient(90deg,#8A4FFF 0%,#6366F1 52%,#00E076 100%);">&nbsp;</td>
          </tr>

          <!-- Dark Header -->
          <tr>
            <td class="header-pad" style="background-color:#0b0f19;padding:22px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="header-logo-cell" valign="middle">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td valign="middle" style="padding-right:12px;">
                          <img src="${escapeHtml(opts.logoUrl)}" alt="Miam" width="38" height="38" style="display:block;width:38px;height:38px;object-fit:contain;" />
                        </td>
                        <td valign="middle">
                          <div style="font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.2px;line-height:1.15;">MiamSign</div>
                          <div style="font-size:11.5px;color:#94a3b8;line-height:1.3;">Miam Digital Studio S.A.C.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="header-badge-cell" align="right" valign="middle">
                    <span style="display:inline-block;${badgeCss}border-radius:9999px;padding:6px 13px;font-size:10.5px;font-weight:800;letter-spacing:0.9px;text-transform:uppercase;white-space:nowrap;">
                      ${escapeHtml(opts.headerBadge)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td class="body-pad" style="padding:32px 30px 28px 30px;background-color:#ffffff;">
              <div style="font-size:11px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;color:#6366f1;margin:0 0 8px 0;">
                ${escapeHtml(opts.eyebrow)}
              </div>

              <h1 style="margin:0 0 10px 0;font-size:25px;font-weight:900;color:#0b0f19;letter-spacing:-0.4px;line-height:1.2;">
                ${opts.headingHtml}
              </h1>

              <p style="margin:0 0 22px 0;font-size:14.5px;line-height:1.6;color:#475569;">
                ${opts.leadHtml}
              </p>

              <!-- 3-Step Progress Rail -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;">
                <tr>
                  ${stepCells}
                </tr>
              </table>

              <!-- Bento 2x2 Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin:0 0 24px 0;">
                <tr>
                  <td style="padding:12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        ${renderTile(opts.bentoTiles[0])}
                        <td class="bento-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>
                        ${renderTile(opts.bentoTiles[1])}
                      </tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:10px;">
                      <tr>
                        ${renderTile(opts.bentoTiles[2])}
                        <td class="bento-gap" width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>
                        ${renderTile(opts.bentoTiles[3])}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- High-Contrast Pill CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:4px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}" target="_blank" rel="noopener" style="display:inline-block;background-color:#0b0f19;color:#ffffff !important;text-decoration:none;border-radius:9999px;padding:12px 16px 12px 24px;font-size:14.5px;font-weight:800;letter-spacing:-0.1px;box-shadow:0 12px 24px rgba(11,15,25,0.20);">
                      <span style="vertical-align:middle;color:#ffffff;">${escapeHtml(opts.ctaLabel)}</span>
                      <span style="display:inline-block;vertical-align:middle;margin-left:10px;background-color:#00e076;color:#052e16;border-radius:9999px;padding:6px 13px;font-size:12.5px;font-weight:900;">
                        ${escapeHtml(opts.ctaTag)}
                      </span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 3-Column Trust & Compliance Strip -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e2e8f0;padding-top:18px;">
                <tr>
                  <td style="padding-top:18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        ${trustCells}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <div style="margin-top:18px;padding-top:14px;border-top:1px dashed #cbd5e1;font-size:11.5px;color:#64748b;line-height:1.5;">
                ${escapeHtml(opts.fallbackText)}<br />
                <a href="${safeUrl}" style="color:#4f46e5;text-decoration:underline;word-break:break-all;">${safeUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Dark Footer -->
          <tr>
            <td style="background-color:#0b0f19;padding:18px 28px;color:#94a3b8;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="footer-left" valign="middle" style="font-size:11.5px;color:#cbd5e1;font-weight:700;">
                    MIAM DIGITAL STUDIO S.A.C. &bull; RUC 20615782344
                  </td>
                  <td class="footer-right" align="right" valign="middle" style="font-size:11.5px;color:#94a3b8;white-space:nowrap;">
                    <a href="mailto:contacto@miam.com.pe" style="color:#cbd5e1;text-decoration:none;">contacto@miam.com.pe</a> &bull; +51 936 400 058
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:10px;font-size:10.5px;color:#64748b;line-height:1.45;">
                    <a href="https://maps.app.goo.gl/WfQMUvctixF6aXWz7" target="_blank" style="color:#64748b;text-decoration:underline;">Urb. José Gálvez, Jr. José de San Martín, Villa María del Triunfo 15822, Lima</a> &bull; Datos protegidos bajo Ley N° 29733 &bull; &copy; ${opts.footerYear} Miam Digital Studio S.A.C.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildContractInviteEmailHtml(
  params: {
    clientName: string;
    contractTitle: string;
    contractUrl: string;
    year?: number;
  } & ContractEmailMeta
): string {
  const currentYear = params.year || new Date().getFullYear();
  const safeName = escapeHtml(params.clientName || "Cliente");
  const meta = resolveContractEmailMeta(params.contractTitle, params);
  const assetBase = resolveAssetBaseUrl(params.contractUrl);

  return renderBentoNoirShell({
    pageTitle: `Firma Requerida: ${params.contractTitle || meta.serviceLabel} - MiamSign`,
    headerBadge: "• PENDIENTE DE FIRMA",
    headerBadgeStyle: "pending",
    eyebrow: "CONTRATO DIGITAL MSA · MIAMSIGN",
    headingHtml: `Hola, ${safeName} 👋`,
    leadHtml:
      "Hemos preparado tu contrato formal de servicios profesionales (<strong>MSA</strong>) para iniciar tu proyecto con fechas garantizadas y respaldo legal peruano. Solo toma 1 minuto revisarlo y firmarlo en línea.",
    steps: [
      { kicker: "PASO 01", label: "✓ Generado", state: "done" },
      { kicker: "PASO 02", label: "• Tu Firma Digital", state: "active" },
      { kicker: "PASO 03", label: "PDF Oficial A4", state: "pending" },
    ],
    bentoTiles: [
      { label: "SERVICIO", value: meta.serviceLabel },
      { label: "INVERSIÓN & MODALIDAD", value: meta.investmentDisplay },
      { label: "PLAZO ESTIMADO", value: meta.deliveryDisplay },
      { label: "DOCUMENTO", value: meta.documentDisplay },
    ],
    ctaUrl: params.contractUrl || "https://firmas.miam.com.pe/sign/vista-previa",
    ctaLabel: "Revisar y Firmar Contrato",
    ctaTag: "Abrir A4 →",
    trustItems: [
      {
        title: "⚖️ Ley N° 27269",
        body: "Firma electrónica con trazabilidad IP y fecha/hora.",
      },
      {
        title: "🛡️ Ley N° 29571",
        body: "Contrato equilibrado + Libro de Reclamaciones Virtual.",
      },
      {
        title: "📥 PDF A4 Directo",
        body: "Descarga inmediata apenas adoptes tu firma.",
      },
    ],
    fallbackText: "Si el botón no responde, abre este enlace seguro en tu navegador:",
    footerYear: currentYear,
    logoUrl: `${assetBase}/img/miam-cat-white.png`,
  });
}

export function buildContractSignedEmailHtml(
  params: {
    clientName: string;
    contractTitle: string;
    contractUrl: string;
    signedAt: Date;
    clientIp: string;
    year?: number;
  } & ContractEmailMeta
): string {
  const currentYear = params.year || new Date().getFullYear();
  const safeName = escapeHtml(params.clientName || "Cliente");
  const meta = resolveContractEmailMeta(params.contractTitle, params);
  const assetBase = resolveAssetBaseUrl(params.contractUrl);
  const formattedDate = new Date(params.signedAt).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });

  return renderBentoNoirShell({
    pageTitle: `Contrato Firmado: ${params.contractTitle || meta.serviceLabel} - MiamSign`,
    headerBadge: "✓ COMPLETADO Y FIRMADO",
    headerBadgeStyle: "signed",
    eyebrow: "CONSTANCIA OFICIAL · PASO 03 COMPLETADO",
    headingHtml: `¡Listo, ${safeName}!&nbsp;✅`,
    leadHtml:
      "Confirmamos el perfeccionamiento electrónico de tu <strong>Contrato Marco de Servicios (MSA)</strong>. Tu firma y la de Gerencia General ya quedaron estampadas y custodiadas; puedes descargar tu <strong>PDF Oficial A4</strong> cuando lo necesites.",
    steps: [
      { kicker: "PASO 01", label: "✓ Generado", state: "done" },
      { kicker: "PASO 02", label: "✓ Firmado Digital", state: "done" },
      { kicker: "PASO 03", label: "✓ PDF Oficial A4", state: "done" },
    ],
    bentoTiles: [
      { label: "SERVICIO FIRMADO", value: meta.serviceLabel },
      { label: "FECHA DE FIRMA", value: formattedDate },
      { label: "TRAZABILIDAD IP", value: params.clientIp || "Registrada por servidor" },
      { label: "DOCUMENTO & RESGUARDO", value: meta.documentDisplay },
    ],
    ctaUrl: params.contractUrl || "https://firmas.miam.com.pe/sign/vista-previa",
    ctaLabel: "Ver Contrato Firmado",
    ctaTag: "Descargar PDF A4 →",
    trustItems: [
      {
        title: "⚖️ Arts. 141 y 141-A CC",
        body: "Acuerdo electrónico con plena eficacia probatoria en Perú.",
      },
      {
        title: "🔒 Custodia Segura",
        body: "Respaldo archivado con IP, fecha y hora verificadas.",
      },
      {
        title: "📄 Copia Íntegra A4",
        body: "Disponible 24/7 para descarga o emisión contable SUNAT.",
      },
    ],
    fallbackText: "Guarda o vuelve a abrir tu contrato firmado desde este enlace seguro:",
    footerYear: currentYear,
    logoUrl: `${assetBase}/img/miam-cat-white.png`,
  });
}

export function buildOrderReceiptEmailHtml(params: {
  clientName: string;
  clientEmail: string;
  orderCode: string;
  serviceName: string;
  paidAmountLabel: string;
  balanceLabel: string;
  paymentMethod: string;
  sunatType: string;
  portalUrl: string;
  portalPasswordHint: string;
  year?: number;
}): string {
  const currentYear = params.year || new Date().getFullYear();
  const safeName = escapeHtml(params.clientName || "Cliente");
  const assetBase = resolveAssetBaseUrl(params.portalUrl);

  return renderBentoNoirShell({
    pageTitle: `Comprobante de Orden ${params.orderCode} - Miam Digital Studio`,
    headerBadge: `✓ ORDEN ${params.orderCode}`,
    headerBadgeStyle: "signed",
    eyebrow: "COMPROBANTE DE COMPRA & PORTAL PRIVADO",
    headingHtml: `¡Gracias, ${safeName}!`,
    leadHtml: `Registramos formalmente tu orden <strong>${escapeHtml(params.orderCode)}</strong> para <strong>${escapeHtml(params.serviceName)}</strong>. Creamos tu cuenta permanente en el <strong>Portal Cliente Miam</strong> para que hagas seguimiento de etapas, completes tu encuesta brief y descargues tus archivos.`,
    steps: [
      { kicker: "ORDEN", label: params.orderCode, state: "done" },
      { kicker: "ACCESO PORTAL", label: `Clave: ${params.portalPasswordHint}`, state: "active" },
      { kicker: "SIGUIENTE PASO", label: "Firma + Encuesta", state: "pending" },
    ],
    bentoTiles: [
      { label: "SERVICIO CONTRATADO", value: params.serviceName },
      {
        label: "ABONO & SALDO",
        value: `${params.paidAmountLabel} (${params.paymentMethod}) · Saldo: ${params.balanceLabel}`,
      },
      {
        label: "COMPROBANTE SUNAT",
        value: `${params.sunatType} Electrónica en emisión`,
      },
      {
        label: "USUARIO DE PORTAL",
        value: `${params.clientEmail} · Clave: ${params.portalPasswordHint}`,
      },
    ],
    ctaUrl: params.portalUrl || "https://firmas.miam.com.pe/portal",
    ctaLabel: "Entrar a Mi Portal Cliente",
    ctaTag: "Abrir Portal →",
    trustItems: [
      {
        title: "🔐 Cuenta Vitalicia",
        body: "Tu acceso con este correo es permanente; puedes cambiar tu clave adentro.",
      },
      {
        title: "📅 Etapas y Fechas",
        body: "Visualiza lo ya hecho, avances en curso y fechas comprometidas.",
      },
      {
        title: "📥 Bóveda 180 Días",
        body: "Descarga tus entregables por 6 meses y tu contrato firmado siempre.",
      },
    ],
    fallbackText: "Guarda este acceso directo a tu Portal Privado:",
    footerYear: currentYear,
    logoUrl: `${assetBase}/img/miam-cat-white.png`,
  });
}
