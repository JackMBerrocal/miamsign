import { NextRequest, NextResponse } from "next/server";
import { createFullAgencyOrder } from "@/lib/agency-db";

const ALLOWED_ORIGINS = [
  "https://miam.com.pe",
  "https://www.miam.com.pe",
  "https://firmas.miam.com.pe",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin))
      ? origin
      : "https://miam.com.pe";

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const body = await req.json();

    const clientName = String(body.clientName || "").trim();
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
    if (!clientName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { success: false, error: "Nombre y correo válidos son obligatorios." },
        { status: 400, headers }
      );
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const serviceName =
      String(body.serviceName || "").trim() ||
      (items.length ? items.map((i: { name?: string }) => i.name).filter(Boolean).join(" + ") : "Servicio Digital Miam");

    const rawFamily = String(body.contractFamily || "BRANDING").toUpperCase();
    const contractFamily =
      rawFamily === "WEB" || rawFamily === "MIAMBOT" ? rawFamily : "BRANDING";

    const result = await createFullAgencyOrder({
      source: "WEB_AUTO",
      clientName,
      clientEmail,
      clientPhone: body.clientPhone ? String(body.clientPhone) : undefined,
      clientDocument: body.clientDocument ? String(body.clientDocument) : undefined,
      clientAddress: body.clientAddress ? String(body.clientAddress) : undefined,
      razonSocial: body.razonSocial ? String(body.razonSocial) : undefined,
      serviceName,
      serviceCategory: body.serviceCategory ? String(body.serviceCategory) : undefined,
      contractFamily,
      deliverables: Array.isArray(body.deliverables) ? body.deliverables.map(String) : undefined,
      deliveryTime: body.deliveryTime ? String(body.deliveryTime) : undefined,
      items,
      totalPen: Number(body.totalPen || 0),
      paidPen: Number(body.paidPen || 0),
      balancePen: Number(body.balancePen || 0),
      totalUsdMonthly: Number(body.totalUsdMonthly || 0),
      paidUsd: Number(body.paidUsd || 0),
      paymentMode:
        body.paymentMode === "100_UPFRONT" || body.paymentMode === "MONTHLY" || body.paymentMode === "MIXED"
          ? body.paymentMode
          : "50_50",
      paymentMethod: String(body.paymentMethod || "YAPE").toUpperCase(),
      operationCode: body.operationCode ? String(body.operationCode) : undefined,
      paymentStatus:
        Number(body.balancePen || 0) <= 0 && (Number(body.paidPen || 0) > 0 || Number(body.paidUsd || 0) > 0)
          ? "PAID_100"
          : "PAID_50",
      sunatType: String(body.sunatType || "BOLETA").toUpperCase() === "FACTURA" ? "FACTURA" : "BOLETA",
      notes: body.goal ? `Objetivo del cliente: ${String(body.goal)}` : undefined,
      sendEmails: true,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error registrando la orden";
    console.error("POST /api/agency/orders error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500, headers });
  }
}
