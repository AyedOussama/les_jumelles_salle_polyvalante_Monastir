"use client";

import { useState, useEffect } from "react";
import { Heart, PartyPopper, Briefcase, CheckCircle2, X, ChevronLeft, ChevronRight, Sparkles, CalendarRange } from "lucide-react";
import { getSettingsAction } from "@/app/actions/settings";
import { scrollToSection } from "@/lib/scrollUtils";

interface PackFeature {
  text: string;
}

interface PackItem {
  id: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
  detailedDescription: string;
  priceText: string;
  images: string[];
  features: PackFeature[];
  isHighlighted?: boolean;
}

const PACKS: PackItem[] = [
  {
    id: 1,
    icon: Heart,
    title: "Pack Mariage",
    description: "Une soirée féérique. La salle complète avec un agencement majestueux et une direction artistique dédiée pour votre grand jour.",
    detailedDescription: "Offrez-vous un mariage d'empereur au sein de la prestigieuse salle Les Jumelles. Ce pack d'exception comprend la privatisation totale de notre salle sur deux étages, l'installation d'une scène d'honneur majestueuse avec trône impérial au choix, un système d'éclairage architectural et robotisé à LED de dernière génération, l'accès exclusif à notre suite mariés privée ultra-confortable pour vos préparatifs, ainsi qu'une coordination artistique et logistique assurée de bout en bout par nos régisseurs.",
    priceText: "À partir de 3 000 DT",
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop"
    ],
    features: [
      { text: "Scène et trône nuptial premium" },
      { text: "Éclairage architectural & robotisé" },
      { text: "Suite mariés privée ultra-confort" },
      { text: "Capacité d'accueil maximale (800 pers.)" },
      { text: "Sonorisation acoustique impériale" }
    ],
    isHighlighted: true,
  },
  {
    id: 2,
    icon: PartyPopper,
    title: "Fiançailles & Outia",
    description: "Un cadre intime et traditionnel, idéal pour célébrer vos fiançailles ou votre cérémonie d'Outia entourés de vos proches.",
    detailedDescription: "Célébrez votre union traditionnelle ou vos fiançailles dans un cadre élégant alliant tradition et modernité. Ce pack met à votre disposition notre salle entièrement décorée selon les thématiques de l'Outia tunisienne, comprenant les décors traditionnels brodés d'or, une sonorisation haute fidélité pour vos groupes de musique ou DJ, un accueil VIP pour vos proches et un service de rafraîchissement d'exception.",
    priceText: "À partir de 2 000 DT",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520854221256-17451cc35953?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop"
    ],
    features: [
      { text: "Aménagement traditionnel sur-mesure" },
      { text: "Décoration florale et thématique" },
      { text: "Sonorisation haute fidélité" },
      { text: "Accueil et logistique professionnelle" },
      { text: "Espace cocktail & rafraîchissements" }
    ],
  },
  {
    id: 3,
    icon: Briefcase,
    title: "Séminaire & Pro",
    description: "Pour vos réunions d'affaires, lancements de produit, conférences et dîners de gala d'entreprise dans un cadre prestigieux.",
    detailedDescription: "Assurez le succès de vos conférences, séminaires professionnels et soirées de gala d'entreprise. Nous mettons à votre disposition notre salle polyvalente modulable en configuration théâtre ou banquet. Ce pack comprend un équipement audiovisuel de pointe (vidéoprojecteur laser 4K, micros haute fidélité sans fil, sonorisation acoustique intégrée), un espace pause-café raffiné et un service d'accueil professionnel pour vos collaborateurs et clients.",
    priceText: "À partir de 1 500 DT",
    images: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop"
    ],
    features: [
      { text: "Disposition modulable (théâtre/banquet)" },
      { text: "Vidéoprojecteur laser & micros sans fil" },
      { text: "Espace pause-café et traiteur dédié" },
      { text: "Climatisation renforcée silencieuse" },
      { text: "Régie technique assurée" }
    ],
  },
];

