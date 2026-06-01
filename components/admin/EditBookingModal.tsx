"use client";

import { useState } from "react";
import { Calendar, Clock4, ShieldCheck, X } from "lucide-react";
import type { Booking } from "@/lib/context/BookingContext";
import type { SettingExtra } from "@/app/actions/settings";

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatReservationCreatedAt(value?: string) {
  if (!value) return "Date de demande indisponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date de demande indisponible";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Tunis",
  }).format(date);
}

interface EditBookingModalProps {
  booking: Booking;
  targetStatus?: Booking["status"];
  onClose: () => void;
  onSave: (id: number, data: Partial<Omit<Booking, "id" | "dossierNum">>) => Promise<void>;
  getExtraLabel: (key: string) => string;
  availableExtras?: Record<string, SettingExtra>;
}

export function EditBookingModal({
  booking,
  targetStatus,
  onClose,
  onSave,
  getExtraLabel,
  availableExtras,
}: EditBookingModalProps) {
  const [name, setName] = useState(booking.name);
  const [phone, setPhone] = useState(booking.phone);
  const [eventType, setEventType] = useState(booking.eventType);
  const [specialNeeds, setSpecialNeeds] = useState(booking.specialNeeds || "");
  const [extras, setExtras] = useState<Booking["extras"]>(() => buildEditableExtras(booking.extras, availableExtras));
  const [totalPrice, setTotalPrice] = useState(booking.totalPrice || 0);
  const [advancePayment, setAdvancePayment] = useState(booking.advancePayment || 0);
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes || "");
  const [status, setStatus] = useState<Booking["status"]>(targetStatus || booking.status || "pending");
  const [paymentError, setPaymentError] = useState("");
  const [eventDate, setEventDate] = useState(booking.date);
  const [eventMonth, setEventMonth] = useState(booking.month !== undefined ? booking.month : 4);
  const [eventYear, setEventYear] = useState(booking.year !== undefined ? booking.year : 2026);
  const [eventSlot, setEventSlot] = useState<Booking["slot"]>(booking.slot);

  const yearOptions = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() + index);

  const handleSave = async () => {
    if (status === "confirmed" && advancePayment <= 0) {
      setPaymentError("Le montant d'avance est obligatoire avant de confirmer la réservation.");
      return;
    }

    setPaymentError("");
    const remainingAmount = Math.max(0, totalPrice - advancePayment);
    await onSave(booking.id, {
      date: eventDate,
      month: eventMonth,
      year: eventYear,
      slot: eventSlot,
      name,
      phone,
      eventType,
      specialNeeds,
      extras,
      totalPrice,
      advancePayment,
      remainingAmount,
      adminNotes,
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-mono text-[#C5A880] font-bold bg-[#C5A880]/10 px-2 py-0.5 rounded border border-[#C5A880]/20">
              Dossier {booking.dossierNum}
            </span>
            <h3 className="text-xl font-serif font-bold text-slate-900 mt-1">
              Détails de la réservation
            </h3>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
              <Clock4 size={13} className="text-[#C5A880]" />
              Demande reçue le {formatReservationCreatedAt(booking.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C5A880]">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Créneau de l&apos;événement</p>
                <p className="text-sm font-bold font-serif text-slate-100">
                  {eventDate} {MONTH_NAMES_FR[eventMonth]} {eventYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                eventSlot === "matinee" ? "bg-sky-500/20 text-sky-300" : "bg-indigo-500/20 text-indigo-300"
              }`}>
                {eventSlot === "matinee" ? "Matinée (10h-16h)" : "Soirée (20h-00h)"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Réattribuer à une autre date</h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-700">
                À utiliser uniquement après accord du client. La modification sera sauvegardée dans les notes privées pour garder la traçabilité.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jour</label>
                <select
                  value={eventDate}
                  onChange={(e) => setEventDate(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880]"
                >
                  {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mois</label>
                <select
                  value={eventMonth}
                  onChange={(e) => setEventMonth(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880]"
                >
                  {MONTH_NAMES_FR.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Année</label>
                <select
                  value={eventYear}
                  onChange={(e) => setEventYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880]"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Créneau</label>
                <select
                  value={eventSlot}
                  onChange={(e) => setEventSlot(e.target.value as Booking["slot"])}
                  className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880]"
                >
                  <option value="matinee">Matinée</option>
                  <option value="soiree">Soirée</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">Informations de Contact</h4>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Nom Complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Téléphone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Type d&apos;Événement</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all font-semibold"
                >
                  <option value="Mariage">Mariage</option>
                  <option value="Fiançailles">Fiançailles</option>
                  <option value="Outia">Outia</option>
                  <option value="Cocktail">Cocktail</option>
                  <option value="Réunion / Séminaire">Réunion / Séminaire</option>
                  <option value="Autre">Autre Événement</option>
                </select>
              </div>
            </div>

              <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">Options & Prestations choisies</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {Object.entries(extras).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/60 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => setExtras({
                        ...extras,
                        [key]: e.target.checked,
                      })}
                      className="rounded text-[#C5A880] focus:ring-[#C5A880] border-slate-300 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {getExtraLabel(key)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Demandes et souhaits du client (visibles au devis)</label>
            <textarea
              value={specialNeeds}
              onChange={(e) => setSpecialNeeds(e.target.value)}
              placeholder="Ex: Demande de buffet sucré-salé, trône de couleur blanc et doré, etc."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
            />
          </div>

          <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#C5A880]/25 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#C5A880]/15">
              <ShieldCheck size={18} className="text-[#C5A880]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A815E]">Paiement</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PaymentInput label="PRIX TOTAL CONVENU (TND)" value={totalPrice} onChange={setTotalPrice} />
              <PaymentInput
                label="MONTANT D'AVANCE PAYÉ (TND)"
                value={advancePayment}
                onChange={(value) => {
                  setAdvancePayment(value);
                  if (value > 0) setPaymentError("");
                }}
                paid
                required={status === "confirmed"}
                error={paymentError}
              />

              <div className="flex flex-col justify-end">
                <div className="bg-[#1A242B] rounded-xl p-3 border border-slate-800 text-white flex justify-between items-center h-[46px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reste à payer :</span>
                  <span className="text-sm font-bold font-mono text-[#C5A880]">
                    {Math.max(0, totalPrice - advancePayment).toLocaleString()} TND
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck size={14} className="text-[#C5A880]" />
              <label className="block text-xs font-bold text-slate-600 uppercase">Notes privées <span className="text-slate-400 normal-case font-normal">(visibles uniquement par vous)</span></label>
            </div>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notes techniques, conditions d'annulation, numéro de reçu de l'acompte, etc."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all font-medium"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase">Statut de la réservation</h5>
              <p className="text-[10px] text-slate-500">Une réservation confirmée bloque la date sur le calendrier.</p>
            </div>
            <select
              value={status}
              onChange={(e) => {
                const nextStatus = e.target.value as Booking["status"];
                setStatus(nextStatus);
                if (nextStatus !== "confirmed" || advancePayment > 0) {
                  setPaymentError("");
                }
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
            >
              <option value="pending">En attente de confirmation</option>
              <option value="confirmed">Confirmé</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-[#1A242B] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-all hover:-translate-y-0.5"
          >
            Enregistrer les Modifications
          </button>
        </div>
      </div>
    </div>
  );
}

function buildEditableExtras(
  bookingExtras: Booking["extras"] | undefined,
  availableExtras: Record<string, SettingExtra> | undefined,
) {
  const legacyKeys = ["decoration", "sonorisation", "climatisation", "traiteur", "autres"];
  const configuredKeys = Object.keys(availableExtras || {});
  const baseKeys = configuredKeys.length > 0 ? configuredKeys : legacyKeys;
  const selectedLegacyKeys = Object.entries(bookingExtras || {})
    .filter(([, value]) => value)
    .map(([key]) => key);
  const keys = Array.from(new Set([...baseKeys, ...selectedLegacyKeys]));

  return keys.reduce<Booking["extras"]>((acc, key) => {
    acc[key] = Boolean(bookingExtras?.[key]);
    return acc;
  }, {});
}

function PaymentInput({
  label,
  value,
  onChange,
  paid = false,
  required = false,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  paid?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label}{required && <span className="text-rose-500"> *</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          min={0}
          required={required}
          aria-invalid={Boolean(error)}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full pl-4 pr-12 py-3 bg-white border rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 transition-all ${
            error ? "border-rose-300 focus:ring-rose-100 focus:border-rose-400" : "border-slate-200 focus:ring-[#C5A880]/20 focus:border-[#C5A880]"
          } ${
            paid ? "text-emerald-700" : ""
          }`}
          placeholder="0"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">TND</span>
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{error}</p>
      )}
    </div>
  );
}
