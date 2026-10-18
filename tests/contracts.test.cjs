/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS test runner and isolated TypeScript loader. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Run the project's TS/TSX with Node's built-in test runner, without adding a
// test dependency. Every database/session import is replaced by an in-memory fake.
function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (!specifier.startsWith("@/")) return require(specifier);
      const base = path.join(process.cwd(), specifier.slice(2));
      const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error(`Unresolved test import: ${specifier}`);
      return load(target);
    };
    new Function("require", "module", "exports", "__filename", "__dirname", code)(localRequire, loadedModule, loadedModule.exports, file, path.dirname(file));
    return loadedModule.exports;
  }
  return (file) => load(path.join(process.cwd(), file));
}

const load = loader();
const contracts = load("lib/contracts.ts");
const booking = {
  id: 42, dossierNum: "JUM-TEST", status: "confirmed", date: 20, month: 10, year: 2026, slot: "soiree",
  name: "أحمد بن علي", phone: "22123456", eventType: "Mariage", totalPrice: 3000.125, advancePayment: 500.1,
  adminNotes: "PRIVATE NOTES MUST NEVER APPEAR IN THE CONTRACT",
};
function validData() {
  return {
    ...contracts.createContractDraft(booking),
    contractDate: "2026-10-18", ownerName: "محمد بن صالح", ownerCin: "01234567",
    renterCin: "12345678", renterAddress: "شارع الحبيب بورقيبة، المنستير",
    securityDeposit: 300, overtimeHourlyRate: 150, cancellationDeduction: 200,
  };
}

function server() {
  let authenticated = true;
  const records = new Map([["site-settings", { key: "site-settings", value: { untouched: true } }]]);
  const calls = [];
  const prisma = {
    booking: {
      findUnique: async ({ where }) => { calls.push(["booking.findUnique", where]); return where.id === booking.id ? structuredClone(booking) : null; },
    },
    appSetting: {
      findUnique: async ({ where }) => { calls.push(["appSetting.findUnique", where]); return records.get(where.key) || null; },
      upsert: async ({ where, create, update }) => {
        calls.push(["appSetting.upsert", where]);
        const value = records.has(where.key) ? { ...records.get(where.key), ...update } : create;
        records.set(where.key, structuredClone(value));
        return value;
      },
    },
  };
  const auth = {
    checkAdminSession: async () => authenticated,
    requireAdminSession: async () => { if (!authenticated) throw new Error("Session administrateur invalide ou expirée."); },
  };
  const importFile = loader({ "@/lib/prisma": { prisma }, "@/app/actions/auth": auth });
  return { actions: importFile("app/actions/contract.ts"), importFile, records, calls, logout: () => { authenticated = false; } };
}

test("draft uses the booking, translates the event, and never copies private notes", () => {
  const data = contracts.createContractDraft(booking);
  assert.equal(data.renterName, booking.name);
  assert.equal(data.eventType, "حفل زفاف");
  assert.equal(data.startDate, "2026-11-20");
  assert.equal(data.endDate, "2026-11-21");
  assert.equal(data.entryTime, "20:00");
  assert.equal(data.exitTime, "00:00");
  assert.equal(data.ownerName, "");
  assert.match(data.contractDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!JSON.stringify(data).includes("PRIVATE"));
  assert.equal(contracts.createContractDraft({ ...booking, date: 31, month: 11 }).endDate, "2027-01-01");
});

test("validation accepts Arabic digits, midnight and millime precision", () => {
  const result = contracts.validateContractData({ ...validData(), ownerCin: "٠١٢٣٤٥٦٧", renterCin: "۱۲۳۴۵۶۷۸", adminNotes: "SECRET" });
  assert.equal(result.valid, true);
  assert.equal(result.data.ownerCin, "01234567");
  assert.equal(result.data.renterCin, "12345678");
  assert.equal(contracts.contractRemainingAmount(result.data), 2500.025);
  assert.equal("adminNotes" in result.data, false);
});

test("validation rejects missing identity, impossible dates, invalid money and payment methods", () => {
  for (const [key, value] of [
    ["ownerName", ""], ["renterCin", "123"], ["ownerPhone", "<script>"], ["renterAddress", "a".repeat(121)],
    ["contractDate", "2026-02-30"], ["endDate", "2026-01-01"], ["entryTime", "25:00"],
    ["totalPrice", -1], ["totalPrice", Infinity], ["advancePayment", 5000], ["securityDeposit", NaN],
    ["cancellationDeduction", 501], ["paymentMethod", "__proto__"],
  ]) {
    const result = contracts.validateContractData({ ...validData(), [key]: value });
    assert.equal(result.valid, false, `${key} should fail`);
    assert.ok(result.errors[key], `${key} should have a field error`);
  }
});

