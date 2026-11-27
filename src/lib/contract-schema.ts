import prisma from "@/lib/prisma";

let contractSchemaReadyPromise: Promise<void> | null = null;

/**
 * Ensures the live PostgreSQL "Contract" table contains all columns defined
 * in prisma/schema.prisma (idempotent, cached per server instance).
 */
export async function ensureContractSchema(): Promise<void> {
  if (contractSchemaReadyPromise) return contractSchemaReadyPromise;
  contractSchemaReadyPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Contract"
          ADD COLUMN IF NOT EXISTS "clientEmail" TEXT,
          ADD COLUMN IF NOT EXISTS "clientPhone" TEXT,
          ADD COLUMN IF NOT EXISTS "clientDocument" TEXT,
          ADD COLUMN IF NOT EXISTS "clientAddress" TEXT,
          ADD COLUMN IF NOT EXISTS "paymentAmount" TEXT,
          ADD COLUMN IF NOT EXISTS "paymentType" TEXT,
          ADD COLUMN IF NOT EXISTS "clientIp" TEXT,
          ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "signatureData" TEXT,
          ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
      `);
    } catch (err) {
      contractSchemaReadyPromise = null;
      throw err;
    }
  })();
  return contractSchemaReadyPromise;
}
