"use client";

import { Calendar, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Image from "next/image";

type AdminView = "dashboard" | "settings";

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  onGoPublic: () => void;
  onLogout: () => void;
}

export function AdminSidebar({
  activeView,
  onViewChange,
  onGoPublic,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/60 flex-col hidden lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="shrink-0">
          <Image src="/logo.png" alt="Logo Les Jumelles" width={48} height={40} className="w-12 h-10 object-contain drop-shadow-sm" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-base leading-tight text-slate-900 tracking-wide uppercase">
            Les Jumelles
          </h1>
          <p className="text-[9px] text-[#C5A880] uppercase tracking-[0.2em] font-bold">
            Espace Gérant
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu Principal</p>

        <button
          onClick={() => onViewChange("dashboard")}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            activeView === "dashboard"
              ? "bg-slate-50 text-[#C5A880] font-semibold border border-slate-200/50 shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-sm">Tableau de bord</span>
        </button>

        <button onClick={onGoPublic} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium transition-colors">
          <Calendar size={18} />
          <span className="text-sm">Site Public</span>
        </button>

        <button
          onClick={() => onViewChange("settings")}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            activeView === "settings"
              ? "bg-slate-50 text-[#C5A880] font-semibold border border-slate-200/50 shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
          }`}
        >
          <Settings size={18} />
          <span className="text-sm">Paramètres</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-sm transition-all border border-transparent hover:border-rose-100"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
