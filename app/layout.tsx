import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { BookingProvider } from "@/lib/context/BookingContext";
import ScrollToTop from "@/components/layout/ScrollToTop";

// High-end Serif font for majestic titles and headers
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

// Sleek Sans-serif font for smooth readable copy
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Les Jumelles Monastir | Salle de Fêtes de Prestige",
  description: "Découvrez Les Jumelles à Monastir. Un cadre majestueux, un design somptueux et un service sur-mesure pour vos mariages, outia, fiançailles et événements professionnels. Réservez votre date en ligne.",
  keywords: ["salle de fete monastir", "mariage monastir", "les jumelles monastir", "salle de mariage tunisie", "outia monastir", "reservation salle fete"],
  authors: [{ name: "Les Jumelles Monastir" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Les Jumelles Monastir | Salle de Fêtes de Prestige",
    description: "Une architecture majestueuse, un design somptueux et un service d'excellence pour vos mariages et séminaires à Monastir.",
    type: "website",
    locale: "fr_TN",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${inter.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-[#FAF8F5] text-slate-800 font-sans antialiased flex flex-col selection:bg-[#C5A880] selection:text-white"
        suppressHydrationWarning
      >
        <BookingProvider>
          {children}
          <ScrollToTop />
        </BookingProvider>
      </body>
    </html>
  );
}
