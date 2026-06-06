"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "./auth";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "lib", "data", "settings.json");
const SETTINGS_DB_KEY = "site-settings";
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const CLOUDINARY_ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

let settingsTableReady: Promise<void> | null = null;
let cachedSettings: { value: SystemSettings; expiresAt: number } | null = null;

export interface SiteImage {
  url: string;
  publicId?: string;
  alt: string;
  title?: string;
  category?: string;
}

export interface SettingPack {
  id: number;
  title: string;
  description: string;
  detailedDescription: string;
  basePrice: number;
  features: string[];
  images?: SiteImage[];
}

export interface SettingExtra {
  label: string;
  price: number;
}

export interface AboutSettings {
  description: string;
  capacityValue: string;
  capacityDetail: string;
  structureValue: string;
  structureDetail: string;
  hours: string;
  phone: string;
}

export interface SystemSettings {
  packs: SettingPack[];
  extras: Record<string, SettingExtra>;
  about: AboutSettings;
  siteImages: {
    hero: SiteImage;
    gallery: SiteImage[];
  };
}

const DEFAULT_HERO_IMAGE: SiteImage = {
  url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
  alt: "Salle de réception Les Jumelles Monastir",
  title: "Photo principale",
  category: "Hero",
};

const DEFAULT_GALLERY_IMAGES: SiteImage[] = [
  {
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop",
    alt: "Table d'honneur et centres de table",
    category: "Décoration",
    title: "Table d'honneur & Centres de table",
  },
  {
    url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
    alt: "Grand hall avec lustres de cristal",
    category: "Architecture",
    title: "Le Grand Hall & Lustres de Cristal",
  },
  {
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
    alt: "Agencement de banquet",
    category: "Réception",
    title: "Agencement de Banquet Impérial",
  },
  {
    url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop",
    alt: "Scénographie lumineuse",
    category: "Éclairage",
    title: "Scénographie Lumineuse & Piste",
  },
  {
    url: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?q=80&w=1976&auto=format&fit=crop",
    alt: "Espace mariés premium",
    category: "Détails",
    title: "Trône Premium & Espace Mariés",
  },
  {
    url: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=2070&auto=format&fit=crop",
    alt: "Façade et accueil lumineux",
    category: "Extérieur",
    title: "Façade & Accueil Lumineux",
  },
];

