"use server";

import type { Prisma } from "@/lib/generated/prisma/client";
import { sendBookingNotificationEmail } from "@/lib/email/booking-notification";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSettingsAction } from "./settings";

const LEGACY_EXTRA_KEYS = ["decoration", "sonorisation", "climatisation", "traiteur", "autres"] as const;

type BookingExtraKey = (typeof LEGACY_EXTRA_KEYS)[number];
export type BookingExtras = Record<string, boolean>;

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
 * Fetch all bookings from the Neon PostgreSQL database.
 */
export async function getBookingsAction() {
  try {
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
    await ensureBookingExtrasColumn();

    // Validation des données d'entrée
    if (!data.name?.trim() || !data.phone?.trim() || !data.eventType?.trim()) {
      throw new Error("Nom, téléphone et type d'événement sont obligatoires.");
    }
    if (!data.slot || !["matinee", "soiree"].includes(data.slot)) {
      throw new Error("Créneau horaire invalide.");
    }
    if (!data.date || data.date < 1 || data.date > 31) {
      throw new Error("Date invalide.");
    }

    // Nettoyage des chaînes
    const safeName = data.name.trim().slice(0, 100);
    const safePhone = data.phone.trim().slice(0, 20);
    const safeEventType = data.eventType.trim().slice(0, 50);
    const safeSpecialNeeds = (data.specialNeeds || "").trim().slice(0, 500);
    const safeExtras = normalizeExtras(data.extras);
    const legacyExtras = buildLegacyExtras(safeExtras);

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
        totalPrice: data.totalPrice || 0,
      },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");

    const responseBooking = {
      id: newBooking.id,
      dossierNum: newBooking.dossierNum,
      date: newBooking.date,
      month: newBooking.month,
      year: newBooking.year,
      slot: newBooking.slot as "matinee" | "soiree",
      status: newBooking.status as BookingStatus,
      name: newBooking.name,
      phone: newBooking.phone,
      eventType: newBooking.eventType,
      specialNeeds: newBooking.specialNeeds || "",
      extras: buildBookingExtras(newBooking),
      totalPrice: newBooking.totalPrice || 0,
      advancePayment: 0,
      remainingAmount: 0,
      adminNotes: "",
    };

    try {
      const settings = await getSettingsAction();
      await sendBookingNotificationEmail(responseBooking, settings);
    } catch (emailError) {
      console.error("[Booking notification email Error]:", emailError);
    }

    return {
      success: true,
      dossierNum: newBooking.dossierNum,
      booking: responseBooking,
    };
  } catch (error) {
    console.error("[Prisma createBookingAction Error]:", error);
    throw new Error("Échec de la création de la réservation.");
  }
}

/**
 * Approve a pending booking (change status to 'confirmed').
 */
export async function approveBookingAction(id: number) {
  try {
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
    await ensureBookingExtrasColumn();

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

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
    await ensureBookingExtrasColumn();

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Réservation introuvable.");
    }

    const updateData: Record<string, string | number | boolean | Prisma.InputJsonValue> = {};
    if (data.date !== undefined) {
      if (data.date < 1 || data.date > 31) throw new Error("Date invalide.");
      updateData.date = data.date;
    }
    if (data.month !== undefined) {
      if (data.month < 0 || data.month > 11) throw new Error("Mois invalide.");
      updateData.month = data.month;
    }
    if (data.year !== undefined) {
      if (data.year < 2024 || data.year > 2100) throw new Error("Année invalide.");
      updateData.year = data.year;
    }
    if (data.slot !== undefined) {
      if (!["matinee", "soiree"].includes(data.slot)) throw new Error("Créneau invalide.");
      updateData.slot = data.slot;
    }
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.eventType !== undefined) updateData.eventType = data.eventType;
    if (data.specialNeeds !== undefined) updateData.specialNeeds = data.specialNeeds.trim();
    if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
    if (data.advancePayment !== undefined) updateData.advancePayment = data.advancePayment;
    if (data.remainingAmount !== undefined) updateData.remainingAmount = data.remainingAmount;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes.trim();
    if (data.status !== undefined) updateData.status = data.status;

    const nextAdvancePayment = data.advancePayment ?? existing.advancePayment;
    const nextDate = data.date ?? existing.date;
    const nextMonth = data.month ?? existing.month;
    const nextYear = data.year ?? existing.year;
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
      }
    };
  } catch (error) {
    console.error("[Prisma updateBookingAction Error]:", error);
    throw new Error(getErrorMessage(error, "Échec de la mise à jour de la réservation."));
  }
}
