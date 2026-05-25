import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Les Jumelles | Panneau de Gestion",
  description: "Système administratif interne de gestion des réservations.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans antialiased flex flex-col">
      {children}
    </div>
  );
}
