"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  extras: {
    decoration: boolean;
    sonorisation: boolean;
    climatisation: boolean;
    traiteur: boolean;
    autres: boolean;
  };
}

type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

/**
 * Fetch all bookings from the Neon PostgreSQL database.
 */
export async function getBookingsAction() {
  try {
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
      extras: {
        decoration: b.decoration,
        sonorisation: b.sonorisation,
        climatisation: b.climatisation,
        traiteur: b.traiteur,
        autres: b.autres,
      },
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
        decoration: data.extras.decoration,
        sonorisation: data.extras.sonorisation,
        climatisation: data.extras.climatisation,
        traiteur: data.extras.traiteur,
        autres: data.extras.autres,
        totalPrice: data.totalPrice || 0,
      },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");

    return {
      success: true,
      dossierNum: newBooking.dossierNum,
      booking: {
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
        extras: {
          decoration: newBooking.decoration,
          sonorisation: newBooking.sonorisation,
          climatisation: newBooking.climatisation,
          traiteur: newBooking.traiteur,
          autres: newBooking.autres,
        },
        totalPrice: newBooking.totalPrice || 0,
        advancePayment: 0,
        remainingAmount: 0,
        adminNotes: "",
      },
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
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "confirmed" },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");
    return { success: true, id: updated.id };
  } catch (error) {
    console.error("[Prisma approveBookingAction Error]:", error);
    throw new Error("Échec de la validation de la réservation.");
  }
}

/**
 * Archive a booking as rejected to preserve traceability.
 */
export async function rejectBookingAction(id: number) {
  try {
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
 * Archive an approved booking as cancelled to preserve traceability.
 */
export async function cancelBookingAction(id: number) {
  try {
    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    const timestamp = new Date().toISOString();
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        adminNotes: `${existing?.adminNotes || ""}\n[${timestamp}] Réservation confirmée annulée par l'administration.`.trim(),
      },
    });

    revalidatePath("/(admin)/dashboard");
    revalidatePath("/");
    return { success: true, id: updated.id };
  } catch (error) {
    console.error("[Prisma cancelBookingAction Error]:", error);
    throw new Error("Échec de l'annulation de la réservation.");
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
  extras?: {
    decoration: boolean;
    sonorisation: boolean;
    climatisation: boolean;
    traiteur: boolean;
    autres: boolean;
  };
  totalPrice?: number;
  advancePayment?: number;
  remainingAmount?: number;
  adminNotes?: string;
  status?: BookingStatus;
}) {
  try {
    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Réservation introuvable.");
    }

    const updateData: Record<string, string | number | boolean> = {};
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
      updateData.decoration = data.extras.decoration;
      updateData.sonorisation = data.extras.sonorisation;
      updateData.climatisation = data.extras.climatisation;
      updateData.traiteur = data.extras.traiteur;
      updateData.autres = data.extras.autres;
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
        extras: {
          decoration: updated.decoration,
          sonorisation: updated.sonorisation,
          climatisation: updated.climatisation,
          traiteur: updated.traiteur,
          autres: updated.autres,
        },
        totalPrice: updated.totalPrice,
        advancePayment: updated.advancePayment,
        remainingAmount: updated.remainingAmount,
        adminNotes: updated.adminNotes || "",
      }
    };
  } catch (error) {
    console.error("[Prisma updateBookingAction Error]:", error);
    throw new Error("Échec de la mise à jour de la réservation.");
  }
}
