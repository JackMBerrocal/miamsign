/**
 * POST /api/agency/create-contract
 *
 * Endpoint interno protegido por secreto compartido (AGENCY_INTERNAL_SECRET).
 * Lo llama api-culqi-charge.php y api-agency-orders.php en Ferozo
 * justo después de confirmar el pago.
 *
 * Crea el contrato real en Prisma/Postgres, genera las etapas y encuesta,
 * envía los 2 correos (recibo + invitación a firmar) y devuelve la URL
 * real de firma `/sign/<contract-id>`.
 *
 * Request body (JSON):
 *   clientName, clientEmail, clientPhone?, clientDocument?,
 *   clientAddress?, razonSocial?, serviceName, contractFamily,
 *   deliverables?, deliveryTime?, items?,
 *   totalPen, paidPen, balancePen, totalUsdMonthly?, paidUsd?,
 *   paymentMode, paymentMethod, operationCode?, paymentStatus?,
 *   sunatType, sunatNumber?, orderCode?, notes?
 *
 * Response:
 *   { success, contractId, contractUrl, signingUrl, orderCode,
 *     portalUrl, initialPassword, receiptEmailSent, contractEmailSent }
 */

import { NextRequest, NextResponse } from "next/server";
import { createFullAgencyOrder } from "@/lib/agency-db";

/* ── Secreto compartido ───────────────────────────────────────────────────
   Debe coincidir con AGENCY_INTERNAL_SECRET en agency_core.php (Ferozo)
   y en las variables de entorno de Vercel.
─────────────────────────────────────────────────────────────────────────── */
const INTERNAL_SECRET = process.env.AGENCY_INTERNAL_SECRET ?? "";

function unauthorized() {
  return NextResponse.json(
    { success: false, error: "No autorizado." },
    { status: 401 }
  );
}

/* Solo llamadas servidor-a-servidor; no necesitamos CORS */
export async function POST(req: NextRequest) {
  /* ── 1. Verificar secreto ─────────────────────────────────────────────── */
  if (!INTERNAL_SECRET) {
    console.error("[create-contract] AGENCY_INTERNAL_SECRET no configurado en Vercel.");
    return NextResponse.json(
      { success: false, error: "Configuración interna incompleta." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("x-agency-secret") ?? "";
  if (authHeader !== INTERNAL_SECRET) {
    console.warn("[create-contract] Intento de acceso con secreto inválido.");
    return unauthorized();
  }

  /* ── 2. Parsear body ──────────────────────────────────────────────────── */
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido." },
      { status: 400 }
    );
  }

  /* Campos obligatorios */
  const clientName  = String(body.clientName  ?? "").trim();
  const clientEmail = String(body.clientEmail ?? "").trim().toLowerCase();
  const serviceName = String(body.serviceName ?? "").trim();

  if (!clientName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) || !serviceName) {
    return NextResponse.json(
      { success: false, error: "clientName, clientEmail y serviceName son obligatorios." },
      { status: 400 }
    );
  }

  /* Familia de contrato — validar */
  const rawFamily = String(body.contractFamily ?? "BRANDING").toUpperCase();
  const contractFamily: "BRANDING" | "WEB" | "MIAMBOT" =
    rawFamily === "WEB" || rawFamily === "MIAMBOT" ? rawFamily : "BRANDING";

  /* Modo de pago — validar */
  const rawMode = String(body.paymentMode ?? "50_50").toUpperCase();
  const paymentMode: "50_50" | "100_UPFRONT" | "MONTHLY" | "MIXED" =
    rawMode === "100_UPFRONT" || rawMode === "MONTHLY" || rawMode === "MIXED"
      ? rawMode
      : "50_50";

  /* Estado de pago — si vino de Culqi ya está pagado */
  const rawStatus = String(body.paymentStatus ?? "").toUpperCase();
  const paymentStatus =
    rawStatus === "PAID_100" || rawStatus === "PAID_50" || rawStatus === "PENDING_VERIFY"
      ? (rawStatus as "PAID_100" | "PAID_50" | "PENDING_VERIFY")
      : Number(body.balancePen ?? 0) <= 0 && Number(body.paidPen ?? 0) > 0
        ? "PAID_100"
        : "PAID_50";

  /* Tipo SUNAT */
  const sunatType: "BOLETA" | "FACTURA" =
    String(body.sunatType ?? "BOLETA").toUpperCase() === "FACTURA" ? "FACTURA" : "BOLETA";

  /* ── 3. Crear la orden completa en MiamSign (Postgres + emails) ─────────── */
  try {
    const result = await createFullAgencyOrder({
      source: "WEB_AUTO",
      clientName,
      clientEmail,
      clientPhone:    body.clientPhone    ? String(body.clientPhone)    : undefined,
      clientDocument: body.clientDocument ? String(body.clientDocument) : undefined,
      clientAddress:  body.clientAddress  ? String(body.clientAddress)  : undefined,
      razonSocial:    body.razonSocial    ? String(body.razonSocial)    : undefined,
      serviceName,
      serviceCategory: body.serviceCategory ? String(body.serviceCategory) : undefined,
      contractFamily,
      deliverables: Array.isArray(body.deliverables)
        ? (body.deliverables as unknown[]).map(String)
        : undefined,
      deliveryTime: body.deliveryTime ? String(body.deliveryTime) : undefined,
      items: Array.isArray(body.items) ? (body.items as Array<{ id?: string; name: string; price?: number }>) : undefined,
      totalPen:         Number(body.totalPen        ?? 0),
      paidPen:          Number(body.paidPen         ?? 0),
      balancePen:       Number(body.balancePen      ?? 0),
      totalUsdMonthly:  Number(body.totalUsdMonthly ?? 0),
      paidUsd:          Number(body.paidUsd         ?? 0),
      paymentMode,
      paymentMethod: String(body.paymentMethod ?? "CARD").toUpperCase(),
      operationCode: body.operationCode ? String(body.operationCode) : undefined,
      paymentStatus,
      sunatType,
      sunatNumber: body.sunatNumber ? String(body.sunatNumber) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      sendEmails: true,
    });

    return NextResponse.json(
      {
        success:            true,
        contractId:         result.contractId,
        contractUrl:        result.contractUrl,
        signingUrl:         result.contractUrl,   // alias semántico
        orderCode:          result.orderCode,
        portalUrl:          result.portalUrl,
        initialPassword:    result.initialPassword,
        isNewAccount:       result.isNewAccount,
        receiptEmailSent:   result.receiptEmailSent,
        contractEmailSent:  result.contractEmailSent,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno al crear el contrato.";
    console.error("[create-contract] Error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
