"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";
import { SITE_CONFIG, NAV_LINKS } from "@/lib/constants";
import { scrollToSection } from "@/lib/scrollUtils";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-[#FCFAF7] border-t border-slate-200/40 relative z-10 pt-14 md:pt-20 pb-8 md:pb-10">
      
      {/* Decorative Golden Line Divider */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A880]/30 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-10 md:mb-16">
        
        {/* Brand Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Image src="/logo.png" alt="Logo Les Jumelles Monastir" width={64} height={52} className="object-contain drop-shadow-sm" />
            </div>
            
            <div>
              <span className="text-xl font-serif text-slate-900 font-bold tracking-[0.15em] uppercase block leading-none">
                Les Jumelles
              </span>
              <span className="text-[9px] uppercase tracking-[0.35em] text-[#C5A880] font-semibold block mt-1">
                Salle Polyvalente Monastir
              </span>
            </div>
          </div>
          
          <p className="text-slate-500 font-light text-sm leading-relaxed max-w-sm">
            La destination de choix pour des événements prestigieux à Monastir. Nous transformons vos rêves en souvenirs somptueux et inoubliables.
          </p>

          <div className="flex gap-3.5 pt-2">
            <a 
              href={SITE_CONFIG.socials.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white hover:bg-[#C5A880] hover:text-white text-slate-400 border border-slate-200/60 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-sm cursor-pointer"
              aria-label="Suivez-nous sur Instagram"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a 
              href={SITE_CONFIG.socials.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white hover:bg-[#C5A880] hover:text-white text-slate-400 border border-slate-200/60 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-sm cursor-pointer"
              aria-label="Suivez-nous sur Facebook"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
          </div>
        </div>

        {/* Contact Links */}
        <div className="space-y-6">
          <h4 className="text-slate-900 font-bold uppercase tracking-[0.18em] text-xs pb-2 border-b border-slate-200/50 w-fit">
            Coordonnées
          </h4>
          <div className="space-y-4 text-sm text-slate-500 font-light">
            <p className="flex items-start gap-3 leading-relaxed">
              <MapPin size={18} className="text-[#C5A880] shrink-0 mt-0.5" />
              <span>{SITE_CONFIG.address.display}</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone size={18} className="text-[#C5A880] shrink-0" />
              <a href={SITE_CONFIG.phone.href} className="hover:text-[#C5A880] transition-colors">
                {SITE_CONFIG.phone.display}
              </a>
            </p>
            <p className="flex items-center gap-3">
              <Mail size={18} className="text-[#C5A880] shrink-0" />
              <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-[#C5A880] transition-colors break-all">
                {SITE_CONFIG.email}
              </a>
            </p>
          </div>
        </div>

        {/* Navigation Shortcuts — driven by shared NAV_LINKS */}
        <div className="space-y-6">
          <h4 className="text-slate-900 font-bold uppercase tracking-[0.18em] text-xs pb-2 border-b border-slate-200/50 w-fit">
            Navigation Rapide
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-500 font-light">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-left hover:text-[#C5A880] transition-colors cursor-pointer w-fit"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollToSection("step-1")}
              className="text-left hover:text-[#C5A880] transition-colors cursor-pointer w-fit font-bold text-[#C5A880]"
            >
              Réserver
            </button>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-center items-center border-t border-slate-200/40 pt-8 text-xs text-slate-400 font-light">
        <p className="text-center">
          © {currentYear} Salle de Fêtes Les Jumelles Monastir. Tous droits réservés.
        </p>
      </div>

    </footer>
  );
}
