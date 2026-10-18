"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Download, Eye, FilePenLine, Loader2, Printer, Save, ShieldCheck, X } from "lucide-react";
import { getBookingContractAction, saveBookingContractAction } from "@/app/actions/contract";
import type { Booking } from "@/lib/context/BookingContext";
import { useToast } from "@/lib/context/ToastContext";
import {
  CONTRACT_PAYMENT_METHODS,
  CONTRACT_TEXT_LIMITS,
  contractRemainingAmount,
  createContractDraft,
  formatContractMoney,
  normalizeContractDigits,
  validateContractData,
  type ContractData,
  type ContractErrors,
} from "@/lib/contracts";
import { ContractPreview } from "./ContractPreview";

type Operation = "save" | "download" | "print";
type TextField = Exclude<keyof ContractData, "totalPrice" | "advancePayment" | "securityDeposit" | "overtimeHourlyRate" | "cancellationDeduction">;
type AmountField = "totalPrice" | "advancePayment" | "securityDeposit" | "overtimeHourlyRate" | "cancellationDeduction";

export function ContractModal({ booking, ownerPhone, onClose }: { booking: Booking; ownerPhone?: string; onClose: () => void }) {
  const toast = useToast();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [initialDraft] = useState(() => createContractDraft(booking, ownerPhone));
  const [data, setData] = useState<ContractData>(initialDraft);
  const [savedSignature, setSavedSignature] = useState(() => JSON.stringify(initialDraft));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [errors, setErrors] = useState<ContractErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [operation, setOperation] = useState<Operation | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showDiscard, setShowDiscard] = useState(false);
  const busy = operation !== null;
  const dirty = JSON.stringify(data) !== savedSignature;
  const idPrefix = `contract-${booking.id}`;

  useEffect(() => {
    let ignore = false;
    getBookingContractAction(booking.id).then((contract) => {
      if (ignore) return;
      const draft = contract?.data || initialDraft;
      setData(draft);
      setSavedSignature(JSON.stringify(draft));
      setSavedAt(contract?.savedAt || null);
      setLoading(false);
    }).catch(() => {
      if (ignore) return;
      setLoadError("Impossible de charger le contrat. Réessayez pour ne pas écraser un contrat existant.");
      setLoading(false);
    });
    return () => { ignore = true; };
  }, [booking.id, loadAttempt, initialDraft]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty) setShowDiscard(true);
    else onClose();
  }, [busy, dirty, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (showDiscard) setShowDiscard(false);
        else requestClose();
      }
      if (event.key !== "Tab") return;
      const scope = showDiscard ? dialogRef.current?.querySelector('[role="alertdialog"]') : dialogRef.current;
      const elements = Array.from(scope?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
      ) || []).filter((element) => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !scope?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !scope?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty || busy) { event.preventDefault(); event.returnValue = ""; }
    };
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [requestClose, dirty, busy, showDiscard]);

  const updateField = <K extends keyof ContractData>(key: K, value: ContractData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setErrorMessage("");
  };

  const handleSave = async (mode: Operation) => {
    if (busy || loading || loadError) return;
    const validation = validateContractData(data);
    setErrors(validation.errors);
    if (!validation.valid) {
      setActiveTab("edit");
      setErrorMessage("يرجى إكمال الحقول المشار إليها قبل حفظ العقد أو طباعته.");
      requestAnimationFrame(() => document.getElementById(`${idPrefix}-${Object.keys(validation.errors)[0]}`)?.focus());
      return;
    }

    // Open synchronously with the click so browsers do not block the PDF tab.
    // A top-level PDF avoids weakening the site's iframe / object security policy.
    const printWindow = mode === "print" ? window.open("about:blank", "_blank") : null;
    if (printWindow) {
      printWindow.opener = null;
      printWindow.document.title = "Préparation du contrat Les Jumelles…";
      printWindow.document.body.textContent = "Préparation du contrat PDF… Veuillez patienter.";
    }
    setOperation(mode);
    setErrorMessage("");
    try {
      const result = await saveBookingContractAction(booking.id, validation.data);
      if (!result.success) {
        setErrors(result.errors);
        setActiveTab("edit");
        throw new Error("Veuillez vérifier les informations du contrat.");
      }
      setData(result.contract.data);
      setSavedSignature(JSON.stringify(result.contract.data));
      setSavedAt(result.contract.savedAt);
      if (mode === "save") {
        toast.success("Contrat enregistré. La réservation et le devis n'ont pas été modifiés.");
        return;
      }
      const response = await fetch(`/api/admin/bookings/${booking.id}/contrat`, {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Impossible de générer le PDF. Le contrat reste enregistré.");
      }
      const url = URL.createObjectURL(await response.blob());
      if (printWindow && !printWindow.closed) {
        printWindow.location.replace(url);
        toast.info("Le PDF est ouvert. Utilisez l'icône d'impression du lecteur PDF pour l'imprimer.", 7000);
        // Keep the PDF alive long enough for the viewer to load it, including on mobile.
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `Contrat_${booking.dossierNum.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        if (mode === "print") toast.info("L'ouverture a été bloquée. Le PDF est téléchargé : ouvrez-le pour l'imprimer.", 7000);
        else toast.success("Contrat PDF téléchargé, prêt pour les deux signatures.");
      }
    } catch (error) {
      printWindow?.close();
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer le contrat.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setOperation(null);
    }
  };

  const field = (key: TextField, label: string, type = "text") => {
    const numeric = key.endsWith("Cin") || type === "tel";
    return (
      <Field key={key} id={`${idPrefix}-${key}`} label={label} error={errors[key]}>
        <input
          id={`${idPrefix}-${key}`} name={key} value={data[key]} type={type} required
          dir={numeric || type === "date" || type === "time" ? "ltr" : "auto"}
          maxLength={key.endsWith("Cin") ? 8 : CONTRACT_TEXT_LIMITS[key as keyof typeof CONTRACT_TEXT_LIMITS]}
          inputMode={key.endsWith("Cin") ? "numeric" : undefined}
          onChange={(event) => updateField(key, numeric ? normalizeContractDigits(event.target.value) : event.target.value as ContractData[typeof key])}
          aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${idPrefix}-${key}-error` : undefined}
          className={inputClass(Boolean(errors[key]))}
        />
      </Field>
    );
  };

  const amountField = (key: AmountField, label: string) => (
    <Field key={key} id={`${idPrefix}-${key}`} label={`${label} (د.ت)`} error={errors[key]}>
      <input
        id={`${idPrefix}-${key}`} name={key} type="number" min={0} max={1_000_000} step="0.001" required dir="ltr"
        value={Number.isFinite(data[key]) ? data[key] : ""}
        onChange={(event) => updateField(key, event.target.value === "" ? Number.NaN : Number(event.target.value))}
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${idPrefix}-${key}-error` : undefined}
        className={inputClass(Boolean(errors[key]))}
      />
    </Field>
  );

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${idPrefix}-title`} tabIndex={-1} className="relative flex max-h-[95dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#C5A880]/30 bg-white shadow-2xl outline-none">
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a38556]">Dossier {booking.dossierNum} · Document indépendant du devis</span>
            <h2 id={`${idPrefix}-title`} className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900"><FilePenLine size={22} className="text-[#a38556]" />Contrat de location</h2>
            <p className="mt-1 text-sm text-slate-500" lang="ar" dir="rtl">عقد كراء واستغلال فضاء Les Jumelles</p>
          </div>
          <button type="button" onClick={requestClose} disabled={busy} aria-label="Fermer le contrat" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40"><X size={22} /></button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 sm:px-7">
          <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Édition et aperçu du contrat">
            {(["edit", "preview"] as const).map((tab) => (
              <button key={tab} type="button" id={`${idPrefix}-tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls={`${idPrefix}-panel-${tab}`} onClick={() => setActiveTab(tab)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold sm:px-4 ${activeTab === tab ? "bg-white text-[#10344d] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                {tab === "edit" ? <FilePenLine size={15} /> : <Eye size={15} />}{tab === "edit" ? "Informations du contrat" : "Aperçu A4"}
              </button>
            ))}
          </div>
          {!loading && !loadError && <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${dirty ? "text-amber-600" : savedAt ? "text-emerald-600" : "text-slate-400"}`}>
            {savedAt && !dirty && <CheckCircle2 size={14} />}{dirty ? "Modifications non enregistrées" : savedAt ? "Contrat enregistré" : "Nouveau contrat"}
          </span>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 p-5 sm:p-7">
          {loading ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-slate-500"><Loader2 className="animate-spin text-[#C5A880]" />Chargement du contrat…</div> : loadError ? (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <p>{loadError}</p><button type="button" onClick={() => { setLoading(true); setLoadError(""); setLoadAttempt((current) => current + 1); }} className="mt-3 rounded-lg border border-rose-200 bg-white px-4 py-2 font-bold">Réessayer</button>
            </div>
          ) : <>
            {errorMessage && <p role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><AlertCircle size={18} className="shrink-0" /><span dir="auto">{errorMessage}</span></p>}
            <div role="tabpanel" id={`${idPrefix}-panel-edit`} aria-labelledby={`${idPrefix}-tab-edit`} hidden={activeTab !== "edit"}>
              <p className="mb-5 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs leading-relaxed text-sky-900"><ShieldCheck size={18} className="shrink-0" />Les informations connues sont préremplies et restent modifiables pour ce contrat uniquement. Aucun changement de réservation, de devis ou de données existantes.</p>
              <form id={`${idPrefix}-form`} noValidate onSubmit={(event) => { event.preventDefault(); void handleSave("save"); }} lang="ar" dir="rtl" style={{ fontFamily: '"Contract Tajawal", Arial, sans-serif' }}>
                <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <FormSection title="المالك (قاعة Les Jumelles)">
                      {field("ownerName", "الاسم واللقب")}{field("ownerCin", "رقم بطاقة التعريف الوطنية")}
                      {field("ownerAddress", "العنوان")}{field("ownerPhone", "الهاتف", "tel")}
                    </FormSection>
                    <FormSection title="المكتري">
                      {field("renterName", "الاسم واللقب")}{field("renterCin", "رقم بطاقة التعريف الوطنية")}
                      {field("renterAddress", "العنوان")}{field("renterPhone", "الهاتف", "tel")}
                    </FormSection>
                  </div>
                  <FormSection title="موضوع العقد ومدة الكراء">
                    {field("contractDate", "تاريخ إبرام العقد", "date")}{field("eventType", "الحفل / المناسبة")}
                    {field("startDate", "بداية فترة الكراء", "date")}{field("endDate", "نهاية فترة الكراء", "date")}
                    {field("entryTime", "وقت الدخول إلى القاعة", "time")}{field("exitTime", "وقت الخروج من القاعة", "time")}
                    <p className="text-xs text-slate-500 sm:col-span-2">توقيت الخروج 00:00 يعني منتصف الليل. يمكن أن ينتهي الحفل في اليوم الموالي.</p>
                  </FormSection>
                  <FormSection title="معلوم الكراء وطريقة الدفع والضمان المالي">
                    {amountField("totalPrice", "المبلغ الإجمالي للكراء")}{amountField("advancePayment", "العربون عند إمضاء العقد")}
                    <div className="rounded-xl border border-[#C5A880]/25 bg-[#FAF6F0] px-4 py-3 sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">المتبقي قبل تاريخ الحفل: </span><output className="font-bold text-[#10344d]"><bdi>{formatContractMoney(contractRemainingAmount(data))}</bdi> د.ت</output>
                    </div>
                    <Field id={`${idPrefix}-paymentMethod`} label="طريقة الدفع" error={errors.paymentMethod}>
                      <select id={`${idPrefix}-paymentMethod`} name="paymentMethod" value={data.paymentMethod} onChange={(event) => updateField("paymentMethod", event.target.value as ContractData["paymentMethod"])} aria-invalid={Boolean(errors.paymentMethod)} aria-describedby={errors.paymentMethod ? `${idPrefix}-paymentMethod-error` : undefined} className={inputClass(Boolean(errors.paymentMethod))}>
                        {Object.entries(CONTRACT_PAYMENT_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    {amountField("securityDeposit", "الضمان المالي")}
                    {amountField("overtimeHourlyRate", "معلوم كل ساعة إضافية")}
                    {amountField("cancellationDeduction", "مبلغ الخصم عند الإلغاء قبل أقل من 30 يوما")}
                    <p className="text-xs leading-relaxed text-amber-800 sm:col-span-2">شروط الإلغاء وبقية البنود مطابقة للنموذج المقدم. راجع المبالغ والشروط في المعاينة قبل الإمضاء. الضمان المالي مستقل عن معلوم الكراء.</p>
                  </FormSection>
                </fieldset>
              </form>
            </div>
            <div role="tabpanel" id={`${idPrefix}-panel-preview`} aria-labelledby={`${idPrefix}-tab-preview`} hidden={activeTab !== "preview"}>
              <p className="mb-4 text-center text-xs text-slate-500">Contrat en arabe · Format A4 · Les deux signatures restent à compléter à la main.</p>
              {activeTab === "preview" && <div className="mx-auto max-w-[906px]"><ContractPreview data={data} dossierNum={booking.dossierNum} /></div>}
            </div>
          </>}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button type="button" onClick={requestClose} disabled={busy} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40">Fermer</button>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="submit" form={`${idPrefix}-form`} disabled={busy || loading || Boolean(loadError)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{operation === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Enregistrer</button>
            <button type="button" onClick={() => void handleSave("download")} disabled={busy || loading || Boolean(loadError)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C5A880]/40 bg-[#FAF6F0] px-4 py-3 text-xs font-bold text-[#8b6b37] hover:bg-[#f2e8d8] disabled:opacity-50">{operation === "download" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}Télécharger le PDF</button>
            <button type="button" onClick={() => void handleSave("print")} disabled={busy || loading || Boolean(loadError)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#10344d] bg-[#10344d] px-4 py-3 text-xs font-bold text-white hover:bg-[#194a68] disabled:opacity-50">{operation === "print" ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}Ouvrir / imprimer le PDF</button>
          </div>
        </footer>

        {showDiscard && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" aria-labelledby={`${idPrefix}-discard-title`} className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id={`${idPrefix}-discard-title`} className="font-bold text-slate-900">Fermer sans enregistrer ?</h3>
            <p className="mt-2 text-sm text-slate-500">Les modifications non enregistrées de ce contrat seront perdues. Le dernier contrat enregistré restera conservé.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" autoFocus onClick={() => setShowDiscard(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold">Continuer la saisie</button>
              <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Fermer sans enregistrer</button>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

function inputClass(error: boolean) {
  return `w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-colors focus:bg-white focus:ring-2 ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-[#C5A880] focus:ring-[#C5A880]/20"}`;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">{label} <span className="text-rose-500">*</span></label>{children}{error && <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>}</div>;
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 border-b border-[#C5A880]/25 pb-3 text-base font-bold text-[#10344d]">{title}</h3><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}
