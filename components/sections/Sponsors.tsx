"use client";

import { Utensils, Sparkles, Camera, Music, Star } from "lucide-react";

interface VendorType {
  id: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
}

const VENDORS: VendorType[] = [
  { id: 1, icon: Utensils, label: "Traiteurs" },
  { id: 2, icon: Sparkles, label: "Décorateurs" },
  { id: 3, icon: Camera, label: "Photographes" },
  { id: 4, icon: Music, label: "DJ & Animation" },
  { id: 5, icon: Star, label: "Fleuristes" },
];

export default function Sponsors() {
  return (
    <section id="partenaires" className="py-8 md:py-12 bg-[#FCFAF7] border-y border-slate-200/40 relative overflow-hidden">

      {/* Absolute faint backing background gradient strip */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A880]/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">

        {/* Section Header */}
        <div className="mb-7 md:mb-9">
          <span className="text-[#C5A880] uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-2 block">
            Nos Sponsors
          </span>
          <h2 className="text-2xl md:text-3xl font-serif text-slate-900 tracking-wide font-bold">
            Ils nous font confiance
          </h2>
          <div className="w-16 h-[1.5px] bg-[#C5A880]/30 mx-auto mt-4"></div>
        </div>

        {/* Vendor Grid Items — fluid responsive grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 md:gap-12 lg:gap-16 justify-items-center max-w-3xl mx-auto">

          {VENDORS.map((vendor) => {
            const Icon = vendor.icon;
            return (
              <div
                key={vendor.id}
                className="flex flex-col items-center gap-3 md:gap-4 hover:text-[#C5A880] transition-all duration-300 cursor-pointer group hover:-translate-y-1.5"
              >
                {/* Visual Glass Frame Icon Wrapper */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-[#C5A880] group-hover:border-transparent transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.02)] relative overflow-hidden">

                  <Icon
                    size={26}
                    strokeWidth={1.25}
                    className="md:w-[30px] md:h-[30px] transition-transform duration-500 group-hover:scale-110 relative z-10"
                  />
                </div>

                {/* Subtitle Card Label */}
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-500 group-hover:text-[#C5A880] transition-colors duration-300">
                  {vendor.label}
                </span>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
