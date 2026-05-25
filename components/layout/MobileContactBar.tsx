"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export default function MobileContactBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncVisibility = () => {
      const navMode = root.dataset.navMode;
      setIsVisible(navMode ? navMode === "drawer" : window.innerWidth < 1024);
    };

    syncVisibility();

    const observer = new MutationObserver(syncVisibility);
    observer.observe(root, { attributes: true, attributeFilter: ["data-nav-mode"] });
    window.addEventListener("resize", syncVisibility);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncVisibility);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200/70 bg-[#FAF8F5]/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div
        className="mx-auto mb-2 flex max-w-md items-center justify-center gap-2 rounded-2xl border border-[#C5A880]/30 bg-white px-4 py-2.5 text-center shadow-sm"
      >
        <Phone size={15} className="text-[#C5A880]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Téléphone</span>
        <span className="font-mono text-base font-extrabold tracking-wide text-slate-950">{SITE_CONFIG.phone.display}</span>
      </div>

      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <a
          href={SITE_CONFIG.phone.href}
          aria-label={`Appeler ${SITE_CONFIG.phone.display}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-[0.98]"
        >
          <Phone size={16} className="text-[#C5A880]" />
          <span>Appeler</span>
        </a>

        <a
          href={SITE_CONFIG.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter Les Jumelles sur WhatsApp"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-[0.98]"
        >
          <MessageCircle size={17} />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