const DEFAULT_PACK_IMAGES: Record<number, SiteImage[]> = {
  1: [
    { url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop", alt: "Pack mariage Les Jumelles", title: "Mariage 1" },
    { url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop", alt: "Ambiance mariage Les Jumelles", title: "Mariage 2" },
    { url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop", alt: "Décoration mariage Les Jumelles", title: "Mariage 3" },
  ],
  2: [
    { url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop", alt: "Pack fiançailles Les Jumelles", title: "Fiançailles 1" },
    { url: "https://images.unsplash.com/photo-1520854221256-17451cc35953?q=80&w=1200&auto=format&fit=crop", alt: "Cérémonie outia Les Jumelles", title: "Fiançailles 2" },
    { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop", alt: "Réception fiançailles Les Jumelles", title: "Fiançailles 3" },
  ],
  3: [
    { url: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop", alt: "Pack professionnel Les Jumelles", title: "Professionnel 1" },
    { url: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=1200&auto=format&fit=crop", alt: "Séminaire Les Jumelles", title: "Professionnel 2" },
    { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop", alt: "Événement professionnel Les Jumelles", title: "Professionnel 3" },
  ],
};

const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  description: "Les Jumelles est une salle de fêtes d'exception à Monastir pensée pour accueillir vos moments importants dans un cadre élégant, moderne et chaleureux. Spécialement conçue pour s'adapter à toutes vos envies, notre salle sublime les mariages féériques, les réceptions prestigieuses et les événements sur-mesure.",
  capacityValue: "Jusqu'à 500 personnes",
  capacityDetail: "300 personnes au 2ème étage, en option",
  structureValue: "Édifiée sur 2 étages",
  structureDetail: "Espaces modulables selon votre événement",
  hours: "Tous les jours\n10h00 - 18h00",
  phone: "+216 56 806 935",
};

const DEFAULT_SETTINGS: SystemSettings = {
  packs: [
    {
      id: 1,
      title: "Pack Mariage",
      description: "Une soirée féérique. La salle complète avec un agencement majestueux et une direction artistique dédiée pour votre grand jour.",
      detailedDescription: "Offrez-vous un mariage d'empereur au sein de la prestigieuse salle Les Jumelles. Ce pack d'exception comprend la privatisation totale de notre salle sur deux étages, l'installation d'une scène d'honneur majestueuse avec trône impérial au choix, un système d'éclairage architectural et robotisé à LED de dernière génération, l'accès exclusif à notre suite mariés privée ultra-confortable pour vos préparatifs, ainsi qu'une coordination artistique et logistique assurée de bout en bout par nos régisseurs.",
      basePrice: 3000,
      features: [
        "Scène et trône nuptial premium",
        "Éclairage architectural & robotisé",
        "Suite mariés privée ultra-comfort",
        "Capacité d'accueil maximale (800 pers.)",
        "Sonorisation acoustique impériale"
      ],
      images: DEFAULT_PACK_IMAGES[1],
    },
    {
      id: 2,
      title: "Fiançailles & Outia",
      description: "Un cadre intime et traditionnel, idéal pour célébrer vos fiançailles ou votre cérémonie d'Outia entourés de vos proches.",
      detailedDescription: "Célébrez votre union traditionnelle ou vos fiançailles dans un cadre élégant alliant tradition et modernité. Ce pack met à votre disposition notre salle entièrement décorée selon les thématiques de l'Outia tunisienne, comprenant les décors traditionnels brodés d'or, une sonorisation haute fidélité pour vos groupes de musique ou DJ, un accueil VIP pour vos proches et un service de rafraîchissement d'exception.",
      basePrice: 2000,
      features: [
        "Aménagement traditionnel sur-mesure",
        "Décoration florale et thématique",
        "Sonorisation haute fidélité",
        "Accueil et logistique professionnelle",
        "Espace cocktail & rafraîchissements"
      ],
      images: DEFAULT_PACK_IMAGES[2],
    },
    {
      id: 3,
      title: "Séminaire & Pro",
      description: "Pour vos réunions d'affaires, lancements de produit, conférences et dîners de gala d'entreprise dans un cadre prestigieux.",
      detailedDescription: "Assurez le succès de vos conférences, séminaires professionnels et soirées de gala d'entreprise. Nous mettons à votre disposition notre salle polyvalente modulable en configuration théâtre ou banquet. Ce pack comprend un équipement audiovisuel de pointe (vidéoprojecteur laser 4K, micros haute fidélité sans fil, sonorisation acoustique intégrée), un espace pause-café raffiné et un service d'accueil professionnel pour vos collaborateurs et clients.",
      basePrice: 1500,
      features: [
        "Disposition modulable (théâtre/banquet)",
        "Vidéoprojecteur laser & micros sans fil",
        "Espace pause-café et traiteur dédié",
        "Climatisation renforcée silencieuse",
        "Régie technique assurée"
      ],
      images: DEFAULT_PACK_IMAGES[3],
    }
  ],
  extras: {
    decoration: { label: "Décoration Florale & Trône Premium", price: 500 },
    sonorisation: { label: "Sonorisation Haute Fidélité & DJ", price: 400 },
    climatisation: { label: "Système de Climatisation Renforcé", price: 250 },
    traiteur: { label: "Menu de Fêtes & Service Traiteur", price: 1000 },
    autres: { label: "Autres aménagements spécifiques", price: 150 }
  },
  about: DEFAULT_ABOUT_SETTINGS,
  siteImages: {
    hero: DEFAULT_HERO_IMAGE,
    gallery: DEFAULT_GALLERY_IMAGES,
  }
};

function normalizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || fallback;
}

function normalizeAboutSettings(about?: Partial<AboutSettings>): AboutSettings {
  const source = about || {};

  return {
    description: normalizeText(source.description, DEFAULT_ABOUT_SETTINGS.description, 1200),
    capacityValue: normalizeText(source.capacityValue, DEFAULT_ABOUT_SETTINGS.capacityValue, 120),
    capacityDetail: normalizeText(source.capacityDetail, DEFAULT_ABOUT_SETTINGS.capacityDetail, 180),
    structureValue: normalizeText(source.structureValue, DEFAULT_ABOUT_SETTINGS.structureValue, 120),
    structureDetail: normalizeText(source.structureDetail, DEFAULT_ABOUT_SETTINGS.structureDetail, 180),
    hours: normalizeText(source.hours, DEFAULT_ABOUT_SETTINGS.hours, 240),
    phone: normalizeText(source.phone, DEFAULT_ABOUT_SETTINGS.phone, 40),
  };
}

function normalizeSettings(settings: Partial<SystemSettings>): SystemSettings {
  const packs = (settings.packs || DEFAULT_SETTINGS.packs).map((pack) => ({
    ...pack,
    images: Array.isArray(pack.images)
      ? pack.images
      : DEFAULT_PACK_IMAGES[pack.id] || DEFAULT_PACK_IMAGES[1],
  }));

  return {
    packs,
    extras: settings.extras || DEFAULT_SETTINGS.extras,
    about: normalizeAboutSettings(settings.about),
    siteImages: {
      hero: settings.siteImages?.hero || DEFAULT_HERO_IMAGE,
      gallery: DEFAULT_GALLERY_IMAGES.map((fallback, index) => ({
        ...fallback,
        ...(settings.siteImages?.gallery?.[index] || {}),
      })),
    },
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function revalidateSettingsPaths() {
  revalidatePath("/");
  revalidatePath("/(admin)/dashboard");
}

function toPrismaJson(settings: SystemSettings): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(settings)) as Prisma.InputJsonValue;
}

function getCachedSettings() {
  if (!cachedSettings || cachedSettings.expiresAt < Date.now()) {
    return null;
  }

  return cachedSettings.value;
}

function setCachedSettings(settings: SystemSettings) {
  cachedSettings = {
    value: settings,
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
  };
}

function parseStoredSettings(value: unknown): SystemSettings {
  if (typeof value === "string") {
    return normalizeSettings(JSON.parse(value) as Partial<SystemSettings>);
  }

  if (value && typeof value === "object") {
    return normalizeSettings(value as Partial<SystemSettings>);
  }

  return normalizeSettings(DEFAULT_SETTINGS);
}

async function readSeedSettings(): Promise<SystemSettings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    return normalizeSettings(JSON.parse(data) as Partial<SystemSettings>);
  } catch (error) {
    console.error("[Settings seed read Error]:", error);
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

async function ensureSettingsTable() {
  if (!settingsTableReady) {
    settingsTableReady = prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "key" TEXT PRIMARY KEY,
        "value" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `.then(() => undefined).catch((error) => {
      settingsTableReady = null;
      throw error;
    });
  }

  await settingsTableReady;
}

async function readSettingsFromDatabase(): Promise<SystemSettings | null> {
  await ensureSettingsTable();

  const record = await prisma.appSetting.findUnique({
    where: { key: SETTINGS_DB_KEY },
    select: { value: true },
  });

  return record ? parseStoredSettings(record.value) : null;
}

async function validateImageFile(file: FormDataEntryValue | null): Promise<File> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Aucune image valide n'a été sélectionnée.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Formats acceptés : JPG, PNG, WebP ou AVIF.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("L'image ne doit pas dépasser 4 Mo.");
  }

  const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isJpeg = signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const isPng =
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47;
  const isWebp =
    signature[0] === 0x52 &&
    signature[1] === 0x49 &&
    signature[2] === 0x46 &&
    signature[3] === 0x46 &&
    signature[8] === 0x57 &&
    signature[9] === 0x45 &&
    signature[10] === 0x42 &&
    signature[11] === 0x50;
  const isAvif =
    signature[4] === 0x66 &&
    signature[5] === 0x74 &&
    signature[6] === 0x79 &&
    signature[7] === 0x70 &&
    signature[8] === 0x61 &&
    signature[9] === 0x76 &&
    signature[10] === 0x69 &&
    signature[11] === 0x66;

  if (!isJpeg && !isPng && !isWebp && !isAvif) {
    throw new Error("Le contenu du fichier ne correspond pas à une image autorisée.");
  }

  return file;
}

async function persistSettings(settings: SystemSettings) {
  const normalizedSettings = normalizeSettings(settings);
  const value = toPrismaJson(normalizedSettings);

  await ensureSettingsTable();
  await prisma.appSetting.upsert({
    where: { key: SETTINGS_DB_KEY },
    update: { value },
    create: {
      key: SETTINGS_DB_KEY,
      value,
    },
  });

  setCachedSettings(normalizedSettings);
  revalidateSettingsPaths();
  return normalizedSettings;
}

/**
 * Lit les configurations administratives depuis PostgreSQL.
 */
export async function getSettingsAction(): Promise<SystemSettings> {
  try {
    const cached = getCachedSettings();
    if (cached) {
      return cached;
    }

    const storedSettings = await readSettingsFromDatabase();
    if (storedSettings) {
      setCachedSettings(storedSettings);
      return storedSettings;
    }

    const seedSettings = await readSeedSettings();
    await persistSettings(seedSettings);
    return seedSettings;
  } catch (error) {
    console.error("[Prisma getSettingsAction Error]:", error);
    return readSeedSettings();
  }
}

/**
 * Met à jour les configurations administratives de la salle.
 */
export async function updateSettingsAction(data: SystemSettings) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      throw new Error("Session administrateur expirée.");
    }

    // Validation minimale
    if (!data.packs || !data.extras || !data.about || !data.siteImages) {
      throw new Error("Format de paramètres invalide.");
    }

    const settings = await persistSettings(data);

    return { success: true, settings };
  } catch (error: unknown) {
    console.error("[Prisma updateSettingsAction Error]:", error);
    return { success: false, error: getErrorMessage(error, "Impossible de sauvegarder les paramètres.") };
  }
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Configuration Cloudinary manquante. Ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.");
  }

  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(params: Record<string, string | number | boolean>, apiSecret: string) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(serialized + apiSecret).digest("hex");
}

async function deleteCloudinaryImage(publicId?: string) {
  if (!publicId) return;

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    invalidate: true,
    public_id: publicId,
    timestamp,
  };

  const body = new URLSearchParams({
    api_key: apiKey,
    invalidate: "true",
    public_id: publicId,
    timestamp: String(timestamp),
    signature: signCloudinaryParams(params, apiSecret),
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[Cloudinary delete error]:", details);
  }
}

async function uploadCloudinaryImage(file: File) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
    folder: "les-jumelles/site",
    timestamp,
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("allowed_formats", CLOUDINARY_ALLOWED_FORMATS);
  formData.append("folder", params.folder);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signCloudinaryParams(params, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudinary a refusé l'upload: ${details}`);
  }

  const result = await response.json();
  return {
    url: result.secure_url as string,
    publicId: result.public_id as string,
  };
}

function resolveSiteImage(settings: SystemSettings, slot: string): SiteImage | undefined {
  const [section, first, second] = slot.split(":");

  if (section === "hero") return settings.siteImages.hero;

  if (section === "gallery") {
    const index = Number(first);
    if (!Number.isInteger(index) || index < 0 || index >= DEFAULT_GALLERY_IMAGES.length) {
      throw new Error("Emplacement de galerie invalide.");
    }
    return settings.siteImages.gallery[index] || DEFAULT_GALLERY_IMAGES[index];
  }

  if (section === "pack") {
    const packId = Number(first);
    const imageIndex = Number(second);
    const pack = settings.packs.find((item) => item.id === packId);
    const imageCount = pack?.images?.length || DEFAULT_PACK_IMAGES[packId]?.length || 0;
    if (!pack || !Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= imageCount) {
      throw new Error("Emplacement de formule invalide.");
    }
    return pack?.images?.[imageIndex] || DEFAULT_PACK_IMAGES[packId]?.[imageIndex] || DEFAULT_PACK_IMAGES[1][imageIndex];
  }

  throw new Error("Emplacement d'image inconnu.");
}

function applySiteImage(settings: SystemSettings, slot: string, image: SiteImage): SystemSettings {
  const [section, first, second] = slot.split(":");

  if (section === "hero") {
    return {
      ...settings,
      siteImages: {
        ...settings.siteImages,
        hero: image,
      },
    };
  }

  if (section === "gallery") {
    const index = Number(first);
    const gallery = [...settings.siteImages.gallery];
    gallery[index] = image;

    return {
      ...settings,
      siteImages: {
        ...settings.siteImages,
        gallery,
      },
    };
  }

  if (section === "pack") {
    const packId = Number(first);
    const imageIndex = Number(second);
    return {
      ...settings,
      packs: settings.packs.map((pack) => {
        if (pack.id !== packId) return pack;
        const images = [...(pack.images || DEFAULT_PACK_IMAGES[pack.id] || DEFAULT_PACK_IMAGES[1])];
        images[imageIndex] = image;
        return { ...pack, images };
      }),
    };
  }

  throw new Error("Emplacement d'image inconnu.");
}

export async function uploadSiteImageAction(slot: string, formData: FormData) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      throw new Error("Session administrateur expirée.");
    }

    const file = await validateImageFile(formData.get("file"));

    const currentSettings = await getSettingsAction();
    const previousImage = resolveSiteImage(currentSettings, slot);
    const uploadedImage = await uploadCloudinaryImage(file);
    const nextImage: SiteImage = {
      ...(previousImage || {
        alt: "Photo Les Jumelles Monastir",
        title: "Photo",
        category: "Image",
      }),
      url: uploadedImage.url,
      publicId: uploadedImage.publicId,
    };
    const updatedSettings = applySiteImage(currentSettings, slot, nextImage);

    const persistedSettings = await persistSettings(updatedSettings);

    if (previousImage?.publicId && previousImage.publicId !== uploadedImage.publicId) {
      await deleteCloudinaryImage(previousImage.publicId);
    }

    return { success: true, settings: persistedSettings };
  } catch (error: unknown) {
    console.error("[uploadSiteImageAction Error]:", error);
    return { success: false, error: getErrorMessage(error, "Impossible d'uploader cette image.") };
  }
}

export async function uploadPackImageAction(packId: number, formData: FormData) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      throw new Error("Session administrateur expirée.");
    }

    if (!Number.isInteger(packId) || packId <= 0) {
      throw new Error("Formule invalide.");
    }

    const file = await validateImageFile(formData.get("file"));
    const currentSettings = await getSettingsAction();
    const pack = currentSettings.packs.find((item) => item.id === packId);

    if (!pack) {
      throw new Error("Formule introuvable.");
    }

    const uploadedImage = await uploadCloudinaryImage(file);
    const currentImages = Array.isArray(pack.images) ? pack.images : [];
    const nextImage: SiteImage = {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId,
      alt: `Photo de la formule ${pack.title}`,
      title: `Photo ${currentImages.length + 1}`,
      category: "Formule",
    };

    const updatedSettings: SystemSettings = {
      ...currentSettings,
      packs: currentSettings.packs.map((item) =>
        item.id === packId
          ? { ...item, images: [...currentImages, nextImage] }
          : item
      ),
    };

    const persistedSettings = await persistSettings(updatedSettings);

    return { success: true, settings: persistedSettings };
  } catch (error: unknown) {
    console.error("[uploadPackImageAction Error]:", error);
    return { success: false, error: getErrorMessage(error, "Impossible d'ajouter cette photo.") };
  }
}

export async function deleteSiteImageAction(slot: string) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      throw new Error("Session administrateur expirée.");
    }

    const [section, first, second] = slot.split(":");
    if (section !== "pack") {
      throw new Error("Seules les photos de formules peuvent être supprimées ici.");
    }

    const packId = Number(first);
    const imageIndex = Number(second);
    const currentSettings = await getSettingsAction();
    const pack = currentSettings.packs.find((item) => item.id === packId);
    const previousImage = pack?.images?.[imageIndex];

    if (!pack || !previousImage) {
      throw new Error("Photo introuvable.");
    }

    const updatedSettings: SystemSettings = {
      ...currentSettings,
      packs: currentSettings.packs.map((item) => {
        if (item.id !== packId) return item;
        return {
          ...item,
          images: (item.images || []).filter((_image, index) => index !== imageIndex),
        };
      }),
    };

    const persistedSettings = await persistSettings(updatedSettings);

    if (previousImage.publicId) {
      await deleteCloudinaryImage(previousImage.publicId);
    }

    return { success: true, settings: persistedSettings };
  } catch (error: unknown) {
    console.error("[deleteSiteImageAction Error]:", error);
    return { success: false, error: getErrorMessage(error, "Impossible de supprimer cette photo.") };
  }
}
