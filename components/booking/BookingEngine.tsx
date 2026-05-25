"use client";

import React, { useState, useEffect } from "react";
import {
  Clock, CheckCircle2, Info, Sparkles, Speaker, Wind,
  Utensils, ChevronRight, Square, CheckSquare, CalendarDays, User, Phone, ClipboardCheck, ChevronLeft
} from "lucide-react";
import { useBookings } from "@/lib/context/BookingContext";
import { getSettingsAction } from "@/app/actions/settings";
import type { SystemSettings } from "@/app/actions/settings";
import { scrollToSection } from "@/lib/scrollUtils";
import SlotCard from "./SlotCard";

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function BookingEngine() {
  const { bookings, addBooking } = useBookings();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Completion states
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dossierNum, setDossierNum] = useState("");

  // Dynamic Calendar Navigation state (defaults starting on May 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1));

  // Booking details states
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<"matinee" | "soiree" | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    eventType: "Mariage",
    specialNeeds: "",
  });

  const [customEventType, setCustomEventType] = useState("");

  const [extras, setExtras] = useState<Record<string, boolean>>({
    decoration: false,
    sonorisation: false,
    climatisation: false,
    traiteur: false,
    autres: false,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getSettingsAction();
        setSettings(s);
        if (s?.extras) {
          const initExtras: Record<string, boolean> = {};
          Object.keys(s.extras).forEach((key) => {
            initExtras[key] = false;
          });
          setExtras(initExtras);
        }
        if (s?.packs?.length > 0) {
          setFormData((prev) => ({ ...prev, eventType: s.packs[0].title }));
        }
      } catch (err) {
        console.error("Failed to load settings in BookingEngine:", err);
      }
    }
    loadSettings();
  }, []);

  const getPackPrice = () => {
    if (formData.eventType === "Autre") return 0;
    if (!settings) {
      if (formData.eventType === "Mariage") return 3000;
      if (formData.eventType === "Fiançailles") return 2000;
      if (formData.eventType === "Séminaire") return 1500;
      return 2000;
    }
    const matchedPack = settings.packs.find((p) =>
      p.title === formData.eventType ||
      p.title.toLowerCase() === formData.eventType.toLowerCase() ||
      p.title.toLowerCase().includes(formData.eventType.toLowerCase()) ||
      formData.eventType.toLowerCase().includes(p.title.toLowerCase())
    );
    return matchedPack ? matchedPack.basePrice : 2000;
  };

  const getExtraPrice = (key: string) => {
    if (!settings) {
      const defaultPrices: Record<string, number> = {
        decoration: 500,
        sonorisation: 400,
        climatisation: 250,
        traiteur: 1000,
        autres: 150
      };
      return defaultPrices[key] || 0;
    }
    return settings.extras[key]?.price || 0;
  };

  const getExtraLabel = (key: string) => {
    if (!settings) {
      const defaultLabels: Record<string, string> = {
        decoration: "Décoration Florale & Trône Premium",
        sonorisation: "Sonorisation Haute Fidélité & DJ",
        climatisation: "Système de Climatisation Renforcé",
        traiteur: "Menu de Fêtes & Service Traiteur",
        autres: "Autres aménagements spécifiques"
      };
      return defaultLabels[key] || key;
    }
    return settings.extras[key]?.label || key;
  };

  const selectedExtras = Object.entries(extras).filter((entry) => entry[1]);

  const calculateTotalPrice = () => {
    let sum = getPackPrice();
    Object.entries(extras).forEach(([key, isSelected]) => {
      if (isSelected) {
        sum += getExtraPrice(key);
      }
    });
    return sum;
  };

  // Calendar Math Calculations
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  // Offset count to start grid on correct weekday (Lun=0, Mar=1...)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
  const offsetDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const offsetDays = Array.from({ length: offsetDaysCount }, (_, i) => i);

  // Computes the status for matinee/soiree slots
  const getSlotStatus = (day: number, slot: "matinee" | "soiree") => {
    const dayBookings = bookings.filter((b) =>
      b.date === day &&
      b.slot === slot &&
      (b.status === "pending" || b.status === "confirmed") &&
      (b.month === undefined ? 4 : b.month) === currentMonth &&
      (b.year === undefined ? 2026 : b.year) === currentYear
    );

    if (dayBookings.length === 0) return "available";

    const hasConfirmed = dayBookings.some((b) => b.status === "confirmed");
    if (hasConfirmed) return "booked";

    return "pending"; // No confirmed, but has pending bookings
  };

  const getPendingCount = (day: number, slot: "matinee" | "soiree") => {
    return bookings.filter((b) =>
      b.date === day &&
      b.slot === slot &&
      b.status === "pending" &&
      (b.month === undefined ? 4 : b.month) === currentMonth &&
      (b.year === undefined ? 2026 : b.year) === currentYear
    ).length;
  };

  const handlePrevMonth = () => {
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const todayDate = new Date();
    const minDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    if (prevDate >= minDate) {
      setCurrentDate(prevDate);
      setSelectedDate(null);
      setSelectedSlot(null);
      setActiveStep(1);
    }
  };

  const handleNextMonth = () => {
    const nextDate = new Date(currentYear, currentMonth + 1, 1);
    const todayDate = new Date();
    const maxDate = new Date(todayDate.getFullYear() + 5, 11, 1);
    if (nextDate <= maxDate) {
      setCurrentDate(nextDate);
      setSelectedDate(null);
      setSelectedSlot(null);
      setActiveStep(1);
    }
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(day);
    setSelectedSlot(null); // Reset slot if changing date
    if (activeStep < 2) setActiveStep(2);

    setTimeout(() => {
      scrollToSection("step-2");
    }, 150);
  };

  const handleSlotSelect = (slot: "matinee" | "soiree") => {
    setSelectedSlot(slot);
    if (activeStep < 3) setActiveStep(3);

    setTimeout(() => {
      scrollToSection("step-3");
    }, 150);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep < 4) setActiveStep(4);

    setTimeout(() => {
      scrollToSection("step-4");
    }, 150);
  };

  const handleExtrasConfirm = () => {
    if (activeStep < 5) setActiveStep(5);

    setTimeout(() => {
      scrollToSection("step-5");
    }, 150);
  };

  const toggleExtra = (key: keyof typeof extras) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmOrder = async () => {
    if (!selectedDate || !selectedSlot) return;

    // Build list of chosen dynamic extras to append to specialNeeds for admin visibility
    const selectedDynamicExtrasList = Object.entries(extras)
      .filter(([k, v]) => v && !["decoration", "sonorisation", "climatisation", "traiteur"].includes(k))
      .map(([k]) => getExtraLabel(k));

    const extraSuffix = selectedDynamicExtrasList.length > 0
      ? ` | Options sélectionnées: ${selectedDynamicExtrasList.join(", ")}`
      : "";

    const finalSpecialNeeds = `${formData.specialNeeds}${extraSuffix}`.trim();

    const mappedExtrasForDb = {
      decoration: !!extras.decoration,
      sonorisation: !!extras.sonorisation,
      climatisation: !!extras.climatisation,
      traiteur: !!extras.traiteur,
      autres: !!extras.autres || selectedDynamicExtrasList.length > 0,
    };

    try {
      const generatedCode = await addBooking({
        date: selectedDate,
        month: currentMonth,
        year: currentYear,
        slot: selectedSlot,
        name: formData.name,
        phone: formData.phone,
        eventType: formData.eventType === "Autre" ? `Autre: ${customEventType}` : formData.eventType,
        specialNeeds: finalSpecialNeeds,
        extras: mappedExtrasForDb,
        totalPrice: calculateTotalPrice(),
      });

      setDossierNum(generatedCode);
      setIsSubmitted(true);
      window.scrollTo({ top: document.getElementById("reservation")?.offsetTop || 0, behavior: "smooth" });
    } catch (error) {
      console.error("Booking error:", error);
      alert("Une erreur est survenue lors de la soumission de votre réservation. Veuillez réessayer.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-xl animate-in zoom-in-95 duration-500 text-center relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-[#C5A880] rounded-t-3xl shadow-md"></div>

        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
          <CheckCircle2 size={44} />
        </div>

        <h3 className="text-3xl font-serif text-slate-900 mb-3 font-bold">Demande Confirmée !</h3>

        <p className="text-slate-600 mb-8 max-w-md mx-auto text-sm md:text-base font-light leading-relaxed">
          Votre créneau a été temporairement bloqué. Notre direction va vous contacter au <strong>{formData.phone}</strong> sous 24h pour finaliser le contrat.
        </p>

        <div className="bg-[#FCFAF7] border border-dashed border-slate-200 rounded-2xl p-6 md:p-8 max-w-sm mx-auto mb-8 text-left shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">
            Numéro de dossier
          </span>
          <p className="text-3xl font-mono text-[#C5A880] font-bold tracking-widest mb-4">
            {dossierNum}
          </p>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">
            Statut actuel
          </span>
          <p className="inline-flex items-center gap-1.5 text-xs text-orange-600 font-bold bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-200">
            <Clock size={14} className="animate-spin" />
            En attente de validation
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setActiveStep(1);
              setSelectedDate(null);
              setSelectedSlot(null);
              setFormData({ name: "", phone: "", eventType: "Mariage", specialNeeds: "" });
              setCustomEventType("");
              setExtras({ decoration: false, sonorisation: false, climatisation: false, traiteur: false, autres: false });
            }}
            className="text-[#C5A880] hover:text-[#b2936a] text-sm font-bold tracking-wide underline cursor-pointer hover:scale-105 transition-all duration-300"
          >
            Faire une autre demande de réservation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">

      {/* Title */}
      <div className="text-center mb-8 md:mb-10">
        <span className="text-[#C5A880] uppercase tracking-[0.35em] text-xs font-semibold mb-2 block">
          Votre calendrier interactif
        </span>
        <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4 tracking-wide font-bold">
          Réservez votre Événement
        </h2>
        <div className="w-20 h-[2px] bg-[#C5A880]/30 mx-auto mb-4"></div>
        <p className="text-slate-600 text-sm md:text-base font-light">
          Suivez les étapes ci-dessous pour vérifier la disponibilité de la salle et soumettre votre demande.
        </p>
      </div>

      {/* STEP 1: CALENDAR */}
      <div
        id="step-1"
        className="bg-white border border-slate-200/60 backdrop-blur-md rounded-3xl p-5 md:p-6 shadow-md transition-all duration-300 relative animate-in fade-in"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C5A880] rounded-t-3xl opacity-60"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C5A880] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              1
            </div>
            <h3 className="text-lg md:text-xl font-serif text-slate-900 tracking-wide font-bold">
              Sélectionnez la Date de Réception
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Green Badge for Today's Date */}
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] md:text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Aujourd&apos;hui : {new Date().getDate()} {MONTH_NAMES_FR[new Date().getMonth()]} {new Date().getFullYear()}</span>
            </div>

            {/* Selected Date Indicator next to it */}
            {selectedDate && (
              <div className="flex items-center gap-1.5 text-[#C5A880] text-[11px] md:text-xs font-semibold bg-[#C5A880]/5 px-3 py-1.5 rounded-full border border-[#C5A880]/20 shadow-sm animate-in zoom-in-95 duration-200">
                <CheckCircle2 size={13} />
                <span>Sélectionné : {selectedDate} {MONTH_NAMES_FR[currentMonth]} {currentYear}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Month/Year Selector Banner */}
        <div className="flex items-center justify-between bg-[#FCFAF7] border border-slate-200/60 rounded-2xl p-2.5 mb-5 shadow-sm">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:border-[#C5A880] hover:bg-[#C5A880]/5 hover:text-[#C5A880] text-slate-500 transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center"
            title="Mois précédent"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Elegant Month & Year Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={currentMonth}
              onChange={(e) => {
                const newMonth = parseInt(e.target.value);
                setCurrentDate(new Date(currentYear, newMonth, 1));
                setSelectedDate(null);
                setSelectedSlot(null);
                setActiveStep(1);
              }}
              className="bg-white border border-slate-200 text-slate-800 text-sm font-semibold py-1.5 px-3 rounded-xl focus:outline-none focus:border-[#C5A880] transition-colors cursor-pointer"
            >
              {MONTH_NAMES_FR.map((name, idx) => {
                const todayDate = new Date();
                const dynamicCurrentYear = todayDate.getFullYear();
                const dynamicCurrentMonth = todayDate.getMonth();
                // Ensure we don't select months in the past if currentYear is this dynamic year
                const isPast = currentYear === dynamicCurrentYear && idx < dynamicCurrentMonth;
                return (
                  <option key={idx} value={idx} disabled={isPast}>
                    {name}
                  </option>
                );
              })}
            </select>

            <select
              value={currentYear}
              onChange={(e) => {
                const newYear = parseInt(e.target.value);
                const todayDate = new Date();
                const dynamicCurrentYear = todayDate.getFullYear();
                const dynamicCurrentMonth = todayDate.getMonth();
                let targetMonth = currentMonth;
                if (newYear === dynamicCurrentYear && currentMonth < dynamicCurrentMonth) {
                  targetMonth = dynamicCurrentMonth;
                }
                setCurrentDate(new Date(newYear, targetMonth, 1));
                setSelectedDate(null);
                setSelectedSlot(null);
                setActiveStep(1);
              }}
              className="bg-white border border-slate-200 text-slate-800 text-sm font-semibold py-1.5 px-3 rounded-xl focus:outline-none focus:border-[#C5A880] transition-colors cursor-pointer"
            >
              {/* Dynamically allow 6 years from today's dynamic year */}
              {Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() + idx).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:border-[#C5A880] hover:bg-[#C5A880]/5 hover:text-[#C5A880] text-slate-500 transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center"
            title="Mois suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Days Grid Headers */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2 text-center text-slate-400 text-[10px] uppercase tracking-[0.25em] font-bold">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="pb-1.5">{d}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {/* Visual offsets to start the month on the correct day of the week */}
          {offsetDays.map((_, i) => (
            <div key={`offset-${i}`} className="aspect-[1.4] bg-slate-50 border border-slate-100 rounded-xl opacity-0"></div>
          ))}

          {days.map((day) => {
            const matStatus = getSlotStatus(day, "matinee");
            const eveStatus = getSlotStatus(day, "soiree");
            const isFullyBooked = matStatus === "booked" && eveStatus === "booked";
            const isSelected = selectedDate === day;

            // Past date disable check
            const cellDate = new Date(currentYear, currentMonth, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPastDate = cellDate < today;

            const isDisabled = isFullyBooked || isPastDate;

            return (
              <button
                key={day}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateSelect(day)}
                className={`
                  aspect-[1.4] rounded-xl flex flex-col items-center justify-between p-1 md:p-1.5 border transition-all duration-300 relative group cursor-pointer
                  ${isSelected
                    ? "border-[#C5A880] bg-[#C5A880]/10 scale-[1.05] shadow-md z-10"
                    : "border-slate-100 bg-[#FCFAF7] hover:bg-slate-100/50 hover:border-slate-200"
                  }
                  ${isDisabled ? "opacity-60 cursor-not-allowed border-dashed bg-slate-50/80" : ""}
                `}
              >
                {/* Day number */}
                <span className={`text-base md:text-lg font-bold ${isSelected
                    ? "text-[#C5A880]"
                    : isPastDate
                      ? "text-slate-400 line-through"
                      : "text-slate-700 group-hover:text-slate-900"
                  }`}>
                  {day}
                </span>

                {/* Slots color coded dot controls */}
                {!isDisabled && (
                  <div className="flex gap-1 justify-center mt-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${matStatus === "available" ? "bg-emerald-500" : matStatus === "pending" ? "bg-amber-400" : "bg-rose-500"
                        }`}
                    ></div>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${eveStatus === "available" ? "bg-emerald-500" : eveStatus === "pending" ? "bg-amber-400" : "bg-rose-500"
                        }`}
                    ></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-5 mt-4 pt-3 border-t border-slate-100 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            Disponible
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            En attente
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            Complet
          </span>
        </div>

        {/* Dynamic pending notice */}
        <div className="mt-4 p-3 bg-amber-50/60 border border-amber-100/60 rounded-2xl flex items-center gap-2.5 max-w-2xl mx-auto shadow-sm">
          <Info size={16} className="text-amber-600 shrink-0" />
          <p className="text-xs md:text-sm text-amber-800 leading-relaxed font-semibold">
            <span className="font-bold text-amber-900 mr-1.5">Bon à savoir :</span>
            Les dates marquées en jaune sont déjà demandées par d&apos;autres clients. Vous pouvez tout de même soumettre votre demande — nous vous recontacterons si la date se libère.
          </p>
        </div>
      </div>

      {/* STEP 2: SLOT SELECT */}
      <div
        id="step-2"
        className={`transition-all duration-500 ${activeStep >= 2 ? "opacity-100 scale-100 max-h-[800px]" : "opacity-0 scale-95 max-h-0 pointer-events-none overflow-hidden"
          }`}
      >
        <div className="bg-white border border-slate-200/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-md relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C5A880] rounded-t-3xl opacity-60"></div>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition-colors ${selectedDate ? "bg-[#C5A880] text-white" : "bg-slate-100 text-slate-400"
              }`}>
              2
            </div>
            <h3 className={`text-xl font-serif tracking-wide font-bold transition-colors ${selectedDate ? "text-slate-900" : "text-slate-400"
              }`}>
              Choisissez le Créneau Horaire
            </h3>
            {selectedSlot && (
              <div className="ml-auto hidden sm:flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={13} />
                <span>{selectedSlot === "matinee" ? "Matinée" : "Soirée"}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto py-2">
            <SlotCard
              title="Matinée"
              time="10h00 - 16h00"
              status={selectedDate !== null ? getSlotStatus(selectedDate, "matinee") : "pending"}
              pendingCount={selectedDate !== null ? getPendingCount(selectedDate, "matinee") : 0}
              isSelected={selectedSlot === "matinee"}
              onClick={() => handleSlotSelect("matinee")}
            />

            <SlotCard
              title="Soirée"
              time="20h00 - 00h00"
              status={selectedDate !== null ? getSlotStatus(selectedDate, "soiree") : "booked"}
              pendingCount={selectedDate !== null ? getPendingCount(selectedDate, "soiree") : 0}
              isSelected={selectedSlot === "soiree"}
              onClick={() => handleSlotSelect("soiree")}
            />
          </div>
        </div>
      </div>

      {/* STEP 3: FORM */}
      <div
        id="step-3"
        className={`transition-all duration-500 ${activeStep >= 3 ? "opacity-100 scale-100 max-h-[1000px]" : "opacity-0 scale-95 max-h-0 pointer-events-none overflow-hidden"
          }`}
      >
        <div className="bg-white border border-slate-200/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-md relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C5A880] rounded-t-3xl opacity-60"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#C5A880] text-white flex items-center justify-center font-bold text-sm shadow-md">
              3
            </div>
            <h3 className="text-xl font-serif text-slate-900 tracking-wide font-bold">
              Informations Personnelles
            </h3>
            {activeStep > 3 && (
              <div className="ml-auto hidden sm:flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={13} />
                <span>Complété</span>
              </div>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Full Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">
                  Nom Complet *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></span>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all duration-300 text-sm font-light shadow-inner"
                    placeholder="Ex: Mohamed Ben Ali"
                  />
                </div>
              </div>

              {/* Phone Dial */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">
                  Numéro de Téléphone *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={16} /></span>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all duration-300 text-sm font-light shadow-inner"
                    placeholder="Ex: 98 123 456"
                  />
                </div>
              </div>

            </div>

            {/* Event Category Type */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">
                Type d&apos;Événement *
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:outline-none focus:border-[#C5A880] transition-all duration-300 text-sm font-semibold cursor-pointer shadow-inner"
              >
                {settings?.packs ? (
                  <>
                    {settings.packs.map((pack) => (
                      <option key={pack.id} value={pack.title}>
                        {pack.title} ({pack.basePrice.toLocaleString()} DT)
                      </option>
                    ))}
                    <option value="Autre">Autre</option>
                  </>
                ) : (
                  <>
                    <option value="Mariage">Mariage</option>
                    <option value="Fiançailles">Fiançailles / Outia</option>
                    <option value="Séminaire">Séminaire / Congrès Pro</option>
                    <option value="Anniversaire">Anniversaire / Soirée Privée</option>
                    <option value="Autre">Autre</option>
                  </>
                )}
              </select>

              {formData.eventType === "Autre" && (
                <div className="mt-4 animate-in slide-in-from-top duration-300">
                  <label className="block text-[10px] uppercase tracking-wider text-[#C5A880] mb-2 font-bold">
                    Précisez le type d&apos;événement * (Obligatoire)
                  </label>
                  <input
                    required
                    type="text"
                    value={customEventType}
                    onChange={(e) => setCustomEventType(e.target.value)}
                    className="w-full bg-slate-50 border border-[#C5A880] rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C5A880] transition-all duration-300 text-sm font-semibold shadow-inner"
                    placeholder="Ex: Soirée Privée, Fête Familiale, Cérémonie Intime..."
                  />
                </div>
              )}
            </div>

            {/* Special Request */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-bold">
                Instructions ou Besoins Particuliers
              </label>
              <textarea
                value={formData.specialNeeds}
                onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all duration-300 text-sm font-light resize-none shadow-inner"
                placeholder="Ex: Rampe PMR requise, menu végétarien, agencement de buffet spécifique..."
              />
            </div>

            {activeStep === 3 && (
              <button
                type="submit"
                className="bg-[#C5A880] hover:bg-[#b2936a] text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 shadow-md shadow-[#C5A880]/10 flex items-center gap-2 ml-auto cursor-pointer text-xs uppercase tracking-widest active:scale-[0.98]"
              >
                <span>Continuer</span>
                <ChevronRight size={14} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* STEP 4: EXTRAS */}
      <div
        id="step-4"
        className={`transition-all duration-500 ${activeStep >= 4 ? "opacity-100 scale-100 max-h-[1000px]" : "opacity-0 scale-95 max-h-0 pointer-events-none overflow-hidden"
          }`}
      >
        <div className="bg-white border border-slate-200/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-md relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C5A880] rounded-t-3xl opacity-60"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#C5A880] text-white flex items-center justify-center font-bold text-sm shadow-md">
              4
            </div>
            <h3 className="text-xl font-serif text-slate-900 tracking-wide font-bold">
              Extras & Équipements Optionnels
            </h3>
            {activeStep > 4 && (
              <div className="ml-auto hidden sm:flex items-center gap-1.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={13} />
                <span>Enregistré</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
            {Object.keys(settings?.extras || {
              decoration: { label: "Décoration Florale & Trône Premium", price: 500 },
              sonorisation: { label: "Sonorisation Haute Fidélité & DJ", price: 400 },
              climatisation: { label: "Système de Climatisation Renforcé", price: 250 },
              traiteur: { label: "Menu de Fêtes & Service Traiteur", price: 1000 },
              autres: { label: "Autres aménagements spécifiques", price: 150 }
            }).map((key) => {
              const Icon = key === "decoration" ? Sparkles :
                key === "sonorisation" ? Speaker :
                  key === "climatisation" ? Wind :
                    key === "traiteur" ? Utensils : ClipboardCheck;
              const isSelected = extras[key as keyof typeof extras] || false;
              return (
                <div
                  key={key}
                  onClick={() => toggleExtra(key as keyof typeof extras)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 bg-white ${isSelected
                      ? "border-[#C5A880] bg-[#C5A880]/5 shadow-sm scale-[1.01]"
                      : "border-slate-100 hover:border-[#C5A880]/30 shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${isSelected ? "bg-[#C5A880] text-white border-transparent" : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold transition-colors ${isSelected ? "text-slate-900" : "text-slate-600"
                        }`}>
                        {getExtraLabel(key)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium font-mono text-[#C5A880] mt-0.5">
                        +{getExtraPrice(key)} DT
                      </span>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="text-[#C5A880] shrink-0" size={20} />
                  ) : (
                    <Square className="text-slate-300 shrink-0" size={20} />
                  )}
                </div>
              );
            })}
          </div>

          {activeStep === 4 && (
            <button
              type="button"
              onClick={handleExtrasConfirm}
              className="bg-[#C5A880] hover:bg-[#b2936a] text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 shadow-md shadow-[#C5A880]/10 flex items-center gap-2 ml-auto cursor-pointer text-xs uppercase tracking-widest active:scale-[0.98]"
            >
              <span>Générer le Résumé</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* STEP 5: REVIEW SUMMARY */}
      <div
        id="step-5"
        className={`transition-all duration-700 ${activeStep >= 5 ? "opacity-100 scale-100 max-h-[1200px]" : "opacity-0 scale-95 max-h-0 pointer-events-none overflow-hidden"
          }`}
      >
        <div className="bg-gradient-to-br from-white to-[#FCFAF7] border border-[#C5A880]/30 rounded-3xl p-6 md:p-8 shadow-xl relative animate-in zoom-in-95 duration-500">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-[#C5A880] rounded-t-3xl shadow-sm"></div>

          <div className="text-center mb-10">
            <h3 className="text-3xl font-serif text-[#C5A880] mb-2 font-bold">Résumé de Votre Demande</h3>
            <p className="text-slate-500 text-sm font-light">
              Veuillez vérifier les informations ci-dessous avant d&apos;enregistrer votre réservation.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-8 shadow-inner">

            {/* Row 1: Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div className="flex gap-4 items-start">
                <div className="bg-[#FCFAF7] border border-slate-200/60 p-3 rounded-xl text-[#C5A880]">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">
                    Date Choisie
                  </span>
                  <p className="text-base text-slate-800 font-bold font-serif tracking-wide">
                    {selectedDate} {MONTH_NAMES_FR[currentMonth]} {currentYear}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-[#FCFAF7] border border-slate-200/60 p-3 rounded-xl text-[#C5A880]">
                  <Clock size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">
                    Créneau Horaire
                  </span>
                  <p className="text-base text-slate-800 font-bold font-serif tracking-wide">
                    {selectedSlot === "matinee" ? "Matinée (10h00 - 16h00)" : "Soirée (20h00 - 00h00)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Row 2: Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">
                  Client & Téléphone
                </span>
                <p className="text-slate-800 font-bold text-sm mb-1">{formData.name}</p>
                <p className="text-slate-500 text-xs font-mono">{formData.phone}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 block">
                  Événement & Besoins Spécifiques
                </span>
                <p className="text-slate-800 font-bold text-sm mb-1">{formData.eventType}</p>
                {formData.specialNeeds ? (
                  <p className="text-slate-500 text-xs font-light flex items-start gap-1">
                    <Info size={13} className="mt-0.5 text-[#C5A880] shrink-0" />
                    <span>{formData.specialNeeds}</span>
                  </p>
                ) : (
                  <span className="text-slate-400 text-xs italic">Aucun besoin particulier mentionné</span>
                )}
              </div>
            </div>

            {/* Row 3: Selected Extras */}
            <div className="pt-6">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-3 block">
                Équipements & Options Sélectionnés
              </span>
              <div className="flex flex-wrap gap-2.5">
                {selectedExtras.length > 0 ? (
                  selectedExtras.map(([key]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-100 shadow-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>{getExtraLabel(key)}</span>
                      </div>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">Aucune option supplémentaire requise.</span>
                )}
              </div>
            </div>

            {/* Row 4: Financial breakdown & dynamic summary */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4 block">
                Détail de la Tarification
              </span>
              <div className="bg-gradient-to-b from-[#FCFAF7] to-white border border-[#C5A880]/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(197,168,128,0.03)]">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-slate-600 font-light">
                    Pack de Base ({formData.eventType === "Autre" ? `Autre: ${customEventType}` : formData.eventType}) :
                  </span>
                  <span className="text-slate-900 font-serif font-semibold">
                    {formData.eventType === "Autre" ? "Sur devis spécifique" : `${getPackPrice().toLocaleString("fr-FR")} DT`}
                  </span>
                </div>

                {selectedExtras.map(([key]) => (
                  <div key={key} className="flex justify-between items-center text-xs text-slate-500 mb-2 border-b border-dashed border-slate-100 pb-2">
                    <span className="font-light">{getExtraLabel(key)} :</span>
                    <span className="font-semibold">+{getExtraPrice(key).toLocaleString("fr-FR")} DT</span>
                  </div>
                ))}

                <div className="flex justify-between items-center text-base pt-3 border-t border-slate-200 mt-4">
                  <span className="text-slate-900 font-bold uppercase tracking-wider text-xs">Estimation Totale (HT) :</span>
                  <span className="text-xl text-[#C5A880] font-serif font-bold tracking-tight">
                    {formData.eventType === "Autre"
                      ? calculateTotalPrice() > 0
                        ? `${calculateTotalPrice().toLocaleString("fr-FR")} DT (Options) + Sur devis`
                        : "Sur devis spécifique"
                      : `${calculateTotalPrice().toLocaleString("fr-FR")} DT`
                    }
                  </span>
                </div>
              </div>
            </div>

          </div>

          <button
            onClick={handleConfirmOrder}
            className="w-full bg-[#C5A880] hover:bg-[#b2936a] text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-md shadow-[#C5A880]/15 text-base flex justify-center items-center gap-3 hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]"
          >
            <span>Confirmer et Envoyer la Demande</span>
            <CheckCircle2 size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}
