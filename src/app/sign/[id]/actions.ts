"use server";
import prisma from "@/lib/prisma";

export async function getContract(id: string) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { company: true },
    });
    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { headers } from "next/headers";
import { sendSignedConfirmationEmail } from "@/lib/email";

export async function signContract(id: string, signatureBase64: string) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    let clientIp = forwardedFor ? forwardedFor.split(',')[0] : "IP Desconocida";

    if (clientIp === "IP Desconocida") {
      const realIp = headersList.get("x-real-ip");
      if (realIp) clientIp = realIp;
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signatureData: signatureBase64,
        clientIp: clientIp,
      },
    });

    // Enviar correo de confirmación de firma al cliente y a Miam
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://firmas.miam.com.pe";
    const contractUrl = `${baseUrl}/sign/${contract.id}`;
    
    // Ejecución asíncrona segura para no demorar la respuesta al cliente
    sendSignedConfirmationEmail(
      contract.clientName || "Cliente",
      contract.clientEmail || "",
      contract.title || "Contrato de Servicios",
      contractUrl,
      contract.signedAt || new Date(),
      clientIp
    ).catch(err => console.error("Error sending sign confirmation email:", err));

    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
