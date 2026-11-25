"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureAgencyTables, saveAgencyFile } from "@/lib/agency-db";
import {
  changeClientOwnPassword,
  clearClientSessionCookie,
  requireClientSession,
  setClientSessionCookie,
  verifyClientCredentials,
} from "@/lib/client-auth";

export async function clientLoginAction(email: string, password: string) {
  try {
    const res = await verifyClientCredentials(email, password);
    if (!res.ok || !res.account) {
      return { success: false, error: res.error || "Credenciales inválidas." };
    }

    await setClientSessionCookie({
      email: res.account.email,
      name: res.account.name,
      mustChangePassword: Boolean(res.account.must_change),
    });

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al iniciar sesión",
    };
  }
}

export async function clientLogoutAction() {
  await clearClientSessionCookie();
  return { success: true };
}

export async function clientChangePasswordAction(currentPassword: string, newPassword: string) {
  try {
    const session = await requireClientSession();
    const res = await changeClientOwnPassword({
      email: session.email,
      currentPassword,
      newPassword,
    });
    if (!res.ok) return { success: false, error: res.error };
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error actualizando clave" };
  }
}

export async function clientSaveSurveyAction(orderId: string, answers: Record<string, string>) {
  try {
    const session = await requireClientSession();
    await ensureAgencyTables();

    const ownerCheck = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM agency_orders
      WHERE id = ${orderId} AND client_email = ${session.email.toLowerCase()}
      LIMIT 1;
    `;
    if (!ownerCheck.length) {
      return { success: false, error: "No autorizado para esta orden." };
    }

    await prisma.$executeRaw`
      UPDATE agency_surveys
      SET answers_json = ${JSON.stringify(answers)}::jsonb, status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW()
      WHERE order_id = ${orderId};
    `;

    // Advance Stage 2 (Encuesta Brief) to DONE cleanly
    const today = new Date().toISOString().slice(0, 10);
    await prisma.$executeRaw`
      UPDATE agency_stages
      SET
        status = 'DONE',
        completed_at = COALESCE(completed_at, ${today}),
        deliverable_note = 'Ya hecho: Encuesta Brief respondida por el cliente.'
      WHERE order_id = ${orderId} AND sort_order = 2;
    `;

    await prisma.$executeRaw`
      UPDATE agency_stages
      SET status = 'IN_PROGRESS'
      WHERE order_id = ${orderId} AND sort_order = 3 AND status = 'PENDING';
    `;

    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error guardando encuesta" };
  }
}

export async function clientUploadFileAction(formData: FormData) {
  try {
    const session = await requireClientSession();
    await ensureAgencyTables();

    const orderId = String(formData.get("orderId") || "").trim();
    const file = formData.get("file");

    const ownerCheck = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM agency_orders
      WHERE id = ${orderId} AND client_email = ${session.email.toLowerCase()}
      LIMIT 1;
    `;
    if (!ownerCheck.length) {
      return { success: false, error: "No autorizado para esta orden." };
    }

    if (!file || !(file instanceof File)) {
      return { success: false, error: "Selecciona un archivo para subir." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await saveAgencyFile({
      orderId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
      uploadedBy: "CLIENT",
      category: "INSUMO_CLIENTE",
      pinnedForever: false,
    });

    revalidatePath("/portal");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error subiendo archivo" };
  }
}
