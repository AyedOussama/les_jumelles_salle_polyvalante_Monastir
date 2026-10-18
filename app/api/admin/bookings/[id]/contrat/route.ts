import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { checkAdminSession } from "@/app/actions/auth";
import { ContractPDF } from "@/components/booking/ContractPDF";
import { prisma } from "@/lib/prisma";
import { readBookingContract } from "@/lib/server/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    if (!await checkAdminSession()) {
      return Response.json({ error: "Session administrateur expirée." }, { status: 401, headers: privateHeaders });
    }
    const { id } = await params;
    const bookingId = Number(id);
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(bookingId) || bookingId <= 0) {
      return Response.json({ error: "Réservation invalide." }, { status: 400, headers: privateHeaders });
    }
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }, select: { dossierNum: true },
    });
    if (!booking) return Response.json({ error: "Réservation introuvable." }, { status: 404, headers: privateHeaders });
    const contract = await readBookingContract(bookingId);
    if (!contract) {
      return Response.json({ error: "Complétez et enregistrez le contrat avant de générer son PDF." }, { status: 404, headers: privateHeaders });
    }
    const artwork = await readFile(path.join(process.cwd(), "public/contract/frame.png"));
    const document = createElement(ContractPDF, {
      data: contract.data,
      dossierNum: booking.dossierNum,
      artworkSrc: `data:image/png;base64,${artwork.toString("base64")}`,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(document);
    const safeDossier = booking.dossierNum.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Contrat_${safeDossier}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[Contract PDF error]:", error);
    return Response.json({ error: "Impossible de générer le contrat PDF. Vos données ont été conservées." }, { status: 500, headers: privateHeaders });
  }
}
