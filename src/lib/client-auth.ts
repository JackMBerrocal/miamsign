import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  getSessionSecret,
  hashPassword,
  signToken,
  verifyPasswordHash,
  verifySignedToken,
} from "@/lib/crypto-session";

export const CLIENT_COOKIE_NAME = "miam_client_session";
const CLIENT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días de sesión persistente para comodidad del cliente

export interface ClientSession {
  email: string;
  name: string;
  mustChangePassword: boolean;
  exp: number;
}

export interface StoredClientAccount {
  email: string;
  name: string;
  phone: string | null;
  document_type: string | null;
  document_number: string | null;
  razon_social: string | null;
  address: string | null;
  password_hash: string;
  initial_code: string | null;
  must_change: boolean;
}

export function generateInitialClientPassword(customCode?: string): string {
  const clean = (customCode || "").trim();
  if (clean.length >= 6) return clean;
  const suffix = crypto.randomInt(1000, 9999);
  return `MIAM-${suffix}`;
}

export async function ensureClientAccountsTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agency_client_accounts (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      document_type TEXT,
      document_number TEXT,
      razon_social TEXT,
      address TEXT,
      password_hash TEXT NOT NULL,
      initial_code TEXT,
      must_change BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function upsertPermanentClientAccount(params: {
  email: string;
  name: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  razonSocial?: string;
  address?: string;
  customInitialPassword?: string;
}): Promise<{ email: string; initialPassword: string | null; isNewAccount: boolean }> {
  const normalizedEmail = (params.email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("El correo del cliente es obligatorio para crear su cuenta permanente.");
  }

  await ensureClientAccountsTable();
  const existingRows = await prisma.$queryRaw<StoredClientAccount[]>`
    SELECT email, name, phone, document_type, document_number, razon_social, address, password_hash, initial_code, must_change
    FROM agency_client_accounts
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `;

  const existing = existingRows[0];
  if (existing) {
    await prisma.$executeRaw`
      UPDATE agency_client_accounts
      SET
        name = ${params.name.trim() || existing.name},
        phone = COALESCE(${params.phone?.trim() || null}, phone),
        document_type = COALESCE(${params.documentType?.trim() || null}, document_type),
        document_number = COALESCE(${params.documentNumber?.trim() || null}, document_number),
        razon_social = COALESCE(${params.razonSocial?.trim() || null}, razon_social),
        address = COALESCE(${params.address?.trim() || null}, address),
        updated_at = NOW()
      WHERE email = ${normalizedEmail};
    `;
    return {
      email: normalizedEmail,
      initialPassword: existing.must_change ? existing.initial_code : null,
      isNewAccount: false,
    };
  }

  const initialPassword = generateInitialClientPassword(params.customInitialPassword);
  const passwordHash = hashPassword(initialPassword);

  await prisma.$executeRaw`
    INSERT INTO agency_client_accounts (
      email, name, phone, document_type, document_number, razon_social, address,
      password_hash, initial_code, must_change, created_at, updated_at
    )
    VALUES (
      ${normalizedEmail},
      ${params.name.trim() || "Cliente Miam"},
      ${params.phone?.trim() || null},
      ${params.documentType?.trim() || null},
      ${params.documentNumber?.trim() || null},
      ${params.razonSocial?.trim() || null},
      ${params.address?.trim() || null},
      ${passwordHash},
      ${initialPassword},
      TRUE,
      NOW(),
      NOW()
    );
  `;

  return {
    email: normalizedEmail,
    initialPassword,
    isNewAccount: true,
  };
}

export async function verifyClientCredentials(
  inputEmail: string,
  inputPassword: string
): Promise<{ ok: boolean; account?: StoredClientAccount; error?: string }> {
  const normalizedEmail = (inputEmail || "").trim().toLowerCase();
  if (!normalizedEmail || !inputPassword) {
    return { ok: false, error: "Ingresa tu correo y contraseña." };
  }

  await ensureClientAccountsTable();
  const rows = await prisma.$queryRaw<StoredClientAccount[]>`
    SELECT email, name, phone, document_type, document_number, razon_social, address, password_hash, initial_code, must_change
    FROM agency_client_accounts
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `;

  const account = rows[0];
  if (!account || !verifyPasswordHash(inputPassword, account.password_hash)) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  return { ok: true, account };
}

export async function resetClientPasswordByAdmin(
  clientEmail: string,
  newInitialPassword?: string
): Promise<{ ok: boolean; newPassword?: string; error?: string }> {
  const normalizedEmail = (clientEmail || "").trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, error: "Correo inválido." };

  const generated = generateInitialClientPassword(newInitialPassword);
  const nextHash = hashPassword(generated);
  await ensureClientAccountsTable();

  await prisma.$executeRaw`
    UPDATE agency_client_accounts
    SET password_hash = ${nextHash}, initial_code = ${generated}, must_change = TRUE, updated_at = NOW()
    WHERE email = ${normalizedEmail};
  `;

  return { ok: true, newPassword: generated };
}

export async function changeClientOwnPassword(params: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = (params.email || "").trim().toLowerCase();
  if (!params.newPassword || params.newPassword.length < 6) {
    return { ok: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }
  const verify = await verifyClientCredentials(normalizedEmail, params.currentPassword);
  if (!verify.ok || !verify.account) {
    return { ok: false, error: "La contraseña actual no coincide." };
  }

  const nextHash = hashPassword(params.newPassword);
  await prisma.$executeRaw`
    UPDATE agency_client_accounts
    SET password_hash = ${nextHash}, initial_code = NULL, must_change = FALSE, updated_at = NOW()
    WHERE email = ${normalizedEmail};
  `;

  await setClientSessionCookie({
    email: normalizedEmail,
    name: verify.account.name,
    mustChangePassword: false,
  });

  return { ok: true };
}

export async function setClientSessionCookie(session: Omit<ClientSession, "exp">): Promise<void> {
  const secret = getSessionSecret();
  if (!secret) throw new Error("MIAMSIGN_SESSION_SECRET no configurado.");

  const payload: ClientSession = {
    email: session.email.trim().toLowerCase(),
    name: session.name,
    mustChangePassword: Boolean(session.mustChangePassword),
    exp: Date.now() + CLIENT_TTL_MS,
  };
  const token = signToken(payload, secret);
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(CLIENT_TTL_MS / 1000),
  });
}

export async function getClientSession(): Promise<ClientSession | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  const decoded = verifySignedToken<ClientSession>(token, secret);
  if (!decoded?.email) return null;
  return {
    email: decoded.email,
    name: decoded.name || "Cliente",
    mustChangePassword: Boolean(decoded.mustChangePassword),
    exp: decoded.exp,
  };
}

export async function requireClientSession(): Promise<ClientSession> {
  const session = await getClientSession();
  if (!session) {
    throw new Error("Sesión expirada. Inicia sesión en tu portal.");
  }
  return session;
}

export async function clearClientSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CLIENT_COOKIE_NAME);
}
