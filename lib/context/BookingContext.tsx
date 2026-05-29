"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  getBookingsAction, 
  createBookingAction, 
  approveBookingAction, 
  rejectBookingAction, 
  cancelBookingAction,
  updateBookingAction,
  type BookingData,
  type BookingExtras
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
}

type BookingUpdateData = Partial<Omit<Booking, "id" | "dossierNum">>;

interface BookingContextType {
  bookings: Booking[];
  isInitialized: boolean;
  addBooking: (bookingData: Omit<Booking, "id" | "status" | "dossierNum">) => Promise<string>;
  approveBooking: (id: number) => Promise<void>;
  rejectBooking: (id: number) => Promise<void>;
  cancelBooking: (id: number) => Promise<void>;
  updateBooking: (id: number, data: BookingUpdateData) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load bookings from database on mount
  useEffect(() => {
    async function loadBookings() {
      try {
        const dbBookings = await getBookingsAction();
        setBookings(dbBookings);
      } catch (error) {
        console.error("Failed to load bookings from database:", error);
      } finally {
        setIsInitialized(true);
      }
    }
    loadBookings();

    // Silent background polling every 15 seconds
    const pollInterval = setInterval(async () => {
      try {
        const freshBookings = await getBookingsAction();
        setBookings(freshBookings);
      } catch (error) {
        // Silently fail — don't disrupt the UI
        console.warn("Background refresh failed:", error);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
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
      
      if (result.success && result.booking) {
        setBookings((prev) => [...prev, result.booking as Booking]);
        return result.dossierNum;
      } else {
        throw new Error("Failed to create booking.");
      }
    } catch (error) {
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
      }
    } catch (error) {
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
      }
    } catch (error) {
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
      }
    } catch (error) {
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
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      throw error;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        isInitialized,
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
