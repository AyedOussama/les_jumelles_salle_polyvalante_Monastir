"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Menu, X, Phone } from "lucide-react";
import { SITE_CONFIG, NAV_LINKS } from "@/lib/constants";
import { scrollToSection } from "@/lib/scrollUtils";

type NavMode = "full" | "compact" | "drawer";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [navMode, setNavMode] = useState<NavMode>("drawer");
    const containerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLButtonElement>(null);
    const fullProbeRef = useRef<HTMLDivElement>(null);
    const compactProbeRef = useRef<HTMLDivElement>(null);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    useEffect(() => {
        const updateNavMode = () => {
            const containerWidth = containerRef.current?.clientWidth || 0;
            const logoWidth = logoRef.current?.offsetWidth || 0;
            const fullWidth = fullProbeRef.current?.scrollWidth || 0;
            const compactWidth = compactProbeRef.current?.scrollWidth || 0;
            const availableWidth = containerWidth - logoWidth - 56;

            let nextMode: NavMode = "drawer";
            if (fullWidth > 0 && fullWidth + 32 <= availableWidth) {
                nextMode = "full";
            } else if (compactWidth > 0 && compactWidth + 56 <= availableWidth) {
                nextMode = "compact";
            }

            setNavMode((currentMode) => (currentMode === nextMode ? currentMode : nextMode));
            if (nextMode !== "drawer") {
                setMobileMenuOpen(false);
            }
            document.documentElement.dataset.navMode = nextMode;
        };

        updateNavMode();

        const resizeObserver = new ResizeObserver(updateNavMode);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        if (logoRef.current) resizeObserver.observe(logoRef.current);
        if (fullProbeRef.current) resizeObserver.observe(fullProbeRef.current);
        if (compactProbeRef.current) resizeObserver.observe(compactProbeRef.current);

        document.fonts?.ready.then(updateNavMode).catch(() => undefined);

        window.addEventListener("resize", updateNavMode);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateNavMode);
            delete document.documentElement.dataset.navMode;
        };
    }, []);

    return (
        <nav
            className="fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-[#FAF8F5]/90 backdrop-blur-xl border-b border-slate-200/30 py-4 shadow-[0_10px_35px_rgba(197,168,128,0.08)]"
        >
            <div ref={containerRef} className="mx-auto flex w-full max-w-[1440px] min-w-0 items-center justify-between px-4 sm:px-6 lg:px-12">

                {/* Logo and Brand Label */}
                <button
                    ref={logoRef}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="group flex min-w-0 items-center gap-3 text-left cursor-pointer focus:outline-none"
                >
                    <div className="relative shrink-0">
                        <Image
                            src="/logo.png"
                            alt="Logo Les Jumelles Monastir"
                            width={64}
                            height={52}
                            priority
                            className="h-12 w-14 object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105 sm:h-13 sm:w-16"
                        />
                    </div>

                    <div className="min-w-0">
                        <span className="block truncate text-lg sm:text-xl font-serif font-bold tracking-[0.16em] sm:tracking-[0.18em] uppercase leading-none transition-colors duration-500 text-slate-900">
                            Les Jumelles
                        </span>
                        <span className="block truncate text-[8px] sm:text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#C5A880] font-semibold mt-1">
                            Salle Polyvalente Monastir
                        </span>
                    </div>
                </button>

                {navMode !== "drawer" && (
                    <DesktopNavigation mode={navMode} />
                )}

                {/* Mobile Hamburger Button */}
                <button
                    className={`${navMode === "drawer" ? "flex" : "hidden"} transition-colors cursor-pointer p-1 text-slate-900`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                >
                    {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>

                <div className="pointer-events-none absolute left-[-9999px] top-0 h-0 overflow-hidden opacity-0" aria-hidden="true">
                    <div ref={fullProbeRef}>
                        <DesktopNavigation mode="full" isProbe />
                    </div>
                    <div ref={compactProbeRef}>
                        <DesktopNavigation mode="compact" isProbe />
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && navMode === "drawer" && (
                <div className="absolute top-full left-0 flex w-full max-w-full flex-col space-y-5 overflow-x-clip bg-[#FAF8F5] border-b border-slate-200/50 py-8 px-6 shadow-2xl animate-in slide-in-from-top duration-300">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => scrollToSection(link.id, closeMobileMenu)}
                            className="text-left text-base font-semibold text-slate-800 hover:text-[#C5A880] py-2.5 border-b border-slate-100 transition-colors focus:outline-none cursor-pointer"
                        >
                            {link.label}
                        </button>
                    ))}

                    <button
                        onClick={() => scrollToSection("step-1", closeMobileMenu)}
                        className="w-full bg-[#C5A880] hover:bg-[#b2936a] text-white font-bold py-4 rounded-xl text-center shadow-lg transition-colors focus:outline-none cursor-pointer text-sm uppercase tracking-widest"
                    >
                        Vérifier les disponibilités
                    </button>

                    <a
                        href={SITE_CONFIG.phone.href}
                        className="flex items-center justify-center gap-2 text-slate-700 hover:text-[#C5A880] font-semibold text-sm py-2 px-4 rounded-xl border border-slate-200/60 bg-white shadow-sm transition-colors cursor-pointer"
                    >
                        <Phone size={16} className="text-[#C5A880]" />
                        <span>{SITE_CONFIG.phone.display}</span>
                    </a>
                </div>
            )}
        </nav>
    );
}

function DesktopNavigation({ mode, isProbe = false }: { mode: Exclude<NavMode, "drawer">; isProbe?: boolean }) {
    const includePhone = mode === "full";
    const compact = mode === "compact";

    return (
        <div className={`flex items-center whitespace-nowrap ${compact ? "gap-5" : "gap-6 xl:gap-10"}`}>
            <div className={`flex items-center text-xs uppercase tracking-[0.25em] font-semibold transition-colors duration-500 text-slate-600 ${compact ? "gap-5" : "gap-6 xl:gap-10"}`}>
                {NAV_LINKS.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => scrollToSection(link.id)}
                        tabIndex={isProbe ? -1 : undefined}
                        className="transition-colors duration-300 cursor-pointer focus:outline-none relative py-1 group hover:text-[#C5A880]"
                    >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#C5A880] group-hover:w-full transition-all duration-300"></span>
                    </button>
                ))}
            </div>

            <button
                onClick={() => scrollToSection("step-1")}
                tabIndex={isProbe ? -1 : undefined}
                className={`flex items-center justify-center rounded-full bg-[#C5A880] py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(197,168,128,0.2)] transition-all duration-300 hover:bg-[#b2936a] hover:shadow-[0_6px_20px_rgba(197,168,128,0.35)] active:scale-[0.98] cursor-pointer ${compact ? "px-5" : "px-5 xl:px-7.5"}`}
            >
                {compact ? "Réserver" : "Réserver Maintenant"}
            </button>

            {includePhone && (
                <a
                    href={SITE_CONFIG.phone.href}
                    tabIndex={isProbe ? -1 : undefined}
                    className="text-sm font-semibold tracking-wider transition-colors duration-500 hover:text-[#C5A880] flex items-center gap-2 text-slate-800"
                >
                    <Phone size={16} className="text-[#C5A880]" />
                    <span>{SITE_CONFIG.phone.display}</span>
                </a>
            )}
        </div>
    );
}
