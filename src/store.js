import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const dataDir = path.resolve("data");
const dbPath = path.join(dataDir, "db.json");

const defaultState = {
  patients: [],
  doctors: [],
  appointments: [],
  treatments: [],
  treatmentRecords: [],
  payments: [],
  expenses: [],
  inventoryItems: [],
  labJobs: [],
  invoices: []
};

const requestedTreatmentCatalog = [
  { name: "Ventana quirurgica orto implante", price: 120.0 },
  { name: "Puente de 2 piezas de zirconio", price: 780.0 },
  { name: "Puente de 2 piezas metal-ceramica", price: 600.0 },
  { name: "Puente de 3 piezas de zirconio", price: 1170.0 },
  { name: "Puente de 3 piezas metal-ceramica", price: 900.0 },
  { name: "Puente de 4 piezas de zirconio", price: 1560.0 },
  { name: "Puente de 4 piezas metal-ceramica", price: 1200.0 },
  { name: "Puente de 5 piezas de zirconio", price: 1950.0 },
  { name: "Puente de 5 piezas metal-ceramica", price: 1500.0 },
  { name: "Puente de 6 piezas de zirconio", price: 2340.0 },
  { name: "Puente de 6 piezas metal-ceramica", price: 1800.0 },
  { name: "Puente fijo 12 piezas sobre 6 implantes", price: 3400.0 },
  { name: "Abrasion para obturar", price: 40.0 },
  { name: "Aditamento de teflon", price: 50.0 },
  { name: "Aditamento externo", price: 100.0 },
  { name: "Aditamento para implante integrado", price: 300.0 },
  { name: "Apicectomia", price: 180.0 },
  { name: "Ataches", price: 240.0 },
  { name: "Atencion domiciliaria", price: 200.0 },
  { name: "Blanqueamiento externo", price: 300.0 },
  { name: "Blanqueamiento interno", price: 100.0 },
  { name: "Brackets de zafiro", price: 850.0 },
  { name: "Brackets metalicos", price: 650.0 },
  { name: "Brackets transparentes", price: 700.0 },
  { name: "Carilla de zirconio", price: 420.0 },
  { name: "Cementado", price: 20.0 },
  { name: "Cirugia menor", price: 40.0 },
  { name: "Compostura", price: 60.0 },
  { name: "Corona metal-ceramica", price: 300.0 },
  { name: "Corona sobre implante", price: 450.0 },
  { name: "Corona zirconio", price: 390.0 },
  { name: "Desatornillar protesis y limpieza de implantes", price: 75.0 },
  { name: "Diferencia de reconstruccion", price: 20.0 },
  { name: "Elevacion con regeneracion", price: 900.0 },
  { name: "Elevacion de seno", price: 500.0 },
  { name: "Empaste", price: 50.0 },
  { name: "Endodoncia multirradicular", price: 180.0 },
  { name: "Endodoncia unirradicular", price: 150.0 },
  { name: "Estudio de ortodoncia", price: 50.0 },
  { name: "Exodoncia compleja", price: 120.0 },
  { name: "Exodoncia de tercer molar", price: 100.0 },
  { name: "Exodoncia normal", price: 50.0 },
  { name: "Ferula de descarga michigan", price: 250.0 },
  { name: "Ferula retenedora de alambre", price: 120.0 },
  { name: "Ferula retenedora de ortodoncia", price: 100.0 },
  { name: "Frenectomia", price: 180.0 },
  { name: "Gingivectomia", price: 180.0 },
  { name: "Gran reconstruccion", price: 80.0 },
  { name: "Implante", price: 890.0 },
  { name: "Injerto de tejido conectivo", price: 500.0 },
  { name: "Limpieza", price: 60.0 },
  { name: "Mantenedor de espacio", price: 120.0 },
  { name: "Mesoestructura completa", price: 4200.0 },
  { name: "Perno de cuarzo", price: 100.0 },
  { name: "Perno de titanio", price: 90.0 },
  { name: "Piercing", price: 40.0 },
  { name: "Placa expansora", price: 500.0 },
  { name: "Placa Hawley", price: 400.0 },
  { name: "Protesis de metal-esqueletico", price: 800.0 },
  { name: "Protesis de resina", price: 700.0 },
  { name: "Protesis inmediata completa", price: 350.0 },
  { name: "Protesis inmediata parcial", price: 250.0 },
  { name: "Raspaje y alisado por cuadrante", price: 80.0 },
  { name: "Raspaje y alisado por pieza", price: 20.0 },
  { name: "Reconstruccion endodoncia", price: 60.0 },
  { name: "Reconstruccion estetica", price: 120.0 },
  { name: "Regeneracion osea", price: 450.0 },
  { name: "Regularizacion osea", price: 200.0 },
  { name: "Rehacer endodoncia", price: 180.0 },
  { name: "Reponer empaste", price: 25.0 },
  { name: "Revision placa Hawley", price: 30.0 },
  { name: "Revision placa expansora", price: 50.0 },
  { name: "Sellador", price: 20.0 },
  { name: "Sobredentadura", price: 900.0 },
  { name: "Sobredentadura removible", price: 2340.0 },
  { name: "Tratamiento de ortodoncia de 12 meses", price: 1080.0 },
  { name: "Tratamiento de ortodoncia de 18 meses", price: 1620.0 },
  { name: "Tratamiento de ortodoncia de 24 meses", price: 2160.0 },
  { name: "Tratamiento de ortodoncia con smilers de 18 meses", price: 6300.0 },
  { name: "Tratamiento de ortodoncia con smilers de 12 meses", price: 4200.0 },
  { name: "Tratamiento de ortodoncia con smilers de 6 meses", price: 2100.0 }
];

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isLabTreatmentName(value) {
  const normalized = normalizeName(value);
  return ["puente", "corona", "compostura", "protesis", "tratamiento"].some((keyword) => normalized.includes(keyword));
}

