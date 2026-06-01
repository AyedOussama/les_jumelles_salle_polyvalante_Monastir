"use server";

import type { Prisma } from "@/lib/generated/prisma/client";
import { sendBookingNotificationEmail } from "@/lib/email/booking-notification";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdminSession } from "./auth";
import { getSettingsAction } from "./settings";

const LEGACY_EXTRA_KEYS = ["decoration", "sonorisation", "climatisation", "traiteur", "autres"] as const;
const BOOKING_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_BOOKINGS_PER_WINDOW = 5;

type BookingExtraKey = (typeof LEGACY_EXTRA_KEYS)[number];
export type BookingExtras = Record<string, boolean>;

export interface PublicBookingAvailability {
  date: number;
  month: number;
  year: number;
  slot: "matinee" | "soiree";
  status: "pending" | "confirmed";
  pendingCount: number;
}

let bookingExtrasColumnReady: Promise<void> | null = null;

// Type definitions to mirror local structures and guarantee strict typing
export interface BookingData {
  date: number;
  month: number;
  year: number;
  slot: "matinee" | "soiree";
  name: string;
  phone: string;
  eventType: string;
  specialNeeds?: string;
  totalPrice?: number;
  extras: BookingExtras;
}

type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

type BookingSubmissionAttempt = {
  count: number;
  firstAttemptAt: number;
};

const globalForBookingRateLimit = globalThis as typeof globalThis & {
  bookingSubmissionAttempts?: Map<string, BookingSubmissionAttempt>;
};

const bookingSubmissionAttempts =
  globalForBookingRateLimit.bookingSubmissionAttempts ??
  new Map<string, BookingSubmissionAttempt>();

globalForBookingRateLimit.bookingSubmissionAttempts = bookingSubmissionAttempts;

function normalizeExtras(extras?: BookingExtras | null): BookingExtras {
  const normalized: BookingExtras = {};

  Object.entries(extras || {}).forEach(([key, value]) => {
    normalized[key] = Boolean(value);
  });

  LEGACY_EXTRA_KEYS.forEach((key) => {
    normalized[key] = Boolean(normalized[key]);
  });

  return normalized;
}

function parseStoredExtras(value: unknown): BookingExtras {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return normalizeExtras(JSON.parse(value) as BookingExtras);
    } catch {
      return {};
    }
  }

  if (typeof value === "object") {
    return normalizeExtras(value as BookingExtras);
  }

  return {};
}

function buildLegacyExtras(extras: BookingExtras): Record<BookingExtraKey, boolean> {
  return {
    decoration: Boolean(extras.decoration),
    sonorisation: Boolean(extras.sonorisation),
    climatisation: Boolean(extras.climatisation),
    traiteur: Boolean(extras.traiteur),
    autres: Boolean(extras.autres),
  };
}

function buildBookingExtras(booking: {
  decoration: boolean;
  sonorisation: boolean;
  climatisation: boolean;
  traiteur: boolean;
  autres: boolean;
  extrasData?: unknown;
}): BookingExtras {
  return normalizeExtras({
    decoration: booking.decoration,
    sonorisation: booking.sonorisation,
    climatisation: booking.climatisation,
    traiteur: booking.traiteur,
    autres: booking.autres,
    ...parseStoredExtras(booking.extrasData),
  });
}

function toPrismaJson(value: BookingExtras): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getClientKey() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();

  return ip || requestHeaders.get("x-real-ip") || "unknown";
}

async function assertBookingSubmissionAllowed() {
  const clientKey = await getClientKey();
  const now = Date.now();
  const attempt = bookingSubmissionAttempts.get(clientKey);

  if (!attempt || now - attempt.firstAttemptAt > BOOKING_RATE_LIMIT_WINDOW_MS) {
    bookingSubmissionAttempts.set(clientKey, {
      count: 1,
      firstAttemptAt: now,
    });
    return;
  }

  if (attempt.count >= MAX_BOOKINGS_PER_WINDOW) {
    throw new Error(
      "Trop de demandes depuis cette connexion. Réessayez plus tard ou contactez-nous par téléphone."
    );
  }

  attempt.count += 1;
}

function assertPositiveInteger(value: unknown, label: string) {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new Error(`${label} invalide.`);
  }
}