export default function Packs() {
  const [selectedPack, setSelectedPack] = useState<PackItem | null>(null);
  const [activePacks, setActivePacks] = useState<PackItem[]>([]);

  useEffect(() => {
    async function loadPacks() {
      try {
        const settings = await getSettingsAction();
        const iconMap: Record<number, React.ComponentType<{ className?: string; size?: number }>> = {
          1: Heart,
          2: PartyPopper,
          3: Briefcase
        };
        const defaultImages: Record<number, string[]> = {
          1: [
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop"
          ],
          2: [
            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1520854221256-17451cc35953?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop"
          ],
          3: [
            "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop"
          ]
        };

        const mappedPacks = settings.packs.map((p) => ({
          id: p.id,
          icon: iconMap[p.id] || Sparkles,
          title: p.title,
          description: p.description,
          detailedDescription: p.detailedDescription,
          priceText: `À partir de ${p.basePrice} DT`,
          images: Array.isArray(p.images) ? p.images.map((image) => image.url) : defaultImages[p.id] || defaultImages[1],
          features: p.features.map((f) => ({ text: f })),
          isHighlighted: p.id === 1
        }));

        setActivePacks(mappedPacks);
      } catch (err) {
        console.error("Failed to load settings in Packs section:", err);
      }
    }
    loadPacks();
  }, []);

  const displayPacks = activePacks.length > 0 ? activePacks : PACKS.map(p => ({
    ...p,
    icon: p.id === 1 ? Heart : p.id === 2 ? PartyPopper : Briefcase
  }));

  const handleReserveFromModal = () => {
    setSelectedPack(null);
    setTimeout(() => {
      scrollToSection("step-1");
    }, 300);
  };

  return (
    <section id="packs" className="py-8 md:py-14 bg-[#FAF8F5] relative border-t border-slate-200/40">

      {/* Visual glowing backing sphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C5A880]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <span className="text-[#C5A880] uppercase tracking-[0.35em] text-xs font-semibold mb-2 block">
            Des formules d&apos;exception
          </span>
          <h2 className="text-3xl md:text-6xl font-serif text-slate-900 mb-6 tracking-wide font-bold">
            Packs & Événements
          </h2>
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#C5A880] to-transparent mx-auto mb-6"></div>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
            Des solutions clés en main et sur-mesure spécialement élaborées pour que chaque instant de votre célébration reste gravé dans les mémoires.
          </p>
        </div>

        {/* Packs Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">

          {displayPacks.map((pack) => {
            const Icon = pack.icon;
            return (
              <div
                key={pack.id}
                className="flex flex-col justify-between p-6 md:p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-1.5 group shadow-[0_15px_40px_rgba(197,168,128,0.06)] bg-gradient-to-b from-white to-[#FCFAF7] border-[#C5A880]/70 hover:shadow-[0_15px_40px_rgba(197,168,128,0.15)] relative"
              >
                <div>
                  {/* Icon Card Frame */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-500 bg-[#C5A880] text-white border-transparent">
                    <Icon size={24} className="transition-transform duration-500 group-hover:scale-110" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-serif text-slate-900 mb-4 tracking-wide font-bold">
                    {pack.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-500 font-light leading-relaxed mb-8">
                    {pack.description}
                  </p>

                  {/* Checklist divider line */}
                  <div className="w-full h-[1px] bg-slate-100 mb-8"></div>

                  {/* Features list */}
                  <ul className="space-y-4 mb-8">
                    {pack.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-light">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA Trigger */}
                <button
                  onClick={() => setSelectedPack(pack)}
                  className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-center transition-all duration-300 border cursor-pointer bg-[#C5A880] hover:bg-[#b2936a] text-white border-transparent shadow-md shadow-[#C5A880]/20"
                >
                  Découvrir ce pack
                </button>
              </div>
            );
          })}

        </div>

      </div>

      {/* LUXURY PACK MODAL */}
      {selectedPack && (
        <PackModal
          pack={selectedPack}
          onClose={() => setSelectedPack(null)}
          onReserve={handleReserveFromModal}
        />
      )}

    </section>
  );
}

interface ModalProps {
  pack: PackItem;
  onClose: () => void;
  onReserve: () => void;
}

function PackModal({ pack, onClose, onReserve }: ModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const hasImages = pack.images.length > 0;
  const hasMultipleImages = pack.images.length > 1;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setActiveImageIdx((prev) => (prev + 1) % pack.images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setActiveImageIdx((prev) => (prev - 1 + pack.images.length) % pack.images.length);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 max-h-[90vh] md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close trigger button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-full transition-all duration-200 cursor-pointer z-50 shadow-sm border border-slate-100 bg-white"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Image slider — flex proportions instead of fixed percentage widths */}
        <div className="w-full md:flex-[3] relative bg-slate-950 aspect-[16/10] md:aspect-auto flex items-center justify-center shrink-0">

          {hasImages ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pack.images[activeImageIdx]}
              alt={pack.title}
              className="w-full h-full object-cover select-none animate-in fade-in duration-500"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-[#2b241d] px-8 text-center text-white">
              <Sparkles size={34} className="mb-4 text-[#C5A880]" />
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C5A880]">Photos à venir</p>
              <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-white/75">
                Cette formule peut être présentée sans galerie dédiée.
              </p>
            </div>
          )}

          {/* Subtle light vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>

          {/* Navigation arrow chevrons */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer border border-white/10"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer border border-white/10"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Slider Dot Indicators */}
          {hasMultipleImages && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {pack.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeImageIdx === idx ? "bg-[#C5A880] w-4" : "bg-white/50 hover:bg-white"
                }`}
              ></button>
            ))}
          </div>}

          {/* Brand Watermark */}
          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[9px] font-bold text-white uppercase tracking-widest">
            LJ Monastir
          </div>
        </div>

        {/* RIGHT COLUMN: Detailed Specs — flex proportions instead of fixed widths */}
        <div className="w-full md:flex-[2] p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header badges */}
            <div className="flex items-center gap-2 mb-3 mt-1.5 md:mt-0">
              <span className="text-[10px] text-[#C5A880] font-bold uppercase tracking-[0.2em]">
                Prestige & Service
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                {pack.id === 3 ? "Professionnel" : "Privé"}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-serif text-slate-900 font-extrabold mb-4 tracking-wide">
              {pack.title}
            </h2>

            {/* Description Paragraph */}
            <p className="text-slate-600 text-xs md:text-sm font-light leading-relaxed mb-6">
              {pack.detailedDescription}
            </p>

            {/* Divider */}
            <div className="w-full h-[1px] bg-slate-100 mb-6"></div>

            {/* What is included checklist */}
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#C5A880]" />
              Ce que contient ce pack :
            </h4>

            <ul className="space-y-3 mb-8">
              {pack.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-slate-700">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-light">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer: Price tag & Golden CTA redirect */}
          <div className="mt-auto border-t border-slate-100 pt-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Formule clés en main
                </span>
                <span className="text-xl md:text-2xl font-serif text-[#C5A880] font-extrabold">
                  {pack.priceText}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-light tracking-wide text-right">
                TVA & Services inclus
              </div>
            </div>

            <button
              onClick={onReserve}
              className="w-full bg-[#C5A880] hover:bg-[#b2936a] text-white font-bold py-4 px-6 rounded-xl text-center shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest text-xs cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CalendarRange size={14} />
              <span>Réserver maintenant</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
