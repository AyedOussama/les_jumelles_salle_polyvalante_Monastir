import { Resend } from "resend";
import type { SystemSettings } from "@/app/actions/settings";

const NOTIFICATION_TO = process.env.BOOKING_NOTIFICATION_TO || "lesjumelles625@gmail.com";
const DEFAULT_FROM = "Les Jumelles Monastir <onboarding@resend.dev>";

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DEFAULT_EXTRA_LABELS: Record<string, string> = {
  decoration: "Décoration",
  sonorisation: "Sonorisation",
  climatisation: "Climatisation",
  traiteur: "Traiteur",
  autres: "Spécifique",
};

interface BookingNotificationPayload {
  dossierNum: string;
  date: number;
  month: number;
  year: number;
  slot: "matinee" | "soiree";
  name: string;
  phone: string;
  eventType: string;
  specialNeeds?: string;
  extras: Record<string, boolean>;
  totalPrice?: number;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value?: number) {
  return `${(value || 0).toLocaleString("fr-FR")} TND`;
}

function getPublicSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "";

  if (!rawUrl) return "";
  return rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    from: process.env.RESEND_FROM || process.env.EMAIL_FROM || DEFAULT_FROM,
  };
}

function getSelectedExtras(booking: BookingNotificationPayload, settings: SystemSettings | null) {
  const configuredLabels = settings?.extras
    ? Object.fromEntries(Object.entries(settings.extras).map(([key, extra]) => [key, extra.label]))
    : DEFAULT_EXTRA_LABELS;

  return Object.entries(booking.extras || {})
    .filter(([, selected]) => selected)
    .map(([key]) => configuredLabels[key] || key);
}

function buildTextEmail(
  booking: BookingNotificationPayload,
  selectedExtras: string[],
  dashboardUrl: string,
) {
  const eventDate = `${booking.date} ${MONTH_NAMES_FR[booking.month]} ${booking.year}`;
  const slotLabel = booking.slot === "matinee" ? "Matinée (10h-16h)" : "Soirée (20h-00h)";

  return [
    "Nouvelle demande de réservation - Les Jumelles Monastir",
    "",
    `Dossier: ${booking.dossierNum}`,
    `Client: ${booking.name}`,
    `Téléphone: ${booking.phone}`,
    `Date: ${eventDate}`,
    `Créneau: ${slotLabel}`,
    `Événement: ${booking.eventType}`,
    `Montant estimé: ${formatMoney(booking.totalPrice)}`,
    `Options: ${selectedExtras.length > 0 ? selectedExtras.join(", ") : "Aucune option sélectionnée"}`,
    `Demandes client: ${booking.specialNeeds || "Aucune demande particulière"}`,
    dashboardUrl ? `Dashboard: ${dashboardUrl}` : "",
  ].filter(Boolean).join("\n");
}

