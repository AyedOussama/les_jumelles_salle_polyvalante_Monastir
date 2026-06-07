"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { getSettingsAction } from "@/app/actions/settings";
import { scrollToSection } from "@/lib/scrollUtils";

const DEFAULT_HERO_IMAGE = "/hero-jumelles.jpg";

export default function Hero() {
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);

  useEffect(() => {
    async function loadHeroImage() {
      try {
        const settings = await getSettingsAction();
        setHeroImage(settings.siteImages.hero.url || DEFAULT_HERO_IMAGE);
      } catch (error) {
        console.error("Failed to load hero image:", error);
      }
    }

    loadHeroImage();
  }, []);

  return (
    <section
      id="accueil"
      className="relative h-screen w-full max-w-full flex items-center justify-center overflow-hidden bg-[#FAF8F5]"
    >
      {/* Immersive Image Layer */}
      <div className="absolute inset-0 z-0 bg-[#FAF8F5] overflow-hidden">
        {/* Soft gradient overlays preserve readability and fade into the ivory background. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#FAF8F5] z-10 pointer-events-none"></div>

        <Image
          src={heroImage}
          alt="Salle de réception Les Jumelles Monastir"
          fill
          preload
          sizes="100vw"
          quality={85}
          className="z-0 select-none object-cover opacity-90 pointer-events-none"
        />
      </div>

      {/* Hero Content Panel */}
      <div className="relative z-20 mx-auto mt-16 w-full max-w-5xl min-w-0 overflow-x-clip px-4 text-center animate-in fade-in duration-1000 slide-in-from-bottom-12 sm:px-6">
        <span className="inline-block max-w-full whitespace-normal break-words text-white uppercase tracking-[0.22em] sm:tracking-[0.35em] text-xs md:text-sm font-semibold mb-6 bg-slate-900/40 px-4 sm:px-5 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
          L&apos;Écrin de vos événements à Monastir
        </span>

        <h1 className="mx-auto max-w-full break-words text-4xl md:text-8xl font-serif text-white mb-8 leading-[1.1] font-extrabold tracking-wide drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
          Vivez des instants <br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 bg-clip-text text-transparent">
            inoubliables.
          </span>
        </h1>

        <p className="text-base md:text-xl text-[#FFF3DF] mb-10 max-w-2xl mx-auto font-semibold leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
          Une salle élégante à Monastir pour vos mariages, fêtes et événements privés.
        </p>

        <div className="mx-auto flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          <button
            onClick={() => scrollToSection("step-1")}
            className="group relative inline-flex min-w-0 items-center justify-center w-full sm:w-auto px-6 sm:px-9 py-4.5 font-extrabold text-white transition-all duration-300 bg-[#C5A880] hover:bg-[#b2936a] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(197,168,128,0.4)] active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider"
          >
            <span className="min-w-0 truncate">Vérifier les disponibilités</span>
            <ChevronRight className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300" size={16} />
          </button>


        </div>
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-[#FAF8F5] to-transparent pointer-events-none z-10"></div>
    </section>
  );
}