test("all ten clauses and the editable amounts are present", () => {
  const sections = contracts.getContractSections(validData());
  assert.deepEqual(sections.map((section) => section.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(sections[2].lines.some(({ text }) => text.includes("2\u00a0500,025")));
  assert.ok(sections[4].lines.some(({ text }) => text.includes("200")));
  assert.ok(sections[6].lines.some(({ text }) => text.includes("00:00")));
});

test("save/reopen/update writes only its namespaced contract and preserves all existing data", async () => {
  const api = server();
  const originalBooking = JSON.stringify(booking);
  assert.equal(await api.actions.getBookingContractAction(booking.id), null);
  const result = await api.actions.saveBookingContractAction(booking.id, validData());
  assert.equal(result.success, true);
  assert.equal(api.records.size, 2);
  assert.deepEqual(api.records.get("site-settings").value, { untouched: true });
  const reopened = await api.actions.getBookingContractAction(booking.id);
  assert.deepEqual(reopened.data, result.contract.data);
  assert.equal(reopened.dossierNum, booking.dossierNum);
  const changed = { ...reopened.data, securityDeposit: 450 };
  await api.actions.saveBookingContractAction(booking.id, changed);
  assert.equal((await api.actions.getBookingContractAction(booking.id)).data.securityDeposit, 450);
  assert.equal(JSON.stringify(booking), originalBooking);
  assert.ok(api.calls.filter(([name]) => name === "appSetting.upsert").every(([, where]) => where.key === "booking-contract:42"));
  assert.ok(!api.calls.some(([name]) => /delete|booking\.update|executeRaw/.test(name)));
});

test("invalid contracts and expired sessions cannot write data", async () => {
  const api = server();
  assert.equal((await api.actions.saveBookingContractAction(booking.id, {})).success, false);
  assert.equal(api.calls.length, 0);
  api.logout();
  await assert.rejects(api.actions.getBookingContractAction(booking.id), /Session/);
  await assert.rejects(api.actions.saveBookingContractAction(booking.id, validData()), /Session/);
  assert.equal(api.calls.length, 0);
});

test("PDF endpoint protects private data and handles invalid/missing contracts", async () => {
  const api = server();
  const { GET } = api.importFile("app/api/admin/bookings/[id]/contrat/route.ts");
  const request = new Request("http://localhost/api/admin/bookings/42/contrat");
  const call = (id) => GET(request, { params: Promise.resolve({ id }) });
  assert.equal((await call("invalid")).status, 400);
  assert.equal((await call("999")).status, 404);
  assert.equal((await call("42")).status, 404);
  api.logout();
  const response = await call("42");
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("generates a real single-page A4 PDF with embedded Arabic fonts, without database writes", async () => {
  const api = server();
  await api.actions.saveBookingContractAction(booking.id, validData());
  const writesBefore = api.calls.filter(([name]) => name === "appSetting.upsert").length;
  const { GET } = api.importFile("app/api/admin/bookings/[id]/contrat/route.ts");
  const response = await GET(new Request("http://localhost/api/admin/bookings/42/contrat"), { params: Promise.resolve({ id: "42" }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/pdf");
  assert.match(response.headers.get("Content-Disposition"), /Contrat_JUM-TEST\.pdf/);
  const buffer = Buffer.from(await response.arrayBuffer());
  const pdf = buffer.toString("latin1");
  assert.ok(pdf.startsWith("%PDF-"));
  assert.equal((pdf.match(/\/Type \/Page\b/g) || []).length, 1);
  const mediaBox = pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
  assert.ok(mediaBox && Math.abs(Number(mediaBox[1]) - 595.28) < 0.01 && Math.abs(Number(mediaBox[2]) - 841.89) < 0.01, "PDF must retain both A4 dimensions");
  assert.ok(pdf.includes("Tajawal-Regular"), "Regular Arabic font is embedded");
  assert.ok(pdf.includes("Tajawal-Bold"), "Bold Arabic font is embedded");
  assert.ok(pdf.includes("/ToUnicode"), "PDF has Unicode text mappings");
  assert.equal(api.calls.filter(([name]) => name === "appSetting.upsert").length, writesBefore);
  if (process.env.CONTRACT_PDF_OUTPUT) fs.writeFileSync(process.env.CONTRACT_PDF_OUTPUT, buffer);
});

test("PDF identity boxes and clauses do not overlap, including maximum-length fields", async () => {
  const { cloneElement } = require("react");
  const { renderToBuffer } = require("@react-pdf/renderer");
  const { ContractPDF } = load("components/booking/ContractPDF.tsx");
  const artworkSrc = `data:image/png;base64,${fs.readFileSync("public/contract/frame.png").toString("base64")}`;
  const long = {
    ...validData(),
    ownerName: "محمد أحمد بن صالح ".repeat(6).slice(0, 80),
    renterName: "أحمد محمد بن علي ".repeat(6).slice(0, 80),
    ownerAddress: "شارع الحبيب بورقيبة المنستير تونس ".repeat(5).slice(0, 120),
    renterAddress: "شارع الحبيب بورقيبة المنستير تونس ".repeat(5).slice(0, 120),
    eventType: "حفل زفاف وخطوبة ومناسبة عائلية ".repeat(4).slice(0, 80),
    totalPrice: 1_000_000, advancePayment: 999_999.999,
    securityDeposit: 1_000_000, overtimeHourlyRate: 1_000_000, cancellationDeduction: 999_999.999,
  };
  for (const data of [validData(), long]) {
    assert.equal(contracts.validateContractData(data).valid, true);
    let layout;
    const document = ContractPDF({ data, dossierNum: "JUM-TEST", artworkSrc });
    const withLayout = cloneElement(document, { onRender: (result) => { layout = result._INTERNAL__LAYOUT__DATA_; } });
    const buffer = await renderToBuffer(withLayout);
    assert.equal(layout.children.length, 1);
    const page = layout.children[0];
    const parties = page.children.find((node) => node.style?.top === 228);
    const agreement = page.children.find((node) => node.style?.top === 323);
    const columns = page.children.find((node) => node.style?.top === 342 && node.children?.length === 2);
    const copies = page.children.find((node) => node.style?.top === 723);
    assert.ok(parties.box.top + parties.box.height < agreement.box.top, `Identity boxes end at ${parties.box.top + parties.box.height}, before agreement at ${agreement.box.top}`);
    assert.ok(columns.box.top + columns.box.height < copies.box.top, `Clauses end at ${columns.box.top + columns.box.height}, before signatures note at ${copies.box.top}`);
    if (data === long && process.env.CONTRACT_PDF_OUTPUT) {
      fs.writeFileSync(process.env.CONTRACT_PDF_OUTPUT.replace(/\.pdf$/, "-long.pdf"), buffer);
    }
  }
});
