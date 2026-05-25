"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  deleteSiteImageAction,
  uploadPackImageAction,
  uploadSiteImageAction,
  type SiteImage,
  type SystemSettings,
} from "@/app/actions/settings";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  Loader2,
  Plus,
  Settings,
  Image as ImageIcon,
  Sparkles,
  Speaker,
  Trash,
  UploadCloud,
  Utensils,
  Wind,
} from "lucide-react";

type SettingsSection = "packs" | "extras" | "photos";

interface SettingsPanelProps {
  settings: SystemSettings | null;
  setSettings: Dispatch<SetStateAction<SystemSettings | null>>;
  settingsLoading: boolean;
  savingSettings: boolean;
  activeSettingsSection: SettingsSection;
  setActiveSettingsSection: (section: SettingsSection) => void;
  activePackId: string | null;
  setActivePackId: (id: string | null) => void;
  onSave: () => boolean | Promise<boolean>;
  onSettingsPersisted: (settings: SystemSettings) => void;
}

export function SettingsPanel({
  settings,
  setSettings,
  settingsLoading,
  savingSettings,
  activeSettingsSection,
  setActiveSettingsSection,
  activePackId,
  setActivePackId,
  onSave,
  onSettingsPersisted,
}: SettingsPanelProps) {
  const [uploadingImageSlot, setUploadingImageSlot] = useState<string | null>(null);
  const [deletingImageSlot, setDeletingImageSlot] = useState<string | null>(null);
  const settingsPackCount = settings?.packs?.length || 0;
  const settingsExtraCount = settings?.extras ? Object.keys(settings.extras).length : 0;
  const settingsPhotoCount = 1 + (settings?.siteImages?.gallery?.length || 0);
  const settingsSections = [
    {
      id: "packs" as const,
      label: "Formules & Packs",
      count: settingsPackCount,
      countLabel: settingsPackCount > 1 ? "formules" : "formule",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "extras" as const,
      label: "Options & Suppléments",
      count: settingsExtraCount,
      countLabel: settingsExtraCount > 1 ? "options" : "option",
      icon: <Sparkles size={20} />,
    },
    {
      id: "photos" as const,
      label: "Photos du Site",
      count: settingsPhotoCount,
      countLabel: settingsPhotoCount > 1 ? "photos" : "photo",
      icon: <ImageIcon size={20} />,
    },
  ];

  const getExtraIcon = (key: string) => {
    switch (key) {
      case "decoration": return <Sparkles size={12} />;
      case "sonorisation": return <Speaker size={12} />;
      case "climatisation": return <Wind size={12} />;
      case "traiteur": return <Utensils size={12} />;
      default: return <ClipboardCheck size={12} />;
    }
  };

  const handleAddPack = () => {
    if (!settings) return;
    const newId = settings.packs.length > 0
      ? Math.max(...settings.packs.map((p) => Number(p.id) || 0)) + 1
      : 1;
    const newPack = {
      id: newId,
      title: `Nouvelle Formule ${newId}`,
      description: "Description courte de la nouvelle formule.",
      basePrice: 1500,
      detailedDescription: "Description détaillée et conditions de la nouvelle formule.",
      features: [
        "Caractéristique 1",
        "Caractéristique 2",
        "Caractéristique 3",
        "Caractéristique 4",
        "Caractéristique 5",
      ],
      images: [],
    };
    setSettings({
      ...settings,
      packs: [...settings.packs, newPack],
    });
    setActivePackId(String(newPack.id));
  };

  const handleDeletePack = (id: string | number) => {
    if (!settings) return;
    if (settings.packs.length <= 1) {
      alert("Vous devez garder au moins une formule active.");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer cette formule ?")) {
      setSettings({
        ...settings,
        packs: settings.packs.filter((pack) => String(pack.id) !== String(id)),
      });
      if (activePackId === String(id)) {
        setActivePackId(null);
      }
    }
  };

  const handleAddExtra = () => {
    if (!settings) return;
    const technicalKey = `extra_${Date.now()}`;
    setSettings({
      ...settings,
      extras: {
        ...settings.extras,
        [technicalKey]: {
          label: "Nouveau Supplément",
          price: 100,
        },
      },
    });
  };

  const handleDeleteExtra = (key: string) => {
    if (!settings) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer cette option ?")) {
      const updatedExtras = { ...settings.extras };
      delete updatedExtras[key];
      setSettings({
        ...settings,
        extras: updatedExtras,
      });
    }
  };

  const handleImageUpload = async (slot: string, file?: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingImageSlot(slot);

    try {
      const result = await uploadSiteImageAction(slot, formData);
      if (result.success && result.settings) {
        setSettings(result.settings);
        onSettingsPersisted(result.settings);
      } else {
        alert(result.error || "Impossible d'uploader cette image.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur inattendue est survenue pendant l'upload.");
    } finally {
      setUploadingImageSlot(null);
    }
  };

  const handlePackImageAdd = async (packId: number, file?: File) => {
    if (!file) return;
    const uploadSlot = `pack:${packId}:add`;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingImageSlot(uploadSlot);

    try {
      const result = await uploadPackImageAction(packId, formData);
      if (result.success && result.settings) {
        setSettings(result.settings);
        onSettingsPersisted(result.settings);
      } else {
        alert(result.error || "Impossible d'ajouter cette photo.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur inattendue est survenue pendant l'upload.");
    } finally {
      setUploadingImageSlot(null);
    }
  };

  const handleImageDelete = async (slot: string) => {
    if (!confirm("Supprimer cette photo de la formule ? Si elle est sur Cloudinary, elle sera aussi supprimée.")) {
      return;
    }

    setDeletingImageSlot(slot);
    try {
      const result = await deleteSiteImageAction(slot);
      if (result.success && result.settings) {
        setSettings(result.settings);
        onSettingsPersisted(result.settings);
      } else {
        alert(result.error || "Impossible de supprimer cette photo.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur inattendue est survenue pendant la suppression.");
    } finally {
      setDeletingImageSlot(null);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-500 bg-white rounded-3xl border border-slate-200/60 shadow-sm min-h-[500px]">
        <Loader2 size={40} className="animate-spin text-[#C5A880] mb-4" />
        <h3 className="text-lg font-serif text-slate-800 font-bold">Chargement en cours</h3>
        <p className="text-xs font-light text-slate-400 mt-1">Récupération des tarifs et configurations...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-8 rounded-3xl text-sm font-medium text-center shadow-sm">
        <AlertTriangle className="mx-auto text-rose-500 mb-2" size={32} />
        <h4 className="text-base font-bold mb-1">Erreur de chargement</h4>
        <p className="text-xs font-light text-rose-600">Impossible de charger le fichier de configuration de la salle.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/60 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A880] bg-[#C5A880]/10 border border-[#C5A880]/20 px-3 py-1 rounded-full">
              <Settings size={12} />
              Paramètres
            </span>
            <h3 className="text-xl font-serif font-bold text-slate-900 mt-3">Configuration de la Salle</h3>
            <p className="text-xs text-slate-500 font-light mt-1">
              Choisissez une section, modifiez uniquement ce dont vous avez besoin, puis sauvegardez.
            </p>
          </div>
          <SaveButton saving={savingSettings} onSave={onSave} compact />
        </div>

        <div className="rounded-2xl bg-slate-100/80 border border-slate-200 p-2">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Choisir une section</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {settingsSections.map((section) => {
              const isActive = activeSettingsSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSettingsSection(section.id)}
                  aria-pressed={isActive}
                  className={`group text-left rounded-xl border p-4 transition-all duration-300 ${
                    isActive
                      ? "bg-[#C5A880] border-[#C5A880] text-white shadow-md shadow-[#C5A880]/20"
                      : "bg-white border-slate-200 text-slate-700 hover:border-[#C5A880]/50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                      isActive ? "bg-white/15 text-white" : "bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880]/20"
                    }`}>
                      {section.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-bold text-base leading-tight">{section.label}</h4>
                      <p className={`text-xs mt-1 ${isActive ? "text-white/80" : "text-slate-500"}`}>
                        {section.count} {section.countLabel}
                      </p>
                    </div>
                    {isActive && <CheckCircle2 size={18} className="shrink-0 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeSettingsSection === "packs" && (
        <div className="space-y-5">
          <SectionHeader
            icon={<LayoutDashboard size={18} />}
            title="Formules & Packs"
            subtitle={`${settingsPackCount} formule${settingsPackCount > 1 ? "s" : ""} configurée${settingsPackCount > 1 ? "s" : ""}`}
            actionLabel="Ajouter une Formule"
            onAction={handleAddPack}
          />

          <div className="grid grid-cols-1 gap-5">
            {settings.packs.map((pack, index) => {
              const isPackOpen = activePackId === String(pack.id);

              return (
                <div key={pack.id} className={`bg-white rounded-2xl border shadow-sm relative overflow-hidden transition-all ${
                  isPackOpen ? "border-[#C5A880]/50 shadow-md shadow-[#C5A880]/10" : "border-slate-200/70"
                }`}>
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C5A880] opacity-80"></div>

                  <div className="flex flex-wrap items-center gap-3 p-4 md:p-5">
                    <button
                      type="button"
                      onClick={() => setActivePackId(isPackOpen ? null : String(pack.id))}
                      aria-expanded={isPackOpen}
                      className="flex-1 min-w-[220px] text-left flex items-center justify-between gap-4 rounded-xl hover:bg-slate-50 p-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#C5A880]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Formule N°{pack.id}
                        </span>
                        <h5 className="text-base font-serif font-bold text-slate-900 mt-2 truncate">{pack.title}</h5>
                        <p className="text-xs text-slate-500 mt-1">
                          {pack.basePrice.toLocaleString()} DT · {pack.features.length} avantage{pack.features.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${isPackOpen ? "rotate-180 text-[#C5A880]" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleDeletePack(pack.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Trash size={12} />
                      <span>Supprimer</span>
                    </button>
                  </div>

                  {isPackOpen && (
                    <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 pt-5">
                        <div className="md:col-span-2">
                          <FieldLabel>Nom de la Formule</FieldLabel>
                          <input
                            type="text"
                            value={pack.title}
                            onChange={(e) => {
                              const updatedPacks = [...settings.packs];
                              updatedPacks[index] = { ...pack, title: e.target.value };
                              setSettings({ ...settings, packs: updatedPacks });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
                          />
                        </div>

                        <div>
                          <FieldLabel>Tarif de Base (DT)</FieldLabel>
                          <input
                            type="number"
                            value={pack.basePrice}
                            onChange={(e) => {
                              const updatedPacks = [...settings.packs];
                              updatedPacks[index] = { ...pack, basePrice: Number(e.target.value) };
                              setSettings({ ...settings, packs: updatedPacks });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-[#C5A880] focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 mb-5">
                        <div>
                          <FieldLabel>Description Courte</FieldLabel>
                          <input
                            type="text"
                            value={pack.description}
                            onChange={(e) => {
                              const updatedPacks = [...settings.packs];
                              updatedPacks[index] = { ...pack, description: e.target.value };
                              setSettings({ ...settings, packs: updatedPacks });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
                          />
                        </div>

                        <div>
                          <FieldLabel>Description Détaillée</FieldLabel>
                          <textarea
                            value={pack.detailedDescription}
                            rows={4}
                            onChange={(e) => {
                              const updatedPacks = [...settings.packs];
                              updatedPacks[index] = { ...pack, detailedDescription: e.target.value };
                              setSettings({ ...settings, packs: updatedPacks });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all resize-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Avantages inclus ({pack.features.length} points)
                          </span>
                          <button
                            onClick={() => {
                              const updatedFeatures = [...pack.features, "Nouvel avantage"];
                              const updatedPacks = [...settings.packs];
                              updatedPacks[index] = { ...pack, features: updatedFeatures };
                              setSettings({ ...settings, packs: updatedPacks });
                            }}
                            className="text-[#C5A880] hover:text-[#b2936a] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <Plus size={12} />
                            <span>Ajouter un Point</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {pack.features.map((feat, featIndex) => (
                            <div key={featIndex} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-sm hover:border-[#C5A880]/30 transition-all">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Check size={14} className="text-emerald-600 shrink-0" />
                                <input
                                  type="text"
                                  value={feat}
                                  onChange={(e) => {
                                    const updatedFeatures = [...pack.features];
                                    updatedFeatures[featIndex] = e.target.value;

                                    const updatedPacks = [...settings.packs];
                                    updatedPacks[index] = { ...pack, features: updatedFeatures };
                                    setSettings({ ...settings, packs: updatedPacks });
                                  }}
                                  className="w-full bg-transparent border-none p-0 text-xs font-semibold focus:outline-none text-slate-700 focus:ring-0"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const updatedFeatures = pack.features.filter((_feature, fi) => fi !== featIndex);
                                  const updatedPacks = [...settings.packs];
                                  updatedPacks[index] = { ...pack, features: updatedFeatures };
                                  setSettings({ ...settings, packs: updatedPacks });
                                }}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer shrink-0"
                                title="Supprimer cet avantage"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Photos de la formule ({pack.images?.length || 0})
                          </span>
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#C5A880]/30 bg-[#C5A880]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#C5A880] transition-colors hover:bg-[#C5A880]/20">
                            {uploadingImageSlot === `pack:${pack.id}:add` ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            <span>{uploadingImageSlot === `pack:${pack.id}:add` ? "Upload..." : "Ajouter une photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              disabled={uploadingImageSlot === `pack:${pack.id}:add`}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                handlePackImageAdd(pack.id, file);
                              }}
                            />
                          </label>
                        </div>
                        {(pack.images?.length || 0) > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(pack.images || []).map((image, imageIndex) => {
                              const slot = `pack:${pack.id}:${imageIndex}`;
                              return (
                                <PhotoSlotCard
                                  key={`${slot}-${image.publicId || image.url}`}
                                  image={image}
                                  title={`Photo ${imageIndex + 1}`}
                                  slot={slot}
                                  uploadingImageSlot={uploadingImageSlot}
                                  deletingImageSlot={deletingImageSlot}
                                  onUpload={handleImageUpload}
                                  onDelete={handleImageDelete}
                                  canDelete
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <ImageIcon size={24} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700">Aucune photo pour cette formule</p>
                            <p className="mt-1 text-xs text-slate-400">Ajoutez seulement les photos nécessaires. Ce n&apos;est pas obligatoire d&apos;avoir 3 photos.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSettingsSection === "extras" && (
        <div className="space-y-5">
          <SectionHeader
            icon={<Sparkles size={18} />}
            title="Options & Suppléments"
            subtitle={`${settingsExtraCount} option${settingsExtraCount > 1 ? "s" : ""} configurée${settingsExtraCount > 1 ? "s" : ""}`}
            actionLabel="Ajouter un Extra"
            onAction={handleAddExtra}
          />

          <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/60 shadow-sm">
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(settings.extras).map((key) => {
                const extra = settings.extras[key];
                return (
                  <div key={key} className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#C5A880]/30 transition-all duration-300 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#C5A880] text-white flex items-center justify-center shadow-md shrink-0">
                      {getExtraIcon(key)}
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <FieldLabel>Nom de l&apos;option</FieldLabel>
                      <input
                        type="text"
                        value={extra.label}
                        onChange={(e) => {
                          const updatedExtras = { ...settings.extras };
                          updatedExtras[key] = { ...extra, label: e.target.value };
                          setSettings({ ...settings, extras: updatedExtras });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
                      />
                    </div>

                    <div className="w-full md:w-48">
                      <FieldLabel>Prix (DT)</FieldLabel>
                      <input
                        type="number"
                        value={extra.price}
                        onChange={(e) => {
                          const updatedExtras = { ...settings.extras };
                          updatedExtras[key] = { ...extra, price: Number(e.target.value) };
                          setSettings({ ...settings, extras: updatedExtras });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#C5A880] focus:outline-none focus:ring-2 focus:ring-[#C5A880]/20 focus:border-[#C5A880] transition-all"
                      />
                    </div>

                    <div className="flex items-center self-end md:self-center h-10 shrink-0">
                      <button
                        onClick={() => handleDeleteExtra(key)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
                        title="Supprimer cet extra"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSettingsSection === "photos" && (
        <div className="space-y-5">
          <SectionHeader
            icon={<ImageIcon size={18} />}
            title="Photos du Site"
            subtitle="Remplacez les visuels publics. Chaque nouveau fichier remplace et supprime l'ancienne image Cloudinary."
            actionLabel="Sauvegarde automatique"
            onAction={() => undefined}
            disabledAction
          />

          <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/60 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/20">
                  <Camera size={18} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-slate-900">Image principale</h4>
                  <p className="text-xs text-slate-500">Utilisée dans le hero de la page d&apos;accueil.</p>
                </div>
              </div>

              <PhotoSlotCard
                image={settings.siteImages.hero}
                title="Hero"
                slot="hero"
                uploadingImageSlot={uploadingImageSlot}
                deletingImageSlot={deletingImageSlot}
                onUpload={handleImageUpload}
                wide
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/20">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-slate-900">Galerie publique</h4>
                  <p className="text-xs text-slate-500">Les 6 images visibles dans la section galerie.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.siteImages.gallery.map((image, index) => {
                  const slot = `gallery:${index}`;
                  return (
                    <PhotoSlotCard
                      key={slot}
                      image={image}
                      title={`Galerie ${index + 1}`}
                      slot={slot}
                      uploadingImageSlot={uploadingImageSlot}
                      deletingImageSlot={deletingImageSlot}
                      onUpload={handleImageUpload}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <SaveButton saving={savingSettings} onSave={onSave} />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  disabledAction = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  disabledAction?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center border border-[#C5A880]/20">
          {icon}
        </div>
        <div>
          <h4 className="text-lg font-serif font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onAction}
        disabled={disabledAction}
        className="bg-[#C5A880]/10 hover:bg-[#C5A880]/20 disabled:hover:bg-[#C5A880]/10 disabled:opacity-80 text-[#C5A880] text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-1.5 border border-[#C5A880]/30 active:scale-[0.98] cursor-pointer disabled:cursor-default shadow-sm"
      >
        {disabledAction ? <CheckCircle2 size={13} /> : <Plus size={13} />}
        <span>{actionLabel}</span>
      </button>
    </div>
  );
}

function PhotoSlotCard({
  image,
  title,
  slot,
  uploadingImageSlot,
  deletingImageSlot,
  onUpload,
  onDelete,
  canDelete = false,
  wide = false,
}: {
  image: SiteImage;
  title: string;
  slot: string;
  uploadingImageSlot: string | null;
  deletingImageSlot: string | null;
  onUpload: (slot: string, file?: File) => void;
  onDelete?: (slot: string) => void;
  canDelete?: boolean;
  wide?: boolean;
}) {
  const isUploading = uploadingImageSlot === slot;
  const isDeleting = deletingImageSlot === slot;

  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-slate-50 p-3 shadow-sm ${wide ? "max-w-3xl" : ""}`}>
      <div className={`relative overflow-hidden rounded-xl bg-slate-200 ${wide ? "aspect-[16/7]" : "aspect-[4/3]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt || title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A880]">
              {image.category || "Image"}
            </span>
            <h5 className="truncate text-sm font-serif font-bold text-white">{image.title || title}</h5>
          </div>
          {image.publicId && (
            <span className="rounded-full bg-emerald-500/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
              Cloudinary
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">{title}</p>
          <p className="truncate text-[10px] text-slate-400">{image.publicId || "Image par défaut"}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
        {canDelete && onDelete && (
          <button
            type="button"
            disabled={isDeleting || isUploading}
            onClick={() => onDelete(slot)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 shadow-sm transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash size={13} />}
            <span>{isDeleting ? "..." : "Supprimer"}</span>
          </button>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#C5A880]/30 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#C5A880] shadow-sm transition-colors hover:bg-[#C5A880]/10">
          {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          <span>{isUploading ? "Upload..." : "Changer"}</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isUploading || isDeleting}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              onUpload(slot, file);
            }}
          />
        </label>
        </div>
      </div>
    </div>
  );
}

function SaveButton({
  saving,
  onSave,
  compact = false,
}: {
  saving: boolean;
  onSave: () => boolean | Promise<boolean>;
  compact?: boolean;
}) {
  return (
    <button
      disabled={saving}
      onClick={onSave}
      className={`bg-[#C5A880] hover:bg-[#b2936a] disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 shadow-md shadow-[#C5A880]/20 uppercase tracking-widest flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer active:scale-[0.98] ${
        compact ? "py-3 px-5 text-xs" : "py-4 px-8 text-sm"
      }`}
    >
      {saving ? (
        <>
          <Loader2 size={compact ? 14 : 16} className="animate-spin" />
          <span>{compact ? "Enregistrement..." : "Sauvegarde en cours..."}</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={compact ? 14 : 16} />
          <span>Sauvegarder</span>
        </>
      )}
    </button>
  );
}
