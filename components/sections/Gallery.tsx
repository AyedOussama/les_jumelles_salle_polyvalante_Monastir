"use client";

import { useEffect, useState } from "react";
import { Sparkles, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getSettingsAction } from "@/app/actions/settings";

interface GalleryItem {
  id: number;
  url: string;
  category: string;
  title: string;
  /** Dynamic aspect ratio instead of static pixel heights */
  aspectClass: string;
}

const INITIAL_ITEMS: GalleryItem[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop",
    category: "Décoration",
    title: "Table d'honneur & Centres de table",
    aspectClass: "aspect-[4/3]",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
    category: "Architecture",
    title: "Le Grand Hall & Lustres de Cristal",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
    category: "Réception",
    title: "Agencement de Banquet Impérial",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop",
    category: "Éclairage",
    title: "Scénographie Lumineuse & Piste",
    aspectClass: "aspect-[4/3]",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=1976&auto=format&fit=crop",
    category: "Détails",
    title: "Trône Premium & Espace Mariés",
    aspectClass: "aspect-[5/6]",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=2070&auto=format&fit=crop",
    category: "Extérieur",
    title: "Façade & Accueil Lumineux",
    aspectClass: "aspect-[5/6]",
  },
];

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>(INITIAL_ITEMS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGalleryImages() {
      try {
        const settings = await getSettingsAction();
        setItems((currentItems) =>
          currentItems.map((item, index) => {
            const image = settings.siteImages.gallery[index];
            if (!image) return item;

            return {
              ...item,
              url: image.url,
              category: image.category || item.category,
              title: image.title || item.title,
            };
          })
        );
      } catch (error) {
        console.error("Failed to load gallery images:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGalleryImages();
  }, []);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! + 1) % items.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! - 1 + items.length) % items.length);
  };

  return (
    <section id="galerie" className="py-10 md:py-16 bg-[#FAF8F5] relative overflow-hidden border-t border-slate-200/20">
      
      {/* Visual background luxury orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#C5A880]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <span className="text-[#C5A880] uppercase tracking-[0.35em] text-xs font-semibold mb-2 block">
            Capturer l&apos;émerveillement
          </span>
          <h2 className="text-3xl md:text-6xl font-serif text-slate-900 mb-6 tracking-wide font-bold">
            La Magie des Lieux
          </h2>
          <div className="relative w-28 h-[2px] bg-gradient-to-r from-transparent via-[#C5A880] to-transparent mx-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF8F5] px-2 text-[#C5A880]">
              <Sparkles size={14} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Masonry Image Grid — aspect-ratio based instead of static heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-4 md:gap-8">
            <GalleryCard 
              item={items[0]} 
              index={0}
              onOpenLightbox={setLightboxIndex} 
              isLoading={isLoading}
            />
            <GalleryCard 
              item={items[1]} 
              index={1}
              onOpenLightbox={setLightboxIndex} 
              isLoading={isLoading}
            />
          </div>

          {/* Column 2 — slight offset for masonry effect on desktop only */}
          <div className="flex flex-col gap-4 md:gap-8 md:pt-12">
            <GalleryCard 
              item={items[2]} 
              index={2}
              onOpenLightbox={setLightboxIndex} 
              isLoading={isLoading}
            />
            <GalleryCard 
              item={items[3]} 
              index={3}
              onOpenLightbox={setLightboxIndex} 
              isLoading={isLoading}
            />
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-4 md:gap-8">
            <GalleryCard 
              item={items[4]} 
              index={4}
              onOpenLightbox={setLightboxIndex} 
              isLoading={isLoading}
            />
            <GalleryCard 
              item={items[5]} 
              index={5}
              onOpenLightbox={setLightboxIndex} 
              isLoading={isLoading}
            />
          </div>

        </div>

      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Info Bar */}
          <div className="absolute top-6 left-6 text-white text-left hidden sm:block">
            <span className="text-[10px] text-[#C5A880] font-bold uppercase tracking-widest">{items[lightboxIndex].category}</span>
            <h4 className="text-lg font-serif font-semibold">{items[lightboxIndex].title}</h4>
          </div>

          {/* Close trigger */}
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-300 cursor-pointer"
          >
            <X size={24} />
          </button>

          {/* Previous Arrow trigger */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 md:p-3.5 rounded-full transition-all duration-300 cursor-pointer z-10"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Main Large Image */}
          <div 
            className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center z-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[lightboxIndex].url}
              alt={items[lightboxIndex].title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
            />
          </div>

          {/* Next Arrow trigger */}
          <button 
            onClick={handleNext}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 md:p-3.5 rounded-full transition-all duration-300 cursor-pointer z-10"
          >
            <ChevronRight size={24} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  lightboxIndex === idx ? "bg-[#C5A880] w-6" : "bg-white/30"
                }`}
              ></div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}

interface CardProps {
  item: GalleryItem;
  index: number;
  onOpenLightbox: (idx: number) => void;
  isLoading: boolean;
}

function GalleryCard({ item, index, onOpenLightbox, isLoading }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200/50 rounded-3xl w-full flex items-center justify-center overflow-hidden group relative cursor-pointer shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(197,168,128,0.12)] hover:-translate-y-1 ${item.aspectClass}`}
    >
      {/* Decorative Golden Outline on Hover */}
      <div className="absolute inset-0 border-[2.5px] border-transparent group-hover:border-[#C5A880]/40 rounded-3xl transition-all duration-500 z-20 pointer-events-none"></div>

      {/* Image Layer */}
      {isLoading ? (
        <div className="w-full h-full bg-slate-200 animate-pulse z-0" />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.url}
          alt={item.title}
          onClick={() => onOpenLightbox(index)}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-out z-0"
          loading="lazy"
        />
      )}

      {/* Soft Bright Overlay on Hover */}
      <div 
        onClick={() => onOpenLightbox(index)}
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-75 transition-opacity duration-500 z-10"
      ></div>

      {/* Info Card Content */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 z-20 flex flex-col justify-end translate-y-1.5 group-hover:translate-y-0 transition-transform duration-500">
        
        {/* Category Badge */}
        <span className="text-[10px] text-[#C5A880] font-bold uppercase tracking-[0.25em] mb-1.5 block">
          {item.category}
        </span>
        
        {/* Title */}
        <h3 className="text-white text-sm md:text-xl font-serif font-semibold tracking-wide drop-shadow-md mb-3">
          {item.title}
        </h3>

        {/* View action row */}
        <div className="flex items-center gap-4 text-slate-300 text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenLightbox(index); }}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10"
          >
            <Eye size={12} className="text-[#C5A880]" />
            <span>Agrandir l&apos;image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
