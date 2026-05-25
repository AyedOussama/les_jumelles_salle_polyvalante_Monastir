"use server";

import { cookies } from "next/headers";

/**
 * Validates the admin password on the server side against the environment variable.
 * If valid, sets a secure HTTP-Only session cookie.
 */
export async function verifyAdminPassword(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // Session valid for 2 hours
      path: "/",
    });
    return { success: true };
  }

  return { success: false, error: "Mot de passe incorrect." };
}

/**
 * Logs out the administrator by deleting the secure session cookie.
 */
export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return { success: true };
}

/**
 * Server-side check to determine if the active session is authorized.
 */
export async function checkAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.has("admin_session");
}