function normalizeLabLine(line) {
  const detectedLabWork = isLabTreatmentName(line.treatmentName || "");
  const isLabWork = line.isLabWork == null ? detectedLabWork : Boolean(line.isLabWork);
  const labStatus = line.labStatus === "delivered" ? "delivered" : "pending";
  const labName = line.labName ? String(line.labName) : "";
  const labCost = Number(line.labCost || 0);

  return {
    isLabWork,
    labName,
    labCost: Number.isFinite(labCost) ? Math.max(0, labCost) : 0,
    labStatus
  };
}

function inferCatalogIcon(normalizedName) {
  if (normalizedName.includes("puente")) return "bridge";
  if (normalizedName.includes("implante") || normalizedName.includes("aditamento")) return "implant";
  if (normalizedName.includes("corona")) return "crown";
  if (
    normalizedName.includes("bracket") ||
    normalizedName.includes("ortodoncia") ||
    normalizedName.includes("placa") ||
    normalizedName.includes("ferula") ||
    normalizedName.includes("mantenedor") ||
    normalizedName.includes("smilers")
  ) {
    return "ortho";
  }
  if (normalizedName.includes("endodoncia") || normalizedName.includes("perno") || normalizedName.includes("apicectomia")) return "root";
  if (
    normalizedName.includes("exodoncia") ||
    normalizedName.includes("cirugia") ||
    normalizedName.includes("elevacion") ||
    normalizedName.includes("regeneracion") ||
    normalizedName.includes("injerto") ||
    normalizedName.includes("regularizacion")
  ) {
    return "surgery";
  }
  if (normalizedName.includes("limpieza") || normalizedName.includes("blanqueamiento")) return "cleaning";
  if (normalizedName.includes("protesis") || normalizedName.includes("sobredentadura") || normalizedName.includes("mesoestructura")) {
    return "prosthesis_removable";
  }
  if (normalizedName.includes("carilla")) return "veneer";
  if (normalizedName.includes("sellador")) return "sealant";
  if (normalizedName.includes("reconstruccion") || normalizedName.includes("empaste") || normalizedName.includes("cementado")) {
    return "restoration";
  }
  if (normalizedName.includes("raspaje")) return "periodontics";
  return "generic";
}

