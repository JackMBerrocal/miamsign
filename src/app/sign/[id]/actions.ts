"use server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { sendSignedConfirmationEmail } from "@/lib/email";

const PUBLIC_CONTRACT_SELECT = {
  id: true,
  title: true,
  content: true,
  type: true,
  status: true,
  clientName: true,
  clientEmail: true,
  clientDocument: true,
  paymentAmount: true,
  paymentType: true,
  createdAt: true,
  signedAt: true,
  signatureData: true,
  clientIp: true,
} as const;

export async function getContract(id: string) {
  try {
    if (!id || typeof id !== "string" || id.length > 80) {
      return { success: false, error: "Identificador de contrato inválido." };
    }
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: PUBLIC_CONTRACT_SELECT,
    });
    if (!contract) {
      return { success: false, error: "Contrato no encontrado." };
    }
    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signContract(id: string, signatureBase64: string, acceptedTerms = false) {
  try {
    if (!acceptedTerms) {
      return {
        success: false,
        error: "Debes marcar la casilla de aceptación expresa antes de adoptar tu firma.",
      };
    }

    if (
      !signatureBase64 ||
      typeof signatureBase64 !== "string" ||
      !signatureBase64.startsWith("data:image/png;base64,") ||
      signatureBase64.length > 500_000
    ) {
      return { success: false, error: "Formato de firma inválido." };
    }

    const existing = await prisma.contract.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      return { success: false, error: "Documento no encontrado." };
    }
    if (existing.status === "SIGNED") {
      return { success: false, error: "Este contrato ya fue firmado anteriormente y no puede modificarse." };
    }

    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    let clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "";

    if (!clientIp) {
      const realIp = headersList.get("x-real-ip");
      if (realIp) clientIp = realIp.trim();
    }
    if (!clientIp) clientIp = "Registrada por servidor";

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signatureData: signatureBase64,
        clientIp,
      },
      select: PUBLIC_CONTRACT_SELECT,
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://firmas.miam.com.pe").replace(/\/$/, "");
    const contractUrl = `${baseUrl}/sign/${contract.id}`;

    sendSignedConfirmationEmail(
      contract.clientName || "Cliente",
      contract.clientEmail || "",
      contract.title || "Contrato de Servicios",
      contractUrl,
      contract.signedAt || new Date(),
      clientIp,
      {
        clientDocument: contract.clientDocument || undefined,
        paymentAmount: contract.paymentAmount || undefined,
        paymentType: contract.paymentType || undefined,
        content: contract.content || undefined,
      }
    ).catch((err) => console.error("Error sending sign confirmation email:", err));

    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
