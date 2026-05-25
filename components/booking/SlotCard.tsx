"use client";

import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface SlotCardProps {
  title: string;
  time: string;
  status: "available" | "pending" | "booked";
  pendingCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function SlotCard({ title, time, status, pendingCount = 0, isSelected, onClick }: SlotCardProps) {
  if (status === "booked") {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-rose-100 opacity-50 bg-[#FCFAF7] shadow-sm w-full select-none cursor-not-allowed text-center"
      >
        <span className="text-xl font-bold text-slate-400 mb-1 font-serif tracking-wide">{title}</span>
        <span className="text-slate-500 font-mono text-xs tracking-wider mb-4">{time}</span>
        
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-500">
          <XCircle size={16} />
          <span>Complet (Réservé)</span>
        </span>
      </div>
    );
  }

  // Both "available" and "pending" are clickable
  const isPending = status === "pending";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group w-full bg-white shadow-sm ${
        isSelected
          ? isPending
            ? "border-amber-500 bg-amber-50/40 shadow-[0_5px_15px_rgba(245,158,11,0.1)] scale-[1.02]"
            : "border-emerald-500 bg-emerald-50/40 shadow-[0_5px_15px_rgba(16,185,129,0.1)] scale-[1.02]"
          : isPending
            ? "border-amber-200 hover:bg-amber-50/20 hover:border-amber-500 bg-amber-50/5"
            : "border-emerald-200 hover:bg-emerald-50/30 hover:border-emerald-500"
      }`}
    >
      <span className="text-xl font-bold text-slate-800 mb-1 font-serif tracking-wide">{title}</span>
      
      <span className={`font-mono text-xs tracking-wider mb-3 px-2 py-0.5 rounded ${
        isPending 
          ? "text-amber-700 bg-amber-100" 
          : "text-emerald-600 bg-emerald-100"
      }`}>
        {time}
      </span>

      {isPending && (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg mb-4 shadow-sm">
          <AlertCircle size={12} className="text-amber-500 animate-pulse" />
          <span>{pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente</span>
        </div>
      )}

      {!isPending && <div className="h-4 mb-4"></div> /* spacer to align titles */}

      <span
        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-transform ${
          isSelected
            ? isPending
              ? "text-amber-600 scale-105"
              : "text-emerald-600 scale-105"
            : isPending
              ? "text-amber-600/80 group-hover:scale-105 group-hover:text-amber-600"
              : "text-emerald-500/80 group-hover:scale-105 group-hover:text-emerald-600"
        }`}
      >
        {isPending ? (
          <>
            <Clock size={16} />
            {isSelected ? "Rejoindre la file d'attente" : "Réserver (File d'attente)"}
          </>
        ) : (
          <>
            <CheckCircle2 size={16} />
            {isSelected ? "Sélectionné" : "Choisir ce créneau"}
          </>
        )}
      </span>
    </button>
  );
}