function colorForIcon(icon) {
  switch (icon) {
    case "implant":
      return "0E7C7B";
    case "bridge":
      return "355070";
    case "crown":
      return "3A86FF";
    case "ortho":
      return "4D908E";
    case "root":
      return "8338EC";
    case "surgery":
      return "D90429";
    case "cleaning":
      return "2A9D8F";
    case "veneer":
      return "4895EF";
    case "periodontics":
      return "2D6A4F";
    case "prosthesis_removable":
      return "6D597A";
    case "sealant":
      return "06D6A0";
    case "restoration":
      return "6C757D";
    default:
      return "6C757D";
  }
}

function inferPieceType(normalizedName) {
  if (
    normalizedName.includes("puente") ||
    normalizedName.includes("cuadrante") ||
    normalizedName.includes("elevacion") ||
    normalizedName.includes("regeneracion") ||
    normalizedName.includes("gingivectomia") ||
    normalizedName.includes("frenectomia") ||
    normalizedName.includes("injerto")
  ) {
    return "sector";
  }

  if (normalizedName.includes("protesis") || normalizedName.includes("sobredentadura") || normalizedName.includes("placa") || normalizedName.includes("ferula")) {
    return "arcada";
  }

  if (
    normalizedName.includes("ortodoncia") ||
    normalizedName.includes("atencion domiciliaria") ||
    normalizedName.includes("estudio") ||
    normalizedName.includes("revision")
  ) {
    return "general";
  }

  return "pieza";
}

function buildDefaultTreatmentCatalog() {
  return requestedTreatmentCatalog.map((item) => {
    const normalizedName = normalizeName(item.name);
    const iconKey = inferCatalogIcon(normalizedName);
    return {
      id: randomUUID(),
      name: item.name,
      price: Number(item.price || 0),
      colorHex: colorForIcon(iconKey),
      iconKey,
      pieceType: inferPieceType(normalizedName)
    };
  });
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultState, null, 2), "utf-8");
  }
}

function loadState() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

let state = loadState();

if (!Array.isArray(state.treatments) || state.treatments.length === 0) {
  state.treatments = buildDefaultTreatmentCatalog();
  persist();
}

const legacyTreatmentIds = new Set(["t-cleaning", "t-filling", "t-root", "t-crown", "t-extraction", "t-implant"]);
const hasLegacyCatalog = Array.isArray(state.treatments) && state.treatments.some((item) => legacyTreatmentIds.has(item.id));
if (hasLegacyCatalog || state.treatments.length < 20) {
  state.treatments = buildDefaultTreatmentCatalog();
  persist();
}

function persist() {
  ensureDataFile();
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), "utf-8");
}

function nowISO() {
  return new Date().toISOString();
}

export function getDashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const todayAppointments = state.appointments.filter((a) =>
    String(a.startAt).startsWith(today)
  );

  const patientsWaiting = todayAppointments.filter(
    (a) => a.status === "checked_in"
  ).length;

  const pendingPayments = state.invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + (invoice.pendingAmount || 0), 0);

  const lowStock = state.inventoryItems.filter(
    (item) => Number(item.stockCurrent) <= Number(item.stockMin)
  ).length;

  const pendingLabJobs = state.treatmentRecords.reduce((count, record) => {
    const pendingLines = (record.lines || []).filter((line) => {
      const labLine = normalizeLabLine(line);
      return labLine.isLabWork && labLine.labStatus !== "delivered";
    }).length;
    return count + pendingLines;
  }, 0);

  return {
    todayAppointments: todayAppointments.length,
    patientsWaiting,
    pendingPayments,
    lowStock,
    pendingLabJobs
  };
}

