import { SITE_CONFIG } from "@/lib/constants";

export const CONTRACT_PAYMENT_METHODS = {
  cash: "نقدا",
  bank_transfer: "تحويل بنكي",
  cheque: "صك بنكي",
} as const;

export interface ContractData {
  contractDate: string;
  ownerName: string;
  ownerCin: string;
  ownerAddress: string;
  ownerPhone: string;
  renterName: string;
  renterCin: string;
  renterAddress: string;
  renterPhone: string;
  eventType: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  advancePayment: number;
  paymentMethod: keyof typeof CONTRACT_PAYMENT_METHODS;
  securityDeposit: number;
  entryTime: string;
  exitTime: string;
  overtimeHourlyRate: number;
  cancellationDeduction: number;
}

export type ContractErrors = Partial<Record<keyof ContractData, string>>;

export interface StoredContract {
  version: 1;
  bookingId: number;
  dossierNum: string;
  data: ContractData;
  savedAt: string;
}

export interface ContractSection {
  number: number;
  title: string;
  icon: "calendar" | "wallet" | "shield" | "cancel" | "handshake" | "clock" | "clipboard" | "scales";
  lines: { text: string; bullet?: boolean; bold?: boolean }[];
}

const EVENT_NAMES_AR: Record<string, string> = {
  Mariage: "حفل زفاف",
  Fiançailles: "حفل خطوبة",
  Outia: "حفل وطية",
  "Henna Sghira": "حفل حنة صغيرة",
  "Henna Kbira": "حفل حنة كبيرة",
  "T'hour": "حفل ختان",
  "Cocktail / réception": "حفل استقبال",
  "Fête École / Garderie": "حفل مدرسي / روضة أطفال",
  "Spectacle / Gala": "عرض / حفل فني",
  "Réunion / Séminaire / Conférence": "اجتماع / ندوة / مؤتمر",
  "Événement associatif (forum.. )": "تظاهرة جمعياتية / منتدى",
  "Autre événement": "مناسبة أخرى",
};

export const CONTRACT_TEXT_LIMITS = {
  ownerName: 80,
  ownerAddress: 120,
  ownerPhone: 32,
  renterName: 80,
  renterAddress: 120,
  renterPhone: 32,
  eventType: 80,
} as const;

export function normalizeContractDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)),
  );
}

