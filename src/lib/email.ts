import nodemailer from "nodemailer";
import {
  buildContractInviteEmailHtml,
  buildContractSignedEmailHtml,
  ContractEmailMeta,
  escapeHtml,
} from "@/lib/email-templates";

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
  contractUrl: string,
  meta?: ContractEmailMeta
) => {
  const htmlContent = buildContractInviteEmailHtml({
    clientName,
    contractTitle,
    contractUrl,
    ...meta,
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
  clientIp: string,
  meta?: ContractEmailMeta
) => {
  const safeName = escapeHtml(clientName);
  const safeEmail = escapeHtml(clientEmail);
  const safeTitle = escapeHtml(contractTitle);
  const safeUrl = escapeHtml(contractUrl);
  const safeIp = escapeHtml(clientIp);
  const formattedDate = new Date(signedAt).toLocaleString("es-PE", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "America/Lima",
  });

  const htmlContent = buildContractSignedEmailHtml({
    clientName,
    contractTitle,
    contractUrl,
    signedAt,
    clientIp,
    ...meta,
  });

  try {
    const transporter = getTransporter();
    const sender = process.env.EMAIL_USER || "noreply@miam.com.pe";

    await transporter.sendMail({
      from: `"MiamSign - Legal" <${sender}>`,
      to: clientEmail,
      subject: `✅ Contrato Firmado y PDF A4 Listo: ${contractTitle} - Miam Digital Studio`,
      html: htmlContent,
    });

    await transporter.sendMail({
      from: `"MiamSign - Notificaciones" <${sender}>`,
      to: "contacto@miam.com.pe",
      subject: `🎉 Contrato Firmado por Cliente: ${clientName} - ${contractTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; background: #f8fafc;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
            <div style="height: 4px; background: linear-gradient(90deg, #8A4FFF, #00E076);"></div>
            <div style="padding: 24px;">
              <h2 style="margin: 0 0 12px 0; color: #059669; font-size: 20px;">¡El cliente ha firmado el contrato!</h2>
              <p style="margin: 4px 0;"><strong>Cliente:</strong> ${safeName} (${safeEmail})</p>
              <p style="margin: 4px 0;"><strong>Contrato:</strong> ${safeTitle}</p>
              <p style="margin: 4px 0;"><strong>Fecha y Hora:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0 18px 0;"><strong>IP Registrada:</strong> ${safeIp}</p>
              <a href="${safeUrl}" style="background-color: #0b0f19; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 9999px; display: inline-block; font-weight: 700; font-size: 13px;">Ver Contrato Firmado (A4) &rarr;</a>
            </div>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};
