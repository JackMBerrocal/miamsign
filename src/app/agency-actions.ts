"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import {
  createFullAgencyOrder,
  deleteAgencyFileById,
  ensureAgencyTables,
  getAllAgencyOrdersAdmin,
  purgeExpiredAgencyFiles,
  saveAgencyFile,
} from "@/lib/agency-db";
import { resetClientPasswordByAdmin } from "@/lib/client-auth";
import { SurveyQuestion } from "@/lib/agency-presets";

export async function getAgencyWorkspaceAction() {
  try {
    await requireAdminSession();
    const data = await getAllAgencyOrdersAdmin();
    return {
      success: true,
      ...data,
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error cargando datos",
      orders: [],
      stages: [],
      files: [],
      surveys: [],
      blobConfigured: false,
    };
  }
}

export async function createManualPurchaseAction(input: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocument?: string;
  clientAddress?: string;
  razonSocial?: string;
  serviceName: string;
  contractFamily: "BRANDING" | "WEB" | "MIAMBOT";
  totalPen: number;
  paidPen: number;
  totalUsdMonthly?: number;
  paidUsd?: number;
  paymentMode: "50_50" | "100_UPFRONT" | "MONTHLY" | "MIXED";
  paymentMethod: string;
  operationCode?: string;
  sunatType: "BOLETA" | "FACTURA";
  sunatNumber?: string;
  deliveryTime?: string;
  notes?: string;
  customInitialPassword?: string;
  sendEmails?: boolean;
}) {
  try {
    await requireAdminSession();
    const balancePen = Math.max(0, Number((input.totalPen - input.paidPen).toFixed(2)));
    const result = await createFullAgencyOrder({
      source: "MANUAL",
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      clientDocument: input.clientDocument,
      clientAddress: input.clientAddress,
      razonSocial: input.razonSocial,
      serviceName: input.serviceName,
      contractFamily: input.contractFamily,
      deliveryTime: input.deliveryTime,
      totalPen: input.totalPen,
      paidPen: input.paidPen,
      balancePen,
      totalUsdMonthly: input.totalUsdMonthly || 0,
      paidUsd: input.paidUsd || 0,
      paymentMode: input.paymentMode,
      paymentMethod: input.paymentMethod,
      operationCode: input.operationCode,
      paymentStatus: balancePen <= 0 ? "PAID_100" : input.paidPen > 0 ? "PAID_50" : "PENDING_VERIFY",
      sunatType: input.sunatType,
      sunatNumber: input.sunatNumber,
      notes: input.notes,
      customInitialPassword: input.customInitialPassword,
      sendEmails: input.sendEmails ?? true,
    });

    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true as const, ...result };
  } catch (error: unknown) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "No se pudo registrar la compra",
    };
  }
}

export async function updateAgencyOrderPaymentAction(params: {
  orderId: string;
  paidPen: number;
  balancePen: number;
  paymentStatus: "PENDING_VERIFY" | "PAID_50" | "PAID_100";
  sunatType?: string;
  sunatNumber?: string;
  deliveryDueAt?: string;
}) {
  try {
    await requireAdminSession();
    await ensureAgencyTables();
    const dueVal = params.deliveryDueAt ? new Date(params.deliveryDueAt) : null;
    await prisma.$executeRaw`
      UPDATE agency_orders
      SET
        paid_pen = ${Number(params.paidPen || 0)},
        balance_pen = ${Math.max(0, Number(params.balancePen || 0))},
        payment_status = ${params.paymentStatus},
        sunat_type = COALESCE(${params.sunatType || null}, sunat_type),
        sunat_number = COALESCE(${params.sunatNumber?.trim() || null}, sunat_number),
        delivery_due_at = COALESCE(${dueVal}, delivery_due_at),
        updated_at = NOW()
      WHERE id = ${params.orderId};
    `;
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error actualizando orden" };
  }
}

