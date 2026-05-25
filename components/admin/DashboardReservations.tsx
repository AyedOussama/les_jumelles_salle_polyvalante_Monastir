"use client";

import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock4,
  Filter,
  Phone,
  Search,
  User,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Booking } from "@/lib/context/BookingContext";

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type DestructiveAction = "reject" | "cancel";

interface PendingDestructiveAction {
  type: DestructiveAction;
  booking: Booking;
}

export interface GroupedPendingBookings {
  date: number;
  month: number;
  year: number;
  slot: "matinee" | "soiree";
  bookings: Booking[];
}

interface DashboardReservationsProps {
  activeTab: "pending" | "confirmed";
  onTabChange: (tab: "pending" | "confirmed") => void;
  pendingCount: number;
  confirmedCount: number;
  groupedPendingBookings: GroupedPendingBookings[];
  confirmedBookings: Booking[];
  hasConfirmedBooking: (booking: Booking) => boolean;
  getConfirmedBookingForSlot: (date: number, month: number, year: number, slot: Booking["slot"]) => Booking | undefined;
  getWaitingListForBooking: (booking: Booking) => Booking[];
  getExtraLabel: (key: string) => string;
  getExtraIcon: (key: string) => ReactNode;
  onOpenEdit: (booking: Booking, targetStatus?: Booking["status"]) => void;
  onReject: (id: number) => Promise<void> | void;
  onCancel: (id: number) => Promise<void> | void;
  onDownloadPdf: (booking: Booking) => void;
}

