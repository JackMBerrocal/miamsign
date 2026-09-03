"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { sendContractEmail } from "@/lib/email";

export async function createContract(data: {
  title: string;
  content: string;
  type: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocument?: string;
  clientAddress?: string;
  companyId: string;
}) {
  try {
    // Asegurarse de que la compañía exista
    let company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: data.companyId,
          name: "Miam Digital Studio",
          plan: "premium"
        }
      });
    }

    const contract = await prisma.contract.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientDocument: data.clientDocument,
        clientAddress: data.clientAddress,
        companyId: data.companyId,
        status: "SENT",
      },
    });
    
    // Enviar correo electrónico
    // NEXT_PUBLIC_BASE_URL no está en .env, así que usaremos el localhost para dev o el origin para prod
    // Para simplificar, asumimos el dominio de producción
    const baseUrl = process.env.VERCEL_URL ? `https://firmas.miam.com.pe` : `http://localhost:3000`;
    const contractUrl = `${baseUrl}/sign/${contract.id}`;
    
    await sendContractEmail(data.clientName, data.clientEmail, data.title, contractUrl);

    revalidatePath("/dashboard/miamsign");
    return { success: true, contract };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getContracts(companyId: string) {
  try {
    const contracts = await prisma.contract.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, contracts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteContract(id: string) {
  try {
    await prisma.contract.delete({ where: { id } });
    revalidatePath("/dashboard/miamsign");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContractClient(id: string, clientName: string, clientEmail: string, clientPhone?: string, clientDocument?: string, clientAddress?: string) {
  try {
    await prisma.contract.update({
      where: { id },
      data: { clientName, clientEmail, clientPhone, clientDocument, clientAddress }
    });
    revalidatePath("/dashboard/miamsign");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resendContractEmail(id: string) {
  try {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new Error("Contrato no encontrado");

    const baseUrl = process.env.VERCEL_URL ? `https://firmas.miam.com.pe` : `http://localhost:3000`;
    const contractUrl = `${baseUrl}/sign/${contract.id}`;
    
    await sendContractEmail(contract.clientName || "", contract.clientEmail || "", contract.title || "", contractUrl);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
