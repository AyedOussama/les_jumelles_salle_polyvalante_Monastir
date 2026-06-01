import type { BookingExtras } from "@/app/actions/booking";

type ExtraSettings = Record<string, { label: string }>;

const LEGACY_SELECTED_OPTIONS_MARKER = "Options sélectionnées:";

export function splitBookingSpecialNeeds(value?: string) {
  const rawValue = (value || "").trim();
  const markerIndex = rawValue.lastIndexOf(LEGACY_SELECTED_OPTIONS_MARKER);

  if (markerIndex === -1) {
    return {
      clientNotes: rawValue,
      optionLabels: [] as string[],
    };
  }

  const clientNotes = rawValue
    .slice(0, markerIndex)
    .replace(/\s*\|\s*$/, "")
    .trim();
  const optionLabels = rawValue
    .slice(markerIndex + LEGACY_SELECTED_OPTIONS_MARKER.length)
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);

  return { clientNotes, optionLabels };
}

export function normalizeOptionLabel(label: string) {
  return label
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function getExtraKeysForOptionLabels(
  optionLabels: string[],
  availableExtras?: ExtraSettings,
) {
  const entries = Object.entries(availableExtras || {});
  const keyByLabel = new Map(
    entries.map(([key, extra]) => [normalizeOptionLabel(extra.label), key]),
  );

  return Array.from(
    new Set(
      optionLabels
        .map((label) => keyByLabel.get(normalizeOptionLabel(label)))
        .filter((key): key is string => Boolean(key)),
    ),
  );
}

export function hydrateExtrasFromOptionLabels(
  extras: BookingExtras | undefined,
  availableExtras: ExtraSettings | undefined,
  optionLabels: string[],
) {
  const hydratedExtras: BookingExtras = { ...(extras || {}) };
  const matchedKeys = getExtraKeysForOptionLabels(optionLabels, availableExtras);

  matchedKeys.forEach((key) => {
    hydratedExtras[key] = true;
  });

  if (hydratedExtras.autres && matchedKeys.length > 0 && !matchedKeys.includes("autres")) {
    hydratedExtras.autres = false;
  }

  return hydratedExtras;
}
