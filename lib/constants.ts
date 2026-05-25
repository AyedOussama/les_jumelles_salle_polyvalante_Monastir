/**
 * Centralized site configuration — Single Source of Truth.
 * Change any value here and it will propagate to the entire site automatically.
 */
export const SITE_CONFIG = {
  phone: {
    display: "+216 56 806 935",
    href: "tel:+21656806935",
  },
  whatsapp: {
    display: "WhatsApp",
    href: "https://wa.me/21656806935",
  },
  email: "contact@lesjumelles-monastir.com",
  address: {
    display: "Avenue Trimeche, Monastir 5000, Tunisie",
    invoice: "Salle Les Jumelles Monastir - pres de gouvernorat",
  },
  socials: {
    instagram: "https://www.instagram.com/les_jumelles_salle_polyvalente/",
    facebook: "https://www.facebook.com/",
  },
};

/**
 * Navigation links — shared between Navbar and Footer.
 * Adding/removing a link here updates both components at once.
 */
export const NAV_LINKS = [
  { id: "galerie", label: "La Galerie" },
  { id: "packs", label: "Nos Packs" },
  { id: "infos", label: "À Propos" },
] as const;