function validateBookingDate(
  day: unknown,
  month: unknown,
  year: unknown,
  options: { allowPast?: boolean } = {}
) {
  if (!Number.isInteger(day) || Number(day) < 1 || Number(day) > 31) {
    throw new Error("Date invalide.");
  }

  if (!Number.isInteger(month) || Number(month) < 0 || Number(month) > 11) {
    throw new Error("Mois invalide.");
  }

  const currentYear = new Date().getFullYear();
  if (
    !Number.isInteger(year) ||
    Number(year) < currentYear ||
    Number(year) > currentYear + 5
  ) {
    throw new Error("Année invalide.");
  }

  const eventDate = new Date(Number(year), Number(month), Number(day));
  if (
    eventDate.getFullYear() !== Number(year) ||
    eventDate.getMonth() !== Number(month) ||
    eventDate.getDate() !== Number(day)
  ) {
    throw new Error("Date invalide.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!options.allowPast && eventDate < today) {
    throw new Error("La date sélectionnée est déjà passée.");
  }
}

function validateSlot(slot: unknown): asserts slot is "matinee" | "soiree" {
  if (slot !== "matinee" && slot !== "soiree") {
    throw new Error("Créneau horaire invalide.");
  }
}

function sanitizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validatePhoneNumber(phone: string) {
  if (!/^[+\d\s()./-]{6,32}$/.test(phone)) {
    throw new Error("Numéro de téléphone invalide.");
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new Error("Numéro de téléphone invalide.");
  }
}

function sanitizeAmount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1_000_000);
}

function assertValidStatus(status: unknown): asserts status is BookingStatus {
  if (
    status !== "pending" &&
    status !== "confirmed" &&
    status !== "rejected" &&
    status !== "cancelled"
  ) {
    throw new Error("Statut invalide.");
  }
}

function getPublicCreateBookingError(error: unknown) {
  const message = getErrorMessage(error, "");
  const publicMessages = new Set([
    "Nom, téléphone et type d'événement sont obligatoires.",
    "Numéro de téléphone invalide.",
    "Créneau horaire invalide.",
    "Date invalide.",
    "Mois invalide.",
    "Année invalide.",
    "La date sélectionnée est déjà passée.",
    "Options de réservation invalides.",
    "Impossible de générer un numéro de dossier unique après plusieurs tentatives.",
    "Trop de demandes depuis cette connexion. Réessayez plus tard ou contactez-nous par téléphone.",
  ]);

  return publicMessages.has(message)
    ? message
    : "Impossible d'enregistrer la réservation pour le moment. Veuillez réessayer.";
}

function toPublicAvailabilityEntry(booking: {
  date: number;
  month: number;
  year: number;
  slot: string;
  status: string;
  pendingCount?: number;
}): PublicBookingAvailability {
  return {
    date: booking.date,
    month: booking.month,
    year: booking.year,
    slot: booking.slot as "matinee" | "soiree",
    status: booking.status === "confirmed" ? "confirmed" : "pending",
    pendingCount: booking.pendingCount || 0,
  };
}

async function ensureBookingExtrasColumn() {
  if (!bookingExtrasColumnReady) {
    bookingExtrasColumnReady = prisma.$executeRaw`
      ALTER TABLE "Booking"
      ADD COLUMN IF NOT EXISTS "extrasData" JSONB NOT NULL DEFAULT '{}'::jsonb
    `.then(() => undefined).catch((error) => {
      bookingExtrasColumnReady = null;
      throw error;
    });
  }

  await bookingExtrasColumnReady;
}

/**
 * Fetch anonymous slot availability for the public booking calendar.
 * It intentionally excludes names, phone numbers, dossier numbers, payments and notes.
 */
export async function getPublicAvailabilityAction(): Promise<PublicBookingAvailability[]> {
  try {
    const dbBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["pending", "confirmed"] },
      },
      select: {
        date: true,
        month: true,
        year: true,
        slot: true,
        status: true,
      },
    });

    const bySlot = new Map<string, PublicBookingAvailability>();

    dbBookings.forEach((booking) => {
      if (booking.slot !== "matinee" && booking.slot !== "soiree") return;

      const key = `${booking.year}-${booking.month}-${booking.date}-${booking.slot}`;
      const current =
        bySlot.get(key) ||
        toPublicAvailabilityEntry({
          date: booking.date,
          month: booking.month,
          year: booking.year,
          slot: booking.slot,
          status: "pending",
        });

      if (booking.status === "confirmed") {
        current.status = "confirmed";
      }

      if (booking.status === "pending") {
        current.pendingCount += 1;
      }

      bySlot.set(key, current);
    });

    return Array.from(bySlot.values());
  } catch (error) {
    console.error("[Prisma getPublicAvailabilityAction Error]:", error);
    throw new Error("Impossible de charger les disponibilités.");
  }
}

