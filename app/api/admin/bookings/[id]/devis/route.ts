import { readFile } from "fs/promises";
import path from "path";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { checkAdminSession } from "@/app/actions/auth";
import { getSettingsAction } from "@/app/actions/settings";
import { InvoicePDF } from "@/components/booking/InvoicePDF";
import { prisma } from "@/lib/prisma";
import type { BookingExtras } from "@/app/actions/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEGACY_EXTRA_KEYS = ["decoration", "sonorisation", "climatisation", "traiteur", "autres"] as const;

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
  if (!value) return {};

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

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "client";
}

async function getLogoDataUri(request: Request) {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo_complet.png");
    const logo = await readFile(logoPath);
    return `data:image/png;base64,${logo.toString("base64")}`;
  } catch (error) {
    console.error("[Invoice logo read error]:", error);
    return new URL("/logo_complet.png", request.url).toString();
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return Response.json({ error: "Session administrateur expirée." }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return Response.json({ error: "Réservation invalide." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return Response.json({ error: "Réservation introuvable." }, { status: 404 });
    }

    const settings = await getSettingsAction();
    const logoSrc = await getLogoDataUri(request);
    const pdfDocument = createElement(InvoicePDF, {
      booking: {
        dossierNum: booking.dossierNum,
        date: booking.date,
        month: booking.month,
        year: booking.year,
        slot: booking.slot as "matinee" | "soiree",
        name: booking.name,
        phone: booking.phone,
        eventType: booking.eventType,
        specialNeeds: booking.specialNeeds || "",
        extras: buildBookingExtras(booking),
        totalPrice: booking.totalPrice || 0,
        advancePayment: booking.advancePayment || 0,
        remainingAmount: booking.remainingAmount || 0,
      },
      settings,
      logoSrc,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const pdfBuffer = await renderToBuffer(pdfDocument);
    const pdfBytes = new Uint8Array(pdfBuffer.length);
    pdfBytes.set(pdfBuffer);
    const filename = `Devis_${booking.dossierNum}_${sanitizeFileName(booking.name)}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[Invoice PDF route error]:", error);
    return Response.json({ error: "Impossible de générer le devis PDF." }, { status: 500 });
  }
}
