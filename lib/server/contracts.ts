import { prisma } from "@/lib/prisma";
import { parseStoredContract } from "@/lib/contracts";

// A dedicated namespace in the existing JSON table avoids any schema migration,
// any change to bookings, and any change to the public site-settings record.
export function bookingContractKey(bookingId: number) {
  return `booking-contract:${bookingId}`;
}

export async function readBookingContract(bookingId: number) {
  const record = await prisma.appSetting.findUnique({
    where: { key: bookingContractKey(bookingId) },
    select: { value: true },
  });
  if (!record) return null;
  const contract = parseStoredContract(record.value);
  if (contract.bookingId !== bookingId) throw new Error("Le contrat ne correspond pas à cette réservation.");
  return contract;
}