/**
 * Fetch all bookings from the Neon PostgreSQL database for authenticated admins only.
 */
export async function getBookingsAction() {
  try {
    await requireAdminSession();
    await ensureBookingExtrasColumn();

    const dbBookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
    });

    return dbBookings.map((b) => ({
      id: b.id,
      dossierNum: b.dossierNum,
      date: b.date,
      month: b.month,
      year: b.year,
      slot: b.slot as "matinee" | "soiree",
      status: b.status as BookingStatus,
      name: b.name,
      phone: b.phone,
      eventType: b.eventType,
      specialNeeds: b.specialNeeds || "",
      extras: buildBookingExtras(b),
      totalPrice: b.totalPrice || 0,
      advancePayment: b.advancePayment || 0,
      remainingAmount: b.remainingAmount || 0,
      adminNotes: b.adminNotes || "",
      createdAt: b.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[Prisma getBookingsAction Error]:", error);
    throw new Error("Impossible de charger les réservations.");
  }
}

/**
 * Create a new booking with a unique dossier number starting with JUM-XXXX.
 */
export async function createBookingAction(data: BookingData) {
  try {
    await assertBookingSubmissionAllowed();
    await ensureBookingExtrasColumn();

    const safeName = sanitizeText(data.name, 100);
    const safePhone = sanitizeText(data.phone, 24);
    const safeEventType = sanitizeText(data.eventType, 80);
    const safeSpecialNeeds = sanitizeText(data.specialNeeds, 500);

    if (!safeName || !safePhone || !safeEventType) {
      throw new Error("Nom, téléphone et type d'événement sont obligatoires.");
    }

    validatePhoneNumber(safePhone);

    validateSlot(data.slot);
    validateBookingDate(data.date, data.month, data.year);

    if (typeof data.extras !== "object" || data.extras === null) {
      throw new Error("Options de réservation invalides.");
    }

    const safeExtras = normalizeExtras(data.extras);
    const legacyExtras = buildLegacyExtras(safeExtras);
    const safeTotalPrice = sanitizeAmount(data.totalPrice);

    let dossierNum = "";
    let isUnique = false;
    let attempts = 0;

    // Retrying mechanism to generate a unique random dossier code
    while (!isUnique && attempts < 10) {
      dossierNum = `JUM-${Math.floor(1000 + Math.random() * 9000)}`;
      const existing = await prisma.booking.findUnique({
        where: { dossierNum },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error("Impossible de générer un numéro de dossier unique après plusieurs tentatives.");
    }

    const newBooking = await prisma.booking.create({
      data: {
        dossierNum,
        date: data.date,
        month: data.month,
        year: data.year,
        slot: data.slot,
        status: "pending",
        name: safeName,
        phone: safePhone,
        eventType: safeEventType,
        specialNeeds: safeSpecialNeeds,
        decoration: legacyExtras.decoration,
        sonorisation: legacyExtras.sonorisation,
        climatisation: legacyExtras.climatisation,
        traiteur: legacyExtras.traiteur,
        autres: legacyExtras.autres,
        extrasData: toPrismaJson(safeExtras),
        totalPrice: safeTotalPrice,
      },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");

    const notificationBooking = {
      dossierNum: newBooking.dossierNum,
      date: newBooking.date,
      month: newBooking.month,
      year: newBooking.year,
      slot: newBooking.slot as "matinee" | "soiree",
      name: newBooking.name,
      phone: newBooking.phone,
      eventType: newBooking.eventType,
      specialNeeds: newBooking.specialNeeds || "",
      extras: buildBookingExtras(newBooking),
      totalPrice: newBooking.totalPrice || 0,
    };
    const publicBooking = toPublicAvailabilityEntry({
      date: newBooking.date,
      month: newBooking.month,
      year: newBooking.year,
      slot: newBooking.slot,
      status: newBooking.status,
      pendingCount: 1,
    });

    try {
      const settings = await getSettingsAction();
      await sendBookingNotificationEmail(notificationBooking, settings);
    } catch (emailError) {
      console.error("[Booking notification email Error]:", emailError);
    }

    return {
      success: true as const,
      dossierNum: newBooking.dossierNum,
      booking: publicBooking,
    };
  } catch (error) {
    console.error("[Prisma createBookingAction Error]:", error);
    return {
      success: false as const,
      error: getPublicCreateBookingError(error),
    };
  }
}

/**
 * Approve a pending booking (change status to 'confirmed').
 */
export async function approveBookingAction(id: number) {
  try {
    await requireAdminSession();
    assertPositiveInteger(id, "Réservation");
    await ensureBookingExtrasColumn();

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Réservation introuvable.");
    }

    if ((existing.advancePayment || 0) <= 0) {
      throw new Error("Le montant d'avance est obligatoire avant de confirmer la réservation.");
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        id: { not: id },
        status: "confirmed",
        date: existing.date,
        month: existing.month,
        year: existing.year,
        slot: existing.slot,
      },
    });

    if (conflictingBooking) {
      throw new Error("Ce créneau est déjà confirmé pour un autre client.");
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "confirmed" },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");
    return { success: true, id: updated.id };
  } catch (error) {
    console.error("[Prisma approveBookingAction Error]:", error);
    throw new Error(getErrorMessage(error, "Échec de la validation de la réservation."));
  }
}

/**
 * Archive a booking as rejected to preserve traceability.
 */
export async function rejectBookingAction(id: number) {
  try {
    await requireAdminSession();
    assertPositiveInteger(id, "Réservation");
    await ensureBookingExtrasColumn();

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Réservation introuvable.");
    }

    const timestamp = new Date().toISOString();
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "rejected",
        adminNotes: `${existing?.adminNotes || ""}\n[${timestamp}] Demande refusée par l'administration.`.trim(),
      },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");
    return { success: true, id: updated.id };
  } catch (error) {
    console.error("[Prisma rejectBookingAction Error]:", error);
    throw new Error("Échec du rejet de la réservation.");
  }
}

