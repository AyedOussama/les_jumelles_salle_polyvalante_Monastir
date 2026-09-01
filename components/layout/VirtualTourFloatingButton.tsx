"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCcw, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

const TOUR_LABEL = "Découvrir Les Jumelles en visite virtuelle 360 degrés";

export default function VirtualTourFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnMobile = (event: MediaQueryListEvent) => {
      if (!event.matches) setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", closeOnMobile);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", closeOnMobile);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <div className="virtual-tour-root">
      <div className="virtual-tour-trigger fixed left-1/2 z-[80] w-[min(292px,calc(100vw-24px))] -translate-x-1/2 md:left-auto md:right-7 md:w-[338px] md:translate-x-0">
        <div className="virtual-tour-enter">
          <div className="virtual-tour-pulse">
            <a
              href={SITE_CONFIG.virtualTourUrl}
              aria-label={TOUR_LABEL}
              className="virtual-tour-surface flex h-16 w-full items-center gap-3.5 overflow-hidden rounded-[20px] border border-[#C5A880]/55 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#263347_100%)] px-3.5 text-left text-white shadow-[0_16px_45px_rgba(15,23,42,0.28),0_0_0_1px_rgba(255,255,255,0.04)_inset] outline-none backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-300 focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] active:scale-[0.99] md:hidden"
            >
              <TourButtonContent mobile />
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={TOUR_LABEL}
              aria-haspopup="dialog"
              className="virtual-tour-surface group hidden h-[84px] w-full cursor-pointer items-center gap-4 overflow-hidden rounded-[22px] border border-[#C5A880]/55 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#263347_100%)] px-4 text-left text-white shadow-[0_18px_50px_rgba(15,23,42,0.30),0_0_0_1px_rgba(255,255,255,0.04)_inset] outline-none backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:scale-[1.025] hover:border-[#ddc6a4] hover:shadow-[0_22px_58px_rgba(15,23,42,0.38),0_0_22px_rgba(197,168,128,0.14)] focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] active:scale-[0.99] md:flex"
            >
              <TourButtonContent />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/75 p-3 backdrop-blur-md motion-reduce:backdrop-blur-none md:flex md:p-5">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="virtual-tour-title"
            className="relative z-[110] flex h-[92dvh] max-h-[1000px] w-[94vw] max-w-[1800px] flex-col overflow-hidden rounded-2xl border border-[#C5A880]/45 bg-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.65)] animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none"
          >
            <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-slate-950 px-4 sm:px-6">
              <div className="min-w-0">
                <p id="virtual-tour-title" className="truncate font-serif text-base font-bold tracking-wide text-white sm:text-lg">
                  Les Jumelles <span className="text-[#C5A880]">—</span> Visite 360°
                </p>
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:block">
                  Explorez la salle à votre rythme
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={SITE_CONFIG.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C5A880]/35 bg-white/5 px-3 text-xs font-bold text-[#eadbc5] outline-none transition-colors hover:border-[#C5A880]/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#C5A880] sm:px-4"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Ouvrir dans un nouvel onglet</span>
                  <span className="sm:hidden">Ouvrir</span>
                </a>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer la visite virtuelle"
                  className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white outline-none transition-colors hover:border-[#C5A880]/60 hover:bg-white/10 hover:text-[#C5A880] focus-visible:ring-2 focus-visible:ring-[#C5A880]"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </header>

            <iframe
              src={SITE_CONFIG.virtualTourUrl}
              title="Visite virtuelle 360 degrés de la salle Les Jumelles"
              className="min-h-0 w-full flex-1 border-0 bg-slate-900"
              allow="accelerometer; autoplay; encrypted-media; fullscreen; gyroscope"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TourButtonContent({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      <span className="virtual-tour-icon relative flex size-12 shrink-0 items-center justify-center rounded-full border border-white/55 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)_inset] md:size-[52px]">
        <RefreshCcw className="absolute size-9 text-white opacity-70 md:size-10" strokeWidth={1.35} aria-hidden="true" />
        <span className="relative text-[13px] font-extrabold tracking-[-0.04em] text-white">360°</span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          lang="ar"
          dir="rtl"
          className="block whitespace-nowrap text-right text-[16px] font-bold leading-tight text-[#fffaf2] md:text-[19px] [font-family:Tahoma,Arial,sans-serif]"
        >
          {mobile ? "تفرّج على القاعة 360°" : "تفرّج على القاعة 360°"}
        </span>
        <span
          dir="ltr"
          className="mt-1 block whitespace-nowrap text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#d8c4a6] md:text-[12px] md:tracking-[0.1em]"
        >
          {mobile ? "Visite virtuelle" : "Visite virtuelle immersive"}
        </span>
      </span>
    </>
  );
}
