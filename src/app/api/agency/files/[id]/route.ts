import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getClientSession } from "@/lib/client-auth";
import { ensureAgencyTables } from "@/lib/agency-db";

interface FileDownloadRow {
  id: string;
  order_id: string;
  file_name: string;
  mime_type: string;
  storage_kind: string;
  storage_url: string | null;
  inline_data: Buffer | null;
  client_email: string;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const admin = await getAdminSession();
    const client = await getClientSession();

    if (!admin && !client) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await ensureAgencyTables();
    const rows = await prisma.$queryRaw<FileDownloadRow[]>`
      SELECT
        f.id, f.order_id, f.file_name, f.mime_type, f.storage_kind, f.storage_url, f.inline_data,
        o.client_email
      FROM agency_files f
      INNER JOIN agency_orders o ON o.id = f.order_id
      WHERE f.id = ${id}
      LIMIT 1;
    `;

    const file = rows[0];
    if (!file) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    if (!admin && client && file.client_email.toLowerCase() !== client.email.toLowerCase()) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    if (file.storage_kind === "EXTERNAL_URL" && file.storage_url) {
      return NextResponse.redirect(file.storage_url);
    }

    if (file.storage_kind === "VERCEL_BLOB" && file.storage_url) {
      const blob = await get(file.storage_url, { access: "private" });
      if (!blob || blob.statusCode !== 200 || !blob.stream) {
        return NextResponse.json({ error: "Blob no disponible" }, { status: 404 });
      }
      return new NextResponse(blob.stream, {
        status: 200,
        headers: {
          "Content-Type": file.mime_type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.file_name)}"`,
        },
      });
    }

    if (file.inline_data) {
      const bytes = new Uint8Array(file.inline_data);
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": file.mime_type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.file_name)}"`,
          "Content-Length": String(bytes.byteLength),
        },
      });
    }

    return NextResponse.json({ error: "Contenido no disponible" }, { status: 404 });
  } catch (error) {
    console.error("GET /api/agency/files/[id] error:", error);
    return NextResponse.json({ error: "Error descargando archivo" }, { status: 500 });
  }
}
