import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "a0090610.ferozo.com",
  port: parseInt(process.env.EMAIL_PORT || "465", 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || "noreply@miam.com.pe",
    pass: process.env.EMAIL_PASS || "Reply23@*",
  },
});

export const sendContractEmail = async (
  clientName: string,
  clientEmail: string,
  contractTitle: string,
  contractUrl: string
) => {
  const currentYear = new Date().getFullYear();

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Firma Requerida: ${contractTitle} - Miam Digital Studio</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 40px 16px;
    }
    .main-table {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .top-gradient {
      height: 6px;
      background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
    }
    .header {
      background-color: #0b0f19;
      padding: 32px 24px 22px 24px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .content {
      padding: 40px 36px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin: 0 0 12px 0;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.65;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .document-card {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6366f1;
      border-radius: 10px;
      padding: 22px 24px;
      margin-bottom: 32px;
    }
    .document-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
      line-height: 1.3;
    }
    .document-meta {
      font-size: 12px;
      color: #64748b;
      margin: 0;
      display: flex;
      gap: 16px;
    }
    .btn-container {
      text-align: center;
      margin: 36px 0;
    }
    .btn-action {
      display: inline-block;
      background-color: #005cb9;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 6px 20px rgba(0, 92, 185, 0.28);
    }
    .security-section {
      background-color: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .security-item {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.55;
      margin-bottom: 8px;
    }
    .security-item:last-child {
      margin-bottom: 0;
    }
    .security-item strong {
      color: #1e293b;
    }
    .link-fallback {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
      margin-top: 24px;
      word-break: break-all;
    }
    .link-fallback a {
      color: #6366f1;
      text-decoration: underline;
    }
    .footer {
      background-color: #0b0f19;
      padding: 32px 30px;
      text-align: center;
      color: #94a3b8;
    }
    .footer-company {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 6px 0;
    }
    .footer-text {
      font-size: 11.5px;
      line-height: 1.6;
      color: #64748b;
      margin: 0 0 16px 0;
    }
    .footer-legal {
      font-size: 10.5px;
      line-height: 1.5;
      color: #475569;
      border-top: 1px solid #1e293b;
      padding-top: 16px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <!-- Gradient Line Top -->
      <tr>
        <td class="top-gradient"></td>
      </tr>

      <!-- Header with Logo -->
      <tr>
        <td class="header">
          <img src="https://miam.com.pe/img/LOGO%20MIAM_blanco.png" alt="Miam Digital Studio" style="max-height: 95px; width: auto; max-width: 260px; margin: 0 auto; display: block;" />
          <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">
            Plataforma Segura de Firma Electrónica &bull; MiamSign
          </p>
        </td>
      </tr>

      <!-- Content Body -->
      <tr>
        <td class="content">
          <div style="text-align: left;">
            <span class="badge">Acción Requerida &bull; Firma de Contrato</span>
          </div>

          <h1 class="greeting">Hola, ${clientName}</h1>

          <p class="paragraph">
            Te informamos que <strong>Miam Digital Studio S.A.C.</strong> ha generado formalmente tu contrato de servicios profesionales bajo la modalidad <strong>Master Services Agreement (MSA)</strong> para tu revisión y firma digital certificada.
          </p>

          <!-- Document Box -->
          <div class="document-card">
            <p class="document-title">📄 ${contractTitle}</p>
            <p style="font-size: 13px; color: #475569; margin: 4px 0 10px 0;">
              <strong>Emisor:</strong> Miam Digital Studio S.A.C. (RUC 20615782344)
            </p>
            <div style="display: flex; gap: 10px; font-size: 11.5px; color: #64748b;">
              <span style="background-color: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                Estado: Pendiente de Firma
              </span>
              <span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                Formato A4 Oficial
              </span>
            </div>
          </div>

          <!-- CTA Button -->
          <div class="btn-container">
            <a href="${contractUrl}" class="btn-action" target="_blank">
              Revisar y Firmar Documento &rarr;
            </a>
          </div>

          <!-- Security and Compliance -->
          <div class="security-section">
            <div class="security-item">
              🛡️ <strong>Validez Legal Plena:</strong> Perfeccionamiento bajo la Ley N° 27269 (Ley de Firmas y Certificados Digitales) y el Código Civil del Perú.
            </div>
            <div class="security-item">
              🔒 <strong>Cifrado y Trazabilidad:</strong> Tu firma es registrada con estampado criptográfico, dirección IP y sellado de tiempo inmutable.
            </div>
            <div class="security-item">
              📥 <strong>Descarga Instantánea:</strong> Al firmar, podrás descargar tu copia completa en PDF en formato A4 de alta fidelidad.
            </div>
          </div>

          <!-- Direct Link Fallback -->
          <p class="link-fallback">
            Si el botón superior no responde, copia y pega este enlace seguro en tu navegador:<br>
            <a href="${contractUrl}">${contractUrl}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
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
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"MiamSign - Legal" <noreply@miam.com.pe>',
      to: clientEmail,
      subject: `Firma Requerida: ${contractTitle} - Miam Digital Studio`,
      html: htmlContent,
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
