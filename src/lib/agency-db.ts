import crypto from "crypto";
import { del, put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import {
  buildDefaultStages,
  buildDefaultSurvey,
  SurveyQuestion,
} from "@/lib/agency-presets";
import {
  ensureClientAccountsTable,
  upsertPermanentClientAccount,
} from "@/lib/client-auth";
import { generateTemplate } from "@/app/templates";
import { sendContractEmail, sendOrderReceiptEmail } from "@/lib/email";

export const AGENCY_COMPANY_ID = "63d76e71-460d-4560-af33-b1d5bf59cc28";

export interface AgencyOrderRecord {
  id: string;
  order_code: string;
  source: string;
  client_email: string;
  client_name: string;
  client_document: string | null;
  client_phone: string | null;
  client_address: string | null;
  razon_social: string | null;
  service_name: string;
  service_category: string | null;
  contract_family: string;
  items_json: unknown;
  total_pen: number;
  paid_pen: number;
  balance_pen: number;
  total_usd_monthly: number;
  paid_usd: number;
  payment_mode: string;
  payment_method: string;
  operation_code: string | null;
  payment_status: string;
  sunat_type: string;
  sunat_number: string | null;
  contract_id: string | null;
  delivery_due_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  initial_code?: string | null;
  contract_status?: string | null;
}

export interface AgencyStageRecord {
  id: string;
  order_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  status: "DONE" | "IN_PROGRESS" | "PENDING";
  due_date: string | null;
  completed_at: string | null;
  deliverable_note: string | null;
}

export interface AgencyFileRecord {
  id: string;
  order_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: "ADMIN" | "CLIENT";
  category: string;
  storage_kind: "VERCEL_BLOB" | "EXTERNAL_URL" | "DB_INLINE";
  storage_url: string | null;
  retention_days: number;
  expires_at: string | null;
  pinned_forever: boolean;
  created_at: string;
}

export interface AgencySurveyRecord {
  id: string;
  order_id: string;
  title: string;
  questions_json: SurveyQuestion[];
  answers_json: Record<string, string>;
  status: "PENDING" | "SUBMITTED";
  submitted_at: string | null;
  updated_at: string;
}

export function getPortalBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://firmas.miam.com.pe").replace(/\/$/, "");
}

let tablesReadyPromise: Promise<void> | null = null;