export function getPatients() {
  return state.patients.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDoctors() {
  return state.doctors
    .map((item) => ({ ...item }))
    .sort((a, b) => Number(b.active) - Number(a.active) || String(a.name || "").localeCompare(String(b.name || "")));
}

export function createDoctor(input) {
  const doctor = {
    id: randomUUID(),
    name: String(input.name || "").trim(),
    specialty: String(input.specialty || "General").trim() || "General",
    phone: String(input.phone || "").trim(),
    active: input.active == null ? true : Boolean(input.active),
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.doctors.push(doctor);
  persist();
  return doctor;
}

export function updateDoctor(id, input) {
  const idx = state.doctors.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = state.doctors[idx];
  state.doctors[idx] = {
    ...current,
    name: input.name == null ? current.name : String(input.name).trim() || current.name,
    specialty: input.specialty == null ? current.specialty : String(input.specialty).trim() || "General",
    phone: input.phone == null ? current.phone : String(input.phone).trim(),
    active: input.active == null ? current.active : Boolean(input.active),
    updatedAt: nowISO()
  };

  persist();
  return state.doctors[idx];
}

export function getPatientProfile(patientId) {
  const patient = state.patients.find((item) => item.id === patientId) || null;
  if (!patient) return null;

  const appointments = state.appointments
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => b.startAt.localeCompare(a.startAt));

  const records = state.treatmentRecords
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const budgets = records.filter((item) => item.type === "budget");
  const treatmentsDone = records.filter((item) => item.type === "done");

  const payments = state.payments
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const budgetTotal = budgets.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const doneTotal = treatmentsDone.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const paidTotal = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    patient,
    appointments,
    budgets,
    treatmentsDone,
    payments,
    summary: {
      budgetTotal,
      doneTotal,
      paidTotal,
      pendingFromDone: Math.max(0, doneTotal - paidTotal),
      pendingFromBudgets: Math.max(0, budgetTotal - paidTotal)
    }
  };
}

