"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { 
  getPublicAvailabilityAction,
  getBookingsAction, 
  createBookingAction, 
  approveBookingAction, 
  rejectBookingAction, 
  cancelBookingAction,
  updateBookingAction,
  type BookingData,
  type BookingExtras,
  type PublicBookingAvailability
} from "@/app/actions/booking";

export interface Booking {
  id: number;
  dossierNum: string;
  date: number; // Day number
  month?: number; // 0-indexed month (0 = Jan, 11 = Dec)
  year?: number; // Full year (e.g., 2026)
  slot: "matinee" | "soiree";
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  name: string;
  phone: string;
  eventType: string;
  specialNeeds?: string;
  extras: BookingExtras;
  totalPrice?: number;
  advancePayment?: number;
  remainingAmount?: number;
  adminNotes?: string;
  createdAt?: string;
}

type BookingUpdateData = Partial<Omit<Booking, "id" | "dossierNum">>;

interface BookingContextType {
  bookings: Booking[];
  availability: PublicBookingAvailability[];
  isInitialized: boolean;
  isAdminInitialized: boolean;
  refreshAvailability: () => Promise<void>;
  loadAdminBookings: () => Promise<void>;
  addBooking: (bookingData: Omit<Booking, "id" | "status" | "dossierNum">) => Promise<string>;
  approveBooking: (id: number) => Promise<void>;
  rejectBooking: (id: number) => Promise<void>;
  cancelBooking: (id: number) => Promise<void>;
  updateBooking: (id: number, data: BookingUpdateData) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);
const SERVER_ACTION_RELOAD_KEY = "les-jumelles:server-action-reload-at";
const SERVER_ACTION_RELOAD_COOLDOWN_MS = 30_000;

function getErrorText(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

function isMissingServerActionError(error: unknown) {
  const message = getErrorText(error);
  return [
    "Failed to find Server Action",
    "UnrecognizedActionError",
    "was not found on the server",
    "failed-to-find-server-action",
  ].some((pattern) => message.includes(pattern));
}

function reloadForFreshDeployment(error: unknown) {
  if (!isMissingServerActionError(error) || typeof window === "undefined") {
    return false;
  }

  const lastReloadAt = Number(window.sessionStorage.getItem(SERVER_ACTION_RELOAD_KEY) || 0);
  const shouldReload = Date.now() - lastReloadAt > SERVER_ACTION_RELOAD_COOLDOWN_MS;

  if (shouldReload) {
    window.sessionStorage.setItem(SERVER_ACTION_RELOAD_KEY, String(Date.now()));
    window.alert("Le site vient d'être mis à jour. La page va se recharger, puis vous pourrez refaire l'action.");
    window.location.reload();
    return true;
  }

  return false;
}

function waitForReload() {
  return new Promise<never>(() => {});
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<PublicBookingAvailability[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdminInitialized, setIsAdminInitialized] = useState(false);

  const refreshAvailability = useCallback(async () => {
    try {
      const publicAvailability = await getPublicAvailabilityAction();
      setAvailability(publicAvailability);
    } catch (error) {
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      throw error;
    }
  }, []);

  const loadAdminBookings = useCallback(async () => {
    try {
      const dbBookings = await getBookingsAction();
      setBookings(dbBookings);
      setIsAdminInitialized(true);
    } catch (error) {
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAvailability() {
      try {
        const publicAvailability = await getPublicAvailabilityAction();
        if (isMounted) {
          setAvailability(publicAvailability);
        }
      } catch (error) {
        if (reloadForFreshDeployment(error)) {
          await waitForReload();
        }
        console.error("Failed to load public availability:", error);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    }

    loadAvailability();

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void loadAvailability();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  const addBooking = async (bookingData: Omit<Booking, "id" | "status" | "dossierNum">) => {
    try {
      const dataToSubmit: BookingData = {
        date: bookingData.date,
        month: bookingData.month ?? new Date().getMonth(),
        year: bookingData.year ?? new Date().getFullYear(),
        slot: bookingData.slot,
        name: bookingData.name,
        phone: bookingData.phone,
        eventType: bookingData.eventType,
        specialNeeds: bookingData.specialNeeds || "",
        extras: bookingData.extras,
        totalPrice: bookingData.totalPrice,
      };

      const result = await createBookingAction(dataToSubmit);
      
      if (result.success) {
        await refreshAvailability();
        if (isAdminInitialized) {
          await loadAdminBookings();
        }
        return result.dossierNum;
      } else {
        throw new Error(result.error || "Impossible d'enregistrer la réservation.");
      }
    } catch (error) {
      // Refresh the availability in case the error was due to slot concurrency
      try {
        await refreshAvailability();
      } catch (refreshErr) {
        console.error("Failed to refresh availability after booking error:", refreshErr);
      }
      
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      console.error("Error adding booking:", error);
      throw error;
    }
  };

  const approveBooking = async (id: number) => {
    try {
      const result = await approveBookingAction(id);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b))
        );
        await refreshAvailability();
      }
    } catch (error) {
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      console.error("Error approving booking:", error);
      throw error;
    }
  };

  const rejectBooking = async (id: number) => {
    try {
      const result = await rejectBookingAction(id);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "rejected" } : b))
        );
        await refreshAvailability();
      }
    } catch (error) {
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      console.error("Error rejecting booking:", error);
      throw error;
    }
  };

  const cancelBooking = async (id: number) => {
    try {
      const result = await cancelBookingAction(id);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "pending" } : b))
        );
        await refreshAvailability();
      }
    } catch (error) {
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      console.error("Error cancelling booking:", error);
      throw error;
    }
  };

  const updateBooking = async (id: number, data: BookingUpdateData) => {
    try {
      const result = await updateBookingAction(id, data);
      if (result.success && result.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...(result.booking as Booking) } : b))
        );
        await refreshAvailability();
      }
    } catch (error) {
      if (reloadForFreshDeployment(error)) {
        await waitForReload();
      }
      console.error("Error updating booking:", error);
      throw error;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        availability,
        isInitialized,
        isAdminInitialized,
        refreshAvailability,
        loadAdminBookings,
        addBooking,
        approveBooking,
        rejectBooking,
        cancelBooking,
        updateBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBookings must be used within a BookingProvider");
  }
  return context;
}
