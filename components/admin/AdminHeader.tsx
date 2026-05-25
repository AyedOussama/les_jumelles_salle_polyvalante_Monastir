"use client";

import { Bell, LogOut, ShieldCheck } from "lucide-react";

type AdminView = "dashboard" | "settings";

interface AdminHeaderProps {
  activeView: AdminView;
  formattedDate: string;
  pendingCount: number;
  onLogout: () => void;
  hasUnsavedSettings?: boolean;
}

export function AdminHeader({
  activeView,
  formattedDate,
  pendingCount,
  onLogout,
  hasUnsavedSettings = false,
}: AdminHeaderProps) {
  return (
    <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 z-10">
      <div className="flex items-center gap-4 lg:hidden">
        <div className="w-8 h-8 rounded-full bg-[#C5A880] flex items-center justify-center text-white font-serif font-bold">LJ</div>
        <h1 className="font-serif font-bold text-lg text-slate-900">Admin</h1>
      </div>

      <div className="hidden lg:block">
        <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wide animate-in fade-in duration-300">
          {activeView === "dashboard" ? "Vue d'ensemble" : "Configuration de la Salle"}
        </h2>
        <p className="text-xs text-slate-500 font-medium tracking-wide capitalize animate-in fade-in duration-300">
          {activeView === "dashboard"
            ? formattedDate
            : hasUnsavedSettings
              ? "Modifications non sauvegardées"
              : "Gestion en temps réel des formules, des descriptions et des tarifs"}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100" title="Demandes en attente">
          <Bell size={19} />
          {pendingCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {pendingCount}
            </span>
          ) : null}
        </button>
        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-800">Bienvenue,Mokhtar</p>
            <p className="text-xs text-[#C5A880] font-medium">Les Jumelles Monastir</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
            <ShieldCheck size={20} />
          </div>
        </div>

        <button onClick={onLogout} className="lg:hidden p-2 text-rose-500 bg-rose-50 rounded-full">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
