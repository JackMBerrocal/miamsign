import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  getSessionSecret,
  hashPassword,
  safeCompare,
  signToken,
  verifyPasswordHash,
  verifySignedToken,
} from "@/lib/crypto-session";

export const SESSION_COOKIE_NAME = "miamsign_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface AdminSession {
  email: string;
  displayName: string;
  mustChangePassword: boolean;
  exp: number;
}

interface StoredAdminAuth {
  email: string;
  password_hash: string;
  display_name: string;
  must_change: boolean;
}

function getAuthConfig() {
  const email = (process.env.MIAMSIGN_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.MIAMSIGN_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
  const secret = getSessionSecret();

  return {
    email,
    password,
    secret,
    configured: Boolean(email && password && secret),
  };
}

export function isAuthConfigured(): boolean {
  return getAuthConfig().configured;
}

async function ensureAuthTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS miam_sign_auth (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT 'Jack M. Berrocal',
      must_change BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getStoredAuth(email: string): Promise<StoredAdminAuth | null> {
  try {
    await ensureAuthTable();
    const rows = await prisma.$queryRaw<StoredAdminAuth[]>`
      SELECT email, password_hash, display_name, must_change
      FROM miam_sign_auth
      WHERE email = ${email.trim().toLowerCase()}
      LIMIT 1;
    `;
    return rows[0] || null;
  } catch (err) {
    console.error("Error reading miam_sign_auth:", err);
    return null;
  }
}

export async function verifyAdminCredentials(
  inputEmail: string,
  inputPassword: string
): Promise<{ ok: boolean; mustChangePassword?: boolean; displayName?: string; error?: string }> {
  const cfg = getAuthConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error:
        "Falta configurar MIAMSIGN_ADMIN_EMAIL, MIAMSIGN_ADMIN_PASSWORD y MIAMSIGN_SESSION_SECRET en Vercel.",
    };
  }

  const normalizedEmail = (inputEmail || "").trim().toLowerCase();
  if (!safeCompare(normalizedEmail, cfg.email)) {
    return { ok: false, error: "Credenciales inválidas." };
  }

  const stored = await getStoredAuth(normalizedEmail);
  if (stored) {
    const matchesStored = verifyPasswordHash(inputPassword || "", stored.password_hash);
    if (!matchesStored) {
      return { ok: false, error: "Credenciales inválidas." };
    }
    return {
      ok: true,
      mustChangePassword: Boolean(stored.must_change),
      displayName: stored.display_name || "Jack M. Berrocal",
    };
  }

  if (!safeCompare(inputPassword || "", cfg.password)) {
    return { ok: false, error: "Credenciales inválidas." };
  }

  return {
    ok: true,
    mustChangePassword: true,
    displayName: "Jack M. Berrocal",
  };
}

export async function updateAdminPasswordAndProfile(params: {
  email: string;
  currentPassword: string;
  newPassword: string;
  displayName?: string;
}): Promise<{ ok: boolean; displayName?: string; error?: string }> {
  const cfg = getAuthConfig();
  const normalizedEmail = (params.email || "").trim().toLowerCase();

  if (!params.newPassword || params.newPassword.length < 8) {
    return { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }
  if (params.newPassword === params.currentPassword) {
    return { ok: false, error: "La nueva contraseña debe ser diferente a la actual." };
  }

  const verifyCurrent = await verifyAdminCredentials(normalizedEmail, params.currentPassword);
  if (!verifyCurrent.ok) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  if (!cfg.secret) {
    return { ok: false, error: "Falta MIAMSIGN_SESSION_SECRET en el servidor." };
  }

  const nextHash = hashPassword(params.newPassword);
  const nextDisplay = (params.displayName || verifyCurrent.displayName || "Jack M. Berrocal").trim().slice(0, 80);

  await ensureAuthTable();
  await prisma.$executeRaw`
    INSERT INTO miam_sign_auth (email, password_hash, display_name, must_change, updated_at)
    VALUES (${normalizedEmail}, ${nextHash}, ${nextDisplay}, FALSE, NOW())
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      display_name = EXCLUDED.display_name,
      must_change = FALSE,
      updated_at = NOW();
  `;

  await setAdminSessionCookie({
    email: normalizedEmail,
    displayName: nextDisplay,
    mustChangePassword: false,
  });

  return { ok: true, displayName: nextDisplay };
}

export async function updateAdminDisplayName(
  email: string,
  displayName: string
): Promise<{ ok: boolean; displayName?: string; error?: string }> {
  const cleanName = (displayName || "").trim().slice(0, 80);
  if (cleanName.length < 2) {
    return { ok: false, error: "Ingresa un nombre válido (mínimo 2 caracteres)." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const stored = await getStoredAuth(normalizedEmail);
  const cfg = getAuthConfig();

  await ensureAuthTable();
  if (stored) {
    await prisma.$executeRaw`
      UPDATE miam_sign_auth
      SET display_name = ${cleanName}, updated_at = NOW()
      WHERE email = ${normalizedEmail};
    `;
    await setAdminSessionCookie({
      email: normalizedEmail,
      displayName: cleanName,
      mustChangePassword: Boolean(stored.must_change),
    });
  } else {
    const initialHash = hashPassword(cfg.password);
    await prisma.$executeRaw`
      INSERT INTO miam_sign_auth (email, password_hash, display_name, must_change, updated_at)
      VALUES (${normalizedEmail}, ${initialHash}, ${cleanName}, TRUE, NOW())
      ON CONFLICT (email) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = NOW();
    `;
    await setAdminSessionCookie({
      email: normalizedEmail,
      displayName: cleanName,
      mustChangePassword: true,
    });
  }

  return { ok: true, displayName: cleanName };
}

export function createSessionToken(session: Omit<AdminSession, "exp">): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("MIAMSIGN_SESSION_SECRET no configurado.");
  }
  const payload: AdminSession = {
    email: session.email.trim().toLowerCase(),
    displayName: session.displayName || "Jack M. Berrocal",
    mustChangePassword: Boolean(session.mustChangePassword),
    exp: Date.now() + SESSION_TTL_MS,
  };
  return signToken(payload, secret);
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  const cfg = getAuthConfig();
  if (!cfg.configured) return null;
  const decoded = verifySignedToken<AdminSession>(token, cfg.secret);
  if (!decoded?.email || !safeCompare(decoded.email.trim().toLowerCase(), cfg.email)) {
    return null;
  }
  return {
    email: decoded.email,
    displayName: decoded.displayName || "Jack M. Berrocal",
    mustChangePassword: Boolean(decoded.mustChangePassword),
    exp: decoded.exp,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("No autorizado. Inicia sesión como administrador para continuar.");
  }
  return session;
}

export async function setAdminSessionCookie(session: Omit<AdminSession, "exp">): Promise<void> {
  const token = createSessionToken(session);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