export async function upsertProjectStageAction(params: {
  stageId?: string;
  orderId: string;
  sortOrder: number;
  title: string;
  description?: string;
  status: "DONE" | "IN_PROGRESS" | "PENDING";
  dueDate?: string;
  completedAt?: string | null;
  deliverableNote?: string;
}) {
  try {
    await requireAdminSession();
    await ensureAgencyTables();
    const id = params.stageId || crypto.randomUUID();
    const completed =
      params.status === "DONE"
        ? params.completedAt || new Date().toISOString().slice(0, 10)
        : null;

    await prisma.$executeRaw`
      INSERT INTO agency_stages (id, order_id, sort_order, title, description, status, due_date, completed_at, deliverable_note)
      VALUES (
        ${id}, ${params.orderId}, ${Number(params.sortOrder || 1)}, ${params.title.trim()},
        ${params.description?.trim() || null}, ${params.status}, ${params.dueDate?.trim() || null},
        ${completed}, ${params.deliverableNote?.trim() || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        sort_order = EXCLUDED.sort_order,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        due_date = EXCLUDED.due_date,
        completed_at = EXCLUDED.completed_at,
        deliverable_note = EXCLUDED.deliverable_note;
    `;
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true, id };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error guardando etapa" };
  }
}

export async function deleteProjectStageAction(stageId: string) {
  try {
    await requireAdminSession();
    await ensureAgencyTables();
    await prisma.$executeRaw`DELETE FROM agency_stages WHERE id = ${stageId};`;
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error eliminando etapa" };
  }
}

export async function uploadAdminFileAction(formData: FormData) {
  try {
    await requireAdminSession();
    const orderId = String(formData.get("orderId") || "").trim();
    const category = String(formData.get("category") || "ENTREGABLE_FINAL").trim();
    const pinnedForever = String(formData.get("pinnedForever") || "false") === "true";
    const file = formData.get("file");

    if (!orderId) return { success: false, error: "Falta orden de destino." };
    if (!file || !(file instanceof File)) {
      return { success: false, error: "Selecciona un archivo válido." };
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    await saveAgencyFile({
      orderId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
      uploadedBy: "ADMIN",
      category,
      pinnedForever,
    });

    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error subiendo archivo" };
  }
}

export async function addExternalFileLinkAction(params: {
  orderId: string;
  fileName: string;
  externalUrl: string;
  category: string;
  pinnedForever?: boolean;
}) {
  try {
    await requireAdminSession();
    await saveAgencyFile({
      orderId: params.orderId,
      fileName: params.fileName,
      mimeType: "text/uri-list",
      externalUrl: params.externalUrl,
      uploadedBy: "ADMIN",
      category: params.category,
      pinnedForever: params.pinnedForever ?? true,
    });
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error guardando enlace" };
  }
}

export async function togglePinFileAction(fileId: string, pinnedForever: boolean) {
  try {
    await requireAdminSession();
    await ensureAgencyTables();
    const expiresAt = pinnedForever ? null : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    await prisma.$executeRaw`
      UPDATE agency_files
      SET pinned_forever = ${pinnedForever}, expires_at = ${expiresAt}
      WHERE id = ${fileId};
    `;
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error actualizando retención" };
  }
}

export async function deleteAgencyFileAction(fileId: string) {
  try {
    await requireAdminSession();
    await deleteAgencyFileById(fileId);
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error eliminando archivo" };
  }
}

export async function purgeExpiredFilesAction() {
  try {
    await requireAdminSession();
    const purgedCount = await purgeExpiredAgencyFiles();
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true, purgedCount };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error depurando archivos" };
  }
}

export async function updateSurveyTemplateAction(params: {
  orderId: string;
  title: string;
  questions: SurveyQuestion[];
}) {
  try {
    await requireAdminSession();
    await ensureAgencyTables();
    await prisma.$executeRaw`
      UPDATE agency_surveys
      SET
        title = ${params.title.trim()},
        questions_json = ${JSON.stringify(params.questions)}::jsonb,
        updated_at = NOW()
      WHERE order_id = ${params.orderId};
    `;
    revalidatePath("/");
    revalidatePath("/portal");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error guardando encuesta" };
  }
}

export async function resetClientPasswordAction(clientEmail: string, customPassword?: string) {
  try {
    await requireAdminSession();
    const res = await resetClientPasswordByAdmin(clientEmail, customPassword);
    if (!res.ok) return { success: false, error: res.error };
    revalidatePath("/");
    return { success: true, newPassword: res.newPassword };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error restableciendo clave" };
  }
}
