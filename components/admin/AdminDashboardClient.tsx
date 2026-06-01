"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Loader2, Sparkles, Speaker, Utensils, Wind } from "lucide-react";
import { useBookings } from "@/lib/context/BookingContext";
import type { Booking } from "@/lib/context/BookingContext";
import { checkAdminSession, logoutAdmin } from "@/app/actions/auth";
import { getSettingsAction, updateSettingsAction } from "@/app/actions/settings";
import type { SystemSettings } from "@/app/actions/settings";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardReservations } from "@/components/admin/DashboardReservations";
import type { GroupedPendingBookings } from "@/components/admin/DashboardReservations";
import { EditBookingModal } from "@/components/admin/EditBookingModal";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

export function AdminDashboardClient() {
  const { bookings, rejectBooking, cancelBooking, updateBooking, loadAdminBookings } = useBookings();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("pending");
  const [activeView, setActiveView] = useState<"dashboard" | "settings">("dashboard");
  const [activeSettingsSection, setActiveSettingsSection] = useState<"packs" | "extras" | "photos">("packs");
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [savedSettingsSignature, setSavedSettingsSignature] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<null | (() => void | Promise<void>)>(null);
  const router = useRouter();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editTargetStatus, setEditTargetStatus] = useState<Booking["status"] | undefined>();

  const openEditModal = (booking: Booking, targetStatus?: Booking["status"]) => {
    setEditingBooking(booking);
    setEditTargetStatus(targetStatus);
  };

  const settingsSignature = useMemo(() => {
    return settings ? JSON.stringify(settings) : null;
  }, [settings]);

  const hasUnsavedSettings =
    activeView === "settings" &&
    Boolean(settingsSignature && savedSettingsSignature && settingsSignature !== savedSettingsSignature);

  const handleSaveEdit = async (id: number, data: Partial<Omit<Booking, "id" | "dossierNum">>) => {
    try {
      await updateBooking(id, data);
      setEditingBooking(null);
      setEditTargetStatus(undefined);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de l'enregistrement des modifications.");
    }
  };

  const downloadPdfInvoice = async (booking: Booking) => {
    try {
      let pdfRenderer: typeof import("@react-pdf/renderer");
      try {
        pdfRenderer = await import("@react-pdf/renderer");
      } catch (e) {
        console.error("@react-pdf/renderer not installed", e);
        alert("Pour générer des PDF, veuillez installer la dépendance en exécutant cette commande dans votre terminal :\n\nnpm install @react-pdf/renderer");
        return;
      }

      // Import dynamique du composant pour éviter les avertissements SSR
      const { InvoicePDF } = await import("@/components/booking/InvoicePDF");

      let activeSettings = settings;
      if (!activeSettings) {
        try {
          activeSettings = await getSettingsAction();
        } catch (e) {
          console.error("Failed to load settings for PDF:", e);
        }
      }

      const pdfInstance = pdfRenderer.pdf(<InvoicePDF booking={booking} settings={activeSettings} />);
      const blob = await pdfInstance.toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Devis_${booking.dossierNum}_${booking.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[PDF generation error]:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  };

  // Validate httpOnly session cookie on mount
  useEffect(() => {
    let isMounted = true;
    let refreshInterval: ReturnType<typeof setInterval> | undefined;

    const verifySession = async () => {
      const isAuthenticated = await checkAdminSession();
      if (!isAuthenticated) {
        router.push("/admin");
      } else {
        await loadAdminBookings();
        if (!isMounted) return;
        setIsAuth(true);
        refreshInterval = setInterval(() => {
          void loadAdminBookings();
        }, 30000);
      }
    };
    verifySession();

    const loadSettings = async () => {
      try {
        const s = await getSettingsAction();
        setSettings(s);
        setSavedSettingsSignature(JSON.stringify(s));
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [router, loadAdminBookings]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedSettings) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedSettings]);

  const handleSaveSettings = async () => {
    if (!settings) return false;
    setSavingSettings(true);
    try {
      const res = await updateSettingsAction(settings);
      if (res.success) {
        const persistedSettings = res.settings || settings;
        setSettings(persistedSettings);
        setSavedSettingsSignature(JSON.stringify(persistedSettings));
        alert("Paramètres de la salle sauvegardés avec succès !");
        return true;
      } else {
        alert("Erreur lors de la sauvegarde : " + res.error);
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur inattendue est survenue lors de la sauvegarde.");
      return false;
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingsPersisted = (persistedSettings: SystemSettings) => {
    setSavedSettingsSignature(JSON.stringify(persistedSettings));
  };

  const requestProtectedLeave = (action: () => void | Promise<void>) => {
    if (hasUnsavedSettings) {
      setPendingLeaveAction(() => action);
      return;
    }
    void action();
  };

  const handleSaveThenLeave = async () => {
    const action = pendingLeaveAction;
    const saved = await handleSaveSettings();
    if (!saved) return;
    setPendingLeaveAction(null);
    await action?.();
  };

  const handleLogout = async () => {
    await logoutAdmin();
    router.push("/admin");
    router.refresh();
  };

  const getExtraLabel = (key: string) => {
    if (settings && settings.extras && settings.extras[key]) {
      return settings.extras[key].label;
    }
    const defaultLabels: Record<string, string> = {
      decoration: "Décoration",
      sonorisation: "Sonorisation",
      climatisation: "Climatisation",
      traiteur: "Traiteur",
      autres: "Spécifique"
    };
    return defaultLabels[key] || key;
  };

  const getExtraIcon = (key: string) => {
    switch (key) {
      case "decoration": return <Sparkles size={12} />;
      case "sonorisation": return <Speaker size={12} />;
      case "climatisation": return <Wind size={12} />;
      case "traiteur": return <Utensils size={12} />;
      default: return <ClipboardCheck size={12} />;
    }
  };

  // Loading Screen while verifying session
  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-slate-500">
        <Loader2 size={40} className="animate-spin text-[#C5A880] mb-4" />
        <h2 className="text-xl font-serif text-slate-800 font-bold tracking-wide">Connexion en cours</h2>
        <p className="text-sm font-light tracking-wide mt-2">Veuillez patienter...</p>
      </div>
    );
  }

  // Helpers for queue and duplicate checks
  const hasConfirmedBooking = (booking: Booking) => {
    return bookings.some((b) => 
      b.status === "confirmed" && 
      b.date === booking.date && 
      (b.month === undefined ? 4 : b.month) === (booking.month === undefined ? 4 : booking.month) && 
      (b.year === undefined ? 2026 : b.year) === (booking.year === undefined ? 2026 : booking.year) && 
      b.slot === booking.slot
    );
  };

  const getConfirmedBookingForSlot = (
    date: number,
    month: number,
    year: number,
    slot: Booking["slot"]
  ) => {
    return bookings.find((booking) =>
      booking.status === "confirmed" &&
      booking.date === date &&
      (booking.month === undefined ? 4 : booking.month) === month &&
      (booking.year === undefined ? 2026 : booking.year) === year &&
      booking.slot === slot
    );
  };

  const getWaitingListForBooking = (confirmedBooking: Booking) => {
    return bookings
      .filter((booking) =>
        booking.status === "pending" &&
        booking.date === confirmedBooking.date &&
        (booking.month === undefined ? 4 : booking.month) === (confirmedBooking.month === undefined ? 4 : confirmedBooking.month) &&
        (booking.year === undefined ? 2026 : booking.year) === (confirmedBooking.year === undefined ? 2026 : confirmedBooking.year) &&
        booking.slot === confirmedBooking.slot
      )
      .sort((a, b) => a.id - b.id);
  };

  const pendingBookings = bookings
    .filter((b) => b.status === "pending")
    .sort((a, b) => {
      const yearA = a.year !== undefined ? a.year : 2026;
      const yearB = b.year !== undefined ? b.year : 2026;
      const monthA = a.month !== undefined ? a.month : 4;
      const monthB = b.month !== undefined ? b.month : 4;
      
      if (yearA !== yearB) return yearA - yearB;
      if (monthA !== monthB) return monthA - monthB;
      if (a.date !== b.date) return a.date - b.date;
      if (a.slot !== b.slot) return a.slot === "matinee" ? -1 : 1;
      return a.id - b.id; // oldest booking first
    });

  const confirmedBookings = bookings
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => {
      const yearA = a.year !== undefined ? a.year : 2026;
      const yearB = b.year !== undefined ? b.year : 2026;
      const monthA = a.month !== undefined ? a.month : 4;
      const monthB = b.month !== undefined ? b.month : 4;
      
      if (yearA !== yearB) return yearA - yearB;
      if (monthA !== monthB) return monthA - monthB;
      if (a.date !== b.date) return a.date - b.date;
      return a.slot === "matinee" ? -1 : 1;
    });

  const groupedPendingBookings: GroupedPendingBookings[] = [];

  pendingBookings.forEach((booking) => {
    const bookingMonth = booking.month !== undefined ? booking.month : 4;
    const bookingYear = booking.year !== undefined ? booking.year : 2026;
    
    let group = groupedPendingBookings.find(
      (g) =>
        g.date === booking.date &&
        g.month === bookingMonth &&
        g.year === bookingYear &&
        g.slot === booking.slot
    );

    if (!group) {
      group = {
        date: booking.date,
        month: bookingMonth,
        year: bookingYear,
        slot: booking.slot,
        bookings: [],
      };
      groupedPendingBookings.push(group);
    }
    
    group.bookings.push(booking);
  });

  groupedPendingBookings.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    if (a.date !== b.date) return a.date - b.date;
    return a.slot === "matinee" ? -1 : 1;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('fr-FR', options);
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F5F7] font-sans text-slate-800">
      <AdminSidebar
        activeView={activeView}
        onViewChange={(view) => {
          if (view === activeView) return;
          requestProtectedLeave(() => setActiveView(view));
        }}
        onGoPublic={() => requestProtectedLeave(() => router.push("/"))}
        onLogout={() => requestProtectedLeave(handleLogout)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        <AdminHeader
          activeView={activeView}
          formattedDate={formattedDate}
          pendingCount={pendingCount}
          onLogout={() => requestProtectedLeave(handleLogout)}
          hasUnsavedSettings={hasUnsavedSettings}
        />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar relative z-0">
          
          {activeView === "dashboard" && (
            <DashboardReservations
              activeTab={activeTab}
              onTabChange={setActiveTab}
              pendingCount={pendingCount}
              confirmedCount={confirmedCount}
              groupedPendingBookings={groupedPendingBookings}
              confirmedBookings={confirmedBookings}
              hasConfirmedBooking={hasConfirmedBooking}
              getConfirmedBookingForSlot={getConfirmedBookingForSlot}
              getWaitingListForBooking={getWaitingListForBooking}
              getExtraLabel={getExtraLabel}
              getExtraIcon={getExtraIcon}
              onOpenEdit={openEditModal}
              onReject={rejectBooking}
              onCancel={cancelBooking}
              onDownloadPdf={downloadPdfInvoice}
            />
          )}

      {activeView === "settings" && (
        <SettingsPanel
          settings={settings}
          setSettings={setSettings}
          settingsLoading={settingsLoading}
          savingSettings={savingSettings}
          activeSettingsSection={activeSettingsSection}
          setActiveSettingsSection={setActiveSettingsSection}
          activePackId={activePackId}
          setActivePackId={setActivePackId}
          onSave={handleSaveSettings}
          onSettingsPersisted={handleSettingsPersisted}
        />
      )}

          <div className="h-8"></div> {/* Bottom padding */}
        </main>
      </div>

      {editingBooking && (
        <EditBookingModal
          key={`${editingBooking.id}-${editTargetStatus || editingBooking.status}`}
          booking={editingBooking}
          targetStatus={editTargetStatus}
          onClose={() => {
            setEditingBooking(null);
            setEditTargetStatus(undefined);
          }}
          onSave={handleSaveEdit}
          getExtraLabel={getExtraLabel}
          availableExtras={settings?.extras}
        />
      )}

      <UnsavedSettingsDialog
        open={Boolean(pendingLeaveAction)}
        saving={savingSettings}
        onClose={() => setPendingLeaveAction(null)}
        onSaveThenLeave={handleSaveThenLeave}
      />

    </div>
  );
}

function UnsavedSettingsDialog({
  open,
  saving,
  onClose,
  onSaveThenLeave,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSaveThenLeave: () => void | Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-amber-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="border-b border-slate-100 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">Modifications non sauvegardées</p>
          <h3 className="mt-2 text-xl font-serif font-bold text-slate-950">Sauvegarder avant de continuer</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Vous avez modifié les paramètres de la salle. Sauvegardez d&apos;abord pour passer à une autre partie.
          </p>
        </div>

        <div className="mx-6 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          Cette protection apparaît uniquement lorsqu’il y a des changements non enregistrés.
        </div>

        <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Rester ici
          </button>
          <button
            type="button"
            onClick={onSaveThenLeave}
            disabled={saving}
            className="rounded-xl border border-[#b2936a] bg-[#C5A880] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#b2936a] disabled:opacity-60"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder et quitter"}
          </button>
        </div>
      </div>
    </div>
  );
}