/**
 * Move a confirmed booking back to pending while preserving traceability.
 */
export async function cancelBookingAction(id: number) {
  try {
    await requireAdminSession();
    assertPositiveInteger(id, "Réservation");
    await ensureBookingExtrasColumn();

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Réservation introuvable.");
    }

    const timestamp = new Date().toISOString();
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "pending",
        adminNotes: `${existing.adminNotes || ""}\n[${timestamp}] Réservation confirmée remise en attente par l'administration.`.trim(),
      },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");
    return { success: true, id: updated.id };
  } catch (error) {
    console.error("[Prisma cancelBookingAction Error]:", error);
    throw new Error(getErrorMessage(error, "Échec de la remise en attente de la réservation."));
  }
}

/**
 * Update details of a booking, including pricing and adminNotes.
 */
export async function updateBookingAction(id: number, data: {
  date?: number;
  month?: number;
  year?: number;
  slot?: "matinee" | "soiree";
  name?: string;
  phone?: string;
  eventType?: string;
  specialNeeds?: string;
  extras?: BookingExtras;
  totalPrice?: number;
  advancePayment?: number;
  remainingAmount?: number;
  adminNotes?: string;
  status?: BookingStatus;
}) {
  try {
    await requireAdminSession();
    assertPositiveInteger(id, "Réservation");
    await ensureBookingExtrasColumn();

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Réservation introuvable.");
    }

    if (!data || typeof data !== "object") {
      throw new Error("Données de réservation invalides.");
    }

    const updateData: Record<string, string | number | boolean | Prisma.InputJsonValue> = {};
    const nextDate = data.date ?? existing.date;
    const nextMonth = data.month ?? existing.month;
    const nextYear = data.year ?? existing.year;
    validateBookingDate(nextDate, nextMonth, nextYear, { allowPast: true });
    if (data.date !== undefined) updateData.date = data.date;
    if (data.month !== undefined) updateData.month = data.month;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.slot !== undefined) {
      validateSlot(data.slot);
      updateData.slot = data.slot;
    }
    if (data.name !== undefined) {
      const safeName = sanitizeText(data.name, 100);
      if (!safeName) throw new Error("Nom invalide.");
      updateData.name = safeName;
    }
    if (data.phone !== undefined) {
      const safePhone = sanitizeText(data.phone, 24);
      validatePhoneNumber(safePhone);
      updateData.phone = safePhone;
    }
    if (data.eventType !== undefined) {
      const safeEventType = sanitizeText(data.eventType, 80);
      if (!safeEventType) throw new Error("Type d'événement invalide.");
      updateData.eventType = safeEventType;
    }
    if (data.specialNeeds !== undefined) updateData.specialNeeds = sanitizeText(data.specialNeeds, 500);
    if (data.totalPrice !== undefined) updateData.totalPrice = sanitizeAmount(data.totalPrice);
    if (data.advancePayment !== undefined) updateData.advancePayment = sanitizeAmount(data.advancePayment);
    if (data.remainingAmount !== undefined) updateData.remainingAmount = sanitizeAmount(data.remainingAmount);
    if (data.adminNotes !== undefined) updateData.adminNotes = sanitizeText(data.adminNotes, 2000);
    if (data.status !== undefined) {
      assertValidStatus(data.status);
      updateData.status = data.status;
    }

    const nextAdvancePayment =
      data.advancePayment !== undefined
        ? sanitizeAmount(data.advancePayment)
        : existing.advancePayment;
    const nextSlot = data.slot ?? (existing.slot as "matinee" | "soiree");
    const nextStatus = data.status ?? (existing.status as BookingStatus);
    const hasDateChanged =
      nextDate !== existing.date ||
      nextMonth !== existing.month ||
      nextYear !== existing.year ||
      nextSlot !== existing.slot;

    if (nextStatus === "confirmed") {
      if ((nextAdvancePayment || 0) <= 0) {
        throw new Error("Le montant d'avance est obligatoire avant de confirmer la réservation.");
      }

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          status: "confirmed",
          date: nextDate,
          month: nextMonth,
          year: nextYear,
          slot: nextSlot,
        },
      });

      if (conflictingBooking) {
        throw new Error("Ce créneau est déjà confirmé pour un autre client.");
      }
    }

    if (data.extras !== undefined) {
      const safeExtras = normalizeExtras(data.extras);
      const legacyExtras = buildLegacyExtras(safeExtras);
      updateData.decoration = legacyExtras.decoration;
      updateData.sonorisation = legacyExtras.sonorisation;
      updateData.climatisation = legacyExtras.climatisation;
      updateData.traiteur = legacyExtras.traiteur;
      updateData.autres = legacyExtras.autres;
      updateData.extrasData = toPrismaJson(safeExtras);
    }

    if (hasDateChanged) {
      const timestamp = new Date().toISOString();
      const previousSlot = existing.slot === "matinee" ? "Matinée" : "Soirée";
      const newSlot = nextSlot === "matinee" ? "Matinée" : "Soirée";
      const trace = `[${timestamp}] Demande déplacée après accord client : ${existing.date}/${existing.month + 1}/${existing.year} ${previousSlot} -> ${nextDate}/${nextMonth + 1}/${nextYear} ${newSlot}.`;
      updateData.adminNotes = `${data.adminNotes !== undefined ? data.adminNotes.trim() : existing.adminNotes || ""}\n${trace}`.trim();
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");

    return {
      success: true,
      booking: {
        id: updated.id,
        dossierNum: updated.dossierNum,
        date: updated.date,
        month: updated.month,
        year: updated.year,
        slot: updated.slot as "matinee" | "soiree",
        status: updated.status as BookingStatus,
        name: updated.name,
        phone: updated.phone,
        eventType: updated.eventType,
        specialNeeds: updated.specialNeeds || "",
        extras: buildBookingExtras(updated),
        totalPrice: updated.totalPrice,
        advancePayment: updated.advancePayment,
        remainingAmount: updated.remainingAmount,
        adminNotes: updated.adminNotes || "",
        createdAt: updated.createdAt.toISOString(),
      }
    };
  } catch (error) {
    console.error("[Prisma updateBookingAction Error]:", error);
    throw new Error(getErrorMessage(error, "Échec de la mise à jour de la réservation."));
  }
}
