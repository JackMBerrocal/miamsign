import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "miamsign_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface AdminSession {
  email: string;
  exp: number;
}

function getAuthConfig() {
  const email = (process.env.MIAMSIGN_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.MIAMSIGN_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";
  const secret =
    process.env.MIAMSIGN_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";

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

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signPayload(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function verifyAdminCredentials(inputEmail: string, inputPassword: string): { ok: boolean; error?: string } {
  const cfg = getAuthConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error:
        "Falta configurar las variables MIAMSIGN_ADMIN_EMAIL, MIAMSIGN_ADMIN_PASSWORD y MIAMSIGN_SESSION_SECRET en el entorno del servidor (Vercel).",
    };
  }

  const normalizedEmail = (inputEmail || "").trim().toLowerCase();
  const validEmail = safeCompare(normalizedEmail, cfg.email);
  const validPassword = safeCompare(inputPassword || "", cfg.password);

  if (!validEmail || !validPassword) {
    return { ok: false, error: "Credenciales inválidas." };
  }

  return { ok: true };
}

export function createSessionToken(email: string): string {
  const cfg = getAuthConfig();
  if (!cfg.secret) {
    throw new Error("MIAMSIGN_SESSION_SECRET no configurado.");
  }
  const payload: AdminSession = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = signPayload(payloadB64, cfg.secret);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const cfg = getAuthConfig();
  if (!cfg.configured) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expectedSig = signPayload(payloadB64, cfg.secret);
  if (!safeCompare(sig, expectedSig)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as AdminSession;
    if (!decoded.email || typeof decoded.exp !== "number" || decoded.exp < Date.now()) {
      return null;
    }
    if (!safeCompare(decoded.email.trim().toLowerCase(), cfg.email)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
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

export async function setAdminSessionCookie(email: string): Promise<void> {
  const token = createSessionToken(email);
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