function buildHtmlEmail(
  booking: BookingNotificationPayload,
  selectedExtras: string[],
  dashboardUrl: string,
) {
  const eventDate = `${booking.date} ${MONTH_NAMES_FR[booking.month]} ${booking.year}`;
  const slotLabel = booking.slot === "matinee" ? "Matinée (10h-16h)" : "Soirée (20h-00h)";
  const extrasHtml = selectedExtras.length > 0
    ? selectedExtras.map((extra) => `
        <span style="display:inline-block;margin:0 8px 8px 0;padding:8px 11px;border-radius:999px;background:#f8f3ea;border:1px solid #eadcc8;color:#7c6547;font-size:12px;font-weight:700;">
          ${escapeHtml(extra)}
        </span>
      `).join("")
    : `<span style="color:#94a3b8;font-size:13px;font-style:italic;">Aucune option sélectionnée</span>`;

  return `
    <div style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6f8;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
              <tr>
                <td style="background:#111827;padding:26px 30px;border-bottom:4px solid #c5a880;">
                  <div style="font-size:11px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;color:#c5a880;">Nouvelle réservation</div>
                  <h1 style="margin:9px 0 0;font-family:Georgia,serif;font-size:25px;line-height:1.2;color:#ffffff;">Demande reçue sur le site</h1>
                  <div style="margin-top:12px;display:inline-block;padding:7px 11px;border-radius:999px;background:rgba(197,168,128,0.16);color:#f6e6cd;font-size:12px;font-weight:800;">
                    Dossier ${escapeHtml(booking.dossierNum)}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:28px 30px 8px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:0 0 14px;">
                        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;">Client</div>
                        <div style="margin-top:6px;font-size:22px;font-family:Georgia,serif;font-weight:700;color:#0f172a;">${escapeHtml(booking.name)}</div>
                        <a href="tel:${escapeHtml(booking.phone)}" style="display:inline-block;margin-top:6px;color:#c5a880;font-size:15px;font-weight:800;text-decoration:none;">${escapeHtml(booking.phone)}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 30px 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="50%" style="padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#fbfbfc;">
                        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#94a3b8;">Date</div>
                        <div style="margin-top:6px;font-size:15px;font-weight:800;color:#111827;">${escapeHtml(eventDate)}</div>
                      </td>
                      <td width="16" style="font-size:0;line-height:0;">&nbsp;</td>
                      <td width="50%" style="padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:#fbfbfc;">
                        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#94a3b8;">Créneau</div>
                        <div style="margin-top:6px;font-size:15px;font-weight:800;color:#111827;">${escapeHtml(slotLabel)}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 30px 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eadcc8;border-radius:18px;background:#fcfaf7;">
                    <tr>
                      <td style="padding:18px;">
                        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:#9a815e;">Événement</div>
                        <div style="margin-top:6px;font-size:17px;font-weight:800;color:#111827;">${escapeHtml(booking.eventType)}</div>
                        <div style="margin-top:14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:#9a815e;">Montant estimé</div>
                        <div style="margin-top:6px;font-size:22px;font-family:Georgia,serif;font-weight:800;color:#c5a880;">${formatMoney(booking.totalPrice)}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 30px 22px;">
                  <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:#94a3b8;margin-bottom:10px;">Options sélectionnées</div>
                  <div>${extrasHtml}</div>
                </td>
              </tr>

              <tr>
                <td style="padding:0 30px 26px;">
                  <div style="padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:#64748b;margin-bottom:8px;">Demandes particulières</div>
                    <div style="font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(booking.specialNeeds || "Aucune demande particulière.")}</div>
                  </div>
                </td>
              </tr>

              ${dashboardUrl ? `
                <tr>
                  <td align="center" style="padding:0 30px 30px;">
                    <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:13px;padding:14px 20px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.14em;">
                      Ouvrir le dashboard
                    </a>
                  </td>
                </tr>
              ` : ""}

              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 30px;color:#64748b;font-size:12px;line-height:1.6;">
                  Cet email a été envoyé automatiquement après une nouvelle demande de réservation sur le site Les Jumelles Monastir.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendBookingNotificationEmail(
  booking: BookingNotificationPayload,
  settings: SystemSettings | null,
) {
  const resendConfig = getResendConfig();

  if (!resendConfig) {
    console.warn("[Booking email skipped]: RESEND_API_KEY is not configured.");
    return;
  }

  const selectedExtras = getSelectedExtras(booking, settings);
  const dashboardUrl = getPublicSiteUrl() ? `${getPublicSiteUrl()}/dashboard` : "";
  const subject = `Nouvelle réservation ${booking.dossierNum} - ${booking.name}`;
  const resend = new Resend(resendConfig.apiKey);
  const { error } = await resend.emails.send({
    from: resendConfig.from,
    to: [NOTIFICATION_TO],
    subject,
    text: buildTextEmail(booking, selectedExtras, dashboardUrl),
    html: buildHtmlEmail(booking, selectedExtras, dashboardUrl),
  });

  if (error) {
    throw new Error(`Resend a refusé l'envoi: ${error.message}`);
  }
}