export function DashboardReservations({
  activeTab,
  onTabChange,
  pendingCount,
  confirmedCount,
  groupedPendingBookings,
  confirmedBookings,
  hasConfirmedBooking,
  getConfirmedBookingForSlot,
  getWaitingListForBooking,
  getExtraLabel,
  getExtraIcon,
  onOpenEdit,
  onReject,
  onCancel,
  onDownloadPdf,
}: DashboardReservationsProps) {
  const [pendingAction, setPendingAction] = useState<PendingDestructiveAction | null>(null);

  const handleConfirmDestructiveAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "reject") {
      await onReject(pendingAction.booking.id);
    } else {
      await onCancel(pendingAction.booking.id);
    }
    setPendingAction(null);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm inline-flex">
          <button
            onClick={() => onTabChange("pending")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "pending"
                ? "bg-[#C5A880] text-white shadow-md shadow-[#C5A880]/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Clock4 size={16} />
            <span>Nouvelles Demandes</span>
            {pendingCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === "pending" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange("confirmed")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "confirmed"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Réservations Confirmées</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === "confirmed" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}>
              {confirmedCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2 border border-slate-200/60 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Clock4 size={14} />
            </div>
            <span className="text-lg font-bold font-mono text-slate-900">{pendingCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">en attente</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2 border border-slate-200/60 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
              <CalendarCheck size={14} />
            </div>
            <span className="text-lg font-bold font-mono text-slate-900">{confirmedCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">confirmées</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden min-h-[500px]">
        {activeTab === "pending" && (
          <PendingBookings
            groups={groupedPendingBookings}
            hasConfirmedBooking={hasConfirmedBooking}
            getConfirmedBookingForSlot={getConfirmedBookingForSlot}
            getExtraLabel={getExtraLabel}
            getExtraIcon={getExtraIcon}
            onOpenEdit={onOpenEdit}
            onRequestReject={(booking) => setPendingAction({ type: "reject", booking })}
          />
        )}

        {activeTab === "confirmed" && (
          <ConfirmedBookings
            bookings={confirmedBookings}
            getWaitingListForBooking={getWaitingListForBooking}
            getExtraLabel={getExtraLabel}
            getExtraIcon={getExtraIcon}
            onOpenEdit={onOpenEdit}
            onRequestCancel={(booking) => setPendingAction({ type: "cancel", booking })}
            onDownloadPdf={onDownloadPdf}
          />
        )}
      </div>

      <DestructiveActionDialog
        action={pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmDestructiveAction}
      />
    </>
  );
}

function PendingBookings({
  groups,
  hasConfirmedBooking,
  getConfirmedBookingForSlot,
  getExtraLabel,
  getExtraIcon,
  onOpenEdit,
  onRequestReject,
}: {
  groups: GroupedPendingBookings[];
  hasConfirmedBooking: (booking: Booking) => boolean;
  getConfirmedBookingForSlot: (date: number, month: number, year: number, slot: Booking["slot"]) => Booking | undefined;
  getExtraLabel: (key: string) => string;
  getExtraIcon: (key: string) => ReactNode;
  onOpenEdit: (booking: Booking, targetStatus?: Booking["status"]) => void;
  onRequestReject: (booking: Booking) => void;
}) {
  return (
    <div>
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-serif font-bold text-lg text-slate-900">Demandes de réservation reçues</h3>
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group) => {
              const bookingMonth = MONTH_NAMES_FR[group.month];
              const confirmedBooking = getConfirmedBookingForSlot(group.date, group.month, group.year, group.slot);
              const isConflictGroup = Boolean(confirmedBooking);

              return (
                <div key={`${group.year}-${group.month}-${group.date}-${group.slot}`} className="relative">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center shrink-0 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C5A880]"></div>
                      <span className="text-[9px] font-bold text-[#C5A880] uppercase tracking-wider leading-none mt-1">{bookingMonth.substring(0,3)}</span>
                      <span className="text-base font-bold font-serif text-slate-900 leading-none">{group.date}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif font-bold text-slate-900 text-sm">
                          {group.date} {bookingMonth} {group.year}
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          group.slot === "matinee" ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"
                        }`}>
                          {group.slot === "matinee" ? "Matinée" : "Soirée"}
                        </span>
                        {isConflictGroup && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold">
                            <AlertTriangle size={11}/>
                            Liste d&apos;attente
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-slate-400 ml-auto">
                          {group.bookings.length} demande{group.bookings.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {confirmedBooking && (
                    <div className="ml-[54px] mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-amber-900">
                        <span className="font-bold uppercase tracking-wider">Créneau confirmé</span>
                        <span className="h-1 w-1 rounded-full bg-amber-500"></span>
                        <span>
                          Dossier <strong>{confirmedBooking.dossierNum}</strong> au nom de <strong>{confirmedBooking.name}</strong>.
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                        Les demandes ci-dessous restent conservées comme liste d&apos;attente. Si cette réservation est annulée, le bouton Accepter sera disponible pour traiter la prochaine demande.
                      </p>
                    </div>
                  )}

                  <div className="ml-7 border-l-2 border-[#C5A880]/20 pl-0 space-y-0">
                    {group.bookings.map((booking, queueIndex) => {
                      const isConflict = hasConfirmedBooking(booking);

                      return (
                        <div key={booking.id} className="relative ml-3">
                          <div className="absolute -left-[19px] top-8 w-3 h-3 rounded-full bg-[#C5A880]/30 border-2 border-[#C5A880] z-10"></div>

                          <div className={`rounded-xl border mb-2 transition-all hover:shadow-md overflow-hidden ${
                            isConflict
                              ? "bg-slate-50 border-slate-200 opacity-70"
                              : "bg-white border-slate-200/80 hover:border-[#C5A880]/30"
                          }`}>
                            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#C5A880]/10 flex items-center justify-center text-[#C5A880] border border-[#C5A880]/20">
                                  <User size={15} />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-bold text-slate-900 text-base leading-tight">{booking.name}</h5>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                      isConflict
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    }`}>
                                      {isConflict ? `Attente n°${queueIndex + 1}` : `Priorité n°${queueIndex + 1}`}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono text-slate-400">Dossier {booking.dossierNum}</span>
                                </div>
                              </div>
                              {isConflict && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
                                  <AlertTriangle size={13}/>
                                  En file d&apos;attente
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col lg:flex-row gap-0">
                              <div className="flex-1 px-4 py-3">
                                <BookingInfo booking={booking} getExtraLabel={getExtraLabel} getExtraIcon={getExtraIcon} />
                              </div>

                              <div className="lg:border-l border-t lg:border-t-0 border-slate-100 px-3 py-3 flex lg:flex-col items-center lg:items-stretch justify-end gap-2 shrink-0 lg:w-36">
                                <button
                                  onClick={() => onOpenEdit(booking)}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm text-center"
                                >
                                  Voir détails
                                </button>
                                <button
                                  onClick={() => onRequestReject(booking)}
                                  className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100 shadow-sm"
                                >
                                  <X size={13} />
                                  Refuser
                                </button>
                                <button
                                  onClick={() => onOpenEdit(booking, "confirmed")}
                                  disabled={isConflict}
                                  className={`w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                    isConflict
                                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                      : "bg-[#C5A880] text-white hover:bg-[#b59870] hover:shadow-md border border-[#ba9d75]"
                                  }`}
                                >
                                  <Check size={13} />
                                  Accepter
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <CheckCircle2 size={32} className="text-slate-300" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Aucune nouvelle demande</h4>
            <p className="text-slate-500 text-sm max-w-sm">
              Toutes les demandes ont été traitées. Les nouvelles demandes de réservation apparaîtront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmedBookings({
  bookings,
  getWaitingListForBooking,
  getExtraLabel,
  getExtraIcon,
  onOpenEdit,
  onRequestCancel,
  onDownloadPdf,
}: {
  bookings: Booking[];
  getWaitingListForBooking: (booking: Booking) => Booking[];
  getExtraLabel: (key: string) => string;
  getExtraIcon: (key: string) => ReactNode;
  onOpenEdit: (booking: Booking) => void;
  onRequestCancel: (booking: Booking) => void;
  onDownloadPdf: (booking: Booking) => void;
}) {
  return (
    <div>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-serif font-bold text-lg text-slate-900">Réservations Confirmées</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un dossier..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] w-64 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-[#F8F9FA] border-b border-slate-200 text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Date de l&apos;événement</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Paiement</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length > 0 ? (
              bookings.map((booking) => {
                const bookingMonth = booking.month !== undefined ? MONTH_NAMES_FR[booking.month] : "Mai";
                const bookingYear = booking.year !== undefined ? booking.year : 2026;
                const waitingList = getWaitingListForBooking(booking);

                return (
                  <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-[#C5A880] font-bold text-xs mb-1">
                        {booking.dossierNum}
                      </div>
                      <div className="font-serif font-bold text-sm text-slate-900 mb-0.5">
                        {booking.date} {bookingMonth} {bookingYear}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        booking.slot === "matinee" ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        {booking.slot === "matinee" ? "Matinée (10h-16h)" : "Soirée (20h-00h)"}
                      </span>
                      {waitingList.length > 0 && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            {waitingList.length} demande{waitingList.length > 1 ? "s" : ""} en liste d&apos;attente
                          </p>
                          <p className="mt-0.5 text-[10px] text-amber-800">
                            Prochaine : {waitingList[0].name} · {waitingList[0].dossierNum}
                          </p>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span>{booking.name}</span>
                      </div>
                      <a href={`tel:${booking.phone}`} className="flex items-center gap-1.5 text-slate-500 text-xs font-mono mb-2 hover:text-[#C5A880] transition-colors">
                        <Phone size={11} className="text-[#C5A880] shrink-0" />
                        <span className="underline">{booking.phone}</span>
                      </a>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="inline-block text-[10px] text-[#C5A880] font-bold bg-[#C5A880]/5 border border-[#C5A880]/15 px-2 py-0.5 rounded">
                          {booking.eventType}
                        </span>
                        {Object.entries(booking.extras).filter(([, val]) => val).length > 0 ? (
                          Object.entries(booking.extras).map(([key, val]) => {
                            if (!val) return null;
                            return (
                              <span
                                key={key}
                                className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-sm"
                                title={getExtraLabel(key)}
                              >
                                {getExtraIcon(key)}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sans extras</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1 max-w-[200px]">
                        <MoneyRow label="Prix Total :" value={booking.totalPrice || 0} />
                        <MoneyRow label="Déjà payé :" value={booking.advancePayment || 0} paid />
                        <div className="pt-1 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Reste :</span>
                          {(booking.remainingAmount || 0) > 0 ? (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                              {(booking.remainingAmount || 0).toLocaleString()} TND
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                              Réglé
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onDownloadPdf(booking)}
                          className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors border border-slate-200 shadow-sm uppercase tracking-wider"
                        >
                          Devis PDF
                        </button>
                        <button
                          onClick={() => onOpenEdit(booking)}
                          className="text-xs font-bold text-[#C5A880] bg-[#C5A880]/10 hover:bg-[#C5A880]/20 px-3 py-2 rounded-lg transition-colors border border-[#C5A880]/20 shadow-sm uppercase tracking-wider"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => onRequestCancel(booking)}
                          className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors border border-rose-100 shadow-sm uppercase tracking-wider"
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 border border-slate-100 mb-4 text-slate-300">
                    <CalendarCheck size={28} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Aucune réservation confirmée</h4>
                  <p className="text-slate-500 text-sm">Acceptez des demandes pour les voir apparaître ici.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DestructiveActionDialog({
  action,
  onClose,
  onConfirm,
}: {
  action: PendingDestructiveAction | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  if (!action) return null;

  const { booking, type } = action;
  const bookingMonth = booking.month !== undefined ? MONTH_NAMES_FR[booking.month] : "Mai";
  const bookingYear = booking.year !== undefined ? booking.year : 2026;
  const isReject = type === "reject";
  const title = isReject ? "Refuser cette demande ?" : "Annuler cette réservation ?";
  const confirmLabel = isReject ? "Oui, refuser la demande" : "Oui, annuler la réservation";
  const consequence = isReject
    ? "La demande ne sera plus affichée dans les nouvelles demandes. Le dossier sera conservé en archive interne pour la traçabilité."
    : "La réservation ne sera plus affichée comme confirmée. Le créneau redeviendra disponible et le dossier sera conservé en archive interne.";

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-500">Action sensible</p>
              <h3 className="mt-1 text-xl font-serif font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{consequence}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <TraceDetail label="Dossier" value={booking.dossierNum} strong />
              <TraceDetail label="Client" value={booking.name} strong />
              <TraceDetail label="Date" value={`${booking.date} ${bookingMonth} ${bookingYear}`} />
              <TraceDetail label="Créneau" value={booking.slot === "matinee" ? "Matinée" : "Soirée"} />
              <TraceDetail label="Téléphone" value={booking.phone} />
              <TraceDetail label="Événement" value={booking.eventType} />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            Vérifiez ces informations avant de continuer. Cette confirmation protège l’utilisateur contre une action accidentelle.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Garder le dossier
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-700 bg-rose-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {isProcessing && <Clock4 size={14} className="animate-spin" />}
            <span>{isProcessing ? "Traitement..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TraceDetail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`mt-0.5 block ${strong ? "font-bold text-slate-950" : "font-medium text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}

function BookingInfo({
  booking,
  getExtraLabel,
  getExtraIcon,
}: {
  booking: Booking;
  getExtraLabel: (key: string) => string;
  getExtraIcon: (key: string) => ReactNode;
}) {
  const selectedExtras = Object.entries(booking.extras).filter(([, val]) => val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Téléphone</label>
        <a href={`tel:${booking.phone}`} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-[#C5A880] transition-colors group/phone">
          <Phone size={14} className="text-[#C5A880]" />
          <span className="font-semibold font-mono group-hover/phone:underline">{booking.phone}</span>
        </a>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type d&apos;événement</label>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          {booking.eventType}
        </span>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Options demandées</label>
        <div className="flex flex-wrap gap-2">
          {selectedExtras.length > 0 ? (
            selectedExtras.map(([key]) => (
              <span key={key} className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 font-medium">
                {getExtraIcon(key)}
                {getExtraLabel(key)}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">Aucune option sélectionnée</span>
          )}
        </div>
      </div>

      {booking.specialNeeds && (
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Demande spéciale</label>
          <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100 text-xs text-amber-800 font-medium leading-relaxed">
            {booking.specialNeeds}
          </div>
        </div>
      )}
    </div>
  );
}

function MoneyRow({ label, value, paid = false }: { label: string; value: number; paid?: boolean }) {
  return (
    <div className="flex justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span className={`font-bold font-mono ${paid ? "text-emerald-600" : "text-slate-800"}`}>
        {value.toLocaleString()} TND
      </span>
    </div>
  );
}