function dateInputValue(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function createContractDraft(booking: {
  name: string;
  phone: string;
  eventType: string;
  date: number;
  month?: number;
  year?: number;
  slot: "matinee" | "soiree";
  totalPrice?: number;
  advancePayment?: number;
}, ownerPhone?: string): ContractData {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const eventDate = dateInputValue(booking.year ?? 2026, booking.month ?? 4, booking.date);
  const end = new Date(`${eventDate}T00:00:00.000Z`);
  if (booking.slot === "soiree") end.setUTCDate(end.getUTCDate() + 1);

  return {
    contractDate: today,
    ownerName: "",
    ownerCin: "",
    ownerAddress: "المنستير - قاعة Les Jumelles",
    ownerPhone: ownerPhone || SITE_CONFIG.phone.display,
    renterName: booking.name,
    renterCin: "",
    renterAddress: "",
    renterPhone: booking.phone,
    eventType: EVENT_NAMES_AR[booking.eventType] || booking.eventType,
    startDate: eventDate,
    endDate: end.toISOString().slice(0, 10),
    totalPrice: booking.totalPrice ?? 0,
    advancePayment: booking.advancePayment ?? 0,
    paymentMethod: "cash",
    securityDeposit: 0,
    entryTime: booking.slot === "matinee" ? "10:00" : "20:00",
    exitTime: booking.slot === "matinee" ? "16:00" : "00:00",
    overtimeHourlyRate: 0,
    cancellationDeduction: 0,
  };
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function roundContractAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function contractRemainingAmount(data: Pick<ContractData, "totalPrice" | "advancePayment">) {
  return roundContractAmount(Math.max(0, data.totalPrice - data.advancePayment));
}

// Both the form and the server use this allowlist. No booking or private admin notes
// are included in the stored contract or in the generated document.
export function validateContractData(input: unknown): {
  data: ContractData;
  errors: ContractErrors;
  valid: boolean;
} {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const errors: ContractErrors = {};
  const text = (key: keyof ContractData) => typeof source[key] === "string"
    ? (source[key] as string).trim().replace(/[\u0000-\u001f\u007f]/g, " ")
    : "";
  const numericText = (key: keyof ContractData) => normalizeContractDigits(text(key));
  const amount = (key: keyof ContractData) => {
    const value = source[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000) {
      errors[key] = "أدخل مبلغا صحيحا بين 0 و 1 000 000 د.ت.";
      return 0;
    }
    return roundContractAmount(value);
  };
  const data: ContractData = {
    contractDate: numericText("contractDate"),
    ownerName: text("ownerName"),
    ownerCin: numericText("ownerCin"),
    ownerAddress: text("ownerAddress"),
    ownerPhone: numericText("ownerPhone"),
    renterName: text("renterName"),
    renterCin: numericText("renterCin"),
    renterAddress: text("renterAddress"),
    renterPhone: numericText("renterPhone"),
    eventType: text("eventType"),
    startDate: numericText("startDate"),
    endDate: numericText("endDate"),
    totalPrice: amount("totalPrice"),
    advancePayment: amount("advancePayment"),
    paymentMethod: text("paymentMethod") as ContractData["paymentMethod"],
    securityDeposit: amount("securityDeposit"),
    entryTime: numericText("entryTime"),
    exitTime: numericText("exitTime"),
    overtimeHourlyRate: amount("overtimeHourlyRate"),
    cancellationDeduction: amount("cancellationDeduction"),
  };

  for (const [key, maxLength] of Object.entries(CONTRACT_TEXT_LIMITS)) {
    const field = key as keyof typeof CONTRACT_TEXT_LIMITS;
    if (!data[field]) errors[field] = "هذا الحقل إجباري.";
    else if (data[field].length > maxLength) errors[field] = `الحد الأقصى ${maxLength} حرفا.`;
  }
  for (const key of ["ownerCin", "renterCin"] as const) {
    if (!/^\d{8}$/.test(data[key])) errors[key] = "رقم بطاقة التعريف الوطنية يجب أن يتكون من 8 أرقام.";
  }
  for (const key of ["ownerPhone", "renterPhone"] as const) {
    const digits = data[key].replace(/\D/g, "");
    if (!/^[+\d\s()./-]{6,32}$/.test(data[key]) || digits.length < 8 || digits.length > 15) {
      errors[key] = "أدخل رقم هاتف صحيحا.";
    }
  }
  for (const key of ["contractDate", "startDate", "endDate"] as const) {
    if (!isDate(data[key])) errors[key] = "أدخل تاريخا صحيحا.";
  }
  if (!errors.startDate && !errors.endDate && data.endDate < data.startDate) {
    errors.endDate = "تاريخ نهاية الكراء يجب ألا يسبق تاريخ البداية.";
  }
  for (const key of ["entryTime", "exitTime"] as const) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data[key])) errors[key] = "أدخل توقيتا صحيحا.";
  }
  if (data.totalPrice <= 0) errors.totalPrice = "معلوم الكراء يجب أن يكون أكبر من صفر.";
  if (data.advancePayment > data.totalPrice) errors.advancePayment = "العربون لا يمكن أن يتجاوز معلوم الكراء.";
  if (data.cancellationDeduction > data.advancePayment) {
    errors.cancellationDeduction = "مبلغ الخصم لا يمكن أن يتجاوز العربون المدفوع.";
  }
  if (!Object.hasOwn(CONTRACT_PAYMENT_METHODS, data.paymentMethod)) {
    errors.paymentMethod = "اختر طريقة الدفع.";
  }
  return { data, errors, valid: Object.keys(errors).length === 0 };
}

export function parseStoredContract(value: unknown): StoredContract {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Contrat enregistré invalide.");
  const record = value as Record<string, unknown>;
  const result = validateContractData(record.data);
  if (record.version !== 1 || !Number.isInteger(record.bookingId) || typeof record.dossierNum !== "string" ||
    typeof record.savedAt !== "string" || !result.valid) {
    throw new Error("Contrat enregistré invalide. Aucune donnée n'a été modifiée.");
  }
  return { version: 1, bookingId: record.bookingId as number, dossierNum: record.dossierNum, data: result.data, savedAt: record.savedAt };
}

export function formatContractDate(value: string) {
  if (!isDate(value)) return "........ / ........ / ........";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function formatContractMoney(value: number) {
  return new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 3 })
    .format(Number.isFinite(value) ? value : 0).replace(/[\u202f\u00a0]/g, " ");
}

