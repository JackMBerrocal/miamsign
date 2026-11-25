export function escapeHtml(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildContractInviteEmailHtml(params: {
  clientName: string;
  contractTitle: string;
  contractUrl: string;
  year?: number;
}): string {
  const currentYear = params.year || new Date().getFullYear();
  const safeName = escapeHtml(params.clientName || "Cliente");
  const safeTitle = escapeHtml(params.contractTitle || "Contrato de Servicios - Miam");
  const safeUrl = escapeHtml(params.contractUrl || "https://firmas.miam.com.pe/sign/vista-previa");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firma Requerida: ${safeTitle} - Miam Digital Studio</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 32px 16px; }
    .main-table { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .top-gradient { height: 6px; background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); }
    .header { background-color: #0b0f19; padding: 32px 24px 22px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px; margin-bottom: 20px; }
    .content { padding: 36px 32px; background-color: #ffffff; }
    .greeting { font-size: 23px; font-weight: 800; color: #0f172a; line-height: 1.3; margin: 0 0 12px 0; }
    .paragraph { font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 24px 0; }
    .document-card { background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-left: 4px solid #6366f1; border-radius: 10px; padding: 20px 22px; margin-bottom: 28px; }
    .document-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn-action { background-color: #005cb9; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 16px 40px; border-radius: 8px; display: inline-block; box-shadow: 0 6px 20px rgba(0, 92, 185, 0.28); }
    .security-section { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 24px; border-radius: 10px; margin-top: 24px; }
    .security-item { font-size: 12.5px; color: #475569; line-height: 1.5; margin-bottom: 10px; }
    .security-item:last-child { margin-bottom: 0; }
    .link-fallback { margin-top: 22px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; word-break: break-all; line-height: 1.5; }
    .link-fallback a { color: #6366f1; text-decoration: underline; }
    .footer { background-color: #0b0f19; padding: 28px 24px; text-align: center; color: #94a3b8; }
    .footer-company { font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 6px 0; }
    .footer-text { font-size: 12px; color: #94a3b8; margin: 0 0 14px 0; line-height: 1.6; }
    .footer-legal { font-size: 11px; color: #475569; border-top: 1px solid #1e293b; padding-top: 14px; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td class="top-gradient"></td></tr>
      <tr>
        <td class="header">
          <img src="https://miam.com.pe/img/LOGO%20MIAM_blanco.png" alt="Miam Digital Studio" style="max-height: 85px; width: auto; max-width: 240px; margin: 0 auto; display: block;" />
          <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
            Plataforma Segura de Firma Electrónica &bull; MiamSign
          </p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div style="text-align: left;">
            <span class="badge">Acción Requerida &bull; Firma de Contrato</span>
          </div>
          <h1 class="greeting">Hola, ${safeName}</h1>
          <p class="paragraph">
            Te informamos que <strong>Miam Digital Studio S.A.C.</strong> ha generado formalmente tu contrato de servicios profesionales bajo la modalidad <strong>Master Services Agreement (MSA)</strong> para tu revisión y firma electrónica vinculante.
          </p>
          <div class="document-card">
            <p class="document-title">📄 ${safeTitle}</p>
            <p style="font-size: 13px; color: #475569; margin: 4px 0 10px 0;">
              <strong>Emisor:</strong> Miam Digital Studio S.A.C. (RUC 20615782344)
            </p>
            <div style="font-size: 11.5px; color: #64748b;">
              <span style="background-color: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-right: 8px;">
                Estado: Pendiente de Firma
              </span>
              <span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                Formato A4 Oficial
              </span>
            </div>
          </div>
          <div class="btn-container">
            <a href="${safeUrl}" class="btn-action" target="_blank" rel="noopener">
              Revisar y Firmar Documento &rarr;
            </a>
          </div>
          <div class="security-section">
            <div class="security-item">
              🛡️ <strong>Validez Legal Plena:</strong> Perfeccionamiento bajo los Arts. 141 y 141-A del Código Civil del Perú y la Ley N° 27269 (Ley de Firmas y Certificados Digitales).
            </div>
            <div class="security-item">
              🔒 <strong>Trazabilidad Electrónica:</strong> Tu firma es registrada con dirección IP, correo verificado y fecha/hora del servidor.
            </div>
            <div class="security-item">
              📥 <strong>Descarga Instantánea:</strong> Al firmar, podrás descargar tu copia completa en PDF en formato A4 de alta fidelidad.
            </div>
          </div>
          <p class="link-fallback">
            Si el botón superior no responde, copia y pega este enlace seguro en tu navegador:<br>
            <a href="${safeUrl}">${safeUrl}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-company">Miam Digital Studio S.A.C.</p>
          <p class="footer-text">
            <a href="https://maps.app.goo.gl/WfQMUvctixF6aXWz7" target="_blank" style="color: #cbd5e1; text-decoration: underline;">
              📍 Urb. José Gálvez, JIRON JOSE DE SAN MARTIN, Villa María del Triunfo 15822
            </a> &bull; RUC: 20615782344<br>
            <a href="https://miam.com.pe" style="color: #6366f1; text-decoration: none;">www.miam.com.pe</a> &bull;
            <a href="mailto:contacto@miam.com.pe" style="color: #6366f1; text-decoration: none;">contacto@miam.com.pe</a>
          </p>
          <p class="footer-legal">
            Este es un correo electrónico oficial emitido automáticamente por el sistema MiamSign. Este mensaje y cualquier archivo anexo son confidenciales y están protegidos por la Ley N° 29733 de Protección de Datos Personales.
          </p>
          <p style="font-size: 10px; color: #475569; margin: 8px 0 0 0;">
            &copy; ${currentYear} Miam Digital Studio S.A.C. Todos los derechos reservados.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
