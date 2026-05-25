"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          type="button"
          aria-label="Retour en haut de page"
          className="fixed bottom-6 right-6 z-50 bg-white/90 backdrop-blur-md border border-[#C5A880]/30 hover:border-[#C5A880] text-[#C5A880] hover:text-[#b2936a] w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer active:scale-95 group hover:-translate-y-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-300"
        >
          <ChevronUp 
            size={22} 
            className="group-hover:-translate-y-0.5 transition-transform duration-300 animate-pulse" 
          />
        </button>
      )}
    </>
  );
}