export function getContractSections(data: ContractData): ContractSection[] {
  // NBSP is a numeric separator in the Unicode bidi algorithm: it keeps the
  // thousands groups in order in Arabic, and prevents an amount wrapping.
  const money = (value: number) => `${formatContractMoney(value).replace(/ /g, "\u00a0")} د.ت`;
  return [
    { number: 1, title: "موضوع العقد", icon: "calendar", lines: [
      { text: "يخص هذا العقد كراء واستغلال فضاء قاعة Les Jumelles" },
      { text: `بمناسبة إقامة حفل / مناسبة: ${data.eventType || "........................"}` },
    ] },
    { number: 2, title: "مدة الكراء", icon: "calendar", lines: [
      { text: `تبدأ فترة الكراء من: ${formatContractDate(data.startDate)}` },
      { text: `إلى غاية: ${formatContractDate(data.endDate)}` },
    ] },
    { number: 3, title: "معلوم الكراء وطريقة الدفع", icon: "wallet", lines: [
      { text: `المبلغ الإجمالي للكراء: ${money(data.totalPrice)}`, bullet: true },
      { text: `العربون عند إمضاء العقد: ${money(data.advancePayment)}`, bullet: true },
      { text: `المتبقي قبل تاريخ الحفل: ${money(contractRemainingAmount(data))}`, bullet: true },
      { text: `طريقة الدفع: ${CONTRACT_PAYMENT_METHODS[data.paymentMethod] || "........................"} (تحدد حسب الاتفاق).`, bullet: true },
    ] },
    { number: 4, title: "الضمان المالي", icon: "shield", lines: [
      { text: `يتم دفع ضمان مالي قدره ${money(data.securityDeposit)}` },
      { text: "لتغطية أي أضرار تلحق بالقاعة أو تجهيزاتها أو ممتلكاتها نتيجة سوء الاستعمال أو الإهمال من طرف المكتري." },
    ] },
    { number: 5, title: "إلغاء الحجز", icon: "cancel", lines: [
      { text: "في حالة إلغاء الحجز من طرف المكتري:", bullet: true },
      { text: "- قبل 30 يوما من تاريخ الحفل: يحتفظ بالمبلغ المدفوع." },
      { text: `- أقل من 30 يوما: يخصم مبلغ ${money(data.cancellationDeduction)}.` },
      { text: "في حالة إلغاء الحجز من طرف القاعة: يتم إرجاع المبلغ كاملا.", bullet: true },
    ] },
    { number: 6, title: "التزامات الطرفين", icon: "handshake", lines: [
      { text: "يلتزم المكتري بـ:", bold: true },
      { text: "المحافظة على القاعة والتجهيزات والأثاث.", bullet: true },
      { text: "عدم إدخال أي تعديلات أو إضافات دون إذن مسبق من المالك.", bullet: true },
      { text: "احترام النظام الداخلي للقاعة والقوانين التونسية.", bullet: true },
      { text: "تحمل مسؤولية الأضرار الناتجة عن سوء الاستعمال أو تصرفات المدعوين.", bullet: true },
      { text: "يلتزم المالك بـ:", bold: true },
      { text: "تسليم القاعة في الحالة المتفق عليها.", bullet: true },
      { text: "توفير الخدمات المتفق عليها حسب الحجز.", bullet: true },
    ] },
    { number: 7, title: "التوقيت والتمديد", icon: "clock", lines: [
      { text: `وقت الدخول إلى القاعة: من الساعة ${data.entryTime || "........"}`, bullet: true },
      { text: `وقت الخروج: في حدود الساعة ${data.exitTime || "........"}`, bullet: true },
      { text: `في حالة التمديد، يقتضي مبلغ إضافي قدره ${money(data.overtimeHourlyRate)} عن كل ساعة إضافية.`, bullet: true },
    ] },
    { number: 8, title: "السلامة والتراخيص", icon: "shield", lines: [
      { text: "يلتزم المكتري باحترام شروط السلامة والحماية المدنية.", bullet: true },
      { text: "يمنع منعا باتا إقامة أي نشاط مخالف للقانون أو الآداب العامة.", bullet: true },
    ] },
    { number: 9, title: "محضر التسليم والاسترجاع", icon: "clipboard", lines: [
      { text: "يتم تحرير محضر تسليم واسترجاع القاعة يوضح حالتها قبل الحفل وبعده، ويتم التوقيع عليه من الطرفين.", bullet: true },
    ] },
    { number: 10, title: "أحكام ختامية", icon: "scales", lines: [
      { text: "يعتبر هذا العقد ملزما للطرفين، ويتم حله بالتراضي أو وفقا للقوانين التونسية الجاري بها العمل." },
    ] },
  ];
}
