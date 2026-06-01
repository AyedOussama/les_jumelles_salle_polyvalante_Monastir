"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { headers } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 2;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

type AdminSessionPayload = {
  sub: "admin";
  iat: number;
  exp: number;
  nonce: string;
};

type LoginAttempt = {
  count: number;
  firstAttemptAt: number;
};

const globalForAuth = globalThis as typeof globalThis & {
  adminLoginAttempts?: Map<string, LoginAttempt>;
};

const loginAttempts =
  globalForAuth.adminLoginAttempts ?? new Map<string, LoginAttempt>();

globalForAuth.adminLoginAttempts = loginAttempts;

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password === "admin123" || password.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD doit être configuré avec une valeur forte dans les variables d'environnement."
    );
  }

  return password;
}

function getSessionSecret() {
  const configuredSecret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (configuredSecret) {
    if (configuredSecret.length < 32) {
      throw new Error(
        "ADMIN_SESSION_SECRET doit contenir au moins 32 caractères."
      );
    }

    return configuredSecret;
  }

  return crypto
    .createHash("sha256")
    .update(`admin-session:${getAdminPassword()}`)
    .digest("hex");
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

function timingSafeEqualString(left: string, right: string) {
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function signValue(value: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function createSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token?: string) {
  if (!token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = signValue(encodedPayload);
  if (!timingSafeEqualString(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    ) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    return payload.sub === "admin" && Number.isFinite(payload.exp) && payload.exp > now;
  } catch {
    return false;
  }
}

async function getClientKey() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();

  return ip || requestHeaders.get("x-real-ip") || "unknown";
}

function isLoginBlocked(key: string) {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;

  const now = Date.now();
  if (now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || now - attempt.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  attempt.count += 1;
}

function clearFailedLogins(key: string) {
  loginAttempts.delete(key);
}

/**
 * Validates the admin password on the server side against the environment variable.
 * If valid, sets a secure HTTP-Only session cookie.
 */
export async function verifyAdminPassword(password: string) {
  const clientKey = await getClientKey();

  if (isLoginBlocked(clientKey)) {
    return {
      success: false,
      error: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }

  if (typeof password !== "string") {
    recordFailedLogin(clientKey);
    return { success: false, error: "Mot de passe incorrect." };
  }

  const adminPassword = getAdminPassword();

  if (timingSafeEqualString(password, adminPassword)) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, createSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });
    clearFailedLogins(clientKey);
    return { success: true };
  }

  recordFailedLogin(clientKey);
  return { success: false, error: "Mot de passe incorrect." };
}

/**
 * Logs out the administrator by deleting the secure session cookie.
 */
export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return { success: true };
}

/**
 * Server-side check to determine if the active session is authorized.
 */
export async function checkAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireAdminSession() {
  const isAdmin = await checkAdminSession();

  if (!isAdmin) {
    throw new Error("Session administrateur invalide ou expirée.");
  }
}
