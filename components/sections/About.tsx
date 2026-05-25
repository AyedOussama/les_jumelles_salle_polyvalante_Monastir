"use client";

import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export default function About() {
  return (
    <section id="infos" className="py-10 md:py-16 bg-[#FCFAF7] relative border-t border-slate-200/40 overflow-hidden">

      {/* Decorative background grid vector lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#c5a88005_1px,transparent_1px),linear-gradient(to_bottom,#c5a88005_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center relative z-10">

        {/* Left Side: Editorial information */}
        <div className="space-y-10 animate-in fade-in duration-700">
          <div>
            <span className="text-[#C5A880] uppercase tracking-[0.35em] text-xs font-semibold mb-2 block">
              Qui sommes-nous
            </span>
            <h2 className="text-3xl md:text-6xl font-serif text-slate-900 mb-6 tracking-wide font-bold">
              À Propos de Nous
            </h2>
            <p className="text-base md:text-lg text-slate-600 font-light leading-relaxed">
              Les Jumelles est une salle de fêtes d&apos;exception à Monastir pensée pour accueillir vos moments importants dans un cadre élégant, moderne et chaleureux. Spécialement conçue pour s&apos;adapter à toutes vos envies, notre salle sublime les mariages féériques, les réceptions prestigieuses et les événements sur-mesure.
            </p>
          </div>

          {/* Majestic Hall Specifications */}
          <div className="space-y-4 animate-in fade-in duration-700">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em] border-b border-slate-200/50 pb-3">
              Spécifications de la Salle
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Capacity Card */}
              <div className="flex items-center gap-3.5 bg-white border border-slate-200/50 p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] group hover:border-[#C5A880]/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 flex items-center justify-center text-[#C5A880] shrink-0">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capacité</span>
                  <span className="text-sm font-semibold text-slate-800">Max 800 personnes</span>
                </div>
              </div>

              {/* Floors Card */}
              <div className="flex items-center gap-3.5 bg-white border border-slate-200/50 p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.01)] group hover:border-[#C5A880]/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 flex items-center justify-center text-[#C5A880] shrink-0">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Structure</span>
                  <span className="text-sm font-semibold text-slate-800">Édifiée sur 2 Étages</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em] mb-4 border-b border-slate-200/50 pb-4">
              Coordonnées & Horaires de Visite
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 text-slate-500">

              {/* Address info card */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-[#C5A880] shrink-0 shadow-sm group-hover:border-[#C5A880] transition-colors duration-300">
                  <MapPin size={20} />
                </div>
                <div>
                  <strong className="block text-slate-900 text-sm font-semibold tracking-wide mb-1">Adresse</strong>
                  <span className="text-sm font-light leading-normal">{SITE_CONFIG.address.display}</span>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-[#C5A880] shrink-0 shadow-sm group-hover:border-[#C5A880] transition-colors duration-300">
                  <Clock size={20} />
                </div>
                <div>
                  <strong className="block text-slate-900 text-sm font-semibold tracking-wide mb-1">Horaires de visite</strong>
                  <span className="text-sm font-light leading-normal">Tous les jours<br />10h00 - 18h00</span>
                </div>
              </div>

              {/* Tel phone */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-[#C5A880] shrink-0 shadow-sm group-hover:border-[#C5A880] transition-colors duration-300">
                  <Phone size={20} />
                </div>
                <div>
                  <strong className="block text-slate-900 text-sm font-semibold tracking-wide mb-1">Téléphone</strong>
                  <a href={SITE_CONFIG.phone.href} className="text-sm font-light hover:text-[#C5A880] transition-colors">
                    {SITE_CONFIG.phone.display}
                  </a>
                </div>
              </div>

              {/* Google Maps External GPS Router anchor button */}
              <div className="pt-4">
                <a
                  href="https://maps.app.goo.gl/gVs4J4mTzUCe6Z1Z7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-widest px-6 md:px-7.5 py-3.5 md:py-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                  <Navigation size={15} className="text-[#C5A880] animate-bounce" />
                  Obtenir l&apos;itinéraire
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Map — dynamic aspect-ratio instead of fixed h-[480px] */}
        <div className="aspect-[4/3] md:aspect-[4/5] lg:aspect-[4/5] w-full rounded-3xl overflow-hidden border border-slate-200/50 shadow-lg relative group">

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3237.0374288896455!2d10.82916647685061!3d35.77445692484546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13026d16263aa8b3%3A0x7778252d1526e221!2sLes%20jumelles%20salle%20des%20f%C3%AAte%20et%20cin%C3%A9ma!5e0!3m2!1sfr!2stn!4v1779402133681!5m2!1sfr!2stn"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500 z-0"
            title="Carte Google Maps Les Jumelles Monastir"
          ></iframe>
        </div>

      </div>
    </section>
  );
}
