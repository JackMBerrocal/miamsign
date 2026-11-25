import nodemailer from "nodemailer";
import { buildContractInviteEmailHtml, escapeHtml } from "@/lib/email-templates";

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const port = parseInt(process.env.EMAIL_PORT || "465", 10);

  if (!host || !user || !pass) {
    throw new Error(
      "Configuración SMTP incompleta. Define EMAIL_HOST, EMAIL_USER y EMAIL_PASS en las variables de entorno."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const sendContractEmail = async (
  clientName: string,
  clientEmail: string,
  contractTitle: string,
  contractUrl: string
) => {
  const htmlContent = buildContractInviteEmailHtml({
    clientName,
    contractTitle,
    contractUrl,
  });

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"MiamSign - Legal" <${process.env.EMAIL_USER || "noreply@miam.com.pe"}>`,
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

export const sendSignedConfirmationEmail = async (
  clientName: string,
  clientEmail: string,
  contractTitle: string,
  contractUrl: string,
  signedAt: Date,
  clientIp: string
) => {
  const currentYear = new Date().getFullYear();
  const safeName = escapeHtml(clientName);
  const safeEmail = escapeHtml(clientEmail);
  const safeTitle = escapeHtml(contractTitle);
  const safeUrl = escapeHtml(contractUrl);
  const safeIp = escapeHtml(clientIp);
  const formattedDate = new Date(signedAt).toLocaleString('es-PE', {
    dateStyle: 'long',
    timeStyle: 'medium',
    timeZone: 'America/Lima'
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento Completado y Firmado - Miam Digital Studio</title>
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
      background: linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%);
    }
    .header {
      background-color: #0b0f19;
      padding: 32px 24px 22px 24px;
      text-align: center;
    }
    .badge-success {
      display: inline-block;
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
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
      border-left: 4px solid #10b981;
      border-radius: 10px;
      padding: 22px 24px;
      margin-bottom: 32px;
    }
    .document-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    .meta-row {
      font-size: 12.5px;
      color: #475569;
      margin: 4px 0;
      line-height: 1.5;
    }
    .btn-container {
      text-align: center;
      margin: 36px 0;
    }
    .btn-action {
      display: inline-block;
      background-color: #059669;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 6px 20px rgba(5, 150, 105, 0.28);
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
      <!-- Gradient Line Top Success (Green) -->
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
            <span class="badge-success">✅ Contrato Firmado y Completado</span>
          </div>

          <h1 class="greeting">¡Firma Completada con Éxito!</h1>

          <p class="paragraph">
            Hola <strong>${safeName}</strong>, te confirmamos que has completado satisfactoriamente el proceso de firma electrónica para el documento <strong>${safeTitle}</strong>.
          </p>

          <!-- Document Box -->
          <div class="document-card">
            <p class="document-title">📄 ${safeTitle}</p>
            <div class="meta-row"><strong>Emisor:</strong> Miam Digital Studio S.A.C. (RUC 20615782344)</div>
            <div class="meta-row"><strong>Firmante:</strong> ${safeName} (${safeEmail})</div>
            <div class="meta-row"><strong>Fecha de Firma:</strong> ${formattedDate}</div>
            <div class="meta-row"><strong>Dirección IP:</strong> ${safeIp}</div>
            <div style="margin-top: 12px;">
              <span style="background-color: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 11.5px;">
                ✓ Firmado y Perfeccionado
              </span>
            </div>
          </div>

          <!-- CTA Button to Download PDF -->
          <div class="btn-container">
            <a href="${safeUrl}" class="btn-action" target="_blank">
              Ver y Descargar Documento Firmado (PDF) &rarr;
            </a>
          </div>

          <!-- Security and Compliance -->
          <div class="security-section">
            <div class="security-item">
              ⚖️ <strong>Plena Validez Legal:</strong> Este contrato electrónico goza de plena eficacia probatoria y validez jurídica según los Arts. 141 y 141-A del Código Civil del Perú y la Ley N° 27269.
            </div>
            <div class="security-item">
              🔒 <strong>Custodia Segura:</strong> Una copia original con registro de fecha/hora e IP queda archivada en los servidores seguros de Miam Digital Studio S.A.C.
            </div>
            <div class="security-item">
              📥 <strong>Tu Copia Oficial:</strong> Puedes acceder al enlace en cualquier momento para volver a descargar tu contrato firmado en formato PDF A4 de alta definición.
            </div>
          </div>
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
            Este es un comprobante oficial de perfeccionamiento contractual emitido por MiamSign.
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
    const transporter = getTransporter();
    const sender = process.env.EMAIL_USER || "noreply@miam.com.pe";

    // 1. Enviar confirmación al cliente
    await transporter.sendMail({
      from: `"MiamSign - Legal" <${sender}>`,
      to: clientEmail,
      subject: `✅ Contrato Firmado y Completado: ${contractTitle} - Miam Digital Studio`,
      html: htmlContent,
    });

    // 2. Enviar notificación interna a la agencia
    await transporter.sendMail({
      from: `"MiamSign - Notificaciones" <${sender}>`,
      to: "contacto@miam.com.pe",
      subject: `🎉 Contrato Firmado por Cliente: ${clientName} - ${contractTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">¡El cliente ha firmado el contrato!</h2>
          <p><strong>Cliente:</strong> ${safeName} (${safeEmail})</p>
          <p><strong>Contrato:</strong> ${safeTitle}</p>
          <p><strong>Fecha y Hora:</strong> ${formattedDate}</p>
          <p><strong>IP Registrada:</strong> ${safeIp}</p>
          <p><a href="${safeUrl}" style="background-color: #005cb9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Contrato Firmado en MiamSign</a></p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};