export async function ensureAgencyTables(): Promise<void> {
  if (tablesReadyPromise) return tablesReadyPromise;
  tablesReadyPromise = (async () => {
    await ensureClientAccountsTable();

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS agency_order_counter (
        year INT PRIMARY KEY,
        last_seq INT NOT NULL DEFAULT 0
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS agency_orders (
        id TEXT PRIMARY KEY,
        order_code TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL DEFAULT 'MANUAL',
        client_email TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_document TEXT,
        client_phone TEXT,
        client_address TEXT,
        razon_social TEXT,
        service_name TEXT NOT NULL,
        service_category TEXT,
        contract_family TEXT NOT NULL DEFAULT 'BRANDING',
        items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        total_pen DOUBLE PRECISION NOT NULL DEFAULT 0,
        paid_pen DOUBLE PRECISION NOT NULL DEFAULT 0,
        balance_pen DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_usd_monthly DOUBLE PRECISION NOT NULL DEFAULT 0,
        paid_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        payment_mode TEXT NOT NULL DEFAULT '50_50',
        payment_method TEXT NOT NULL DEFAULT 'YAPE',
        operation_code TEXT,
        payment_status TEXT NOT NULL DEFAULT 'PAID_50',
        sunat_type TEXT NOT NULL DEFAULT 'BOLETA',
        sunat_number TEXT,
        contract_id TEXT,
        delivery_due_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_agency_orders_client_email
      ON agency_orders (client_email, created_at DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS agency_stages (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES agency_orders(id) ON DELETE CASCADE,
        sort_order INT NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        due_date TEXT,
        completed_at TEXT,
        deliverable_note TEXT
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS agency_surveys (
        id TEXT PRIMARY KEY,
        order_id TEXT UNIQUE NOT NULL REFERENCES agency_orders(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'PENDING',
        submitted_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS agency_files (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES agency_orders(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        size_bytes INT NOT NULL DEFAULT 0,
        uploaded_by TEXT NOT NULL DEFAULT 'ADMIN',
        category TEXT NOT NULL DEFAULT 'ENTREGABLE_FINAL',
        storage_kind TEXT NOT NULL DEFAULT 'DB_INLINE',
        storage_url TEXT,
        inline_data BYTEA,
        retention_days INT NOT NULL DEFAULT 180,
        expires_at TIMESTAMPTZ,
        pinned_forever BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  })().catch((err) => {
    tablesReadyPromise = null;
    throw err;
  });

  return tablesReadyPromise;
}

export async function generateNextOrderCode(): Promise<string> {
  await ensureAgencyTables();
  const year = new Date().getFullYear();
  const rows = await prisma.$queryRaw<Array<{ last_seq: number }>>`
    INSERT INTO agency_order_counter (year, last_seq)
    VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET last_seq = agency_order_counter.last_seq + 1
    RETURNING last_seq;
  `;
  const seq = Number(rows[0]?.last_seq || 1);
  return `MIAM-${year}-${String(seq).padStart(4, "0")}`;
}

export interface CreateAgencyOrderInput {
  source: "WEB_AUTO" | "MANUAL";
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocument?: string;
  clientAddress?: string;
  razonSocial?: string;
  serviceName: string;
  serviceCategory?: string;
  contractFamily: "BRANDING" | "WEB" | "MIAMBOT";
  deliverables?: string[];
  deliveryTime?: string;
  items?: Array<{ id?: string; name: string; price?: number; currency?: string; rule?: string }>;
  totalPen: number;
  paidPen: number;
  balancePen: number;
  totalUsdMonthly?: number;
  paidUsd?: number;
  paymentMode: "50_50" | "100_UPFRONT" | "MONTHLY" | "MIXED";
  paymentMethod: string;
  operationCode?: string;
  paymentStatus?: "PENDING_VERIFY" | "PAID_50" | "PAID_100";
  sunatType: "BOLETA" | "FACTURA";
  sunatNumber?: string;
  notes?: string;
  customInitialPassword?: string;
  sendEmails?: boolean;
}

export async function createFullAgencyOrder(input: CreateAgencyOrderInput) {
  await ensureAgencyTables();

  const orderCode = await generateNextOrderCode();
  const orderId = crypto.randomUUID();
  const normalizedEmail = input.clientEmail.trim().toLowerCase();
  const now = new Date();

  const accountRes = await upsertPermanentClientAccount({
    email: normalizedEmail,
    name: input.clientName,
    phone: input.clientPhone,
    documentType: input.sunatType === "FACTURA" ? "RUC" : "DNI",
    documentNumber: input.clientDocument,
    razonSocial: input.razonSocial,
    address: input.clientAddress,
    customInitialPassword: input.customInitialPassword,
  });

  // Ensure Company exists for Prisma Contract foreign key
  let company = await prisma.company.findUnique({ where: { id: AGENCY_COMPANY_ID } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        id: AGENCY_COMPANY_ID,
        name: "Miam Digital Studio",
        plan: "premium",
      },
    });
  }

  const deliverablesText =
    input.deliverables && input.deliverables.length
      ? input.deliverables.map((d) => `✔️ ${d}`).join("\n\n")
      : `✔️ Ejecución integral de ${input.serviceName}\n\n✔️ Rondas de revisión y entrega digital en Portal Miam`;

  const paymentAmountLabel =
    input.totalPen > 0 && (input.totalUsdMonthly || 0) > 0
      ? `${input.totalPen.toFixed(2)} PEN + ${(input.totalUsdMonthly || 0).toFixed(2)} USD/mes`
      : input.totalPen > 0
        ? `${input.totalPen.toFixed(2)} PEN`
        : `${(input.totalUsdMonthly || 0).toFixed(2)} USD / mes`;

  const paymentTypeForTemplate =
    input.paymentMode === "MONTHLY"
      ? "MONTHLY"
      : input.paymentMode === "100_UPFRONT"
        ? "100_UPFRONT"
        : "50_50";

  const contractContent = generateTemplate(
    input.contractFamily,
    input.razonSocial?.trim() || input.clientName.trim(),
    input.clientDocument?.trim() || "POR VALIDAR",
    input.clientAddress?.trim() || "Lima, Perú",
    paymentAmountLabel,
    paymentTypeForTemplate,
    `${input.serviceName} (${orderCode})`,
    deliverablesText,
    input.deliveryTime || "Según cronograma de etapas en Portal Cliente"
  );

  const contractTitle = `Contrato ${input.serviceName} (${orderCode}) - Miam`;
  const contract = await prisma.contract.create({
    data: {
      title: contractTitle,
      content: contractContent,
      type: input.contractFamily,
      clientName: input.clientName.trim(),
      clientEmail: normalizedEmail,
      clientPhone: input.clientPhone?.trim() || undefined,
      clientDocument: input.clientDocument?.trim() || undefined,
      clientAddress: input.clientAddress?.trim() || undefined,
      paymentAmount: paymentAmountLabel,
      paymentType: paymentTypeForTemplate,
      companyId: AGENCY_COMPANY_ID,
      status: "SENT",
    },
  });

  const paymentStatus =
    input.paymentStatus ||
    (input.balancePen <= 0 ? "PAID_100" : input.paidPen > 0 ? "PAID_50" : "PENDING_VERIFY");

  const defaultDue = new Date(now.getTime());
  defaultDue.setDate(defaultDue.getDate() + (input.contractFamily === "MIAMBOT" ? 4 : 18));

  await prisma.$executeRaw`
    INSERT INTO agency_orders (
      id, order_code, source, client_email, client_name, client_document, client_phone,
      client_address, razon_social, service_name, service_category, contract_family,
      items_json, total_pen, paid_pen, balance_pen, total_usd_monthly, paid_usd,
      payment_mode, payment_method, operation_code, payment_status,
      sunat_type, sunat_number, contract_id, delivery_due_at, notes, created_at, updated_at
    )
    VALUES (
      ${orderId}, ${orderCode}, ${input.source}, ${normalizedEmail}, ${input.clientName.trim()},
      ${input.clientDocument?.trim() || null}, ${input.clientPhone?.trim() || null},
      ${input.clientAddress?.trim() || null}, ${input.razonSocial?.trim() || null},
      ${input.serviceName.trim()}, ${input.serviceCategory?.trim() || null}, ${input.contractFamily},
      ${JSON.stringify(input.items || [])}::jsonb,
      ${Number(input.totalPen || 0)}, ${Number(input.paidPen || 0)}, ${Number(input.balancePen || 0)},
      ${Number(input.totalUsdMonthly || 0)}, ${Number(input.paidUsd || 0)},
      ${input.paymentMode}, ${input.paymentMethod.toUpperCase()}, ${input.operationCode?.trim() || null},
      ${paymentStatus}, ${input.sunatType}, ${input.sunatNumber?.trim() || "Por emitir"},
      ${contract.id}, ${defaultDue}, ${input.notes?.trim() || null}, NOW(), NOW()
    );
  `;

  // Seed stages
  const stages = buildDefaultStages(input.contractFamily, now, paymentStatus !== "PENDING_VERIFY");
  for (const st of stages) {
    await prisma.$executeRaw`
      INSERT INTO agency_stages (id, order_id, sort_order, title, description, status, due_date, completed_at, deliverable_note)
      VALUES (
        ${crypto.randomUUID()}, ${orderId}, ${st.sortOrder}, ${st.title}, ${st.description},
        ${st.status}, ${st.dueDate}, ${st.completedAt}, ${st.deliverableNote}
      );
    `;
  }

  // Seed survey tailored to the service
  const surveySeed = buildDefaultSurvey(input.contractFamily, input.serviceName);
  await prisma.$executeRaw`
    INSERT INTO agency_surveys (id, order_id, title, questions_json, answers_json, status, updated_at)
    VALUES (
      ${crypto.randomUUID()}, ${orderId}, ${surveySeed.title},
      ${JSON.stringify(surveySeed.questions)}::jsonb, '{}'::jsonb, 'PENDING', NOW()
    );
  `;

  const baseUrl = getPortalBaseUrl();
  const contractUrl = `${baseUrl}/sign/${contract.id}`;
  const portalUrl = `${baseUrl}/portal`;

  let receiptEmailSent = false;
  let contractEmailSent = false;

  if (input.sendEmails !== false) {
    receiptEmailSent = await sendOrderReceiptEmail({
      clientName: input.clientName.trim(),
      clientEmail: normalizedEmail,
      orderCode,
      serviceName: input.serviceName,
      paidAmountLabel:
        input.paidPen > 0
          ? `S/ ${Number(input.paidPen).toFixed(2)}${input.paidUsd ? ` + $ ${input.paidUsd.toFixed(2)} USD` : ""}`
          : `$ ${Number(input.paidUsd || 0).toFixed(2)} USD`,
      balanceLabel: input.balancePen > 0 ? `S/ ${Number(input.balancePen).toFixed(2)}` : "Liquidado (S/ 0.00)",
      paymentMethod: input.paymentMethod.toUpperCase(),
      sunatType: input.sunatType,
      portalUrl,
      contractUrl,
      portalPasswordHint: accountRes.initialPassword || "Tu contraseña registrada en Portal Miam",
    });

    contractEmailSent = await sendContractEmail(
      input.clientName.trim(),
      normalizedEmail,
      contractTitle,
      contractUrl,
      {
        serviceName: `${input.serviceName} · ${orderCode}`,
        clientDocument: input.clientDocument || undefined,
        paymentAmount: paymentAmountLabel,
        paymentType: paymentTypeForTemplate,
        deliveryTime: input.deliveryTime || undefined,
        content: contractContent,
      }
    );
  }

  return {
    orderId,
    orderCode,
    contractId: contract.id,
    contractUrl,
    portalUrl,
    clientEmail: normalizedEmail,
    initialPassword: accountRes.initialPassword,
    isNewAccount: accountRes.isNewAccount,
    receiptEmailSent,
    contractEmailSent,
  };
}

export async function getAllAgencyOrdersAdmin() {
  await ensureAgencyTables();
  const orders = await prisma.$queryRaw<AgencyOrderRecord[]>`
    SELECT
      o.*,
      a.initial_code,
      c.status AS contract_status
    FROM agency_orders o
    LEFT JOIN agency_client_accounts a ON a.email = o.client_email
    LEFT JOIN "Contract" c ON c.id = o.contract_id
    ORDER BY o.created_at DESC;
  `;

  const stages = await prisma.$queryRaw<AgencyStageRecord[]>`
    SELECT * FROM agency_stages ORDER BY sort_order ASC;
  `;

  const files = await prisma.$queryRaw<AgencyFileRecord[]>`
    SELECT id, order_id, file_name, mime_type, size_bytes, uploaded_by, category,
           storage_kind, storage_url, retention_days, expires_at, pinned_forever, created_at
    FROM agency_files
    ORDER BY created_at DESC;
  `;

  const surveys = await prisma.$queryRaw<AgencySurveyRecord[]>`
    SELECT * FROM agency_surveys;
  `;

  return { orders, stages, files, surveys };
}

export async function getClientPortalData(clientEmail: string) {
  await ensureAgencyTables();
  const normalizedEmail = clientEmail.trim().toLowerCase();

  const orders = await prisma.$queryRaw<AgencyOrderRecord[]>`
    SELECT o.*, c.status AS contract_status
    FROM agency_orders o
    LEFT JOIN "Contract" c ON c.id = o.contract_id
    WHERE o.client_email = ${normalizedEmail}
    ORDER BY o.created_at DESC;
  `;

  if (!orders.length) {
    return { orders: [], stages: [], files: [], surveys: [] };
  }

  const orderIds = orders.map((o) => o.id);

  const stages = await prisma.$queryRaw<AgencyStageRecord[]>`
    SELECT * FROM agency_stages
    WHERE order_id = ANY(${orderIds}::text[])
    ORDER BY sort_order ASC;
  `;

  const files = await prisma.$queryRaw<AgencyFileRecord[]>`
    SELECT id, order_id, file_name, mime_type, size_bytes, uploaded_by, category,
           storage_kind, storage_url, retention_days, expires_at, pinned_forever, created_at
    FROM agency_files
    WHERE order_id = ANY(${orderIds}::text[])
    ORDER BY created_at DESC;
  `;

  const surveys = await prisma.$queryRaw<AgencySurveyRecord[]>`
    SELECT * FROM agency_surveys
    WHERE order_id = ANY(${orderIds}::text[]);
  `;

  return { orders, stages, files, surveys };
}

export async function saveAgencyFile(params: {
  orderId: string;
  fileName: string;
  mimeType: string;
  buffer?: Buffer;
  externalUrl?: string;
  uploadedBy: "ADMIN" | "CLIENT";
  category: string;
  pinnedForever?: boolean;
}) {
  await ensureAgencyTables();
  const fileId = crypto.randomUUID();
  const retentionDays = params.pinnedForever ? 0 : 180;
  const expiresAt = params.pinnedForever
    ? null
    : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  if (params.externalUrl && params.externalUrl.trim()) {
    await prisma.$executeRaw`
      INSERT INTO agency_files (
        id, order_id, file_name, mime_type, size_bytes, uploaded_by, category,
        storage_kind, storage_url, retention_days, expires_at, pinned_forever, created_at
      )
      VALUES (
        ${fileId}, ${params.orderId}, ${params.fileName.trim()}, 'text/uri-list', 0,
        ${params.uploadedBy}, ${params.category}, 'EXTERNAL_URL', ${params.externalUrl.trim()},
        ${retentionDays}, ${expiresAt}, ${Boolean(params.pinnedForever)}, NOW()
      );
    `;
    return { id: fileId, storageKind: "EXTERNAL_URL" as const };
  }

  const buf = params.buffer;
  if (!buf || !buf.length) {
    throw new Error("El archivo está vacío.");
  }

  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (hasBlobToken) {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`agency/${params.orderId}/${fileId}-${safeName}`, buf, {
      access: "private",
      contentType: params.mimeType || "application/octet-stream",
    });

    await prisma.$executeRaw`
      INSERT INTO agency_files (
        id, order_id, file_name, mime_type, size_bytes, uploaded_by, category,
        storage_kind, storage_url, retention_days, expires_at, pinned_forever, created_at
      )
      VALUES (
        ${fileId}, ${params.orderId}, ${params.fileName.trim()},
        ${params.mimeType || "application/octet-stream"}, ${buf.length},
        ${params.uploadedBy}, ${params.category}, 'VERCEL_BLOB', ${blob.url},
        ${retentionDays}, ${expiresAt}, ${Boolean(params.pinnedForever)}, NOW()
      );
    `;
    return { id: fileId, storageKind: "VERCEL_BLOB" as const };
  }

  // Smart fallback: DB BYTEA up to 3.5 MB when BLOB_READ_WRITE_TOKEN isn't configured yet
  if (buf.length > 3_500_000) {
    throw new Error(
      "Archivo mayor a 3.5 MB: conecta BLOB_READ_WRITE_TOKEN en Vercel Storage o pega un enlace de Google Drive."
    );
  }

  await prisma.$executeRaw`
    INSERT INTO agency_files (
      id, order_id, file_name, mime_type, size_bytes, uploaded_by, category,
      storage_kind, inline_data, retention_days, expires_at, pinned_forever, created_at
    )
    VALUES (
      ${fileId}, ${params.orderId}, ${params.fileName.trim()},
      ${params.mimeType || "application/octet-stream"}, ${buf.length},
      ${params.uploadedBy}, ${params.category}, 'DB_INLINE', ${buf},
      ${retentionDays}, ${expiresAt}, ${Boolean(params.pinnedForever)}, NOW()
    );
  `;
  return { id: fileId, storageKind: "DB_INLINE" as const };
}

export async function deleteAgencyFileById(fileId: string) {
  await ensureAgencyTables();
  const rows = await prisma.$queryRaw<
    Array<{ id: string; storage_kind: string; storage_url: string | null }>
  >`
    SELECT id, storage_kind, storage_url FROM agency_files WHERE id = ${fileId} LIMIT 1;
  `;
  const target = rows[0];
  if (!target) return;

  if (target.storage_kind === "VERCEL_BLOB" && target.storage_url && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(target.storage_url);
    } catch (err) {
      console.error("Error deleting blob:", err);
    }
  }

  await prisma.$executeRaw`DELETE FROM agency_files WHERE id = ${fileId};`;
}

export async function purgeExpiredAgencyFiles(): Promise<number> {
  await ensureAgencyTables();
  const expired = await prisma.$queryRaw<
    Array<{ id: string; storage_kind: string; storage_url: string | null }>
  >`
    SELECT id, storage_kind, storage_url
    FROM agency_files
    WHERE pinned_forever = FALSE AND expires_at IS NOT NULL AND expires_at < NOW();
  `;
  for (const f of expired) {
    if (f.storage_kind === "VERCEL_BLOB" && f.storage_url && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(f.storage_url);
      } catch (err) {
        console.error("Blob cleanup warning:", err);
      }
    }
  }
  if (expired.length > 0) {
    const ids = expired.map((f) => f.id);
    await prisma.$executeRaw`DELETE FROM agency_files WHERE id = ANY(${ids}::text[]);`;
  }
  return expired.length;
}
