"use server";

import { requireAdminSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { validateContractData, type StoredContract } from "@/lib/contracts";
import { bookingContractKey, readBookingContract } from "@/lib/server/contracts";

function assertBookingId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Réservation invalide.");
}

export async function getBookingContractAction(bookingId: number) {
  await requireAdminSession();
  assertBookingId(bookingId);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true } });
  if (!booking) throw new Error("Réservation introuvable.");
  return readBookingContract(bookingId);
}

export async function saveBookingContractAction(bookingId: number, input: unknown) {
  await requireAdminSession();
  assertBookingId(bookingId);
  const result = validateContractData(input);
  if (!result.valid) return { success: false as const, errors: result.errors };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, dossierNum: true, status: true },
  });
  if (!booking) throw new Error("Réservation introuvable.");
  if (booking.status !== "confirmed") throw new Error("La réservation doit être confirmée pour établir son contrat.");

  const contract: StoredContract = {
    version: 1,
    bookingId,
    dossierNum: booking.dossierNum,
    data: result.data,
    savedAt: new Date().toISOString(),
  };
  const value = JSON.parse(JSON.stringify(contract)) as Prisma.InputJsonValue;
  await prisma.appSetting.upsert({
    where: { key: bookingContractKey(bookingId) },
    create: { key: bookingContractKey(bookingId), value },
    update: { value },
  });
  return { success: true as const, contract };
}
