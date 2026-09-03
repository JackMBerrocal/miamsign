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
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firma Requerida - Miam Digital Studio</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0f172a;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            border: 1px solid #334155;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            letter-spacing: 2px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: 600;
            color: #f1f5f9;
        }
        .message {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 30px;
        }
        .contract-box {
            background-color: #0f172a;
            border-left: 4px solid #7c3aed;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 35px;
        }
        .contract-title {
            font-size: 16px;
            font-weight: 600;
            color: #e2e8f0;
            margin: 0 0 5px 0;
        }
        .contract-subtitle {
            font-size: 13px;
            color: #94a3b8;
            margin: 0;
        }
        .cta-container {
            text-align: center;
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            transition: background-color 0.3s;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
        }
        .cta-button:hover {
            background-color: #2563eb;
        }
        .footer {
            background-color: #0f172a;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #334155;
        }
        .footer-legal {
            margin-top: 10px;
            font-size: 11px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MIAM DIGITAL STUDIO</h1>
        </div>
        <div class="content">
            <div class="greeting">Hola ${clientName},</div>
            <div class="message">
                Te informamos que Miam Digital Studio S.A.C. ha emitido un nuevo documento legal que requiere tu revisión y firma electrónica (MiamSign).
            </div>
            
            <div class="contract-box">
                <p class="contract-title">${contractTitle}</p>
                <p class="contract-subtitle">Master Services Agreement (MSA)</p>
            </div>

            <div class="cta-container">
                <a href="${contractUrl}" class="cta-button">Revisar y Firmar Documento</a>
            </div>

            <div class="message" style="font-size: 13px; color: #94a3b8; text-align: center;">
                Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:<br>
                <a href="${contractUrl}" style="color: #60a5fa; word-break: break-all; text-decoration: none; display: block; margin-top: 10px;">${contractUrl}</a>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} Miam Digital Studio S.A.C. Todos los derechos reservados.</p>
            <p class="footer-legal">
                <strong>Aviso Legal:</strong> La firma electrónica realizada a través de la plataforma MiamSign tiene plena validez jurídica de conformidad con la Ley N° 27269 (Ley de Firmas y Certificados Digitales) y el Código Civil del Perú.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"MiamSign - Legal" <noreply@miam.com.pe>',
      to: clientEmail,
      subject: `Firma Requerida: ${contractTitle}`,
      html: htmlContent,
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
