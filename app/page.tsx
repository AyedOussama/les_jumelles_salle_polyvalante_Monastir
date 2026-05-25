import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Gallery from "@/components/sections/Gallery";
import About from "@/components/sections/About";
import Packs from "@/components/sections/Packs";
import Sponsors from "@/components/sections/Sponsors";
import BookingEngine from "@/components/booking/BookingEngine";
import Footer from "@/components/layout/Footer";
import MobileContactBar from "@/components/layout/MobileContactBar";

export default function Home() {
  return (
    <div className="site-shell min-h-screen bg-[#FAF8F5] text-slate-800 font-sans relative">

      {/* 1. Global Sticky Glassmorphism Header */}
      <Navbar />

      {/* 2. Hero cinematic section */}
      <Hero />

      {/* 3. Editorial masonry gallery */}
      <Gallery />

      {/* 4. Contact profiles & custom Dark Google Map */}
      <About />

      {/* 5. Packs & formulas spotlights */}
      <Packs />

      {/* 6. Professional Sponsors showcase */}
      <Sponsors />

      {/* 7. Multi-step Booking engine */}
      <section id="reservation" className="py-10 md:py-16 bg-[#F3EBE3] relative overflow-hidden border-t border-slate-200/40">

        {/* Glow backdrop ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#C5A880]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl w-[90%] mx-auto relative z-10">
          <BookingEngine />
        </div>
      </section>

      {/* 8. Global Brand Footer */}
      <Footer />

      <MobileContactBar />

    </div>
  );
}
