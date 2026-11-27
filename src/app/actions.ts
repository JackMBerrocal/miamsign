"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendContractEmail } from "@/lib/email";
import { ensureContractSchema } from "@/lib/contract-schema";
import {
  clearAdminSessionCookie,
  requireAdminSession,
  setAdminSessionCookie,
  updateAdminDisplayName,
  updateAdminPasswordAndProfile,
  verifyAdminCredentials,
} from "@/lib/auth";

function getPortalBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return "https://firmas.miam.com.pe";
  return "http://localhost:3000";
}

export async function loginAdminAction(email: string, password: string) {
  const check = await verifyAdminCredentials(email, password);
  if (!check.ok) {
    return { success: false, error: check.error || "Credenciales inválidas." };
  }
  await setAdminSessionCookie({
    email,
    displayName: check.displayName || "Jack M. Berrocal",
    mustChangePassword: Boolean(check.mustChangePassword),
  });
  revalidatePath("/");
  return { success: true, mustChangePassword: Boolean(check.mustChangePassword) };
}

export async function logoutAdminAction() {
  await clearAdminSessionCookie();
  revalidatePath("/");
  return { success: true };
}

export async function changeAdminPasswordAction(
  currentPassword: string,
  newPassword: string,
  displayName?: string
) {
  try {
    const session = await requireAdminSession();
    const res = await updateAdminPasswordAndProfile({
      email: session.email,
      currentPassword,
      newPassword,
      displayName: displayName || session.displayName,
    });
    if (!res.ok) {
      return { success: false, error: res.error };
    }
    revalidatePath("/");
    return { success: true, displayName: res.displayName };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminProfileAction(displayName: string) {
  try {
    const session = await requireAdminSession();
    const res = await updateAdminDisplayName(session.email, displayName);
    if (!res.ok) {
      return { success: false, error: res.error };
    }
    revalidatePath("/");
    return { success: true, displayName: res.displayName };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContract(data: {
  title: string;
  content: string;
  type: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocument?: string;
  clientAddress?: string;
  paymentAmount?: string;
  paymentType?: string;
  companyId: string;
}) {
  try {
    await requireAdminSession();
    await ensureContractSchema();

    let company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: data.companyId,
          name: "Miam Digital Studio",
          plan: "premium",
        },
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
        paymentAmount: data.paymentAmount,
        paymentType: data.paymentType,
        companyId: data.companyId,
        status: "SENT",
      },
    });

    const contractUrl = `${getPortalBaseUrl()}/sign/${contract.id}`;
    const emailSent = await sendContractEmail(data.clientName, data.clientEmail, data.title, contractUrl, {
      clientDocument: data.clientDocument,
      paymentAmount: data.paymentAmount,
      paymentType: data.paymentType,
      content: data.content,
    });

    revalidatePath("/");
    revalidatePath("/dashboard/miamsign");
    return { success: true, contract, emailSent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getContracts(companyId: string) {
  try {
    await requireAdminSession();
    await ensureContractSchema();
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
    await requireAdminSession();
    await prisma.contract.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/dashboard/miamsign");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContractClient(
  id: string,
  clientName: string,
  clientEmail: string,
  clientPhone?: string,
  clientDocument?: string,
  clientAddress?: string
) {
  try {
    await requireAdminSession();
    await ensureContractSchema();
    await prisma.contract.update({
      where: { id },
      data: { clientName, clientEmail, clientPhone, clientDocument, clientAddress },
    });
    revalidatePath("/");
    revalidatePath("/dashboard/miamsign");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resendContractEmail(id: string) {
  try {
    await requireAdminSession();
    await ensureContractSchema();
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new Error("Contrato no encontrado");

    const contractUrl = `${getPortalBaseUrl()}/sign/${contract.id}`;
    const sent = await sendContractEmail(
      contract.clientName || "",
      contract.clientEmail || "",
      contract.title || "",
      contractUrl,
      {
        clientDocument: contract.clientDocument || undefined,
        paymentAmount: contract.paymentAmount || undefined,
        paymentType: contract.paymentType || undefined,
        content: contract.content || undefined,
      }
    );
    if (!sent) throw new Error("No se pudo enviar el correo. Verifica EMAIL_PASS en Vercel.");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