export function createPatient(input) {
  const patient = {
    id: randomUUID(),
    firstName: input.firstName || "",
    lastName: input.lastName || "",
    documentId: input.documentId || "",
    birthDate: input.birthDate || "",
    phone: input.phone || "",
    email: input.email || "",
    notes: input.notes || "",
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.patients.push(patient);
  persist();
  return patient;
}

export function updatePatient(id, input) {
  const idx = state.patients.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = state.patients[idx];
  state.patients[idx] = {
    ...current,
    firstName: input.firstName ?? current.firstName,
    lastName: input.lastName ?? current.lastName,
    documentId: input.documentId ?? current.documentId,
    birthDate: input.birthDate ?? current.birthDate,
    phone: input.phone ?? current.phone,
    email: input.email ?? current.email,
    notes: input.notes ?? current.notes,
    updatedAt: nowISO()
  };

  persist();
  return state.patients[idx];
}

export function getAppointments() {
  return state.appointments
    .map((item) => ({
      ...item,
      doctorName: item.doctorName || "Sin asignar"
    }))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function createAppointment(input) {
  const appointment = {
    id: randomUUID(),
    patientId: input.patientId,
    patientName: input.patientName || "",
    doctorName: input.doctorName || "Sin asignar",
    startAt: input.startAt,
    durationMin: Number(input.durationMin || 30),
    box: input.box || "General",
    reason: input.reason || "",
    status: input.status || "scheduled",
    notes: input.notes || "",
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.appointments.push(appointment);
  persist();
  return appointment;
}

export function updateAppointmentStatus(id, status) {
  const idx = state.appointments.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  state.appointments[idx] = {
    ...state.appointments[idx],
    status,
    updatedAt: nowISO()
  };

  persist();
  return state.appointments[idx];
}

export function updateAppointment(id, input) {
  const idx = state.appointments.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = state.appointments[idx];
  state.appointments[idx] = {
    ...current,
    doctorName: input.doctorName == null ? current.doctorName : String(input.doctorName).trim() || "Sin asignar",
    startAt: input.startAt == null ? current.startAt : String(input.startAt),
    durationMin: input.durationMin == null ? current.durationMin : Math.max(10, Number(input.durationMin || 30)),
    box: input.box == null ? current.box : String(input.box || "General"),
    reason: input.reason == null ? current.reason : String(input.reason),
    notes: input.notes == null ? current.notes : String(input.notes),
    status: input.status == null ? current.status : String(input.status),
    updatedAt: nowISO()
  };

  persist();
  return state.appointments[idx];
}

export function updateAppointmentNotes(id, notes) {
  const idx = state.appointments.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  state.appointments[idx] = {
    ...state.appointments[idx],
    notes: String(notes || "").trim(),
    updatedAt: nowISO()
  };

  persist();
  return state.appointments[idx];
}

export function getTreatmentCatalog() {
  return state.treatments
    .map((item) => ({ ...item }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createTreatmentCatalogItem(input) {
  const treatment = {
    id: randomUUID(),
    name: input.name || "",
    price: Number(input.price || 0),
    colorHex: input.colorHex || "6C757D",
    iconKey: input.iconKey || "generic",
    pieceType: input.pieceType || "pieza"
  };

  state.treatments.push(treatment);
  persist();
  return treatment;
}

export function updateTreatmentCatalogItem(id, input) {
  const idx = state.treatments.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = state.treatments[idx];
  state.treatments[idx] = {
    ...current,
    name: input.name ?? current.name,
    price: input.price == null ? current.price : Number(input.price),
    pieceType: input.pieceType ?? current.pieceType,
    iconKey: input.iconKey ?? current.iconKey,
    colorHex: input.colorHex ?? current.colorHex
  };

  persist();
  return state.treatments[idx];
}

export function getTreatmentRecords() {
  return state.treatmentRecords
    .map((record) => ({
      ...record,
      lines: (record.lines || []).map((line) => ({
        ...line,
        ...normalizeLabLine(line)
      }))
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createTreatmentRecord(input) {
  const lines = Array.isArray(input.lines)
    ? input.lines
        .filter((line) => line.treatmentId)
        .map((line) => {
          const normalizedLab = normalizeLabLine(line);
          return {
            treatmentId: line.treatmentId,
            treatmentName: line.treatmentName || "",
            quantity: Number(line.quantity || 1),
            unitPrice: Number(line.unitPrice || 0),
            toothCode: line.toothCode || null,
            note: line.note || null,
            ...normalizedLab,
            lineTotal: Number(line.quantity || 1) * Number(line.unitPrice || 0)
          };
        })
    : [];

  const record = {
    id: randomUUID(),
    patientId: input.patientId,
    patientName: input.patientName || "",
    operatorName: input.operatorName || "Sin asignar",
    type: input.type === "done" ? "done" : "budget",
    source: input.source || "manual",
    date: input.date || new Date().toISOString().slice(0, 10),
    notes: input.notes || "",
    lines,
    total: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.treatmentRecords.push(record);
  persist();
  return record;
}

export function updateTreatmentRecordLabLine(recordId, lineIndex, input) {
  const recordIdx = state.treatmentRecords.findIndex((item) => item.id === recordId);
  if (recordIdx === -1) return null;

  const record = state.treatmentRecords[recordIdx];
  const index = Number(lineIndex);
  if (!Number.isInteger(index) || index < 0 || index >= (record.lines || []).length) return null;

  const currentLine = record.lines[index];
  const mergedLab = normalizeLabLine({
    ...currentLine,
    ...input
  });

  record.lines[index] = {
    ...currentLine,
    ...mergedLab,
    lineTotal: Number(currentLine.quantity || 1) * Number(currentLine.unitPrice || 0)
  };
  record.updatedAt = nowISO();

  state.treatmentRecords[recordIdx] = record;
  persist();
  return record;
}

export function getPayments() {
  return state.payments
    .map((item) => ({ ...item }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function createPayment(input) {
  const payment = {
    id: randomUUID(),
    patientId: input.patientId,
    patientName: input.patientName || "",
    amount: Number(input.amount || 0),
    method: input.method || "tarjeta",
    date: input.date || new Date().toISOString().slice(0, 10),
    note: input.note || "",
    kind: input.kind === "refund" ? "refund" : "payment",
    allocations: Array.isArray(input.allocations)
      ? input.allocations.map((item) => ({
          recordId: String(item.recordId || ""),
          lineIndex: Number(item.lineIndex || 0),
          amount: Math.max(0, Number(item.amount || 0))
        }))
      : [],
    invoiceRef: input.invoiceRef ? String(input.invoiceRef) : "",
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.payments.push(payment);
  persist();
  return payment;
}

export function getExpenses() {
  return (state.expenses || [])
    .map((item) => ({ ...item }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function createExpense(input) {
  const expense = {
    id: randomUUID(),
    concept: String(input.concept || "Gasto operativo"),
    amount: Math.max(0, Number(input.amount || 0)),
    method: input.method || "transferencia",
    date: input.date || new Date().toISOString().slice(0, 10),
    note: input.note || "",
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.expenses = Array.isArray(state.expenses) ? state.expenses : [];
  state.expenses.push(expense);
  persist();
  return expense;
}

function inDateRange(value, from, to) {
  if (!value) return false;
  const day = String(value).slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function getReportDoctorEarnings({ operatorName, month }) {
  const monthPrefix = month || new Date().toISOString().slice(0, 7);
  const rows = state.treatmentRecords.filter(
    (record) => record.type === "done" && String(record.date || "").startsWith(monthPrefix)
  );

  const grouped = new Map();
  for (const row of rows) {
    const key = row.operatorName || "Sin asignar";
    if (!grouped.has(key)) {
      grouped.set(key, { operatorName: key, total: 0, records: 0 });
    }
    const current = grouped.get(key);
    current.total += Number(row.total || 0);
    current.records += 1;
  }

  let items = [...grouped.values()].sort((a, b) => b.total - a.total);
  if (operatorName) {
    items = items.filter((item) => item.operatorName.toLowerCase().includes(String(operatorName).toLowerCase()));
  }

  return {
    month: monthPrefix,
    items,
    total: items.reduce((sum, item) => sum + item.total, 0)
  };
}

export function getReportPatientTreatments({ patientId, from, to }) {
  const rows = state.treatmentRecords.filter(
    (record) => record.patientId === patientId && inDateRange(record.date, from, to)
  );

  return {
    patientId,
    from: from || null,
    to: to || null,
    records: rows,
    total: rows.reduce((sum, item) => sum + Number(item.total || 0), 0)
  };
}

export function getReportTreatmentsSummary({ from, to }) {
  const rows = state.treatmentRecords.filter((record) => inDateRange(record.date, from, to));
  const byTreatment = new Map();

  for (const record of rows) {
    for (const line of record.lines || []) {
      const key = line.treatmentName || line.treatmentId;
      if (!byTreatment.has(key)) {
        byTreatment.set(key, { treatmentName: key, quantity: 0, amount: 0 });
      }
      const current = byTreatment.get(key);
      current.quantity += Number(line.quantity || 0);
      current.amount += Number(line.lineTotal || 0);
    }
  }

  const items = [...byTreatment.values()].sort((a, b) => b.amount - a.amount);

  return {
    from: from || null,
    to: to || null,
    items,
    recordsCount: rows.length,
    totalAmount: rows.reduce((sum, item) => sum + Number(item.total || 0), 0)
  };
}
