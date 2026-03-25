const sections = ["inicio", "tratamientos", "pacientes", "doctores", "historial", "reportes", "agenda", "cobros", "inventario", "trabajos", "ajustes"];

const sectionLabels = {
  inicio: "Inicio",
  tratamientos: "Tratamientos",
  pacientes: "Pacientes",
  doctores: "Doctores",
  historial: "Historial",
  reportes: "Reportes/PDF",
  agenda: "Agenda",
  cobros: "Cobros",
  inventario: "Inventario",
  trabajos: "Trabajos Lab",
  ajustes: "Ajustes"
};

const sectionIcons = {
  inicio: "🏠",
  tratamientos: "🦷",
  pacientes: "🧑",
  doctores: "🩺",
  historial: "🗂️",
  reportes: "📄",
  agenda: "📅",
  cobros: "💳",
  inventario: "📦",
  trabajos: "🧪",
  ajustes: "⚙️"
};

const mobileDockSections = ["inicio", "agenda", "tratamientos", "pacientes", "cobros"];

const doctorSections = ["agenda", "tratamientos", "pacientes", "historial", "inicio"];

function normalizeWorkflowRole(role) {
  return role === "doctor" ? "doctor" : "admin";
}

function getMobileDockSections() {
  const visible = getVisibleSections();
  const preferred = mobileDockSections.filter((key) => visible.includes(key));
  if (visible.includes("ajustes") && !preferred.includes("ajustes")) {
    preferred.push("ajustes");
  }
  return preferred.slice(0, 5);
}

function renderMobileDock() {
  const items = getMobileDockSections();
  return `
    <nav class="mobile-dock" aria-label="Navegacion principal movil">
      ${items
        .map(
          (key) => `
            <button type="button" class="mobile-dock-btn ${state.activeSection === key ? "active" : ""}" data-mobile-section="${key}" title="${sectionLabels[key]}">
              <span class="mobile-dock-icon">${sectionIcons[key]}</span>
              <span class="mobile-dock-label">${sectionLabels[key]}</span>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderWorkflowSessionModal() {
  if (!state.ui.sessionModalOpen) return "";
  const workflowRole = normalizeWorkflowRole(state.workflow.role);
  const doctorOptions = getDoctorNames({ includeInactive: true })
    .map((name) => `<option value="${escapeHtml(name)}" ${state.workflow.doctorName === name ? "selected" : ""}>${escapeHtml(name)}</option>`)
    .join("");
  const canClose = state.workflow.sessionStarted;

  return `
    <div class="modal-backdrop" id="workflowSessionBackdrop">
      <div class="modal-card">
        <div class="toolbar" style="justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin:0;">Sesion de trabajo</h3>
          ${canClose ? '<button type="button" id="closeWorkflowSessionModal">Cerrar</button>' : ""}
        </div>
        <p class="helper" style="margin-top:0;">Selecciona perfil y doctor al abrir la app. Luego puedes cambiarlo desde el icono junto a DentOrg.</p>
        <div class="row">
          <div class="field">
            <label>Perfil</label>
            <select id="workflowSessionRole">
              <option value="admin" ${workflowRole === "admin" ? "selected" : ""}>Admin</option>
              <option value="doctor" ${workflowRole === "doctor" ? "selected" : ""}>Doctor</option>
            </select>
          </div>
          <div class="field">
            <label>Doctor</label>
            <select id="workflowSessionDoctor" ${workflowRole === "doctor" ? "" : "disabled"}>
              <option value="">Seleccionar doctor</option>
              ${doctorOptions}
            </select>
          </div>
        </div>
        <div class="toolbar" style="margin-top:12px; justify-content:flex-end;">
          <button type="button" class="primary" id="startWorkflowSessionBtn">${state.workflow.sessionStarted ? "Guardar sesion" : "Iniciar sesion"}</button>
        </div>
      </div>
    </div>
  `;
}

function getVisibleSections() {
  return normalizeWorkflowRole(state.workflow.role) === "doctor" ? doctorSections : sections;
}

function canAccessSection(sectionKey) {
  return getVisibleSections().includes(sectionKey);
}

const appointmentStatuses = ["scheduled", "confirmed", "checked_in", "completed", "cancelled", "no_show"];
const agendaWeekdays = [
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miercoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sabado" },
  { key: 7, label: "Domingo" }
];
const agendaPrefsStorageKey = "dentorg:agenda-preferences";
const workflowPrefsStorageKey = "dentorg:workflow-preferences";
const themePrefsStorageKey = "dentorg:theme-preferences";
const apiBaseStorageKey = "dentorg:api-base-url";
const teethTopRight = ["18", "17", "16", "15", "14", "13", "12", "11"];
const teethTopLeft = ["21", "22", "23", "24", "25", "26", "27", "28"];
const teethBottomLeft = ["48", "47", "46", "45", "44", "43", "42", "41"];
const teethBottomRight = ["31", "32", "33", "34", "35", "36", "37", "38"];
const allTeeth = new Set([...teethTopRight, ...teethTopLeft, ...teethBottomLeft, ...teethBottomRight]);

function createDefaultAgendaDaySchedules() {
  return {
    1: { enabled: true, start: "08:00", end: "20:00" },
    2: { enabled: true, start: "08:00", end: "20:00" },
    3: { enabled: true, start: "08:00", end: "20:00" },
    4: { enabled: true, start: "08:00", end: "20:00" },
    5: { enabled: true, start: "08:00", end: "20:00" },
    6: { enabled: false, start: "08:00", end: "14:00" },
    7: { enabled: false, start: "08:00", end: "14:00" }
  };
}

function createAgendaPresetSchedules(presetKey = "standard") {
  if (presetKey === "compact") {
    return {
      1: { enabled: true, start: "09:00", end: "14:00" },
      2: { enabled: true, start: "09:00", end: "14:00" },
      3: { enabled: true, start: "09:00", end: "14:00" },
      4: { enabled: true, start: "09:00", end: "14:00" },
      5: { enabled: true, start: "09:00", end: "14:00" },
      6: { enabled: false, start: "09:00", end: "13:00" },
      7: { enabled: false, start: "09:00", end: "13:00" }
    };
  }

  if (presetKey === "extended") {
    return {
      1: { enabled: true, start: "08:00", end: "21:00" },
      2: { enabled: true, start: "08:00", end: "21:00" },
      3: { enabled: true, start: "08:00", end: "21:00" },
      4: { enabled: true, start: "08:00", end: "21:00" },
      5: { enabled: true, start: "08:00", end: "21:00" },
      6: { enabled: true, start: "09:00", end: "14:00" },
      7: { enabled: false, start: "09:00", end: "13:00" }
    };
  }

  return createDefaultAgendaDaySchedules();
}

const state = {
  activeSection: "inicio",
  dashboard: null,
  patients: [],
  doctors: [],
  activePatientProfile: null,
  appointments: [],
  agenda: {
    view: "week",
    currentDate: new Date().toISOString().slice(0, 10),
    selectedDateTime: "",
    doctorFilter: "all",
    slotIntervalMin: 60,
    daySchedules: createDefaultAgendaDaySchedules(),
    quickAdd: {
      open: false,
      dateTime: "",
      selectedPatientId: "",
      doctorName: "",
      durationMin: 30,
      reason: "",
      notes: "",
      isUrgent: false
    }
  },
  treatments: [],
  treatmentRecords: [],
  payments: [],
  expenses: [],
  treatmentDraft: {
    patientId: "",
    operatorName: "Usuario 1",
    type: "budget",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    lines: [],
    selectedTooth: "16",
    selectedTreatmentId: ""
  },
  treatmentCatalogSearch: "",
  patientSearch: "",
  globalPatientSearch: "",
  ui: {
    darkMode: false,
    sessionModalOpen: false,
    windows: {
      inicio: "agenda",
      agenda: "calendar",
      tratamientos: "draft",
      pacientes: "listado",
      cobros: "registro"
    }
  },
  workflow: {
    role: "admin",
    doctorName: "",
    sessionStarted: false
  },
  inicioQuick: {
    patientId: "",
    visitType: "control",
    doctorName: "",
    reason: "Control",
    startAt: new Date().toISOString().slice(0, 16)
  },
  settings: {
    view: "treatments",
    treatmentWindow: "catalog",
    treatmentSearch: "",
    patientSearch: "",
    apiBaseUrl: "",
    reports: {
      month: new Date().toISOString().slice(0, 7),
      operatorName: "",
      patientId: "",
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10)
    },
    reportResults: {
      doctorEarnings: null,
      patientTreatments: null,
      treatmentsSummary: null
    }
  },
  history: {
    search: "",
    type: "all",
    doctor: "all",
    patientId: "all",
    status: "all",
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    cacheKey: "",
    cachedRows: []
  },
  voice: {
    listening: false,
    transcript: "",
    recognitionReady: false,
    unsupportedReason: ""
  },
  parsedPreview: []
};

const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
const connectionStatus = document.getElementById("connectionStatus");
const openSessionBtn = document.getElementById("openSessionBtn");
const activeSessionName = document.getElementById("activeSessionName");
const topbarThemeToggle = document.getElementById("topbarThemeToggle");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

function normalizeApiBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\/$/, "");
}

function readPersistedApiBaseUrl() {
  try {
    return normalizeApiBaseUrl(localStorage.getItem(apiBaseStorageKey) || "");
  } catch (_error) {
    return "";
  }
}

function loadApiBasePreference() {
  const configuredByWindow = normalizeApiBaseUrl(window.DENTORG_API_BASE_URL || "");
  const persisted = readPersistedApiBaseUrl();
  state.settings.apiBaseUrl = configuredByWindow || persisted;
}

function saveApiBasePreference() {
  try {
    const value = normalizeApiBaseUrl(state.settings.apiBaseUrl);
    if (!value) {
      localStorage.removeItem(apiBaseStorageKey);
      return;
    }
    localStorage.setItem(apiBaseStorageKey, value);
  } catch (_error) {
    // no-op
  }
}

function getApiBaseUrl() {
  return normalizeApiBaseUrl(state.settings.apiBaseUrl || "");
}

function resolveApiUrl(path) {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === "string" && input.startsWith("/api")) {
    return nativeFetch(resolveApiUrl(input), init);
  }
  return nativeFetch(input, init);
};

function isNativeShellRuntime() {
  return Boolean(window.Capacitor) || window.location.protocol === "capacitor:" || window.location.protocol === "file:";
}

function getSocketClientScriptUrl() {
  const base = getApiBaseUrl();
  return base ? `${base}/socket.io/socket.io.js` : "/socket.io/socket.io.js";
}

function getSocketConnectionUrl() {
  return getApiBaseUrl() || undefined;
}

function ensureSocketClient() {
  if (typeof window.io === "function") return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = getSocketClientScriptUrl();
    script.async = true;
    script.onload = () => resolve(typeof window.io === "function");
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function printTreatmentRecordPdf(recordId) {
  const record = state.treatmentRecords.find((item) => item.id === recordId);
  if (!record) {
    alert("Registro no encontrado");
    return;
  }

  const billingSnapshot = record.type === "done" ? getPatientBillingSnapshot(record.patientId) : null;
  const billingByLine = new Map((billingSnapshot?.items || []).map((item) => [`${item.recordId}:${item.lineIndex}`, item]));

  const rows = (record.lines || []).map((line, lineIndex) => {
    const key = `${record.id}:${lineIndex}`;
    const billingLine = billingByLine.get(key);
    const lineTotal = Number(line.lineTotal || Number(line.quantity || 0) * Number(line.unitPrice || 0));
    const status = record.type === "budget" ? "presupuesto" : billingLine?.status === "paid" ? "pagado" : "no pagado";
    const pending = record.type === "budget" ? "-" : formatMoney(billingLine?.outstanding || 0);

    return [
      line.treatmentName || "Tratamiento",
      String(Number(line.quantity || 0)),
      line.toothCode || "-",
      formatMoney(line.unitPrice || 0),
      formatMoney(lineTotal),
      status,
      pending
    ];
  });

  rows.push(["TOTAL", "", "", "", formatMoney(record.total || 0), "", record.type === "budget" ? "-" : formatMoney(billingSnapshot?.pendingTotal || 0)]);

  const title = record.type === "budget" ? "Presupuesto" : "Tratamiento realizado";
  const subtitle = `Paciente: ${record.patientName || "Paciente"} | Fecha: ${record.date || "-"} | Usuario: ${record.operatorName || "-"}`;
  printReportPdf({
    title,
    subtitle,
    columns: ["Tratamiento", "Cant.", "Pieza", "P.Unit.", "Importe", "Estado", "Pendiente"],
    rows
  });
}

async function pingApiHealth() {
  const response = await fetch("/api/health");
  if (!response.ok) return false;
  const payload = await response.json();
  return Boolean(payload?.ok);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isLabTreatmentName(value) {
  const normalized = normalizeText(value);
  return ["puente", "corona", "compostura", "protesis", "tratamiento"].some((keyword) => normalized.includes(keyword));
}

function getDraftLabDefaults(treatmentName) {
  return {
    isLabWork: isLabTreatmentName(treatmentName),
    labName: "",
    labCost: 0,
    labStatus: "pending"
  };
}

function statusBadge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function treatmentIcon(iconKey) {
  switch (iconKey) {
    case "implant":
      return "⚙️";
    case "bridge":
      return "🌉";
    case "crown":
      return "👑";
    case "ortho":
      return "🪛";
    case "root":
      return "🧬";
    case "surgery":
      return "🩺";
    case "cleaning":
      return "✨";
    case "veneer":
      return "💎";
    case "periodontics":
      return "🌿";
    case "prosthesis_removable":
      return "🧩";
    case "sealant":
      return "💧";
    case "restoration":
      return "🛠️";
    default:
      return "🦷";
  }
}

function saveThemePreferences() {
  try {
    localStorage.setItem(
      themePrefsStorageKey,
      JSON.stringify({
        darkMode: Boolean(state.ui.darkMode)
      })
    );
  } catch (_error) {
    // no-op
  }
}

function loadThemePreferences() {
  try {
    const raw = localStorage.getItem(themePrefsStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.ui.darkMode = Boolean(parsed?.darkMode);
  } catch (_error) {
    // no-op
  }
}

function applyThemeMode() {
  document.body.classList.toggle("theme-dark", Boolean(state.ui.darkMode));
}

const treatmentIconOptions = [
  "generic",
  "crown",
  "bridge",
  "implant",
  "ortho",
  "root",
  "surgery",
  "cleaning",
  "veneer",
  "periodontics",
  "prosthesis_removable",
  "sealant",
  "restoration"
];

const treatmentColorPalette = ["#0E7C7B", "#355070", "#3A86FF", "#4D908E", "#8338EC", "#D90429", "#2A9D8F", "#4895EF", "#2D6A4F", "#6D597A", "#06D6A0", "#6C757D"];

function normalizeTreatmentColorHex(value, fallback = "#6C757D") {
  const cleaned = String(value || "")
    .trim()
    .replace(/^#/, "")
    .replace(/[^0-9A-Fa-f]/g, "")
    .slice(0, 6);
  if (cleaned.length !== 6) return fallback;
  return `#${cleaned.toUpperCase()}`;
}

function renderTreatmentIconOptions(selectedKey = "generic") {
  return treatmentIconOptions
    .map((key) => `<option value="${key}" ${key === selectedKey ? "selected" : ""}>${treatmentIcon(key)}</option>`)
    .join("");
}

function getTreatmentColorByIcon(iconKey = "generic") {
  const index = Math.max(0, treatmentIconOptions.indexOf(iconKey));
  return treatmentColorPalette[index % treatmentColorPalette.length] || "#6C757D";
}

function treatmentMetaById(treatmentId) {
  const treatment = treatmentById(treatmentId);
  return {
    iconKey: treatment?.iconKey || "generic",
    colorHex: normalizeTreatmentColorHex(treatment?.colorHex || "#6C757D")
  };
}

function saveWorkflowPreferences() {
  try {
    localStorage.setItem(
      workflowPrefsStorageKey,
      JSON.stringify({
        role: normalizeWorkflowRole(state.workflow.role),
        doctorName: String(state.workflow.doctorName || ""),
        sessionStarted: Boolean(state.workflow.sessionStarted)
      })
    );
  } catch (_error) {
    // no-op
  }
}

function loadWorkflowPreferences() {
  try {
    const raw = localStorage.getItem(workflowPrefsStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.workflow.role = normalizeWorkflowRole(parsed?.role);
    state.workflow.doctorName = String(parsed?.doctorName || "");
    state.workflow.sessionStarted = Boolean(parsed?.sessionStarted);
  } catch (_error) {
    // no-op
  }
}

function getWorkflowSessionLabel() {
  if (!state.workflow.sessionStarted) return "Sin iniciar";
  if (normalizeWorkflowRole(state.workflow.role) === "doctor") {
    return state.workflow.doctorName ? `Doctor ${state.workflow.doctorName}` : "Doctor";
  }
  return "Admin";
}

function syncTopbarControls() {
  if (activeSessionName) {
    activeSessionName.textContent = getWorkflowSessionLabel();
  }
  if (topbarThemeToggle) {
    topbarThemeToggle.classList.toggle("active", Boolean(state.ui.darkMode));
    topbarThemeToggle.setAttribute("aria-pressed", state.ui.darkMode ? "true" : "false");
    topbarThemeToggle.style.display = state.activeSection === "ajustes" ? "inline-flex" : "none";
  }
}

function applyWorkflowSession() {
  if (normalizeWorkflowRole(state.workflow.role) === "doctor" && state.workflow.doctorName) {
    state.agenda.doctorFilter = state.workflow.doctorName;
    state.history.doctor = state.workflow.doctorName;
    state.inicioQuick.doctorName = state.workflow.doctorName;
    return;
  }
  state.agenda.doctorFilter = "all";
  state.history.doctor = "all";
}

function startWorkflowSession() {
  if (normalizeWorkflowRole(state.workflow.role) === "doctor") {
    if (!state.workflow.doctorName) {
      alert("Selecciona doctor para iniciar sesion");
      return;
    }
    const today = toDateKey(new Date());
    state.activeSection = "agenda";
    state.agenda.currentDate = today;
    state.agenda.selectedDateTime = `${today}T09:00`;
    state.agenda.view = "day";
  } else {
    state.activeSection = "inicio";
  }
  state.workflow.sessionStarted = true;
  state.ui.sessionModalOpen = false;
  applyWorkflowSession();
  saveWorkflowPreferences();
  render();
}

function getModuleWindow(moduleKey, fallbackKey) {
  const value = state.ui.windows?.[moduleKey];
  return value || fallbackKey;
}

function setModuleWindow(moduleKey, windowKey) {
  if (!state.ui.windows) state.ui.windows = {};
  state.ui.windows[moduleKey] = windowKey;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function patientPickerLabel(patient) {
  const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
  const extra = patient.phone || patient.documentId || "";
  return extra ? `${fullName} · ${extra}` : fullName;
}

function buildPatientDatalistOptions() {
  return state.patients.map((item) => `<option value="${escapeHtml(patientPickerLabel(item))}" data-value-id="${item.id}"></option>`).join("");
}

function getDoctorNames({ includeInactive = false, includeUnassigned = false, includeTreatmentOperators = false } = {}) {
  const fromDoctors = state.doctors
    .filter((item) => includeInactive || item.active)
    .map((item) => item.name);
  const fromAppointments = state.appointments.map((item) => item.doctorName || (includeUnassigned ? "Sin asignar" : ""));
  const fromTreatments = includeTreatmentOperators ? state.treatmentRecords.map((item) => item.operatorName || "") : [];

  return [...new Set([...fromDoctors, ...fromAppointments, ...fromTreatments].filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function resolveDatalistValueId(listId, inputValue) {
  const value = String(inputValue || "").trim();
  if (!listId || !value) return "";
  const options = [...document.querySelectorAll(`#${listId} option`)];
  const exact = options.find((item) => item.value === value);
  if (exact?.dataset?.valueId) return exact.dataset.valueId;
  const normalized = normalizeText(value);
  const normalizedMatch = options.find((item) => normalizeText(item.value) === normalized);
  return normalizedMatch?.dataset?.valueId || "";
}

function resolvePatientIdFromInput(listId, inputValue) {
  const fromList = resolveDatalistValueId(listId, inputValue);
  if (fromList) return fromList;
  const normalized = normalizeText(inputValue);
  if (!normalized) return "";
  const found = state.patients.find(
    (item) => normalizeText(`${item.firstName} ${item.lastName}`) === normalized || normalizeText(patientPickerLabel(item)) === normalized
  );
  return found?.id || "";
}

function downloadCsv(filename, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No hay datos para exportar");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((key) => escapeCsvCell(row[key])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function printReportPdf({ title, subtitle = "", columns = [], rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    alert("No se pudo abrir la ventana de impresion");
    return;
  }

  const generatedAt = new Date().toLocaleString("es-ES");
  const headerHtml = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const rowsHtml = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  printWindow.document.write(`<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #1b1f2a; }
        h1 { margin: 0; font-size: 20px; }
        .meta { margin-top: 4px; font-size: 12px; color: #5b6478; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #cbd2e0; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #eef2fa; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="meta">${escapeHtml(subtitle)}</div>` : ""}
      <div class="meta">Generado: ${escapeHtml(generatedAt)}</div>
      <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
  </html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function getSelectedPatient() {
  return state.patients.find((item) => item.id === state.treatmentDraft.patientId) || null;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateTimeKey(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toDateKey(date)}T${hours}:${minutes}`;
}

function fromDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDateLabel(date) {
  return date.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getTimeSlots(intervalMin = 60, startMin = 8 * 60, endMin = 20 * 60) {
  const safeInterval = [10, 30, 60].includes(Number(intervalMin)) ? Number(intervalMin) : 60;
  if (endMin <= startMin) return [];
  const slots = [];
  for (let minutesTotal = startMin; minutesTotal < endMin; minutesTotal += safeInterval) {
    const hour = Math.floor(minutesTotal / 60);
    const minute = minutesTotal % 60;
    slots.push({
      hour,
      minute,
      label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    });
  }
  return slots;
}

function appointmentDateTimeKey(appointment) {
  return String(appointment.startAt || "").slice(0, 16);
}

function weekdayKeyFromDate(date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function timeStringToMinutes(value, fallback = 8 * 60) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return fallback;
  return Math.min(24 * 60, Math.max(0, hour * 60 + minute));
}

function minutesToTimeString(totalMinutes) {
  const safe = Math.min(24 * 60, Math.max(0, Number(totalMinutes || 0)));
  const hour = String(Math.floor(safe / 60)).padStart(2, "0");
  const minute = String(safe % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function getDayScheduleForDate(date) {
  const key = String(weekdayKeyFromDate(date));
  const fallback = { enabled: false, start: "08:00", end: "20:00" };
  return state.agenda.daySchedules?.[key] || fallback;
}

function dayHasAvailability(schedule, slotMinute) {
  if (!schedule?.enabled) return false;
  const start = timeStringToMinutes(schedule.start, 8 * 60);
  const end = timeStringToMinutes(schedule.end, 20 * 60);
  if (end <= start) return false;
  return slotMinute >= start && slotMinute < end;
}

function getAgendaWindowForDays(days) {
  const ranges = days
    .map((day) => getDayScheduleForDate(day))
    .filter((schedule) => schedule.enabled)
    .map((schedule) => ({
      startMin: timeStringToMinutes(schedule.start, 8 * 60),
      endMin: timeStringToMinutes(schedule.end, 20 * 60)
    }))
    .filter((range) => range.endMin > range.startMin);

  if (ranges.length === 0) return null;

  return {
    startMin: Math.min(...ranges.map((range) => range.startMin)),
    endMin: Math.max(...ranges.map((range) => range.endMin))
  };
}

function saveAgendaPreferences() {
  try {
    localStorage.setItem(
      agendaPrefsStorageKey,
      JSON.stringify({
        slotIntervalMin: state.agenda.slotIntervalMin,
        daySchedules: state.agenda.daySchedules
      })
    );
  } catch (_error) {
    // no-op
  }
}

function loadAgendaPreferences() {
  try {
    const raw = localStorage.getItem(agendaPrefsStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const base = createDefaultAgendaDaySchedules();
    const incoming = parsed?.daySchedules || {};

    state.agenda.daySchedules = Object.fromEntries(
      Object.keys(base).map((key) => {
        const row = incoming[key] || {};
        return [
          key,
          {
            enabled: typeof row.enabled === "boolean" ? row.enabled : base[key].enabled,
            start: typeof row.start === "string" ? row.start : base[key].start,
            end: typeof row.end === "string" ? row.end : base[key].end
          }
        ];
      })
    );

    const interval = Number(parsed?.slotIntervalMin || 60);
    state.agenda.slotIntervalMin = [10, 30, 60].includes(interval) ? interval : 60;
  } catch (_error) {
    // no-op
  }
}

function resetQuickAddState(dateTime = "", options = {}) {
  const selectedDateTime = String(dateTime || "").slice(0, 16);
  const isUrgent = Boolean(options.isUrgent);
  const defaultDoctor = state.agenda.doctorFilter !== "all" ? state.agenda.doctorFilter : "";
  state.agenda.quickAdd = {
    open: Boolean(selectedDateTime || isUrgent),
    dateTime: selectedDateTime || `${state.agenda.currentDate}T09:00`,
    selectedPatientId: "",
    doctorName: defaultDoctor,
    durationMin: isUrgent ? 20 : 30,
    reason: isUrgent ? "Urgencia" : "",
    notes: "",
    isUrgent
  };
}

async function saveAppointment(payload) {
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    return false;
  }

  state.agenda.selectedDateTime = String(payload.startAt || "").slice(0, 16);
  if (state.agenda.doctorFilter !== "all") {
    state.agenda.doctorFilter = payload.doctorName;
  }
  await fetchAll();
  return true;
}

function getPatientPendingFromDone(patientId) {
  return getPatientBillingSnapshot(patientId).pendingTotal;
}

function getPatientBillingSnapshot(patientId) {
  const doneRecords = state.treatmentRecords
    .filter((record) => record.patientId === patientId && record.type === "done")
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  const items = doneRecords.flatMap((record) =>
    (record.lines || []).map((line, lineIndex) => {
      const total = Number(line.lineTotal || Number(line.quantity || 0) * Number(line.unitPrice || 0));
      return {
        key: `${record.id}:${lineIndex}`,
        recordId: record.id,
        lineIndex,
        patientId,
        date: record.date || "",
        treatmentName: line.treatmentName || "Tratamiento",
        toothCode: line.toothCode || "",
        total,
        paid: 0,
        outstanding: total
      };
    })
  );

  const itemByKey = new Map(items.map((item) => [item.key, item]));
  const patientPayments = state.payments
    .filter((payment) => payment.patientId === patientId)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  const applySequential = (amount) => {
    let remaining = Math.max(0, Number(amount || 0));
    for (const item of items) {
      if (remaining <= 0) break;
      if (item.outstanding <= 0) continue;
      const chunk = Math.min(item.outstanding, remaining);
      item.paid += chunk;
      item.outstanding = Math.max(0, item.outstanding - chunk);
      remaining -= chunk;
    }
    return remaining;
  };

  for (const payment of patientPayments) {
    const kind = payment.kind === "refund" ? "refund" : "payment";
    const signedAmount = kind === "refund" ? -Math.max(0, Number(payment.amount || 0)) : Math.max(0, Number(payment.amount || 0));
    if (signedAmount < 0) {
      let remainingRefund = Math.abs(signedAmount);
      for (const item of [...items].reverse()) {
        if (remainingRefund <= 0) break;
        if (item.paid <= 0) continue;
        const chunk = Math.min(item.paid, remainingRefund);
        item.paid = Math.max(0, item.paid - chunk);
        item.outstanding += chunk;
        remainingRefund -= chunk;
      }
      continue;
    }

    let remaining = signedAmount;
    const allocations = Array.isArray(payment.allocations) ? payment.allocations : [];
    for (const allocation of allocations) {
      if (remaining <= 0) break;
      const key = `${allocation.recordId}:${Number(allocation.lineIndex || 0)}`;
      const target = itemByKey.get(key);
      if (!target || target.outstanding <= 0) continue;
      const chunk = Math.min(target.outstanding, Math.max(0, Number(allocation.amount || 0)), remaining);
      target.paid += chunk;
      target.outstanding = Math.max(0, target.outstanding - chunk);
      remaining -= chunk;
    }

    if (remaining > 0) {
      applySequential(remaining);
    }
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    status: item.outstanding <= 0.01 ? "paid" : "pending"
  }));

  const totalDone = normalizedItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalPaid = state.payments
    .filter((payment) => payment.patientId === patientId)
    .reduce((sum, payment) => {
      const amount = Math.max(0, Number(payment.amount || 0));
      return payment.kind === "refund" ? sum - amount : sum + amount;
    }, 0);
  const pendingTotal = normalizedItems.reduce((sum, item) => sum + Math.max(0, Number(item.outstanding || 0)), 0);
  const credit = Math.max(0, totalPaid - totalDone);

  return {
    items: normalizedItems,
    totalDone,
    totalPaid,
    pendingTotal,
    credit
  };
}

function buildPaymentAllocations(patientId, amount, selectedKeys = []) {
  const snapshot = getPatientBillingSnapshot(patientId);
  const selectedSet = new Set((selectedKeys || []).filter(Boolean));
  const sourceItems = snapshot.items.filter((item) => item.outstanding > 0.01 && (selectedSet.size === 0 || selectedSet.has(item.key)));
  let remaining = Math.max(0, Number(amount || 0));
  const allocations = [];

  for (const item of sourceItems) {
    if (remaining <= 0) break;
    const chunk = Math.min(item.outstanding, remaining);
    allocations.push({
      recordId: item.recordId,
      lineIndex: item.lineIndex,
      amount: Number(chunk.toFixed(2))
    });
    remaining -= chunk;
  }

  return allocations;
}

function buildInvoiceRowsFromPaymentIds(paymentIds = []) {
  const selected = state.payments.filter((payment) => paymentIds.includes(payment.id));
  if (selected.length === 0) return [];

  return selected.flatMap((payment) => {
    const allocations = Array.isArray(payment.allocations) ? payment.allocations : [];
    if (allocations.length === 0) {
      return [[payment.date || "", payment.patientName || "Paciente", payment.note || "Cobro", "-", formatMoney(payment.amount || 0)]];
    }

    return allocations.map((allocation) => {
      const record = state.treatmentRecords.find((item) => item.id === allocation.recordId);
      const line = record?.lines?.[Number(allocation.lineIndex || 0)] || null;
      return [
        payment.date || "",
        payment.patientName || record?.patientName || "Paciente",
        line?.treatmentName || payment.note || "Tratamiento",
        line?.toothCode || "-",
        formatMoney(allocation.amount || 0)
      ];
    });
  });
}

function lineAffectsTooth(line, toothCode) {
  const raw = String(line.toothCode || "").trim().toUpperCase();
  if (!raw) return false;
  if (raw === toothCode) return true;
  if (raw === "+") return toothCode.startsWith("1") || toothCode.startsWith("2");
  if (raw === "-") return toothCode.startsWith("3") || toothCode.startsWith("4");
  const match = /^(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return false;
  const start = match[1];
  const end = match[2];
  if (!allTeeth.has(start) || !allTeeth.has(end) || !allTeeth.has(toothCode)) return false;
  if (start[0] !== end[0] || start[0] !== toothCode[0]) return false;
  const min = Math.min(Number(start[1]), Number(end[1]));
  const max = Math.max(Number(start[1]), Number(end[1]));
  return Number(toothCode[1]) >= min && Number(toothCode[1]) <= max;
}

function computeDraftTotal() {
  return state.treatmentDraft.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
}

function mergeLine(line) {
  const idx = state.treatmentDraft.lines.findIndex(
    (item) => item.treatmentId === line.treatmentId && String(item.toothCode || "") === String(line.toothCode || "")
  );
  const labDefaults = getDraftLabDefaults(line.treatmentName);
  const meta = treatmentMetaById(line.treatmentId);
  const iconKey = line.iconKey || meta.iconKey;
  const colorHex = normalizeTreatmentColorHex(line.colorHex || meta.colorHex);
  if (idx === -1) {
    state.treatmentDraft.lines.push({
      ...line,
      iconKey,
      colorHex,
      ...labDefaults,
      isLabWork: line.isLabWork == null ? labDefaults.isLabWork : Boolean(line.isLabWork),
      labName: line.labName || "",
      labCost: Number(line.labCost || 0),
      labStatus: line.labStatus === "delivered" ? "delivered" : "pending",
      id: uid()
    });
    return;
  }
  state.treatmentDraft.lines[idx].quantity += Number(line.quantity || 1);
  state.treatmentDraft.lines[idx].iconKey = iconKey;
  state.treatmentDraft.lines[idx].colorHex = colorHex;
}

function buildDraftLinesFromRecord(record) {
  return (record.lines || []).map((line) => ({
    ...treatmentMetaById(line.treatmentId),
    id: uid(),
    treatmentId: line.treatmentId,
    treatmentName: line.treatmentName,
    quantity: Number(line.quantity || 1),
    unitPrice: Number(line.unitPrice || 0),
    toothCode: line.toothCode || null,
    note: line.note || null,
    isLabWork: Boolean(line.isLabWork),
    labName: line.labName || "",
    labCost: Number(line.labCost || 0),
    labStatus: line.labStatus === "delivered" ? "delivered" : "pending"
  }));
}

function treatmentById(id) {
  return state.treatments.find((item) => item.id === id) || null;
}

function extractToothCodes(segment) {
  const direct = [...segment.matchAll(/\b([1-4][1-8])\b/g)].map((match) => match[1]);
  const ranges = [...segment.matchAll(/\b([1-4][1-8])\s*(?:a|-)\s*([1-4][1-8])\b/g)]
    .filter((m) => m[1][0] === m[2][0])
    .map((m) => `${m[1]}-${m[2]}`);

  if (segment.includes("arcada superior")) ranges.push("+");
  if (segment.includes("arcada inferior")) ranges.push("-");
  if (segment.includes("general")) ranges.push("X");

  return [...new Set([...direct, ...ranges])];
}

function resolveQuantity(segment) {
  const numberMatch = /\b(\d+)\b/.exec(segment);
  if (numberMatch) return Math.max(1, Number(numberMatch[1]));
  if (segment.includes("dos")) return 2;
  if (segment.includes("tres")) return 3;
  return 1;
}

function parseTranscriptionSmart(rawText) {
  const normalized = normalizeText(rawText);
  if (!normalized) return [];

  const segments = normalized.split(/[.,;]|\sy\s/g).map((item) => item.trim()).filter(Boolean);
  const parsed = [];

  for (const segment of segments) {
    const quantity = resolveQuantity(segment);
    const toothCodes = extractToothCodes(segment);
    const matches = state.treatments.filter((treatment) => {
      const treatmentName = normalizeText(treatment.name);
      return segment.includes(treatmentName) || segment.includes(treatmentName.split(" ")[0]);
    });

    for (const treatment of matches) {
      if (toothCodes.length === 0) {
        parsed.push({
          id: uid(),
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          quantity,
          unitPrice: treatment.price,
          toothCode: null,
          note: null
        });
      } else {
        for (const toothCode of toothCodes) {
          parsed.push({
            id: uid(),
            treatmentId: treatment.id,
            treatmentName: treatment.name,
            quantity,
            unitPrice: treatment.price,
            toothCode,
            note: toothCode === "X" ? "General" : toothCode === "+" ? "Arcada superior" : toothCode === "-" ? "Arcada inferior" : `Pieza ${toothCode}`
          });
        }
      }
    }
  }

  return parsed;
}

function buildSidebar() {
  sidebar.innerHTML = getVisibleSections()
    .map(
      (key) =>
        `<button class="nav-item ${state.activeSection === key ? "active" : ""}" data-section="${key}"><span class="nav-icon">${sectionIcons[key]}</span><span>${sectionLabels[key]}</span></button>`
    )
    .join("");

  sidebar.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeSection = btn.dataset.section;
      render();
    });
  });
}

function renderInicio() {
  const dashboard = state.dashboard || {
    todayAppointments: 0,
    patientsWaiting: 0,
    pendingPayments: 0,
    lowStock: 0,
    pendingLabJobs: 0
  };

  const now = new Date();
  const todayKey = toDateKey(now);
  const sortedAppointments = [...state.appointments].sort((a, b) => String(a.startAt || "").localeCompare(String(b.startAt || "")));
  const workflowRole = normalizeWorkflowRole(state.workflow.role);
  const isDoctorView = workflowRole === "doctor";
  const currentDoctorName = String(state.workflow.doctorName || "").trim();
  const scopedAppointments = isDoctorView
    ? sortedAppointments.filter((item) => normalizeText(item.doctorName || "") === normalizeText(currentDoctorName))
    : sortedAppointments;

  const todayAppointments = scopedAppointments.filter((item) => String(item.startAt || "").startsWith(todayKey));
  const upcomingToday = todayAppointments
    .filter((item) => {
      const status = String(item.status || "scheduled");
      return new Date(item.startAt) >= now && !["cancelled", "completed", "no_show"].includes(status);
    })
    .slice(0, 6);

  const upcomingAppointments = scopedAppointments
    .filter((item) => {
      const status = String(item.status || "scheduled");
      return new Date(item.startAt) >= now && status !== "cancelled";
    })
    .slice(0, 8);

  const pendingPatients = state.patients
    .map((patient) => ({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      pending: getPatientPendingFromDone(patient.id)
    }))
    .filter((item) => item.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 4);

  const unassignedAppointments = upcomingAppointments.filter((item) => !item.doctorName || item.doctorName === "Sin asignar").length;
  const noShowToday = todayAppointments.filter((item) => item.status === "no_show").length;

  const activeTodayAppointments = todayAppointments.filter((item) => item.status !== "cancelled");
  const doctorsToday = [...new Set(activeTodayAppointments.map((item) => item.doctorName).filter((name) => name && name !== "Sin asignar"))];
  const todaySchedule = getDayScheduleForDate(now);
  const slotUnitsPerDoctor = todaySchedule.enabled
    ? getTimeSlots(30, timeStringToMinutes(todaySchedule.start, 8 * 60), timeStringToMinutes(todaySchedule.end, 20 * 60)).length
    : 0;
  const occupiedUnitsByDoctor = doctorsToday.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});

  activeTodayAppointments.forEach((item) => {
    if (!item.doctorName || !occupiedUnitsByDoctor[item.doctorName]) return;
    const units = Math.max(1, Math.ceil(Number(item.durationMin || 30) / 30));
    occupiedUnitsByDoctor[item.doctorName] += units;
  });

  const doctorsWithFreeSlots = doctorsToday.filter((name) => occupiedUnitsByDoctor[name] < slotUnitsPerDoctor).length;
  const hasDoctorsToday = doctorsToday.length > 0;
  const hasFreeSlotsToday = doctorsWithFreeSlots > 0;
  const availabilityClass = !hasDoctorsToday ? "warning" : hasFreeSlotsToday ? "ok" : "warning";
  const availabilityText = !hasDoctorsToday
    ? "No hay doctores asignados hoy"
    : hasFreeSlotsToday
    ? `Hueco libre hoy (${doctorsWithFreeSlots}/${doctorsToday.length} doctor/es con disponibilidad)`
    : "Sin huecos libres hoy";

  const nextTodayMarkup = upcomingToday
    .map(
      (item) => `<button type="button" class="home-appointment-item" data-appointment-id="${item.id}">
        <div class="home-appointment-main">
          <div class="home-appointment-time">${new Date(item.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
          <div class="home-appointment-text">
            <strong>${item.patientName || "Paciente"}</strong>
            <span>${item.doctorName || "Sin asignar"} · ${item.reason || "Consulta"}</span>
          </div>
        </div>
        <div>${statusBadge(item.status || "scheduled")}</div>
      </button>`
    )
    .join("");

  const upcomingMarkup = upcomingAppointments
    .map(
      (item) => `<button type="button" class="home-appointment-item compact" data-appointment-id="${item.id}">
        <div class="home-appointment-main">
          <div class="home-appointment-time">${new Date(item.startAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}<br>${new Date(item.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
          <div class="home-appointment-text">
            <strong>${item.patientName || "Paciente"}</strong>
            <span>${item.doctorName || "Sin asignar"}</span>
          </div>
        </div>
      </button>`
    )
    .join("");

  const pendingMarkup = pendingPatients
    .map((item) => `<div class="alert-item"><span>${item.name}</span><strong>${formatMoney(item.pending)}</strong></div>`)
    .join("");

  const nextUnassigned = upcomingAppointments.find((item) => !item.doctorName || item.doctorName === "Sin asignar");
  const topPendingPatient = pendingPatients[0] || null;
  const pendingLabRow = state.treatmentRecords
    .flatMap((record) =>
      (record.lines || []).map((line) => ({
        patientId: record.patientId,
        patientName: record.patientName,
        date: record.date,
        treatmentName: line.treatmentName,
        isLabWork: line.isLabWork == null ? isLabTreatmentName(line.treatmentName) : Boolean(line.isLabWork),
        labStatus: line.labStatus === "delivered" ? "delivered" : "pending"
      }))
    )
    .find((line) => line.isLabWork && line.labStatus !== "delivered");

  const smartActions = [
    `<button type="button" class="smart-action-btn" data-smart-action="urgent-now">⚡ Crear urgencia ahora</button>`,
    nextUnassigned
      ? `<button type="button" class="smart-action-btn" data-smart-action="assign-doctor" data-appointment-id="${nextUnassigned.id}">👨‍⚕️ Asignar doctor a ${nextUnassigned.patientName || "cita"}</button>`
      : "",
    topPendingPatient
      ? `<button type="button" class="smart-action-btn" data-smart-action="open-patient" data-patient-id="${topPendingPatient.id}">💳 Cobro rápido · ${topPendingPatient.name}</button>`
      : "",
    pendingLabRow
      ? `<button type="button" class="smart-action-btn" data-smart-action="open-lab">🧪 Revisar trabajo lab pendiente (${pendingLabRow.patientName || "paciente"})</button>`
      : ""
  ]
    .filter(Boolean)
    .join("");

  const quick = state.inicioQuick || {};
  const quickPatient = state.patients.find((item) => item.id === quick.patientId) || null;
  const quickPatientUpcoming = quickPatient
    ? state.appointments
        .filter((item) => item.patientId === quickPatient.id)
        .filter((item) => {
          const status = String(item.status || "scheduled");
          return new Date(item.startAt) >= now && !["cancelled", "completed", "no_show"].includes(status);
        })
        .sort((a, b) => String(a.startAt || "").localeCompare(String(b.startAt || "")))
    : [];
  const nearestExistingAppointment = quickPatientUpcoming[0] || null;
  const suggestedDuration = quick.visitType === "tratamiento" ? 60 : quick.visitType === "urgencia" ? 20 : 30;

  const quickPatientOptions = buildPatientDatalistOptions();
  const quickPatientLabel = quickPatient ? patientPickerLabel(quickPatient) : "";

  const quickDoctorOptions = getDoctorNames({ includeUnassigned: true }).map((name) => `<option value="${name}"></option>`).join("");

  const doctorPendingTreatments = state.treatmentRecords
    .filter((record) => record.type === "budget")
    .filter((record) => !isDoctorView || normalizeText(record.operatorName || "") === normalizeText(currentDoctorName))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 5);

  const doctorNotes = upcomingAppointments
    .filter((item) => String(item.notes || "").trim())
    .slice(0, 4);

  const futurePatientIds = new Set(
    scopedAppointments
      .filter((item) => {
        const status = String(item.status || "scheduled");
        return Boolean(item.patientId) && new Date(item.startAt) >= now && !["cancelled", "no_show"].includes(status);
      })
      .map((item) => item.patientId)
  );

  const doctorRenewals = scopedAppointments
    .filter((item) => item.status === "completed" && Boolean(item.patientId))
    .filter((item) => !futurePatientIds.has(item.patientId))
    .sort((a, b) => String(b.startAt || "").localeCompare(String(a.startAt || "")))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.patientId === item.patientId) === index)
    .slice(0, 4);

  const existingAppointmentNotice = nearestExistingAppointment
    ? `<div class="intake-alert">Paciente con cita ya programada: <strong>${new Date(nearestExistingAppointment.startAt).toLocaleString("es-ES")}</strong> · ${nearestExistingAppointment.reason || "Consulta"} <button type="button" class="inicio-existing-appointment" data-appointment-id="${nearestExistingAppointment.id}">Ir a esa cita</button></div>`
    : `<p class="helper">Sin citas futuras detectadas para este paciente.</p>`;

  if (isDoctorView) {
    const doctorPendingMarkup = doctorPendingTreatments
      .map(
        (record) => `<div class="doctor-list-item"><strong>${record.patientName || "Paciente"}</strong><span>${record.date || "-"} · ${record.lines?.length || 0} lineas</span></div>`
      )
      .join("");

    const doctorNotesMarkup = doctorNotes
      .map(
        (item) => `<div class="doctor-list-item"><strong>${item.patientName || "Paciente"}</strong><span>${escapeHtml(String(item.notes || "").slice(0, 96))}</span></div>`
      )
      .join("");

    const doctorRenewalsMarkup = doctorRenewals
      .map(
        (item) => `<div class="doctor-list-item"><strong>${item.patientName || "Paciente"}</strong><span>Ultima cita: ${new Date(item.startAt).toLocaleDateString("es-ES")}</span></div>`
      )
      .join("");

    return `
      <h2>Inicio clinico</h2>

      <div class="panel home-hero doctor-hero">
        <div>
          <h2>Hoy · ${now.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })}</h2>
          <p class="helper">Solo informacion clinica relevante para tu jornada.</p>
        </div>
        <div class="home-actions">
          <button type="button" class="primary home-action-btn" data-go="agenda">Ir a agenda</button>
          <button type="button" class="home-action-btn" data-go="tratamientos">Tratamientos</button>
          <button type="button" class="home-action-btn" data-go="pacientes">Pacientes</button>
        </div>
      </div>

      <div class="grid home-kpis doctor-kpis">
        <div class="card"><div class="kpi-title">Citas hoy</div><div class="kpi-value">${todayAppointments.length}</div></div>
        <div class="card"><div class="kpi-title">Siguientes citas</div><div class="kpi-value">${upcomingToday.length}</div></div>
        <div class="card"><div class="kpi-title">Tratamientos pendientes</div><div class="kpi-value">${doctorPendingTreatments.length}</div></div>
        <div class="card"><div class="kpi-title">Citas para renovar</div><div class="kpi-value">${doctorRenewals.length}</div></div>
      </div>

      <div class="home-layout doctor-home-layout">
        <div class="panel">
          <h2>Siguientes citas del dia</h2>
          <div class="home-appointments-list">${nextTodayMarkup || `<p class="helper">No hay mas citas pendientes para hoy.</p>`}</div>
        </div>

        <div class="panel">
          <h2>Proximas citas</h2>
          <div class="home-appointments-list">${upcomingMarkup || `<p class="helper">No hay citas futuras registradas.</p>`}</div>
        </div>
      </div>

      <div class="doctor-focus-grid">
        <div class="panel">
          <h2>Comentarios de citas</h2>
          <div class="doctor-list">${doctorNotesMarkup || `<p class="helper">Sin comentarios en citas proximas.</p>`}</div>
        </div>

        <div class="panel">
          <h2>Tratamientos pendientes</h2>
          <div class="doctor-list">${doctorPendingMarkup || `<p class="helper">Sin pendientes de tratamiento.</p>`}</div>
        </div>

        <div class="panel">
          <h2>Citas por renovar</h2>
          <div class="doctor-list">${doctorRenewalsMarkup || `<p class="helper">No hay renovaciones pendientes.</p>`}</div>
        </div>
      </div>
    `;
  }
  const inicioWindow = getModuleWindow("inicio", "agenda");

  return `
    <h2>Inicio operativo</h2>

    <div class="panel home-hero">
      <div>
        <h2>Hoy · ${now.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })}</h2>
        <p class="helper">Resumen diario y accesos directos.</p>
      </div>
      <div class="home-actions">
        <button type="button" class="primary home-action-btn" data-go="agenda">Ir a agenda</button>
        <button type="button" class="home-action-btn" data-go="pacientes">Pacientes</button>
        <button type="button" class="home-action-btn" data-go="cobros">Cobros</button>
      </div>
    </div>

    <div class="grid home-kpis">
      <div class="card"><div class="kpi-title">Citas hoy</div><div class="kpi-value">${dashboard.todayAppointments}</div></div>
      <div class="card"><div class="kpi-title">Pacientes en espera</div><div class="kpi-value">${dashboard.patientsWaiting}</div></div>
      <div class="card"><div class="kpi-title">Cobro pendiente</div><div class="kpi-value">${formatMoney(dashboard.pendingPayments)}</div></div>
      <div class="card"><div class="kpi-title">Stock critico</div><div class="kpi-value">${dashboard.lowStock}</div></div>
      <div class="card"><div class="kpi-title">Trabajos lab pendientes</div><div class="kpi-value">${dashboard.pendingLabJobs}</div></div>
    </div>

    <div class="panel">
      <div class="toolbar module-windows-nav">
        <button type="button" class="module-window-btn ${inicioWindow === "agenda" ? "active" : ""}" data-module-window="inicio" data-window-key="agenda">Citas</button>
        <button type="button" class="module-window-btn ${inicioWindow === "alertas" ? "active" : ""}" data-module-window="inicio" data-window-key="alertas">Avisos</button>
        <button type="button" class="module-window-btn ${inicioWindow === "acciones" ? "active" : ""}" data-module-window="inicio" data-window-key="acciones">Acciones</button>
        <button type="button" class="module-window-btn ${inicioWindow === "admision" ? "active" : ""}" data-module-window="inicio" data-window-key="admision">Admisión</button>
      </div>
    </div>

    ${inicioWindow === "agenda" ? `<div class="home-layout">
      <div class="panel">
        <h2>Siguientes citas del dia</h2>
        <div class="home-appointments-list">${nextTodayMarkup || `<p class="helper">No hay mas citas pendientes para hoy.</p>`}</div>
      </div>

      <div class="panel">
        <h2>Proximas citas</h2>
        <div class="home-appointments-list">${upcomingMarkup || `<p class="helper">No hay citas futuras registradas.</p>`}</div>
      </div>
    </div>` : ""}

    ${inicioWindow === "alertas" ? `<div class="panel">
      <h2>Avisos</h2>
      <div class="alerts-grid">
        <div class="alert-card">
          <div class="kpi-title">Citas sin doctor asignado</div>
          <div class="kpi-value">${unassignedAppointments}</div>
        </div>
        <div class="alert-card ${noShowToday > 0 ? "warning" : "ok"}">
          <div class="kpi-title">No show de hoy</div>
          <div class="kpi-value">${noShowToday}</div>
        </div>
        <div class="alert-card ${availabilityClass}">
          <div class="kpi-title">Disponibilidad doctores hoy</div>
          <div class="kpi-value" style="font-size:1rem;">${availabilityText}</div>
        </div>
        <div class="alert-card">
          <div class="kpi-title">Pendientes de cobro por paciente</div>
          <div class="alert-list">${pendingMarkup || `<p class="helper">Sin pendientes relevantes.</p>`}</div>
        </div>
      </div>
    </div>` : ""}

    ${inicioWindow === "acciones" ? `<div class="panel">
      <h2>Acciones inteligentes</h2>
      <div class="smart-actions">${smartActions}</div>
      <p class="helper" style="margin-top:8px;">Atajos de un clic para resolver lo más urgente del día.</p>
    </div>` : ""}

    ${inicioWindow === "admision" ? `<div class="panel">
      <h2>Admisión rápida inteligente</h2>
      <form id="inicioQuickForm">
        <div class="row">
          <div class="field"><label>Paciente</label><input id="inicioQuickPatientSearch" list="inicioQuickPatientList" value="${escapeHtml(quickPatientLabel)}" placeholder="Buscar y seleccionar paciente" required /><input id="inicioQuickPatientId" type="hidden" name="patientId" value="${quick.patientId || ""}" /><datalist id="inicioQuickPatientList">${quickPatientOptions}</datalist></div>
          <div class="field"><label>Tipo visita</label><select id="inicioQuickType" name="visitType"><option value="control" ${quick.visitType === "control" ? "selected" : ""}>Control</option><option value="tratamiento" ${quick.visitType === "tratamiento" ? "selected" : ""}>Tratamiento</option><option value="urgencia" ${quick.visitType === "urgencia" ? "selected" : ""}>Urgencia</option></select></div>
          <div class="field"><label>Doctor</label><input id="inicioQuickDoctor" name="doctorName" value="${quick.doctorName || ""}" list="inicioQuickDoctorList" placeholder="Sin asignar" /></div>
          <div class="field"><label>Fecha y hora</label><input id="inicioQuickStartAt" type="datetime-local" name="startAt" value="${quick.startAt || new Date().toISOString().slice(0, 16)}" required /></div>
          <div class="field"><label>Duración sugerida</label><input value="${suggestedDuration} min" disabled /></div>
          <div class="field"><label>Motivo</label><input id="inicioQuickReason" name="reason" value="${quick.reason || ""}" /></div>
        </div>
        <datalist id="inicioQuickDoctorList">${quickDoctorOptions}</datalist>
        <div style="margin-top:8px;">${quickPatient ? existingAppointmentNotice : `<p class="helper">Selecciona paciente para revisar si ya tiene citas próximas.</p>`}</div>
        <div class="toolbar" style="margin-top:10px;"><button type="submit" class="primary">Registrar admisión y crear cita</button></div>
      </form>
    </div>` : ""}
  `;
}

function renderPacientes() {
  const rows = state.patients
    .filter((p) => normalizeText(`${p.firstName} ${p.lastName} ${p.phone || ""} ${p.documentId || ""}`).includes(normalizeText(state.patientSearch)))
    .map(
      (p) =>
        `<tr>
          <td><input class="patient-inline-first" data-patient-id="${p.id}" value="${escapeHtml(p.firstName || "")}" /></td>
          <td><input class="patient-inline-last" data-patient-id="${p.id}" value="${escapeHtml(p.lastName || "")}" /></td>
          <td><input class="patient-inline-phone" data-patient-id="${p.id}" value="${escapeHtml(p.phone || "")}" /></td>
          <td><input class="patient-inline-email" data-patient-id="${p.id}" value="${escapeHtml(p.email || "")}" /></td>
          <td><input class="patient-inline-document" data-patient-id="${p.id}" value="${escapeHtml(p.documentId || "")}" /></td>
          <td>${formatMoney(getPatientPendingFromDone(p.id))}</td>
          <td class="history-actions">
            <button type="button" class="save-patient-inline" data-patient-id="${p.id}">Guardar</button>
            <button type="button" class="open-patient-profile" data-patient-id="${p.id}">Perfil</button>
          </td>
        </tr>`
    )
    .join("");

  const profile = state.activePatientProfile;
  const billingSnapshot = profile ? getPatientBillingSnapshot(profile.patient.id) : null;
  const pendingLinesRows = (billingSnapshot?.items || [])
    .filter((item) => item.status === "pending")
    .map(
      (item) => `<tr><td>${item.date || "-"}</td><td>${item.treatmentName}</td><td>${item.toothCode || "-"}</td><td>${formatMoney(item.total)}</td><td>${formatMoney(item.outstanding)}</td><td><span class="badge checked_in">no pagado</span></td></tr>`
    )
    .join("");

  const profileSection = profile
    ? `
      <div class="panel">
        <div class="toolbar" style="justify-content:space-between;">
          <h2>Perfil de paciente: ${profile.patient.firstName} ${profile.patient.lastName}</h2>
          <button type="button" id="closePatientProfileBtn">Cerrar perfil</button>
        </div>
        <div class="grid">
          <div class="card"><div class="kpi-title">Presupuestos</div><div class="kpi-value">${formatMoney(profile.summary.budgetTotal)}</div></div>
          <div class="card"><div class="kpi-title">Tratamientos realizados</div><div class="kpi-value">${formatMoney(profile.summary.doneTotal)}</div></div>
          <div class="card"><div class="kpi-title">Pagado</div><div class="kpi-value">${formatMoney(billingSnapshot?.totalPaid || 0)}</div></div>
          <div class="card"><div class="kpi-title">Pendiente actual</div><div class="kpi-value">${formatMoney(billingSnapshot?.pendingTotal || 0)}</div></div>
          <div class="card"><div class="kpi-title">Saldo a favor</div><div class="kpi-value">${formatMoney(billingSnapshot?.credit || 0)}</div></div>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Comentarios del perfil</h2>
          <div class="field">
            <label>Comentario general del paciente</label>
            <textarea id="patientProfileNotes" rows="3">${escapeHtml(profile.patient.notes || "")}</textarea>
          </div>
          <div style="margin-top:10px;"><button type="button" id="savePatientProfileNotes" class="primary" data-patient-id="${profile.patient.id}">Guardar comentario</button></div>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Estado de cobro por tratamiento</h2>
          <table><thead><tr><th>Fecha</th><th>Tratamiento</th><th>Pieza</th><th>Importe</th><th>Pendiente</th><th>Estado</th></tr></thead><tbody>${pendingLinesRows || `<tr><td colspan="6" class="helper">Todo pagado.</td></tr>`}</tbody></table>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Registrar pago</h2>
          <form id="patientPaymentForm" data-patient-id="${profile.patient.id}">
            <div class="row">
              <div class="field"><label>Importe</label><input name="amount" type="number" step="0.01" min="0" required /></div>
              <div class="field"><label>Metodo</label><select name="method"><option value="efectivo">efectivo</option><option value="tarjeta">tarjeta</option><option value="transferencia">transferencia</option></select></div>
              <div class="field"><label>Fecha</label><input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
              <div class="field"><label>Nota</label><input name="note" /></div>
            </div>
            <div style="margin-top:10px;"><button type="submit" class="primary">Guardar pago</button></div>
          </form>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Citas</h2>
          <table><thead><tr><th>Fecha</th><th>Motivo</th><th>Estado</th><th>Comentario</th><th></th></tr></thead><tbody>${profile.appointments
            .map(
              (item) => `<tr><td>${new Date(item.startAt).toLocaleString()}</td><td>${item.reason || "-"}</td><td>${item.status}</td><td><textarea class="appointment-note-input" data-appointment-id="${item.id}" rows="2">${escapeHtml(item.notes || "")}</textarea></td><td class="history-actions"><button type="button" class="save-appointment-note" data-appointment-id="${item.id}">Guardar</button><button type="button" class="start-treatment-from-appointment" data-appointment-id="${item.id}">Tratar</button></td></tr>`
            )
            .join("") || `<tr><td colspan="5" class="helper">Sin citas</td></tr>`}</tbody></table>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Presupuestos</h2>
          <table><thead><tr><th>Fecha</th><th>Lineas</th><th>Total</th><th>Usuario</th><th></th></tr></thead><tbody>${profile.budgets
            .map((item) => `<tr><td>${item.date}</td><td>${item.lines?.length || 0}</td><td>${formatMoney(item.total)}</td><td>${item.operatorName || "-"}</td><td><button type="button" class="print-treatment-record" data-record-id="${item.id}">Imprimir</button></td></tr>`)
            .join("") || `<tr><td colspan="5" class="helper">Sin presupuestos</td></tr>`}</tbody></table>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Tratamientos realizados</h2>
          <table><thead><tr><th>Fecha</th><th>Lineas</th><th>Total</th><th>Usuario</th></tr></thead><tbody>${profile.treatmentsDone
            .map((item) => `<tr><td>${item.date}</td><td>${item.lines?.length || 0}</td><td>${formatMoney(item.total)}</td><td>${item.operatorName || "-"}</td></tr>`)
            .join("") || `<tr><td colspan="4" class="helper">Sin tratamientos realizados</td></tr>`}</tbody></table>
        </div>

        <div class="panel" style="margin-top:12px;">
          <h2>Pagos</h2>
          <table><thead><tr><th>Fecha</th><th>Metodo</th><th>Importe</th><th>Nota</th></tr></thead><tbody>${profile.payments
            .map((item) => `<tr><td>${item.date}</td><td>${item.method}</td><td>${formatMoney(item.amount)}</td><td>${item.note || "-"}</td></tr>`)
            .join("") || `<tr><td colspan="4" class="helper">Sin pagos registrados</td></tr>`}</tbody></table>
        </div>
      </div>
    `
    : "";

  const patientsWindow = getModuleWindow("pacientes", "listado");

  return `
    <h2>Pacientes</h2>

    <div class="panel">
      <div class="toolbar module-windows-nav">
        <button type="button" class="module-window-btn ${patientsWindow === "alta" ? "active" : ""}" data-module-window="pacientes" data-window-key="alta">Alta rápida</button>
        <button type="button" class="module-window-btn ${patientsWindow === "listado" ? "active" : ""}" data-module-window="pacientes" data-window-key="listado">Listado</button>
        <button type="button" class="module-window-btn ${patientsWindow === "perfil" ? "active" : ""}" data-module-window="pacientes" data-window-key="perfil">Perfil activo</button>
      </div>
    </div>

    ${patientsWindow === "alta" ? `<div class="panel">
      <h2>Alta rapida</h2>
      <form id="patientForm">
        <div class="row">
          <div class="field"><label>Nombre</label><input name="firstName" required /></div>
          <div class="field"><label>Apellidos</label><input name="lastName" required /></div>
          <div class="field"><label>Telefono</label><input name="phone" required /></div>
          <div class="field"><label>Email</label><input name="email" type="email" /></div>
          <div class="field"><label>DNI/NIE</label><input name="documentId" /></div>
          <div class="field"><label>Fecha nacimiento</label><input name="birthDate" type="date" /></div>
        </div>
        <div class="field" style="margin-top:10px;"><label>Notas</label><textarea name="notes" rows="2"></textarea></div>
        <div style="margin-top:12px;"><button class="primary" type="submit">Guardar paciente</button></div>
      </form>
    </div>` : ""}

    ${patientsWindow === "listado" ? `<div class="panel">
      <h2>Listado</h2>
      <div class="toolbar" style="margin-bottom:8px;">
        <input id="patientSearch" placeholder="Buscar paciente por nombre, telefono o documento" value="${state.patientSearch}" />
        <span class="helper">${rows ? "" : ""}</span>
      </div>
      <table>
        <thead><tr><th>Nombre</th><th>Apellidos</th><th>Telefono</th><th>Email</th><th>Documento</th><th>Pendiente</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7" class="helper">Sin pacientes aun</td></tr>`}</tbody>
      </table>
      <p class="helper" style="margin-top:8px;">Edicion directa: cambia campos y pulsa Guardar por fila.</p>
    </div>` : ""}

    ${patientsWindow === "perfil" ? profileSection || `<div class="panel"><p class="helper">Abre un perfil desde el listado para verlo aquí.</p></div>` : ""}
  `;
}

function renderDoctores() {
  const todayKey = toDateKey(new Date());
  const appointmentsToday = state.appointments.filter((item) => String(item.startAt || "").startsWith(todayKey));
  const activeDoctors = state.doctors.filter((item) => item.active);

  const rows = state.doctors
    .map((doctor) => {
      const doctorAppointments = appointmentsToday.filter((item) => item.doctorName === doctor.name).length;
      return `<tr>
        <td><input class="doctor-name" data-id="${doctor.id}" value="${doctor.name}" /></td>
        <td><input class="doctor-specialty" data-id="${doctor.id}" value="${doctor.specialty || "General"}" /></td>
        <td><input class="doctor-phone" data-id="${doctor.id}" value="${doctor.phone || ""}" /></td>
        <td><input type="checkbox" class="doctor-active" data-id="${doctor.id}" ${doctor.active ? "checked" : ""} /></td>
        <td>${doctorAppointments}</td>
        <td>
          <button type="button" class="save-doctor" data-id="${doctor.id}">Guardar</button>
          <button type="button" class="doctor-go-agenda" data-doctor-name="${doctor.name}">Ver agenda</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <h2>Doctores</h2>

    <div class="grid" style="margin-bottom:10px;">
      <div class="card"><div class="kpi-title">Doctores activos</div><div class="kpi-value">${activeDoctors.length}</div></div>
      <div class="card"><div class="kpi-title">Doctores totales</div><div class="kpi-value">${state.doctors.length}</div></div>
      <div class="card"><div class="kpi-title">Citas hoy</div><div class="kpi-value">${appointmentsToday.length}</div></div>
    </div>

    <div class="panel">
      <h2>Alta rapida de doctor</h2>
      <form id="doctorForm">
        <div class="row">
          <div class="field"><label>Nombre</label><input name="name" required placeholder="Dr. Garcia" /></div>
          <div class="field"><label>Especialidad</label><input name="specialty" placeholder="Implantologia" /></div>
          <div class="field"><label>Telefono</label><input name="phone" placeholder="600123123" /></div>
          <div class="field"><label>Activo</label><select name="active"><option value="true">Si</option><option value="false">No</option></select></div>
        </div>
        <div style="margin-top:10px;"><button type="submit" class="primary">Guardar doctor</button></div>
      </form>
    </div>

    <div class="panel">
      <h2>Listado editable</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Especialidad</th><th>Telefono</th><th>Activo</th><th>Citas hoy</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" class="helper">Sin doctores aun</td></tr>`}</tbody>
      </table>
      <p class="helper" style="margin-top:8px;">Edicion directa para evitar pantallas extra.</p>
    </div>
  `;
}

function buildHistoryRows() {
  const doctorLocked = normalizeWorkflowRole(state.workflow.role) === "doctor" && state.workflow.doctorName ? state.workflow.doctorName : "";
  const appointmentRows = state.appointments.map((item) => ({
    dateKey: String(item.startAt || "").slice(0, 10),
    dateTime: item.startAt,
    type: "appointment",
    patientId: item.patientId || "",
    patientName: item.patientName || "Paciente",
    doctorName: item.doctorName || "Sin asignar",
    status: item.status || "scheduled",
    amount: null,
    detail: item.reason || "Consulta",
    sourceId: item.id
  }));

  const treatmentRows = state.treatmentRecords.map((item) => ({
    dateKey: String(item.date || "").slice(0, 10),
    dateTime: `${String(item.date || "").slice(0, 10)}T12:00:00`,
    type: "treatment",
    patientId: item.patientId || "",
    patientName: item.patientName || "Paciente",
    doctorName: item.operatorName || "Sin asignar",
    status: item.type === "done" ? "realizado" : "presupuesto",
    amount: Number(item.total || 0),
    detail: `${item.lines?.length || 0} linea/s`,
    sourceId: item.id
  }));

  const paymentRows = state.payments.map((item) => ({
    dateKey: String(item.date || "").slice(0, 10),
    dateTime: `${String(item.date || "").slice(0, 10)}T12:00:00`,
    type: "payment",
    patientId: item.patientId || "",
    patientName: item.patientName || "Paciente",
    doctorName: "-",
    status: item.method || "pago",
    amount: Number(item.amount || 0),
    detail: item.note || "Pago registrado",
    sourceId: item.id
  }));

  const rows = [...appointmentRows, ...treatmentRows, ...paymentRows].sort((a, b) => String(b.dateTime || "").localeCompare(String(a.dateTime || "")));
  const filters = state.history;
  const normalizedSearch = normalizeText(filters.search || "");

  return rows.filter((row) => {
    if (doctorLocked && row.doctorName !== doctorLocked) return false;
    if (filters.type !== "all" && row.type !== filters.type) return false;
    if (filters.doctor !== "all" && row.doctorName !== filters.doctor) return false;
    if (filters.patientId !== "all" && row.patientId !== filters.patientId) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.from && row.dateKey < filters.from) return false;
    if (filters.to && row.dateKey > filters.to) return false;

    if (!normalizedSearch) return true;
    const haystack = normalizeText(`${row.patientName} ${row.doctorName} ${row.detail} ${row.status}`);
    return haystack.includes(normalizedSearch);
  });
}

function getFilteredHistoryRows() {
  const filtersKey = `${state.history.search}|${state.history.type}|${state.history.doctor}|${state.history.patientId}|${state.history.status}|${state.history.from}|${state.history.to}`;
  const dataKey = `${state.appointments.length}|${state.treatmentRecords.length}|${state.payments.length}`;
  const cacheKey = `${filtersKey}|${dataKey}`;

  if (state.history.cacheKey === cacheKey && Array.isArray(state.history.cachedRows)) {
    return state.history.cachedRows;
  }

  const rows = buildHistoryRows();
  state.history.cacheKey = cacheKey;
  state.history.cachedRows = rows;
  return rows;
}

function renderHistorial() {
  const doctorLocked = normalizeWorkflowRole(state.workflow.role) === "doctor" && state.workflow.doctorName ? state.workflow.doctorName : "";
  const rows = getFilteredHistoryRows();
  const doctorNames = getDoctorNames({ includeInactive: true, includeUnassigned: true, includeTreatmentOperators: true });
  const statuses = [...new Set(rows.map((item) => item.status).filter(Boolean).sort((a, b) => a.localeCompare(b)))];
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const historyPatient = state.patients.find((item) => item.id === state.history.patientId);
  const historyPatientValue = state.history.patientId !== "all" && historyPatient ? patientPickerLabel(historyPatient) : "";
  const historyDoctorValue = state.history.doctor === "all" ? "" : state.history.doctor;
  const historyDoctorOptions = doctorNames.map((name) => `<option value="${escapeHtml(name)}" data-value-id="${escapeHtml(name)}"></option>`).join("");
  const historyPatientOptions = buildPatientDatalistOptions();

  const rowsMarkup = rows
    .slice(0, 500)
    .map((row) => {
      const typeLabel = row.type === "appointment" ? "Cita" : row.type === "treatment" ? "Tratamiento" : "Pago";
      const quickActions = [
        row.type === "appointment"
          ? `<button type="button" class="history-repeat-appointment" data-appointment-id="${row.sourceId}">Repetir +7d</button>`
          : "",
        row.type === "appointment"
          ? `<button type="button" class="history-open-appointment" data-appointment-id="${row.sourceId}">Abrir en agenda</button>`
          : "",
        row.type === "treatment"
          ? `<button type="button" class="history-reuse-record" data-record-id="${row.sourceId}">Usar en tratamientos</button>`
          : "",
        row.type === "treatment" && row.status === "presupuesto"
          ? `<button type="button" class="print-treatment-record" data-record-id="${row.sourceId}">Imprimir presupuesto</button>`
          : "",
        row.patientId ? `<button type="button" class="history-quick-payment" data-patient-id="${row.patientId}">Cobro</button>` : "",
        row.patientId ? `<button type="button" class="open-history-patient" data-patient-id="${row.patientId}">Perfil</button>` : ""
      ]
        .filter(Boolean)
        .join("");

      return `<tr>
        <td>${row.dateKey || "-"}</td>
        <td><span class="badge">${typeLabel}</span></td>
        <td>${row.patientName}</td>
        <td>${row.doctorName}</td>
        <td>${row.status}</td>
        <td>${row.amount == null ? "-" : formatMoney(row.amount)}</td>
        <td>${row.detail || "-"}</td>
        <td class="history-actions">${quickActions || "-"}</td>
      </tr>`;
    })
    .join("");

  return `
    <h2>Historial operativo</h2>

    <div class="panel history-filters-panel">
      <div class="row history-filters-row">
        <div class="field"><label>Buscar</label><input id="historySearch" value="${state.history.search}" placeholder="Paciente, doctor, motivo..." /></div>
        <div class="field"><label>Tipo</label><select id="historyType"><option value="all" ${state.history.type === "all" ? "selected" : ""}>Todos</option><option value="appointment" ${state.history.type === "appointment" ? "selected" : ""}>Citas</option><option value="treatment" ${state.history.type === "treatment" ? "selected" : ""}>Tratamientos</option><option value="payment" ${state.history.type === "payment" ? "selected" : ""}>Pagos</option></select></div>
        <div class="field"><label>Doctor</label><input id="historyDoctorSearch" list="historyDoctorOptions" value="${escapeHtml(doctorLocked || historyDoctorValue)}" placeholder="Todos los doctores" ${doctorLocked ? "disabled" : ""} /><datalist id="historyDoctorOptions">${historyDoctorOptions}</datalist></div>
        <div class="field"><label>Paciente</label><input id="historyPatientSearch" list="historyPatientOptions" value="${escapeHtml(historyPatientValue)}" placeholder="Todos los pacientes" /><datalist id="historyPatientOptions">${historyPatientOptions}</datalist></div>
        <div class="field"><label>Estado/metodo</label><select id="historyStatus"><option value="all">Todos</option>${statuses
          .map((value) => `<option value="${value}" ${state.history.status === value ? "selected" : ""}>${value}</option>`)
          .join("")}</select></div>
        <div class="field"><label>Desde</label><input type="date" id="historyFrom" value="${state.history.from}" /></div>
        <div class="field"><label>Hasta</label><input type="date" id="historyTo" value="${state.history.to}" /></div>
      </div>
      <div class="toolbar" style="margin-top:10px;">
        <button type="button" class="history-range" data-days="0">Hoy</button>
        <button type="button" class="history-range" data-days="7">7 dias</button>
        <button type="button" class="history-range" data-days="30">30 dias</button>
        <button type="button" id="historyResetFilters">Reset</button>
        <button type="button" class="primary" id="exportHistoryCsv">Exportar CSV</button>
      </div>
    </div>

    <div class="grid history-kpis-grid">
      <div class="card"><div class="kpi-title">Movimientos visibles</div><div class="kpi-value">${rows.length}</div></div>
      <div class="card"><div class="kpi-title">Importe total visible</div><div class="kpi-value">${formatMoney(totalAmount)}</div></div>
    </div>

    <div class="panel history-table-panel">
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Paciente</th><th>Doctor</th><th>Estado</th><th>Importe</th><th>Detalle</th><th></th></tr></thead>
        <tbody>${rowsMarkup || `<tr><td colspan="8" class="helper">Sin movimientos con estos filtros</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function renderAgenda() {
  const currentDate = fromDateKey(state.agenda.currentDate);
  const currentView = state.agenda.view;
  const doctorLocked = normalizeWorkflowRole(state.workflow.role) === "doctor" && state.workflow.doctorName ? state.workflow.doctorName : "";
  const doctorFilter = doctorLocked || state.agenda.doctorFilter || "all";
  const slotIntervalMin = Number(state.agenda.slotIntervalMin || 60);
  const quickAdd = state.agenda.quickAdd;

  const doctorNames = getDoctorNames({ includeUnassigned: true });

  const filteredAppointments =
    doctorFilter === "all"
      ? state.appointments
      : state.appointments.filter((item) => (item.doctorName || "Sin asignar") === doctorFilter);

  const patientOptions = buildPatientDatalistOptions();
  const quickDoctorOptions = doctorNames.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
  const quickPatient = state.patients.find((item) => item.id === quickAdd.selectedPatientId) || null;
  const quickPatientValue = quickPatient ? patientPickerLabel(quickPatient) : "";
  const agendaPatient = state.patients.find((item) => item.id === state.agenda.quickAdd.selectedPatientId) || null;

  const selectedDateTime =
    state.agenda.selectedDateTime || `${state.agenda.currentDate}T09:00`;

  const slots = getTimeSlots(slotIntervalMin);

  const getAppointmentsForDate = (dateKey) =>
    filteredAppointments.filter((item) => String(item.startAt || "").startsWith(dateKey));

  const renderMonthView = () => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);

    const dayHeaders = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
      .map((name) => `<th>${name}</th>`)
      .join("");

    const weeks = [];
    for (let week = 0; week < 6; week += 1) {
      const cells = [];
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + week * 7 + day);
        const dateKey = toDateKey(date);
        const appointments = getAppointmentsForDate(dateKey);
        const inMonth = date.getMonth() === currentDate.getMonth();
        cells.push(`
          <td class="calendar-month-cell ${inMonth ? "" : "muted"}">
            <button type="button" class="month-day-btn" data-date="${dateKey}">
              <div class="month-day-number">${date.getDate()}</div>
              <div class="month-day-meta">${appointments.length} cita(s)</div>
            </button>
          </td>
        `);
      }
      weeks.push(`<tr>${cells.join("")}</tr>`);
    }

    return `
      <div class="panel">
        <table class="calendar-month-table">
          <thead><tr>${dayHeaders}</tr></thead>
          <tbody>${weeks.join("")}</tbody>
        </table>
      </div>
    `;
  };

  const renderWeekOrDayView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = currentView === "day" ? [currentDate] : Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });

    const agendaWindow = getAgendaWindowForDays(days);
    if (!agendaWindow) {
      return `<div class="panel"><p class="helper">No hay horario configurado para los dias visibles. Ajusta el horario semanal.</p></div>`;
    }

    const slots = getTimeSlots(slotIntervalMin, agendaWindow.startMin, agendaWindow.endMin);

    const headerCells = days
      .map((day) => `<th>${formatDateLabel(day)}</th>`)
      .join("");

    const body = slots
      .map((slot) => {
        const rowCells = days
          .map((day) => {
            const slotDate = new Date(day);
            slotDate.setHours(slot.hour, slot.minute, 0, 0);
            const slotKey = toDateTimeKey(slotDate);
            const daySchedule = getDayScheduleForDate(day);
            const slotMinute = slot.hour * 60 + slot.minute;
            const isAvailable = dayHasAvailability(daySchedule, slotMinute);
            const appointments = filteredAppointments.filter(
              (item) => appointmentDateTimeKey(item) === slotKey
            );

            return `
              <td>
                <div class="agenda-slot ${isAvailable ? "" : "unavailable"}" data-datetime="${slotKey}" data-available="${isAvailable}">
                  ${appointments
                    .map(
                      (item) => {
                        const urgentPrefix = normalizeText(item.reason || "").includes("urgenc") ? "⚠ " : "";
                        return `<button type="button" class="agenda-event" data-appointment-id="${item.id}">${urgentPrefix}${item.patientName} · ${item.doctorName || "Sin asignar"} (${item.durationMin}m)</button>`;
                      }
                    )
                    .join("")}
                </div>
              </td>
            `;
          })
          .join("");

        return `<tr><th class="time-col">${slot.label}</th>${rowCells}</tr>`;
      })
      .join("");

    return `
      <div class="panel">
        <div class="calendar-time-wrap">
          <table class="calendar-time-table ${slotIntervalMin === 10 ? "dense" : ""}">
            <thead><tr><th class="time-col"></th>${headerCells}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
    `;
  };

  const periodStart =
    currentView === "month"
      ? toDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
      : currentView === "week"
      ? toDateKey(startOfWeek(currentDate))
      : toDateKey(currentDate);

  const periodEnd =
    currentView === "month"
      ? toDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
      : currentView === "week"
      ? (() => {
          const d = startOfWeek(currentDate);
          d.setDate(d.getDate() + 6);
          return toDateKey(d);
        })()
      : toDateKey(currentDate);

  const visibleRows = filteredAppointments
    .filter((item) => {
      const key = String(item.startAt || "").slice(0, 10);
      return key >= periodStart && key <= periodEnd;
    })
    .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)))
    .map(
      (a) => `<tr>
        <td><input type="datetime-local" class="agenda-row-start" data-appointment-id="${a.id}" value="${appointmentDateTimeKey(a)}" /></td>
        <td>${a.patientName}</td>
        <td><input class="agenda-row-doctor" data-appointment-id="${a.id}" value="${escapeHtml(a.doctorName || "")}" placeholder="Sin asignar" /></td>
        <td><input class="agenda-row-reason" data-appointment-id="${a.id}" value="${escapeHtml(a.reason || "")}" /></td>
        <td><input class="agenda-row-notes" data-appointment-id="${a.id}" value="${escapeHtml(a.notes || "")}" /></td>
        <td><select data-appointment-id="${a.id}" class="agenda-row-status">${appointmentStatuses
          .map((s) => `<option value="${s}" ${s === a.status ? "selected" : ""}>${s}</option>`)
          .join("")}</select></td>
        <td class="history-actions"><button type="button" class="save-appointment-inline" data-appointment-id="${a.id}">Guardar</button><button type="button" class="agenda-open-treatment" data-appointment-id="${a.id}">Tratar</button><button type="button" class="open-history-patient" data-patient-id="${a.patientId || ""}">Perfil</button></td>
      </tr>`
    )
    .join("");

  const calendarContent = currentView === "month" ? renderMonthView() : renderWeekOrDayView();

  const quickAddModal = quickAdd.open
    ? `
      <div class="modal-backdrop" id="quickModalBackdrop">
        <div class="modal-card">
          <h3>${quickAdd.isUrgent ? "Nueva urgencia" : "Nueva cita rapida"}</h3>
          <form id="quickAppointmentForm">
            <div class="field">
              <label>Fecha y hora</label>
              <input name="startAt" type="datetime-local" value="${quickAdd.dateTime}" ${quickAdd.isUrgent ? "" : "readonly"} />
            </div>

            <div class="field">
              <label><input id="quickUrgentToggle" type="checkbox" ${quickAdd.isUrgent ? "checked" : ""} /> Marcar como urgencia</label>
            </div>

            <div class="field">
              <label>Paciente</label>
              <input id="quickPatientInput" list="quickPatientList" value="${escapeHtml(quickPatientValue)}" placeholder="Buscar y seleccionar paciente" required />
              <input id="quickPatientId" type="hidden" name="patientId" value="${quickAdd.selectedPatientId || ""}" />
              <datalist id="quickPatientList">${patientOptions}</datalist>
            </div>

            <div class="field">
              <label>Doctor</label>
              <input id="quickDoctorInput" name="doctorName" list="quickDoctorList" value="${escapeHtml(quickAdd.doctorName || "")}" placeholder="Buscar doctor o escribir" />
              <datalist id="quickDoctorList">${quickDoctorOptions}</datalist>
            </div>

            <div class="field">
              <label>Duracion (min)</label>
              <input name="durationMin" type="number" min="10" value="${quickAdd.durationMin || 30}" />
            </div>
            <div class="field">
              <label>Motivo</label>
              <input name="reason" value="${quickAdd.reason || ""}" />
            </div>
            <div class="field">
              <label>Comentario</label>
              <textarea name="notes" rows="2">${escapeHtml(quickAdd.notes || "")}</textarea>
            </div>

            <div class="toolbar" style="margin-top:12px; justify-content:flex-end;">
              <button type="button" id="quickCancelBtn">Cancelar</button>
              <button type="submit" class="primary">Guardar cita</button>
            </div>
          </form>
        </div>
      </div>
    `
    : "";
  const agendaWindow = getModuleWindow("agenda", "calendar");

  return `
    <h2>Agenda</h2>

    <div class="panel">
      <div class="toolbar" style="justify-content: space-between;">
        <div class="toolbar">
          <button type="button" id="agendaPrevBtn">&lt;</button>
          <button type="button" id="agendaTodayBtn">Hoy</button>
          <button type="button" id="agendaNextBtn">&gt;</button>
          <strong>${currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</strong>
        </div>
        <div class="toolbar">
          <button type="button" class="agenda-view-btn ${currentView === "month" ? "active" : ""}" data-view="month">Mes</button>
          <button type="button" class="agenda-view-btn ${currentView === "week" ? "active" : ""}" data-view="week">Semana</button>
          <button type="button" class="agenda-view-btn ${currentView === "day" ? "active" : ""}" data-view="day">Dia</button>
          <select id="agendaDoctorFilter" ${doctorLocked ? "disabled" : ""}>
            ${doctorLocked
              ? `<option value="${doctorLocked}" selected>${doctorLocked}</option>`
              : `<option value="all" ${doctorFilter === "all" ? "selected" : ""}>Todos los doctores</option>${doctorNames
                  .map((name) => `<option value="${name}" ${doctorFilter === name ? "selected" : ""}>${name}</option>`)
                  .join("")}`}
          </select>
          <button type="button" id="agendaQuickUrgencyBtn">+ Urgencia</button>
        </div>
      </div>
      <p class="helper">Vista operativa de agenda. Intervalo y horario semanal se configuran desde Ajustes > Agenda.</p>
    </div>

    <div class="panel">
      <div class="toolbar module-windows-nav">
        <button type="button" class="module-window-btn ${agendaWindow === "calendar" ? "active" : ""}" data-module-window="agenda" data-window-key="calendar">Calendario</button>
        <button type="button" class="module-window-btn ${agendaWindow === "new" ? "active" : ""}" data-module-window="agenda" data-window-key="new">Nueva cita</button>
        <button type="button" class="module-window-btn ${agendaWindow === "list" ? "active" : ""}" data-module-window="agenda" data-window-key="list">Citas visibles</button>
      </div>
    </div>

    ${agendaWindow === "calendar" ? calendarContent : ""}

    ${agendaWindow === "new" ? `<div class="panel">
      <h2>Nueva cita</h2>
      <form id="appointmentForm">
        <datalist id="agendaDoctorList">${doctorNames.map((name) => `<option value="${name}"></option>`).join("")}</datalist>
        <datalist id="agendaPatientList">${patientOptions}</datalist>
        <div class="row">
          <div class="field"><label>Paciente</label><input id="agendaPatientInput" list="agendaPatientList" value="${escapeHtml(agendaPatient ? patientPickerLabel(agendaPatient) : "")}" placeholder="Buscar y seleccionar paciente" required /><input id="agendaPatientId" name="patientId" type="hidden" value="${agendaPatient?.id || ""}" /></div>
          <div class="field"><label>Doctor</label><input name="doctorName" list="agendaDoctorList" value="${doctorFilter !== "all" ? doctorFilter : ""}" placeholder="Ej: Dr. Garcia" /></div>
          <div class="field"><label>Fecha y hora</label><input type="datetime-local" name="startAt" value="${selectedDateTime}" required /></div>
          <div class="field"><label>Duracion (min)</label><input name="durationMin" type="number" value="30" min="10" /></div>
          <div class="field"><label>Box</label><input name="box" value="General" /></div>
          <div class="field"><label>Motivo</label><input name="reason" /></div>
          <div class="field"><label>Comentario</label><input name="notes" /></div>
          <div class="field"><label>Estado</label><select name="status">${appointmentStatuses.map((s) => `<option value="${s}">${s}</option>`).join("")}</select></div>
        </div>
        <div style="margin-top:12px;"><button class="primary" type="submit">Guardar cita</button></div>
      </form>
    </div>` : ""}

    ${agendaWindow === "list" ? `<div class="panel">
      <h2>Citas visibles (${periodStart} a ${periodEnd})</h2>
      <table>
        <thead><tr><th>Fecha y hora</th><th>Paciente</th><th>Doctor</th><th>Motivo</th><th>Comentario</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${visibleRows || `<tr><td colspan="7" class="helper">Sin citas en este periodo</td></tr>`}</tbody>
      </table>
      <p class="helper" style="margin-top:8px;">Edicion rapida: ajusta fecha, doctor, motivo, comentario o estado y pulsa Guardar.</p>
    </div>` : ""}

    ${quickAddModal}
  `;
}

function renderOdontogramArch(left, right) {
  const renderTooth = (toothCode) => {
    const affected = state.treatmentDraft.lines.some((line) => lineAffectsTooth(line, toothCode));
    return `<button type="button" class="tooth ${affected ? "active" : ""} ${state.treatmentDraft.selectedTooth === toothCode ? "selected" : ""}" data-tooth="${toothCode}">${toothCode}</button>`;
  };
  return `<div class="arch">${left.map(renderTooth).join("")}<span class="arch-gap"></span>${right.map(renderTooth).join("")}</div>`;
}

function renderTreatmentRows() {
  if (state.treatmentDraft.lines.length === 0) {
    return `<tr><td colspan="11" class="helper">Sin lineas aun. Puedes usar voz, odontograma o añadir manual.</td></tr>`;
  }

  return state.treatmentDraft.lines
    .map(
      (line, index) => `<tr>
      <td><span class="treatment-chip" style="--treatment-color:${normalizeTreatmentColorHex(line.colorHex)}"><span class="treatment-chip-icon">${treatmentIcon(line.iconKey)}</span><span>${line.treatmentName}</span></span></td>
      <td><input type="number" min="1" class="line-qty" data-line-index="${index}" value="${line.quantity}" /></td>
      <td><input type="text" class="line-tooth" data-line-index="${index}" value="${line.toothCode || ""}" placeholder="21, +, -, 11-13" /></td>
      <td>${formatMoney(line.unitPrice)}</td>
      <td>${formatMoney(Number(line.unitPrice) * Number(line.quantity))}</td>
      <td>${line.note || "-"}</td>
      <td><input type="checkbox" class="line-lab-work" data-line-index="${index}" ${line.isLabWork ? "checked" : ""} /></td>
      <td><input class="line-lab-name" data-line-index="${index}" value="${line.labName || ""}" placeholder="Laboratorio" /></td>
      <td><input type="number" min="0" step="0.01" class="line-lab-cost" data-line-index="${index}" value="${Number(line.labCost || 0)}" /></td>
      <td><select class="line-lab-status" data-line-index="${index}"><option value="pending" ${line.labStatus !== "delivered" ? "selected" : ""}>pendiente</option><option value="delivered" ${line.labStatus === "delivered" ? "selected" : ""}>entregado</option></select></td>
      <td><button type="button" class="line-delete" data-line-index="${index}">Eliminar</button></td>
    </tr>`
    )
    .join("");
}

function renderTrabajosLab() {
  const labRows = state.treatmentRecords
    .flatMap((record) =>
      (record.lines || []).map((line, lineIndex) => ({
        recordId: record.id,
        lineIndex,
        date: record.date,
        patientName: record.patientName,
        treatmentName: line.treatmentName,
        quantity: Number(line.quantity || 0),
        lineTotal: Number(line.lineTotal || 0),
        isLabWork: line.isLabWork == null ? isLabTreatmentName(line.treatmentName) : Boolean(line.isLabWork),
        labName: line.labName || "",
        labCost: Number(line.labCost || 0),
        labStatus: line.labStatus === "delivered" ? "delivered" : "pending"
      }))
    )
    .filter((line) => line.isLabWork || isLabTreatmentName(line.treatmentName))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const pending = labRows.filter((item) => item.labStatus !== "delivered");
  const totalSell = labRows.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  const totalLabCost = labRows.reduce((sum, item) => sum + Number(item.labCost || 0) * Math.max(1, Number(item.quantity || 1)), 0);

  const rowsMarkup = labRows
    .map(
      (item) => `<tr>
        <td>${item.date || "-"}</td>
        <td>${item.patientName || "-"}</td>
        <td>${item.treatmentName || "-"}</td>
        <td>${item.quantity}</td>
        <td>${formatMoney(item.lineTotal)}</td>
        <td><input type="checkbox" class="lab-row-is-lab" data-record-id="${item.recordId}" data-line-index="${item.lineIndex}" ${item.isLabWork ? "checked" : ""} /></td>
        <td><input class="lab-row-lab-name" data-record-id="${item.recordId}" data-line-index="${item.lineIndex}" value="${item.labName}" placeholder="Laboratorio" /></td>
        <td><input type="number" min="0" step="0.01" class="lab-row-lab-cost" data-record-id="${item.recordId}" data-line-index="${item.lineIndex}" value="${item.labCost}" /></td>
        <td>${formatMoney(Number(item.labCost || 0) * Math.max(1, Number(item.quantity || 1)))}</td>
        <td><select class="lab-row-status" data-record-id="${item.recordId}" data-line-index="${item.lineIndex}"><option value="pending" ${item.labStatus !== "delivered" ? "selected" : ""}>pendiente</option><option value="delivered" ${item.labStatus === "delivered" ? "selected" : ""}>entregado</option></select></td>
        <td><button type="button" class="save-lab-job" data-record-id="${item.recordId}" data-line-index="${item.lineIndex}">Guardar</button></td>
      </tr>`
    )
    .join("");

  return `
    <h2>Trabajos de laboratorio</h2>

    <div class="grid">
      <div class="card"><div class="kpi-title">Trabajos lab detectados</div><div class="kpi-value">${labRows.length}</div></div>
      <div class="card"><div class="kpi-title">Pendientes</div><div class="kpi-value">${pending.length}</div></div>
      <div class="card"><div class="kpi-title">Total presupuestado/pacientes</div><div class="kpi-value">${formatMoney(totalSell)}</div></div>
      <div class="card"><div class="kpi-title">A pagar a laboratorio</div><div class="kpi-value">${formatMoney(totalLabCost)}</div></div>
    </div>

    <div class="panel">
      <h2>Gestion de trabajos (editable)</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Paciente</th><th>Tratamiento</th><th>Cant.</th><th>Importe paciente</th><th>Lab</th><th>Laboratorio</th><th>Coste/u</th><th>Coste total lab</th><th>Estado</th><th></th></tr></thead>
        <tbody>${rowsMarkup || `<tr><td colspan="11" class="helper">Sin trabajos de laboratorio detectados</td></tr>`}</tbody>
      </table>
      <p class="helper" style="margin-top:8px;">Puedes modificar laboratorio, coste y estado cuando quieras.</p>
    </div>
  `;
}

function renderParsedPreview() {
  if (state.parsedPreview.length === 0) return "";
  const treatmentOptions = state.treatments.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
  return `
    <div class="panel">
      <h2>Previsualizacion del dictado</h2>
      <table>
        <thead><tr><th>Tratamiento</th><th>Cant.</th><th>Pieza</th><th>Precio</th><th></th></tr></thead>
        <tbody>
          ${state.parsedPreview
            .map(
              (line, index) => `<tr>
                <td><select class="preview-treatment" data-preview-index="${index}">${treatmentOptions}</select></td>
                <td><input type="number" min="1" class="preview-qty" data-preview-index="${index}" value="${line.quantity}" /></td>
                <td><input type="text" class="preview-tooth" data-preview-index="${index}" value="${line.toothCode || ""}" /></td>
                <td>${formatMoney(line.unitPrice)}</td>
                <td><button type="button" class="preview-delete" data-preview-index="${index}">Quitar</button></td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <div class="toolbar" style="margin-top:10px;">
        <button type="button" class="primary" id="applyParsedBtn">Aplicar lineas detectadas</button>
        <button type="button" id="clearParsedBtn">Descartar</button>
      </div>
    </div>
  `;
}

function renderTratamientos() {
  const patientOptions = state.patients.map((item) => `<option value="${escapeHtml(patientPickerLabel(item))}" data-value-id="${item.id}"></option>`).join("");
  const treatmentOptions = state.treatments
    .map(
      (item) =>
        `<option value="${escapeHtml(`${treatmentIcon(item.iconKey)} ${item.name} (${formatMoney(item.price)})`)}" data-value-id="${item.id}"></option>`
    )
    .join("");
  const selectedDraftPatient = state.patients.find((item) => item.id === state.treatmentDraft.patientId) || null;
  const selectedTreatment = state.treatments.find((item) => item.id === state.treatmentDraft.selectedTreatmentId) || null;
  const records = state.treatmentRecords
    .slice(0, 8)
    .map(
      (record) => `<tr><td>${record.type === "budget" ? "Presupuesto" : "Realizado"}</td><td>${record.patientName}</td><td>${record.date}</td><td>${record.lines.length}</td><td>${formatMoney(record.total)}</td><td>${record.source}</td><td><button type="button" class="reuse-treatment-record" data-record-id="${record.id}">Usar plantilla</button> <button type="button" class="print-treatment-record" data-record-id="${record.id}">Imprimir</button></td></tr>`
    )
    .join("");
  const catalogFiltered = state.treatments
    .filter((item) => normalizeText(item.name).includes(normalizeText(state.treatmentCatalogSearch)))
    .slice(0, 25);
  const quickTreatments = catalogFiltered.slice(0, 8);
  const selectedPatient = getSelectedPatient();
  const treatmentWindow = getModuleWindow("tratamientos", "draft");
  const quickStats = `
    <div class="grid" style="margin-bottom: 10px;">
      <div class="card"><div class="kpi-title">Paciente activo</div><div class="kpi-value" style="font-size:1rem;">${selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Sin seleccionar"}</div></div>
      <div class="card"><div class="kpi-title">Lineas actuales</div><div class="kpi-value">${state.treatmentDraft.lines.length}</div></div>
      <div class="card"><div class="kpi-title">Total actual</div><div class="kpi-value">${formatMoney(computeDraftTotal())}</div></div>
      <div class="card"><div class="kpi-title">Catalogo PresDent</div><div class="kpi-value">${state.treatments.length}</div></div>
    </div>
  `;

  return `
    <h2>Tratamientos (voz + odontograma)</h2>

    <div class="panel">
      <div class="toolbar module-windows-nav">
        <button type="button" class="module-window-btn ${treatmentWindow === "draft" ? "active" : ""}" data-module-window="tratamientos" data-window-key="draft">Cabecera y líneas</button>
        <button type="button" class="module-window-btn ${treatmentWindow === "catalogo" ? "active" : ""}" data-module-window="tratamientos" data-window-key="catalogo">Catálogo</button>
        <button type="button" class="module-window-btn ${treatmentWindow === "clinico" ? "active" : ""}" data-module-window="tratamientos" data-window-key="clinico">Voz y odontograma</button>
        <button type="button" class="module-window-btn ${treatmentWindow === "registros" ? "active" : ""}" data-module-window="tratamientos" data-window-key="registros">Últimos registros</button>
      </div>
    </div>

    ${quickStats}

    ${treatmentWindow === "draft" ? `<div class="panel">
      <h2>Cabecera</h2>
      <div class="row">
        <div class="field"><label>Paciente</label><input id="recordPatientInput" list="recordPatientList" value="${escapeHtml(selectedDraftPatient ? patientPickerLabel(selectedDraftPatient) : "")}" placeholder="Buscar y seleccionar paciente" /><input id="recordPatientId" type="hidden" value="${state.treatmentDraft.patientId || ""}" /><datalist id="recordPatientList">${patientOptions}</datalist></div>
        <div class="field"><label>Usuario que registra</label><input id="recordOperatorName" value="${state.treatmentDraft.operatorName}" /></div>
        <div class="field"><label>Tipo de registro</label><select id="recordType"><option value="budget" ${state.treatmentDraft.type === "budget" ? "selected" : ""}>Presupuesto</option><option value="done" ${state.treatmentDraft.type === "done" ? "selected" : ""}>Tratamiento realizado</option></select></div>
        <div class="field"><label>Fecha</label><input type="date" id="recordDate" value="${state.treatmentDraft.date}" /></div>
        <div class="field"><label>Notas</label><input id="recordNotes" value="${state.treatmentDraft.notes || ""}" /></div>
      </div>
      <p class="helper" style="margin-top:8px;">Flujo rapido: desde Agenda pulsa Tratar y entra con paciente + contexto de cita, listo para voz y guardar.</p>
    </div>` : ""}

    ${treatmentWindow === "catalogo" ? `<div class="panel">
      <h2>Catalogo de tratamientos y precios (PresDent 2.0)</h2>
      <div class="toolbar" style="margin-bottom:10px;">
        ${quickTreatments
          .map(
            (item) =>
              `<button type="button" class="quick-add-treatment" data-treatment-id="${item.id}" title="${item.name}" style="--treatment-color:${normalizeTreatmentColorHex(item.colorHex)}"><span class="quick-treatment-icon">${treatmentIcon(item.iconKey)}</span>${item.name}</button>`
          )
          .join("")}
      </div>
      <div class="toolbar">
        <input id="treatmentCatalogSearch" placeholder="Buscar tratamiento..." value="${state.treatmentCatalogSearch}" style="min-width: 280px;" />
        <span class="helper">Atajos visibles: ${quickTreatments.length} · Catalogo completo en Ajustes > Tratamientos</span>
      </div>
      <p class="helper" style="margin-top:8px;">Vista previa activa de icono+color. La administración masiva del catálogo se hace desde Ajustes.</p>
    </div>` : ""}

    ${treatmentWindow === "clinico" ? `<div class="panel">
      <h2>Dictado por voz</h2>
      <div class="toolbar">
        <button type="button" class="primary" id="startVoiceBtn" ${!state.voice.recognitionReady ? "disabled" : ""}>Iniciar grabacion</button>
        <button type="button" id="stopVoiceBtn" ${!state.voice.listening ? "disabled" : ""}>Pausar</button>
        <button type="button" id="processVoiceBtn" ${!state.voice.transcript.trim() ? "disabled" : ""}>Procesar texto</button>
        <span class="helper">${state.voice.recognitionReady ? (state.voice.listening ? "Grabando..." : "Listo para dictado") : state.voice.unsupportedReason}</span>
      </div>
      <div class="field" style="margin-top:8px;">
        <label>Transcripcion</label>
        <textarea id="voiceTranscript" rows="3">${state.voice.transcript}</textarea>
      </div>
      <p class="helper">Modelo copiado de PresDent 2.0: dictado -> parser -> previsualizacion editable -> aplicar lineas.</p>
    </div>` : ""}

    ${treatmentWindow === "clinico" ? renderParsedPreview() : ""}

    ${treatmentWindow === "clinico" ? `<div class="panel">
      <h2>Odontograma interactivo</h2>
      <div class="odontogram">
        ${renderOdontogramArch(teethTopRight, teethTopLeft)}
        ${renderOdontogramArch(teethBottomLeft, teethBottomRight)}
      </div>
      <div class="toolbar" style="margin-top:10px;">
        <input id="odontogramTreatmentInput" list="odontogramTreatmentList" value="${escapeHtml(selectedTreatment ? `${treatmentIcon(selectedTreatment.iconKey)} ${selectedTreatment.name} (${formatMoney(selectedTreatment.price)})` : "")}" placeholder="Buscar tratamiento" />
        <input id="odontogramTreatmentId" type="hidden" value="${state.treatmentDraft.selectedTreatmentId || ""}" />
        <datalist id="odontogramTreatmentList">${treatmentOptions}</datalist>
        <input type="number" id="odontogramQty" min="1" value="1" style="width:90px;" />
        <button type="button" class="primary" id="addToToothBtn">Añadir a pieza ${state.treatmentDraft.selectedTooth}</button>
      </div>
    </div>` : ""}

    ${treatmentWindow === "draft" ? `<div class="panel">
      <h2>Lineas del registro</h2>
      <table>
        <thead><tr><th>Tratamiento</th><th>Cant.</th><th>Pieza</th><th>P.Unit.</th><th>Importe</th><th>Nota</th><th>Lab</th><th>Laboratorio</th><th>Coste/u Lab</th><th>Estado Lab</th><th></th></tr></thead>
        <tbody>${renderTreatmentRows()}</tbody>
      </table>
      <div class="toolbar" style="margin-top:10px;">
        <strong>Total: ${formatMoney(computeDraftTotal())}</strong>
        <button type="button" class="primary" id="saveTreatmentRecordBtn">Guardar ${state.treatmentDraft.type === "budget" ? "presupuesto" : "tratamiento"}</button>
        <button type="button" id="clearTreatmentDraftBtn">Limpiar borrador</button>
      </div>
    </div>` : ""}

    ${treatmentWindow === "registros" ? `<div class="panel">
      <h2>Ultimos registros</h2>
      <table>
        <thead><tr><th>Tipo</th><th>Paciente</th><th>Fecha</th><th>Lineas</th><th>Total</th><th>Origen</th><th></th></tr></thead>
        <tbody>${records || `<tr><td colspan="7" class="helper">Sin registros aun</td></tr>`}</tbody>
      </table>
      <p class="helper" style="margin-top:8px;">Usar plantilla copia lineas de un registro previo para rehacer presupuestos/tratamientos en segundos.</p>
    </div>` : ""}
  `;
}

function renderPlaceholder(title, description) {
  return `<h2>${title}</h2><div class="panel"><p>${description}</p><p class="helper">Modulo preparado para el siguiente sprint. La arquitectura ya esta unificada para todo usuario.</p></div>`;
}

function renderWorkspaceBar() {
  const hasSearch = Boolean(String(state.globalPatientSearch || "").trim());
  const quickHits = hasSearch
    ? state.patients
        .filter((item) =>
          normalizeText(`${item.firstName} ${item.lastName} ${item.phone || ""} ${item.documentId || ""}`).includes(normalizeText(state.globalPatientSearch))
        )
        .slice(0, 6)
    : [];

  return `
    <div class="workspace-bar panel">
      <div class="workspace-main">
        <input id="globalPatientSearch" placeholder="Buscar paciente global (nombre, telefono, documento)" value="${state.globalPatientSearch}" />
      </div>
      ${
        hasSearch
          ? `<div class="workspace-hits">
              ${
                quickHits.length > 0
                  ? quickHits
                      .map(
                        (item) =>
                          `<button type="button" class="workspace-hit" data-patient-id="${item.id}">${item.firstName} ${item.lastName}<span>${item.phone || item.documentId || ""}</span></button>`
                      )
                      .join("")
                  : `<span class="helper">Sin coincidencias</span>`
              }
            </div>`
          : ""
      }
    </div>
  `;
}

function renderCobros() {
  const payments = [...state.payments].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const expenses = [...state.expenses].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const pendingRows = state.patients
    .map((patient) => {
      const snapshot = getPatientBillingSnapshot(patient.id);
      return {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone || "-",
        pending: snapshot.pendingTotal,
        credit: snapshot.credit
      };
    })
    .filter((item) => item.pending > 0 || item.credit > 0)
    .sort((a, b) => b.pending - a.pending || b.credit - a.credit);

  const patientOptions = state.patients.map((item) => `<option value="${escapeHtml(patientPickerLabel(item))}" data-value-id="${item.id}"></option>`).join("");

  const paymentsRows = payments
    .slice(0, 20)
    .map(
      (item) => `<tr><td><input type="checkbox" class="cobros-invoice-payment" value="${item.id}" /></td><td>${item.date}</td><td>${item.patientName}</td><td>${item.method}</td><td>${item.kind === "refund" ? "Devolucion" : "Cobro"}</td><td>${formatMoney(item.amount)}</td><td>${item.note || "-"}</td><td><button type="button" class="cobros-print-invoice" data-payment-id="${item.id}">Factura</button></td></tr>`
    )
    .join("");

  const expensesRows = expenses
    .slice(0, 20)
    .map((item) => `<tr><td>${item.date}</td><td>${item.concept || "Gasto"}</td><td>${item.method || "-"}</td><td>${formatMoney(item.amount)}</td><td>${item.note || "-"}</td></tr>`)
    .join("");

  const incomesTotal = payments
    .filter((item) => item.kind !== "refund")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const refundsTotal = payments.filter((item) => item.kind === "refund").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const cashBalance = incomesTotal - refundsTotal - expensesTotal;
  const cobrosWindow = getModuleWindow("cobros", "registro");

  return `
    <h2>Cobros</h2>

    <div class="panel">
      <div class="toolbar module-windows-nav">
        <button type="button" class="module-window-btn ${cobrosWindow === "registro" ? "active" : ""}" data-module-window="cobros" data-window-key="registro">Cobro rápido</button>
        <button type="button" class="module-window-btn ${cobrosWindow === "pendientes" ? "active" : ""}" data-module-window="cobros" data-window-key="pendientes">Pendientes</button>
        <button type="button" class="module-window-btn ${cobrosWindow === "historial" ? "active" : ""}" data-module-window="cobros" data-window-key="historial">Últimos cobros</button>
        <button type="button" class="module-window-btn ${cobrosWindow === "caja" ? "active" : ""}" data-module-window="cobros" data-window-key="caja">Caja</button>
      </div>
    </div>

    ${cobrosWindow === "registro" ? `<div class="panel">
      <h2>Cobro rapido</h2>
      <form id="cobrosQuickPaymentForm">
        <div class="row">
          <div class="field"><label>Paciente</label><input id="cobrosPatientInput" list="cobrosPatientList" placeholder="Buscar y seleccionar paciente" required /><input id="cobrosPatientId" name="patientId" type="hidden" /><datalist id="cobrosPatientList">${patientOptions}</datalist></div>
          <div class="field"><label>Importe</label><input name="amount" type="number" step="0.01" min="0" required /></div>
          <div class="field"><label>Metodo</label><select name="method"><option value="efectivo">efectivo</option><option value="tarjeta">tarjeta</option><option value="transferencia">transferencia</option></select></div>
          <div class="field"><label>Fecha</label><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
          <div class="field"><label>Nota</label><input name="note" placeholder="Concepto cobro" /></div>
        </div>
        <p class="helper" style="margin-top:8px;">El cobro se reparte automaticamente sobre tratamientos no pagados para dejar estado pagado/no pagado claro.</p>
        <div style="margin-top:10px;"><button type="submit" class="primary">Registrar cobro</button></div>
      </form>
    </div>` : ""}

    ${cobrosWindow === "pendientes" ? `<div class="panel">
      <h2>Pacientes con pendiente</h2>
      <table>
        <thead><tr><th>Paciente</th><th>Telefono</th><th>Pendiente</th><th>A favor</th><th></th></tr></thead>
        <tbody>
          ${pendingRows
            .map(
              (item) => `<tr>
                <td>${item.name}</td>
                <td>${item.phone}</td>
                <td>${formatMoney(item.pending)}</td>
                <td>${formatMoney(item.credit)}</td>
                <td><button type="button" class="cobros-open-patient" data-patient-id="${item.id}">Ver perfil</button></td>
              </tr>`
            )
            .join("") || `<tr><td colspan="5" class="helper">Sin pendientes de cobro.</td></tr>`}
        </tbody>
      </table>
    </div>` : ""}

    ${cobrosWindow === "historial" ? `<div class="panel">
      <h2>Ultimos cobros</h2>
      <div class="toolbar"><button type="button" id="cobrosPrintSelectedInvoice">Factura de seleccion</button></div>
      <table>
        <thead><tr><th></th><th>Fecha</th><th>Paciente</th><th>Metodo</th><th>Tipo</th><th>Importe</th><th>Nota</th><th></th></tr></thead>
        <tbody>${paymentsRows || `<tr><td colspan="8" class="helper">Sin cobros registrados.</td></tr>`}</tbody>
      </table>

      <h2 style="margin-top:12px;">Gastos recientes</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Concepto</th><th>Metodo</th><th>Importe</th><th>Nota</th></tr></thead>
        <tbody>${expensesRows || `<tr><td colspan="5" class="helper">Sin gastos registrados.</td></tr>`}</tbody>
      </table>
    </div>` : ""}

    ${cobrosWindow === "caja" ? `<div class="panel">
      <h2>Caja diaria</h2>
      <div class="grid" style="margin-bottom:10px;">
        <div class="card"><div class="kpi-title">Ingresos</div><div class="kpi-value">${formatMoney(incomesTotal)}</div></div>
        <div class="card"><div class="kpi-title">Devoluciones</div><div class="kpi-value">${formatMoney(refundsTotal)}</div></div>
        <div class="card"><div class="kpi-title">Gastos</div><div class="kpi-value">${formatMoney(expensesTotal)}</div></div>
        <div class="card"><div class="kpi-title">Saldo caja</div><div class="kpi-value">${formatMoney(cashBalance)}</div></div>
      </div>

      <form id="cobrosExpenseForm">
        <div class="row">
          <div class="field"><label>Concepto</label><input name="concept" placeholder="Ej: material, laboratorio, suministros" required /></div>
          <div class="field"><label>Importe</label><input name="amount" type="number" step="0.01" min="0" required /></div>
          <div class="field"><label>Metodo</label><select name="method"><option value="transferencia">transferencia</option><option value="efectivo">efectivo</option><option value="tarjeta">tarjeta</option></select></div>
          <div class="field"><label>Fecha</label><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
          <div class="field"><label>Nota</label><input name="note" /></div>
        </div>
        <div style="margin-top:10px;"><button type="submit" class="primary">Registrar gasto</button></div>
      </form>
    </div>` : ""}
  `;
}

function renderReportes() {
  const doctorReportRows = state.settings.reportResults.doctorEarnings?.items
    ?.map((item) => `<tr><td>${item.operatorName}</td><td>${item.records}</td><td>${formatMoney(item.total)}</td></tr>`)
    .join("");
  const patientReportRows = state.settings.reportResults.patientTreatments?.records
    ?.map((record) => `<tr><td>${record.date}</td><td>${record.type}</td><td>${record.lines?.length || 0}</td><td>${formatMoney(record.total)}</td><td>${record.operatorName || "-"}</td></tr>`)
    .join("");
  const summaryRows = state.settings.reportResults.treatmentsSummary?.items
    ?.map((item) => `<tr><td>${item.treatmentName}</td><td>${item.quantity}</td><td>${formatMoney(item.amount)}</td></tr>`)
    .join("");

  return `
    <h2>Reportes y exportaciones PDF</h2>

    <div class="panel">
      <div class="row">
        <div class="field"><label>Mes</label><input type="month" id="reportMonth" value="${state.settings.reports.month}" /></div>
        <div class="field"><label>Usuario</label><input id="reportOperator" value="${state.settings.reports.operatorName}" placeholder="opcional" /></div>
        <div class="field"><label>Desde</label><input type="date" id="reportFrom" value="${state.settings.reports.from}" /></div>
        <div class="field"><label>Hasta</label><input type="date" id="reportTo" value="${state.settings.reports.to}" /></div>
        <div class="field"><label>Paciente</label><select id="reportPatientId"><option value="">Seleccionar...</option>${state.patients
          .map((item) => `<option value="${item.id}" ${state.settings.reports.patientId === item.id ? "selected" : ""}>${item.firstName} ${item.lastName}</option>`)
          .join("")}</select></div>
      </div>
      <div class="toolbar" style="margin-top:10px;">
        <button type="button" class="primary" id="runDoctorEarningsReport">Ganancias por usuario</button>
        <button type="button" class="primary" id="runPatientTreatmentsReport">Tratamientos de paciente</button>
        <button type="button" class="primary" id="runTreatmentsSummaryReport">Tratamientos totales por rango</button>
      </div>
    </div>

    <div class="panel" style="margin-top:12px;">
      <h2>Ganancias por usuario</h2>
      <div class="toolbar"><button type="button" id="exportDoctorEarningsCsv">Exportar CSV</button><button type="button" id="exportDoctorEarningsPdf">Exportar PDF</button></div>
      <table style="margin-top:8px;"><thead><tr><th>Usuario</th><th>Registros</th><th>Total</th></tr></thead><tbody>${doctorReportRows || `<tr><td colspan="3" class="helper">Sin datos</td></tr>`}</tbody></table>
    </div>

    <div class="panel" style="margin-top:12px;">
      <h2>Tratamientos por paciente</h2>
      <div class="toolbar"><button type="button" id="exportPatientTreatmentsCsv">Exportar CSV</button><button type="button" id="exportPatientTreatmentsPdf">Exportar PDF</button></div>
      <table style="margin-top:8px;"><thead><tr><th>Fecha</th><th>Tipo</th><th>Lineas</th><th>Total</th><th>Usuario</th></tr></thead><tbody>${patientReportRows || `<tr><td colspan="5" class="helper">Sin datos</td></tr>`}</tbody></table>
    </div>

    <div class="panel" style="margin-top:12px;">
      <h2>Resumen total de tratamientos</h2>
      <div class="toolbar"><button type="button" id="exportTreatmentsSummaryCsv">Exportar CSV</button><button type="button" id="exportTreatmentsSummaryPdf">Exportar PDF</button></div>
      <table style="margin-top:8px;"><thead><tr><th>Tratamiento</th><th>Cantidad</th><th>Importe</th></tr></thead><tbody>${summaryRows || `<tr><td colspan="3" class="helper">Sin datos</td></tr>`}</tbody></table>
    </div>
  `;
}

function renderAjustes() {
  const settingsView = state.settings.view || "treatments";
  const settingsTreatmentWindow = state.settings.treatmentWindow || "catalog";

  const scheduleRows = agendaWeekdays
    .map((day) => {
      const item = state.agenda.daySchedules[String(day.key)] || { enabled: false, start: "08:00", end: "20:00" };
      return `<tr>
        <td>${day.label}</td>
        <td><input type="checkbox" class="agenda-day-enabled" data-day="${day.key}" ${item.enabled ? "checked" : ""} /></td>
        <td><input type="time" class="agenda-day-start" data-day="${day.key}" value="${item.start}" ${item.enabled ? "" : "disabled"} /></td>
        <td><input type="time" class="agenda-day-end" data-day="${day.key}" value="${item.end}" ${item.enabled ? "" : "disabled"} /></td>
      </tr>`;
    })
    .join("");

  const treatmentRows = state.treatments
    .filter((item) => normalizeText(item.name).includes(normalizeText(state.settings.treatmentSearch)))
    .slice(0, 60)
    .map(
      (item) => `<tr>
        <td><span class="treatment-chip" style="--treatment-color:${normalizeTreatmentColorHex(item.colorHex)}"><span class="treatment-chip-icon">${treatmentIcon(item.iconKey)}</span><span>${item.name}</span></span></td>
        <td><input class="setting-treatment-price" data-id="${item.id}" type="number" step="0.01" value="${item.price}" /></td>
        <td>
          <select class="setting-treatment-piece" data-id="${item.id}">
            <option value="pieza" ${item.pieceType === "pieza" ? "selected" : ""}>pieza</option>
            <option value="sector" ${item.pieceType === "sector" ? "selected" : ""}>sector</option>
            <option value="arcada" ${item.pieceType === "arcada" ? "selected" : ""}>arcada</option>
            <option value="general" ${item.pieceType === "general" ? "selected" : ""}>general</option>
          </select>
        </td>
        <td><select class="setting-treatment-icon icon-only-select" data-id="${item.id}">${renderTreatmentIconOptions(item.iconKey || "generic")}</select></td>
        <td><button type="button" class="save-treatment-setting" data-id="${item.id}">Guardar</button></td>
      </tr>`
    )
    .join("");

  const filteredPatients = state.patients.filter((item) => normalizeText(`${item.firstName} ${item.lastName}`).includes(normalizeText(state.settings.patientSearch)));
  const patientRows = filteredPatients
    .slice(0, 25)
    .map(
      (item) => `<tr>
        <td><input class="setting-patient-first" data-id="${item.id}" value="${item.firstName}" /></td>
        <td><input class="setting-patient-last" data-id="${item.id}" value="${item.lastName}" /></td>
        <td><input class="setting-patient-phone" data-id="${item.id}" value="${item.phone || ""}" /></td>
        <td><input class="setting-patient-email" data-id="${item.id}" value="${item.email || ""}" /></td>
        <td><button type="button" class="save-patient-setting" data-id="${item.id}">Guardar</button></td>
      </tr>`
    )
    .join("");

  const treatmentsView = `
    <div class="panel">
      <h2>Tratamientos</h2>
      <div class="toolbar module-windows-nav" style="margin-bottom:10px;">
        <button type="button" class="module-window-btn settings-treatment-window-btn ${settingsTreatmentWindow === "catalog" ? "active" : ""}" data-settings-treatment-window="catalog">Catalogo</button>
        <button type="button" class="module-window-btn settings-treatment-window-btn ${settingsTreatmentWindow === "new" ? "active" : ""}" data-settings-treatment-window="new">Nuevo</button>
      </div>

      ${settingsTreatmentWindow === "new" ? `<form id="settingsCreateTreatmentForm">
        <div class="row">
          <div class="field"><label>Tratamiento</label><input name="name" required placeholder="Ej: Microcarilla" /></div>
          <div class="field"><label>Precio</label><input name="price" type="number" step="0.01" min="0" required /></div>
          <div class="field"><label>Tipo</label><select name="pieceType"><option value="pieza">pieza</option><option value="sector">sector</option><option value="arcada">arcada</option><option value="general">general</option></select></div>
          <div class="field"><label>Icono</label><select name="iconKey" class="icon-only-select">${renderTreatmentIconOptions("generic")}</select></div>
        </div>
        <div style="margin-top:10px;"><button type="submit" class="primary">Añadir</button></div>
      </form>` : ""}

      ${settingsTreatmentWindow === "catalog" ? `<div class="toolbar">
        <input id="settingsTreatmentSearch" placeholder="Buscar tratamiento" value="${state.settings.treatmentSearch}" />
      </div>
      <table class="settings-compact-table" style="margin-top:10px;">
        <thead><tr><th>Tratamiento</th><th>Precio</th><th>Tipo</th><th>Icono</th><th></th></tr></thead>
        <tbody>${treatmentRows || `<tr><td colspan="5" class="helper">Sin tratamientos</td></tr>`}</tbody>
      </table>
      </div>` : ""}
    </div>
  `;

  const patientsView = `
    <div class="panel">
      <h2>Gestion de pacientes</h2>
      <div class="toolbar">
        <input id="settingsPatientSearch" placeholder="Buscar paciente" value="${state.settings.patientSearch}" />
        <span class="helper">${filteredPatients.length} resultados${filteredPatients.length > 25 ? " · mostrando 25" : ""}</span>
      </div>
      <table class="settings-compact-table" style="margin-top:10px;">
        <thead><tr><th>Nombre</th><th>Apellidos</th><th>Telefono</th><th>Email</th><th></th></tr></thead>
        <tbody>${patientRows || `<tr><td colspan="5" class="helper">Sin pacientes</td></tr>`}</tbody>
      </table>
    </div>
  `;

  const agendaView = `
    <div class="panel">
      <div class="toolbar" style="justify-content: space-between;">
        <h2>Agenda y horario semanal</h2>
        <button type="button" id="agendaResetScheduleBtn">Restablecer</button>
      </div>
      <div class="toolbar" style="margin-bottom:8px;">
        <button type="button" class="agenda-preset-btn" data-agenda-preset="standard">Estandar</button>
        <button type="button" class="agenda-preset-btn" data-agenda-preset="compact">Compacto</button>
        <button type="button" class="agenda-preset-btn" data-agenda-preset="extended">Extendido</button>
      </div>
      <div class="row">
        <div class="field" style="max-width:260px;"><label>Division de franja</label><select id="agendaSlotInterval"><option value="60" ${Number(state.agenda.slotIntervalMin) === 60 ? "selected" : ""}>1h</option><option value="30" ${Number(state.agenda.slotIntervalMin) === 30 ? "selected" : ""}>30 min</option><option value="10" ${Number(state.agenda.slotIntervalMin) === 10 ? "selected" : ""}>10 min</option></select></div>
      </div>
      <details class="settings-advanced" style="margin-top:8px;">
        <summary>Horario avanzado</summary>
        <table class="settings-compact-table" style="margin-top:8px;">
          <thead><tr><th>Dia</th><th>Activo</th><th>Inicio</th><th>Fin</th></tr></thead>
          <tbody>${scheduleRows}</tbody>
        </table>
      </details>
    </div>
  `;

  const connectionView = `
    <div class="panel">
      <h2>Conexion API</h2>
      <form id="apiBaseConfigForm">
        <div class="row">
          <div class="field"><label>URL API base</label><input id="settingsApiBaseUrl" name="apiBaseUrl" placeholder="Ej: https://api.dominio.com" value="${escapeHtml(state.settings.apiBaseUrl || "")}" /></div>
        </div>
        <div class="toolbar" style="margin-top:10px;">
          <button type="submit" class="primary">Guardar conexion</button>
          <button type="button" id="testApiConnectionBtn">Probar conexion</button>
        </div>
      </form>
    </div>
  `;

  const activeViewContent =
    settingsView === "patients"
      ? patientsView
      : settingsView === "agenda"
      ? agendaView
      : settingsView === "connection"
      ? connectionView
      : treatmentsView;

  return `
    <h2>Ajustes</h2>

    <div class="panel">
      <div class="toolbar settings-views-nav">
        <button type="button" class="settings-view-btn ${settingsView === "treatments" ? "active" : ""}" data-view="treatments">Tratamientos</button>
        <button type="button" class="settings-view-btn ${settingsView === "patients" ? "active" : ""}" data-view="patients">Pacientes</button>
        <button type="button" class="settings-view-btn ${settingsView === "agenda" ? "active" : ""}" data-view="agenda">Agenda</button>
        <button type="button" class="settings-view-btn ${settingsView === "connection" ? "active" : ""}" data-view="connection">Conexion</button>
      </div>
    </div>

    ${activeViewContent}
  `;
}

function renderContent() {
  if (!canAccessSection(state.activeSection)) {
    state.activeSection = getVisibleSections()[0] || "inicio";
  }

  switch (state.activeSection) {
    case "inicio":
      return renderInicio();
    case "tratamientos":
      return renderTratamientos();
    case "pacientes":
      return renderPacientes();
    case "doctores":
      return renderDoctores();
    case "historial":
      return renderHistorial();
    case "reportes":
      return renderReportes();
    case "agenda":
      return renderAgenda();
    case "cobros":
      return renderCobros();
    case "inventario":
      return renderPlaceholder("Inventario", "Articulos, stock minimo y movimientos de almacen.");
    case "trabajos":
      return renderTrabajosLab();
    case "ajustes":
      return renderAjustes();
    default:
      return "";
  }
}

function refreshPreviewSelectDefaults() {
  document.querySelectorAll(".preview-treatment").forEach((select) => {
    const index = Number(select.dataset.previewIndex);
    select.value = state.parsedPreview[index]?.treatmentId || "";
  });
}

function initSpeechIfNeeded() {
  if (!SpeechRecognition) {
    state.voice.recognitionReady = false;
    state.voice.unsupportedReason = "Este navegador no soporta reconocimiento de voz web.";
    return;
  }

  if (recognition) return;
  recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.interimResults = true;
  recognition.continuous = true;
  state.voice.recognitionReady = true;

  recognition.onresult = (event) => {
    let text = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      text += `${event.results[i][0].transcript} `;
    }
    state.voice.transcript = `${state.voice.transcript} ${text}`.replace(/\s+/g, " ").trim();
    const el = document.getElementById("voiceTranscript");
    if (el) el.value = state.voice.transcript;
  };

  recognition.onend = () => {
    state.voice.listening = false;
    render();
  };

  recognition.onerror = () => {
    state.voice.listening = false;
    render();
  };
}

async function saveTreatmentRecord() {
  const patient = getSelectedPatient();
  if (!patient) {
    alert("Selecciona un paciente");
    return;
  }
  if (state.treatmentDraft.lines.length === 0) {
    alert("Añade al menos una linea");
    return;
  }

  const payload = {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    operatorName: state.treatmentDraft.operatorName || "Sin asignar",
    type: state.treatmentDraft.type,
    source: "voice-odontogram",
    date: state.treatmentDraft.date,
    notes: state.treatmentDraft.notes,
    lines: state.treatmentDraft.lines.map((line) => ({
      treatmentId: line.treatmentId,
      treatmentName: line.treatmentName,
      quantity: Number(line.quantity || 1),
      unitPrice: Number(line.unitPrice || 0),
      toothCode: line.toothCode || null,
      note: line.note || null,
      isLabWork: Boolean(line.isLabWork),
      labName: line.labName || "",
      labCost: Number(line.labCost || 0),
      labStatus: line.labStatus === "delivered" ? "delivered" : "pending"
    }))
  };

  const response = await fetch("/api/treatment-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    alert("No se pudo guardar el registro");
    return;
  }

  state.treatmentDraft.lines = [];
  state.parsedPreview = [];
  state.voice.transcript = "";
  await fetchAll();
  render();
}

async function loadPatientProfile(patientId) {
  if (!patientId) return;
  const response = await fetch(`/api/patients/${patientId}/profile`);
  if (!response.ok) {
    alert("No se pudo cargar el perfil del paciente");
    return;
  }
  state.activePatientProfile = await response.json();
}

function openTreatmentFromAppointment(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) return;

  const hasDraftData = state.treatmentDraft.lines.length > 0 || state.parsedPreview.length > 0 || Boolean(state.voice.transcript.trim());
  if (hasDraftData) {
    const confirmReplace = window.confirm("Hay un borrador de tratamientos en curso. ¿Quieres sustituirlo por el de esta cita?");
    if (!confirmReplace) return;
  }

  state.treatmentDraft.lines = [];
  state.parsedPreview = [];
  state.voice.transcript = "";
  state.treatmentDraft.patientId = appointment.patientId || "";
  if (appointment.doctorName && appointment.doctorName !== "Sin asignar") {
    state.treatmentDraft.operatorName = appointment.doctorName;
  }
  state.treatmentDraft.type = "done";
  state.treatmentDraft.date = String(appointment.startAt || new Date().toISOString()).slice(0, 10);
  const appointmentDateLabel = appointment.startAt ? new Date(appointment.startAt).toLocaleString("es-ES") : new Date().toLocaleString("es-ES");
  const reason = String(appointment.reason || "").trim();
  const notes = String(appointment.notes || "").trim();
  state.treatmentDraft.notes = [
    `Cita ${appointmentDateLabel}`,
    reason ? `Motivo: ${reason}` : "",
    notes ? `Notas: ${notes}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
  state.treatmentCatalogSearch = "";
  state.activeSection = "tratamientos";
  render();
}

function attachEvents() {
  if (topbarThemeToggle) {
    topbarThemeToggle.onclick = () => {
      state.ui.darkMode = !state.ui.darkMode;
      saveThemePreferences();
      render();
    };
  }

  if (openSessionBtn) {
    openSessionBtn.onclick = () => {
      state.ui.sessionModalOpen = true;
      render();
    };
  }

  const globalPatientSearch = document.getElementById("globalPatientSearch");
  if (globalPatientSearch) {
    globalPatientSearch.addEventListener("input", () => {
      state.globalPatientSearch = globalPatientSearch.value;
      render();
    });
  }

  document.querySelectorAll(".module-window-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const moduleKey = String(button.dataset.moduleWindow || "");
      const windowKey = String(button.dataset.windowKey || "");
      if (!moduleKey || !windowKey) return;
      setModuleWindow(moduleKey, windowKey);
      render();
    });
  });

  document.querySelectorAll(".mobile-dock-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const target = String(button.dataset.mobileSection || "");
      if (!target || !canAccessSection(target)) return;
      state.activeSection = target;
      render();
    });
  });

  document.querySelectorAll(".workspace-hit").forEach((button) => {
    button.addEventListener("click", async () => {
      const patientId = button.dataset.patientId;
      if (!patientId) return;
      await loadPatientProfile(patientId);
      state.activeSection = "pacientes";
      state.globalPatientSearch = "";
      render();
    });
  });

  document.querySelectorAll(".agenda-open-treatment, .start-treatment-from-appointment").forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.getAttribute("data-appointment-id");
      if (!appointmentId) return;
      openTreatmentFromAppointment(appointmentId);
    });
  });

  document.querySelectorAll(".patient-inline-first, .patient-inline-last, .patient-inline-phone, .patient-inline-email, .patient-inline-document").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const patientId = input.getAttribute("data-patient-id");
      if (!patientId) return;
      const saveBtn = document.querySelector(`.save-patient-inline[data-patient-id="${patientId}"]`);
      if (saveBtn) saveBtn.click();
    });
  });

  const workflowSessionRole = document.getElementById("workflowSessionRole");
  if (workflowSessionRole) {
    workflowSessionRole.addEventListener("change", () => {
      state.workflow.role = normalizeWorkflowRole(workflowSessionRole.value);
      if (state.workflow.role !== "doctor") {
        state.workflow.doctorName = "";
      }
      render();
    });
  }

  const workflowSessionDoctor = document.getElementById("workflowSessionDoctor");
  if (workflowSessionDoctor) {
    workflowSessionDoctor.addEventListener("change", () => {
      state.workflow.doctorName = String(workflowSessionDoctor.value || "");
      render();
    });
  }

  const startWorkflowSessionBtn = document.getElementById("startWorkflowSessionBtn");
  if (startWorkflowSessionBtn) {
    startWorkflowSessionBtn.addEventListener("click", () => {
      startWorkflowSession();
    });
  }

  const closeWorkflowSessionModal = document.getElementById("closeWorkflowSessionModal");
  if (closeWorkflowSessionModal) {
    closeWorkflowSessionModal.addEventListener("click", () => {
      state.ui.sessionModalOpen = false;
      render();
    });
  }

  document.querySelectorAll(".home-action-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.go;
      if (!target) return;
      if (!canAccessSection(target)) return;
      state.activeSection = target;
      render();
    });
  });

  document.querySelectorAll(".home-appointment-item").forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.dataset.appointmentId;
      const appointment = state.appointments.find((item) => item.id === appointmentId);
      if (!appointment) return;
      state.activeSection = "agenda";
      state.agenda.currentDate = String(appointment.startAt || "").slice(0, 10);
      state.agenda.selectedDateTime = appointmentDateTimeKey(appointment);
      state.agenda.view = "day";
      render();
    });
  });

  document.querySelectorAll(".smart-action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.smartAction;
      if (action === "urgent-now") {
        const now = new Date();
        const nowKey = toDateTimeKey(now);
        state.activeSection = "agenda";
        state.agenda.currentDate = toDateKey(now);
        state.agenda.selectedDateTime = nowKey;
        state.agenda.view = "day";
        resetQuickAddState(nowKey, { isUrgent: true });
        render();
        return;
      }

      if (action === "assign-doctor") {
        const appointmentId = button.dataset.appointmentId;
        const appointment = state.appointments.find((item) => item.id === appointmentId);
        if (!appointment) return;
        state.activeSection = "agenda";
        state.agenda.currentDate = String(appointment.startAt || "").slice(0, 10);
        state.agenda.selectedDateTime = appointmentDateTimeKey(appointment);
        state.agenda.view = "day";
        render();
        return;
      }

      if (action === "open-patient") {
        const patientId = button.dataset.patientId;
        if (!patientId) return;
        await loadPatientProfile(patientId);
        state.activeSection = "pacientes";
        render();
        return;
      }

      if (action === "open-lab") {
        state.activeSection = "trabajos";
        render();
      }
    });
  });

  const inicioQuickPatientSearch = document.getElementById("inicioQuickPatientSearch");
  const inicioQuickPatientId = document.getElementById("inicioQuickPatientId");
  if (inicioQuickPatientSearch && inicioQuickPatientId) {
    const syncInicioQuickPatient = () => {
      const resolvedId = resolvePatientIdFromInput("inicioQuickPatientList", inicioQuickPatientSearch.value);
      inicioQuickPatientId.value = resolvedId;
      if (state.inicioQuick.patientId !== resolvedId) {
        state.inicioQuick.patientId = resolvedId;
        render();
      }
    };
    inicioQuickPatientSearch.addEventListener("change", syncInicioQuickPatient);
    inicioQuickPatientSearch.addEventListener("blur", syncInicioQuickPatient);
  }

  const inicioQuickType = document.getElementById("inicioQuickType");
  if (inicioQuickType) {
    inicioQuickType.addEventListener("change", () => {
      const value = inicioQuickType.value || "control";
      state.inicioQuick.visitType = value;
      if (value === "urgencia") {
        state.inicioQuick.reason = "Urgencia";
      } else if (!state.inicioQuick.reason || normalizeText(state.inicioQuick.reason) === "urgencia") {
        state.inicioQuick.reason = value === "tratamiento" ? "Tratamiento" : "Control";
      }
      render();
    });
  }

  const inicioQuickDoctor = document.getElementById("inicioQuickDoctor");
  if (inicioQuickDoctor) {
    inicioQuickDoctor.addEventListener("change", () => {
      state.inicioQuick.doctorName = inicioQuickDoctor.value || "";
    });
  }

  const inicioQuickStartAt = document.getElementById("inicioQuickStartAt");
  if (inicioQuickStartAt) {
    inicioQuickStartAt.addEventListener("change", () => {
      state.inicioQuick.startAt = inicioQuickStartAt.value || state.inicioQuick.startAt;
    });
  }

  const inicioQuickReason = document.getElementById("inicioQuickReason");
  if (inicioQuickReason) {
    inicioQuickReason.addEventListener("change", () => {
      state.inicioQuick.reason = inicioQuickReason.value || "";
    });
  }

  document.querySelectorAll(".inicio-existing-appointment").forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.dataset.appointmentId;
      const appointment = state.appointments.find((item) => item.id === appointmentId);
      if (!appointment) return;
      state.activeSection = "agenda";
      state.agenda.currentDate = String(appointment.startAt || "").slice(0, 10);
      state.agenda.selectedDateTime = appointmentDateTimeKey(appointment);
      state.agenda.view = "day";
      render();
    });
  });

  const inicioQuickForm = document.getElementById("inicioQuickForm");
  if (inicioQuickForm) {
    inicioQuickForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(inicioQuickForm);
      const patientSearchValue = String(document.getElementById("inicioQuickPatientSearch")?.value || "");
      const patientId = String(formData.get("patientId") || resolvePatientIdFromInput("inicioQuickPatientList", patientSearchValue));
      const patient = state.patients.find((item) => item.id === patientId);
      if (!patient) return alert("Selecciona un paciente");

      const visitType = String(formData.get("visitType") || "control");
      const durationMin = visitType === "tratamiento" ? 60 : visitType === "urgencia" ? 20 : 30;
      const rawReason = String(formData.get("reason") || "").trim();
      const reasonBase = rawReason || (visitType === "tratamiento" ? "Tratamiento" : visitType === "urgencia" ? "Urgencia" : "Control");

      const payload = {
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: String(formData.get("doctorName") || "").trim() || "Sin asignar",
        startAt: String(formData.get("startAt") || "").slice(0, 16),
        durationMin,
        box: visitType === "urgencia" ? "Urgencias" : "General",
        reason: visitType === "urgencia" ? `[URGENCIA] ${reasonBase}` : reasonBase,
        status: "scheduled"
      };

      if (!payload.startAt) return alert("Selecciona fecha y hora");

      const saved = await saveAppointment(payload);
      if (!saved) return alert("No se pudo crear cita desde admisión rápida");

      state.activeSection = "agenda";
      state.agenda.currentDate = String(payload.startAt).slice(0, 10);
      state.agenda.selectedDateTime = String(payload.startAt).slice(0, 16);
      state.agenda.view = "day";
      render();
    });
  }

  const patientForm = document.getElementById("patientForm");
  if (patientForm) {
    patientForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(patientForm).entries());
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return alert("No se pudo crear paciente");
      patientForm.reset();
      await fetchAll();
      render();
    });
  }

  const patientSearch = document.getElementById("patientSearch");
  if (patientSearch) {
    patientSearch.addEventListener("input", () => {
      state.patientSearch = patientSearch.value;
      render();
    });
  }

  document.querySelectorAll(".open-patient-profile").forEach((button) => {
    button.addEventListener("click", async () => {
      const patientId = button.dataset.patientId;
      await loadPatientProfile(patientId);
      render();
    });
  });

  document.querySelectorAll(".save-patient-inline").forEach((button) => {
    button.addEventListener("click", async () => {
      const patientId = button.getAttribute("data-patient-id");
      if (!patientId) return;

      const firstName = document.querySelector(`.patient-inline-first[data-patient-id="${patientId}"]`)?.value || "";
      const lastName = document.querySelector(`.patient-inline-last[data-patient-id="${patientId}"]`)?.value || "";
      const phone = document.querySelector(`.patient-inline-phone[data-patient-id="${patientId}"]`)?.value || "";
      const email = document.querySelector(`.patient-inline-email[data-patient-id="${patientId}"]`)?.value || "";
      const documentId = document.querySelector(`.patient-inline-document[data-patient-id="${patientId}"]`)?.value || "";

      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        return alert("Nombre, apellidos y telefono son obligatorios");
      }

      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, email, documentId })
      });
      if (!response.ok) return alert("No se pudo guardar paciente");

      await fetchAll();
      if (state.activePatientProfile?.patient?.id === patientId) {
        await loadPatientProfile(patientId);
      }
      render();
    });
  });

  const doctorForm = document.getElementById("doctorForm");
  if (doctorForm) {
    doctorForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(doctorForm);
      const payload = {
        name: formData.get("name"),
        specialty: formData.get("specialty"),
        phone: formData.get("phone"),
        active: formData.get("active") === "true"
      };
      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return alert("No se pudo crear doctor");
      doctorForm.reset();
      await fetchAll();
      render();
    });
  }

  document.querySelectorAll(".save-doctor").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const name = document.querySelector(`.doctor-name[data-id="${id}"]`)?.value || "";
      if (!name.trim()) return alert("El nombre del doctor es obligatorio");
      const specialty = document.querySelector(`.doctor-specialty[data-id="${id}"]`)?.value || "General";
      const phone = document.querySelector(`.doctor-phone[data-id="${id}"]`)?.value || "";
      const active = Boolean(document.querySelector(`.doctor-active[data-id="${id}"]`)?.checked);
      const response = await fetch(`/api/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, phone, active })
      });
      if (!response.ok) return alert("No se pudo actualizar doctor");
      await fetchAll();
      render();
    });
  });

  document.querySelectorAll(".save-appointment-inline").forEach((button) => {
    button.addEventListener("click", async () => {
      const appointmentId = button.getAttribute("data-appointment-id");
      if (!appointmentId) return;

      const startAt = document.querySelector(`.agenda-row-start[data-appointment-id="${appointmentId}"]`)?.value || "";
      const doctorName = document.querySelector(`.agenda-row-doctor[data-appointment-id="${appointmentId}"]`)?.value || "";
      const reason = document.querySelector(`.agenda-row-reason[data-appointment-id="${appointmentId}"]`)?.value || "";
      const notes = document.querySelector(`.agenda-row-notes[data-appointment-id="${appointmentId}"]`)?.value || "";
      const status = document.querySelector(`.agenda-row-status[data-appointment-id="${appointmentId}"]`)?.value || "scheduled";

      if (!startAt) return alert("La fecha y hora es obligatoria");

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt, doctorName, reason, notes, status })
      });
      if (!response.ok) return alert("No se pudo guardar la cita");

      await fetchAll();
      if (state.activePatientProfile?.patient?.id) {
        await loadPatientProfile(state.activePatientProfile.patient.id);
      }
      render();
    });
  });

  document.querySelectorAll(".agenda-row-start, .agenda-row-doctor, .agenda-row-reason, .agenda-row-notes").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const appointmentId = input.getAttribute("data-appointment-id");
      if (!appointmentId) return;
      const saveBtn = document.querySelector(`.save-appointment-inline[data-appointment-id="${appointmentId}"]`);
      if (saveBtn) saveBtn.click();
    });
  });

  document.querySelectorAll(".doctor-go-agenda").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.doctorName;
      if (!name) return;
      state.activeSection = "agenda";
      state.agenda.doctorFilter = name;
      render();
    });
  });

  const historySearch = document.getElementById("historySearch");
  if (historySearch) {
    historySearch.addEventListener("input", () => {
      state.history.search = historySearch.value;
      render();
    });
  }
  const historyType = document.getElementById("historyType");
  if (historyType) {
    historyType.addEventListener("change", () => {
      state.history.type = historyType.value;
      render();
    });
  }
  const historyDoctorSearch = document.getElementById("historyDoctorSearch");
  if (historyDoctorSearch) {
    const syncHistoryDoctor = () => {
      if (normalizeWorkflowRole(state.workflow.role) === "doctor" && state.workflow.doctorName) {
        state.history.doctor = state.workflow.doctorName;
        return render();
      }
      const resolvedDoctor = resolveDatalistValueId("historyDoctorOptions", historyDoctorSearch.value) || String(historyDoctorSearch.value || "").trim();
      state.history.doctor = resolvedDoctor ? resolvedDoctor : "all";
      render();
    };
    historyDoctorSearch.addEventListener("change", syncHistoryDoctor);
    historyDoctorSearch.addEventListener("blur", syncHistoryDoctor);
  }

  const historyPatientSearch = document.getElementById("historyPatientSearch");
  if (historyPatientSearch) {
    const syncHistoryPatient = () => {
      const resolvedId = resolvePatientIdFromInput("historyPatientOptions", historyPatientSearch.value);
      state.history.patientId = resolvedId || "all";
      render();
    };
    historyPatientSearch.addEventListener("change", syncHistoryPatient);
    historyPatientSearch.addEventListener("blur", syncHistoryPatient);
  }
  const historyStatus = document.getElementById("historyStatus");
  if (historyStatus) {
    historyStatus.addEventListener("change", () => {
      state.history.status = historyStatus.value;
      render();
    });
  }
  const historyFrom = document.getElementById("historyFrom");
  if (historyFrom) {
    historyFrom.addEventListener("change", () => {
      state.history.from = historyFrom.value;
      render();
    });
  }
  const historyTo = document.getElementById("historyTo");
  if (historyTo) {
    historyTo.addEventListener("change", () => {
      state.history.to = historyTo.value;
      render();
    });
  }

  document.querySelectorAll(".history-range").forEach((button) => {
    button.addEventListener("click", () => {
      const days = Number(button.dataset.days || 0);
      const today = new Date();
      const to = toDateKey(today);
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - days);
      state.history.from = toDateKey(fromDate);
      state.history.to = to;
      render();
    });
  });

  const historyResetFilters = document.getElementById("historyResetFilters");
  if (historyResetFilters) {
    historyResetFilters.addEventListener("click", () => {
      state.history.search = "";
      state.history.type = "all";
      state.history.doctor = "all";
      state.history.patientId = "all";
      state.history.status = "all";
      state.history.from = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10);
      state.history.to = new Date().toISOString().slice(0, 10);
      render();
    });
  }

  document.querySelectorAll(".open-history-patient").forEach((button) => {
    button.addEventListener("click", async () => {
      const patientId = button.dataset.patientId;
      if (!patientId) return;
      await loadPatientProfile(patientId);
      state.activeSection = "pacientes";
      render();
    });
  });

  document.querySelectorAll(".history-quick-payment").forEach((button) => {
    button.addEventListener("click", async () => {
      const patientId = button.dataset.patientId;
      if (!patientId) return;
      await loadPatientProfile(patientId);
      state.activeSection = "pacientes";
      render();
    });
  });

  document.querySelectorAll(".history-repeat-appointment").forEach((button) => {
    button.addEventListener("click", () => {
      const sourceId = button.dataset.appointmentId;
      const source = state.appointments.find((item) => item.id === sourceId);
      if (!source) return;
      const sourceDate = new Date(source.startAt);
      sourceDate.setDate(sourceDate.getDate() + 7);
      const repeatAt = toDateTimeKey(sourceDate);

      state.activeSection = "agenda";
      state.agenda.currentDate = toDateKey(sourceDate);
      state.agenda.selectedDateTime = repeatAt;
      state.agenda.view = "day";
      resetQuickAddState(repeatAt, { isUrgent: false });
      state.agenda.quickAdd.selectedPatientId = source.patientId || "";
      state.agenda.quickAdd.doctorName = source.doctorName || "";
      state.agenda.quickAdd.reason = source.reason || "";
      state.agenda.quickAdd.notes = source.notes || "";
      state.agenda.quickAdd.durationMin = Number(source.durationMin || 30);
      render();
    });
  });

  document.querySelectorAll(".history-open-appointment").forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.dataset.appointmentId;
      const appointment = state.appointments.find((item) => item.id === appointmentId);
      if (!appointment) return;

      state.activeSection = "agenda";
      state.agenda.currentDate = String(appointment.startAt || "").slice(0, 10);
      state.agenda.selectedDateTime = appointmentDateTimeKey(appointment);
      state.agenda.view = "day";
      render();
    });
  });

  document.querySelectorAll(".history-reuse-record").forEach((button) => {
    button.addEventListener("click", () => {
      const recordId = button.dataset.recordId;
      const record = state.treatmentRecords.find((item) => item.id === recordId);
      if (!record) return;

      state.activeSection = "tratamientos";
      state.treatmentDraft.patientId = record.patientId || "";
      state.treatmentDraft.operatorName = record.operatorName || state.treatmentDraft.operatorName;
      state.treatmentDraft.type = record.type === "done" ? "done" : "budget";
      state.treatmentDraft.date = new Date().toISOString().slice(0, 10);
      state.treatmentDraft.notes = record.notes || "";
      state.treatmentDraft.lines = buildDraftLinesFromRecord(record);
      state.treatmentDraft.selectedTreatmentId = state.treatmentDraft.lines[0]?.treatmentId || state.treatmentDraft.selectedTreatmentId;
      render();
    });
  });

  document.querySelectorAll(".print-treatment-record").forEach((button) => {
    button.addEventListener("click", () => {
      const recordId = String(button.dataset.recordId || "");
      if (!recordId) return;
      printTreatmentRecordPdf(recordId);
    });
  });

  const savePatientProfileNotes = document.getElementById("savePatientProfileNotes");
  if (savePatientProfileNotes) {
    savePatientProfileNotes.addEventListener("click", async () => {
      const patientId = savePatientProfileNotes.getAttribute("data-patient-id");
      const notes = document.getElementById("patientProfileNotes")?.value || "";
      if (!patientId) return;

      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) return alert("No se pudo guardar el comentario del paciente");

      await fetchAll();
      await loadPatientProfile(patientId);
      render();
    });
  }

  document.querySelectorAll(".save-appointment-note").forEach((button) => {
    button.addEventListener("click", async () => {
      const appointmentId = button.getAttribute("data-appointment-id");
      const noteInput = document.querySelector(`.appointment-note-input[data-appointment-id="${appointmentId}"]`);
      const notes = noteInput?.value || "";
      if (!appointmentId) return;

      const response = await fetch(`/api/appointments/${appointmentId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) return alert("No se pudo guardar el comentario de la cita");

      await fetchAll();
      if (state.activePatientProfile?.patient?.id) {
        await loadPatientProfile(state.activePatientProfile.patient.id);
      }
      render();
    });
  });

  const exportHistoryCsv = document.getElementById("exportHistoryCsv");
  if (exportHistoryCsv) {
    exportHistoryCsv.addEventListener("click", () => {
      const rows = getFilteredHistoryRows().map((row) => ({
        fecha: row.dateKey,
        tipo: row.type,
        paciente: row.patientName,
        doctor: row.doctorName,
        estado: row.status,
        importe: row.amount == null ? "" : row.amount,
        detalle: row.detail
      }));
      downloadCsv("historial-operativo.csv", rows);
    });
  }

  const patientPaymentForm = document.getElementById("patientPaymentForm");
  if (patientPaymentForm) {
    patientPaymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(patientPaymentForm);
      const patientId = patientPaymentForm.getAttribute("data-patient-id");
      const patient = state.patients.find((item) => item.id === patientId);
      if (!patient) return alert("Paciente no encontrado");

      const payload = {
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        amount: Number(formData.get("amount") || 0),
        method: formData.get("method"),
        date: formData.get("date"),
        note: formData.get("note"),
        allocations: buildPaymentAllocations(patientId, Number(formData.get("amount") || 0))
      };

      if (payload.amount <= 0) {
        return alert("El importe debe ser mayor que 0");
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return alert("No se pudo registrar pago");

      await fetchAll();
      await loadPatientProfile(patientId);
      render();
    });
  }

  const cobrosQuickPaymentForm = document.getElementById("cobrosQuickPaymentForm");
  const cobrosPatientInput = document.getElementById("cobrosPatientInput");
  const cobrosPatientId = document.getElementById("cobrosPatientId");
  if (cobrosPatientInput && cobrosPatientId) {
    const syncCobrosPatient = () => {
      cobrosPatientId.value = resolvePatientIdFromInput("cobrosPatientList", cobrosPatientInput.value);
    };
    cobrosPatientInput.addEventListener("change", syncCobrosPatient);
    cobrosPatientInput.addEventListener("blur", syncCobrosPatient);
  }

  if (cobrosQuickPaymentForm) {
    cobrosQuickPaymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(cobrosQuickPaymentForm);
      const patientSearchValue = String(document.getElementById("cobrosPatientInput")?.value || "");
      const patientId = String(formData.get("patientId") || resolvePatientIdFromInput("cobrosPatientList", patientSearchValue));
      const patient = state.patients.find((item) => item.id === patientId);
      if (!patient) return alert("Selecciona un paciente");

      const payload = {
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        amount: Number(formData.get("amount") || 0),
        method: String(formData.get("method") || "tarjeta"),
        date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
        note: String(formData.get("note") || ""),
        allocations: buildPaymentAllocations(patientId, Number(formData.get("amount") || 0))
      };

      if (payload.amount <= 0) return alert("El importe debe ser mayor que 0");

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return alert("No se pudo registrar cobro");

      await fetchAll();
      render();
    });
  }

  document.querySelectorAll(".cobros-open-patient").forEach((button) => {
    button.addEventListener("click", async () => {
      const patientId = button.dataset.patientId;
      if (!patientId) return;
      await loadPatientProfile(patientId);
      state.activeSection = "pacientes";
      render();
    });
  });

  document.querySelectorAll(".cobros-print-invoice").forEach((button) => {
    button.addEventListener("click", () => {
      const paymentId = String(button.dataset.paymentId || "");
      if (!paymentId) return;
      const rows = buildInvoiceRowsFromPaymentIds([paymentId]);
      if (rows.length === 0) return alert("No hay datos de tratamientos para generar factura");
      printReportPdf({
        title: "Factura de tratamientos pagados",
        subtitle: `Pago ${paymentId}`,
        columns: ["Fecha", "Paciente", "Tratamiento", "Pieza", "Importe abonado"],
        rows
      });
    });
  });

  const cobrosPrintSelectedInvoice = document.getElementById("cobrosPrintSelectedInvoice");
  if (cobrosPrintSelectedInvoice) {
    cobrosPrintSelectedInvoice.addEventListener("click", () => {
      const selectedIds = [...document.querySelectorAll(".cobros-invoice-payment:checked")].map((input) => String(input.value || "")).filter(Boolean);
      if (selectedIds.length === 0) return alert("Selecciona uno o mas cobros");
      const rows = buildInvoiceRowsFromPaymentIds(selectedIds);
      if (rows.length === 0) return alert("No hay datos de tratamientos para generar factura");
      printReportPdf({
        title: "Factura consolidada",
        subtitle: `Cobros: ${selectedIds.length}`,
        columns: ["Fecha", "Paciente", "Tratamiento", "Pieza", "Importe abonado"],
        rows
      });
    });
  }

  const cobrosExpenseForm = document.getElementById("cobrosExpenseForm");
  if (cobrosExpenseForm) {
    cobrosExpenseForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(cobrosExpenseForm);
      const payload = {
        concept: String(formData.get("concept") || "Gasto operativo"),
        amount: Number(formData.get("amount") || 0),
        method: String(formData.get("method") || "transferencia"),
        date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
        note: String(formData.get("note") || "")
      };
      if (payload.amount <= 0) return alert("El importe del gasto debe ser mayor que 0");

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return alert("No se pudo registrar gasto");

      await fetchAll();
      render();
    });
  }

  const closePatientProfileBtn = document.getElementById("closePatientProfileBtn");
  if (closePatientProfileBtn) {
    closePatientProfileBtn.addEventListener("click", () => {
      state.activePatientProfile = null;
      render();
    });
  }

  const treatmentCatalogSearch = document.getElementById("treatmentCatalogSearch");
  if (treatmentCatalogSearch) {
    treatmentCatalogSearch.addEventListener("input", () => {
      state.treatmentCatalogSearch = treatmentCatalogSearch.value;
      render();
    });
  }

  document.querySelectorAll(".quick-add-treatment").forEach((button) => {
    button.addEventListener("click", () => {
      const treatment = treatmentById(button.dataset.treatmentId);
      if (!treatment) return;
      mergeLine({
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        quantity: 1,
        unitPrice: treatment.price,
        toothCode: treatment.pieceType === "general" ? "X" : state.treatmentDraft.selectedTooth,
        note: treatment.pieceType === "general" ? "General" : `Pieza ${state.treatmentDraft.selectedTooth}`
      });
      render();
    });
  });

  document.querySelectorAll(".reuse-treatment-record").forEach((button) => {
    button.addEventListener("click", () => {
      const recordId = button.getAttribute("data-record-id");
      const record = state.treatmentRecords.find((item) => item.id === recordId);
      if (!record) return;

      state.treatmentDraft.patientId = record.patientId || "";
      state.treatmentDraft.operatorName = record.operatorName || state.treatmentDraft.operatorName;
      state.treatmentDraft.type = record.type === "done" ? "done" : "budget";
      state.treatmentDraft.date = new Date().toISOString().slice(0, 10);
      state.treatmentDraft.notes = record.notes || "";
      state.treatmentDraft.lines = buildDraftLinesFromRecord(record);
      state.treatmentDraft.selectedTreatmentId = state.treatmentDraft.lines[0]?.treatmentId || state.treatmentDraft.selectedTreatmentId;
      render();
    });
  });

  const appointmentForm = document.getElementById("appointmentForm");
  if (appointmentForm) {
    const agendaPatientInput = document.getElementById("agendaPatientInput");
    const agendaPatientId = document.getElementById("agendaPatientId");
    if (agendaPatientInput && agendaPatientId) {
      const syncAgendaPatient = () => {
        const resolvedId = resolvePatientIdFromInput("agendaPatientList", agendaPatientInput.value);
        agendaPatientId.value = resolvedId;
        state.agenda.quickAdd.selectedPatientId = resolvedId;
      };
      agendaPatientInput.addEventListener("change", syncAgendaPatient);
      agendaPatientInput.addEventListener("blur", syncAgendaPatient);
    }

    const startAtInput = appointmentForm.querySelector('input[name="startAt"]');
    if (startAtInput) {
      startAtInput.addEventListener("change", () => {
        state.agenda.selectedDateTime = startAtInput.value;
      });
    }

    appointmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(appointmentForm);
      const agendaPatientInputValue = String(document.getElementById("agendaPatientInput")?.value || "");
      const patientId = String(formData.get("patientId") || resolvePatientIdFromInput("agendaPatientList", agendaPatientInputValue));
      const patient = state.patients.find((item) => item.id === patientId);
      const payload = {
        patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
        doctorName: formData.get("doctorName") || "Sin asignar",
        startAt: formData.get("startAt"),
        durationMin: Number(formData.get("durationMin") || 30),
        box: formData.get("box"),
        reason: formData.get("reason"),
        notes: formData.get("notes"),
        status: formData.get("status")
      };
      const saved = await saveAppointment(payload);
      if (!saved) return alert("No se pudo crear cita");
      render();
    });
  }

  const quickModalBackdrop = document.getElementById("quickModalBackdrop");
  if (quickModalBackdrop) {
    quickModalBackdrop.addEventListener("click", (event) => {
      if (!event.target.closest(".modal-card")) {
        resetQuickAddState();
        render();
      }
    });
  }

  const quickCancelBtn = document.getElementById("quickCancelBtn");
  if (quickCancelBtn) {
    quickCancelBtn.addEventListener("click", () => {
      resetQuickAddState();
      render();
    });
  }

  const quickPatientInput = document.getElementById("quickPatientInput");
  const quickPatientId = document.getElementById("quickPatientId");
  if (quickPatientInput && quickPatientId) {
    const syncQuickPatient = () => {
      const resolvedId = resolvePatientIdFromInput("quickPatientList", quickPatientInput.value);
      quickPatientId.value = resolvedId;
      state.agenda.quickAdd.selectedPatientId = resolvedId;
    };
    quickPatientInput.addEventListener("change", syncQuickPatient);
    quickPatientInput.addEventListener("blur", syncQuickPatient);
  }

  const quickDoctorInput = document.getElementById("quickDoctorInput");
  if (quickDoctorInput) {
    quickDoctorInput.addEventListener("change", () => {
      state.agenda.quickAdd.doctorName = String(quickDoctorInput.value || "").trim();
    });
  }

  const quickUrgentToggle = document.getElementById("quickUrgentToggle");
  if (quickUrgentToggle) {
    quickUrgentToggle.addEventListener("change", () => {
      state.agenda.quickAdd.isUrgent = quickUrgentToggle.checked;
      if (quickUrgentToggle.checked && !state.agenda.quickAdd.reason) {
        state.agenda.quickAdd.reason = "Urgencia";
      }
      render();
    });
  }

  const quickAppointmentForm = document.getElementById("quickAppointmentForm");
  if (quickAppointmentForm) {
    quickAppointmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(quickAppointmentForm);
      const quickPatientInputValue = String(document.getElementById("quickPatientInput")?.value || "");
      const patientId = String(formData.get("patientId") || resolvePatientIdFromInput("quickPatientList", quickPatientInputValue));
      const patient = state.patients.find((item) => item.id === patientId);
      if (!patient) return alert("Selecciona un paciente");

      const payload = {
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: formData.get("doctorName") || "Sin asignar",
        startAt: formData.get("startAt"),
        durationMin: Number(formData.get("durationMin") || (state.agenda.quickAdd.isUrgent ? 20 : 30)),
        box: state.agenda.quickAdd.isUrgent ? "Urgencias" : "General",
        reason: state.agenda.quickAdd.isUrgent
          ? formData.get("reason")
            ? `[URGENCIA] ${String(formData.get("reason") || "").trim()}`
            : "[URGENCIA]"
          : formData.get("reason"),
        notes: formData.get("notes"),
        status: "scheduled"
      };

      const saved = await saveAppointment(payload);
      if (!saved) return alert("No se pudo crear cita");

      resetQuickAddState();
      render();
    });
  }

  const agendaDoctorFilter = document.getElementById("agendaDoctorFilter");
  if (agendaDoctorFilter) {
    agendaDoctorFilter.addEventListener("change", () => {
      if (normalizeWorkflowRole(state.workflow.role) === "doctor" && state.workflow.doctorName) {
        state.agenda.doctorFilter = state.workflow.doctorName;
        return render();
      }
      state.agenda.doctorFilter = agendaDoctorFilter.value || "all";
      render();
    });
  }

  const agendaSlotInterval = document.getElementById("agendaSlotInterval");
  if (agendaSlotInterval) {
    agendaSlotInterval.addEventListener("change", () => {
      const value = Number(agendaSlotInterval.value || 60);
      state.agenda.slotIntervalMin = [10, 30, 60].includes(value) ? value : 60;
      saveAgendaPreferences();
      render();
    });
  }

  const agendaResetScheduleBtn = document.getElementById("agendaResetScheduleBtn");
  if (agendaResetScheduleBtn) {
    agendaResetScheduleBtn.addEventListener("click", () => {
      state.agenda.daySchedules = createDefaultAgendaDaySchedules();
      saveAgendaPreferences();
      render();
    });
  }

  document.querySelectorAll(".agenda-preset-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = String(button.dataset.agendaPreset || "standard");
      state.agenda.daySchedules = createAgendaPresetSchedules(preset);
      saveAgendaPreferences();
      render();
    });
  });

  document.querySelectorAll(".agenda-day-enabled").forEach((input) => {
    input.addEventListener("change", () => {
      const dayKey = String(input.dataset.day || "");
      const row = state.agenda.daySchedules[dayKey];
      if (!row) return;
      row.enabled = input.checked;
      saveAgendaPreferences();
      render();
    });
  });

  document.querySelectorAll(".agenda-day-start").forEach((input) => {
    input.addEventListener("change", () => {
      const dayKey = String(input.dataset.day || "");
      const row = state.agenda.daySchedules[dayKey];
      if (!row) return;
      row.start = input.value || row.start;
      const startMin = timeStringToMinutes(row.start, 8 * 60);
      const endMin = timeStringToMinutes(row.end, 20 * 60);
      if (endMin <= startMin) {
        row.end = minutesToTimeString(Math.min(24 * 60, startMin + 60));
      }
      saveAgendaPreferences();
      render();
    });
  });

  document.querySelectorAll(".agenda-day-end").forEach((input) => {
    input.addEventListener("change", () => {
      const dayKey = String(input.dataset.day || "");
      const row = state.agenda.daySchedules[dayKey];
      if (!row) return;
      row.end = input.value || row.end;
      const startMin = timeStringToMinutes(row.start, 8 * 60);
      const endMin = timeStringToMinutes(row.end, 20 * 60);
      if (endMin <= startMin) {
        row.start = minutesToTimeString(Math.max(0, endMin - 60));
      }
      saveAgendaPreferences();
      render();
    });
  });

  const agendaQuickUrgencyBtn = document.getElementById("agendaQuickUrgencyBtn");
  if (agendaQuickUrgencyBtn) {
    agendaQuickUrgencyBtn.addEventListener("click", () => {
      const now = new Date();
      const nowKey = toDateTimeKey(now);
      state.agenda.currentDate = toDateKey(now);
      state.agenda.selectedDateTime = nowKey;
      state.agenda.view = "day";
      resetQuickAddState(nowKey, { isUrgent: true });
      render();
    });
  }

  document.querySelectorAll(".agenda-view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.agenda.view = button.dataset.view;
      render();
    });
  });

  const agendaTodayBtn = document.getElementById("agendaTodayBtn");
  if (agendaTodayBtn) {
    agendaTodayBtn.addEventListener("click", () => {
      state.agenda.currentDate = toDateKey(new Date());
      render();
    });
  }

  const shiftAgendaDate = (direction) => {
    const current = fromDateKey(state.agenda.currentDate);
    const delta = state.agenda.view === "month" ? 30 : state.agenda.view === "week" ? 7 : 1;
    current.setDate(current.getDate() + direction * delta);
    state.agenda.currentDate = toDateKey(current);
    render();
  };

  const agendaPrevBtn = document.getElementById("agendaPrevBtn");
  if (agendaPrevBtn) {
    agendaPrevBtn.addEventListener("click", () => shiftAgendaDate(-1));
  }

  const agendaNextBtn = document.getElementById("agendaNextBtn");
  if (agendaNextBtn) {
    agendaNextBtn.addEventListener("click", () => shiftAgendaDate(1));
  }

  document.querySelectorAll(".month-day-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const dateKey = button.dataset.date;
      state.agenda.currentDate = dateKey;
      state.agenda.view = "day";
      state.agenda.selectedDateTime = `${dateKey}T09:00`;
      render();
    });
  });

  document.querySelectorAll(".agenda-slot").forEach((slot) => {
    slot.addEventListener("click", (event) => {
      if (event.target.closest(".agenda-event")) return;
      if (slot.dataset.available === "false") return;
      const dateTime = slot.dataset.datetime;
      if (!dateTime) return;
      state.agenda.selectedDateTime = dateTime;
      resetQuickAddState(dateTime, { isUrgent: false });
      render();
    });
  });

  document.querySelectorAll(".agenda-event").forEach((eventButton) => {
    eventButton.addEventListener("click", () => {
      const id = eventButton.dataset.appointmentId;
      const appointment = state.appointments.find((item) => item.id === id);
      if (!appointment) return;
      state.agenda.selectedDateTime = appointmentDateTimeKey(appointment);
      state.agenda.currentDate = String(appointment.startAt || "").slice(0, 10);
      render();
    });

    eventButton.addEventListener("dblclick", () => {
      const id = eventButton.dataset.appointmentId;
      if (!id) return;
      openTreatmentFromAppointment(id);
    });
  });

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const response = await fetch(`/api/appointments/${select.getAttribute("data-appointment-id")}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: select.value })
      });
      if (!response.ok) return alert("No se pudo actualizar estado");
      await fetchAll();
      render();
    });
  });

  const recordPatientInput = document.getElementById("recordPatientInput");
  const recordPatientId = document.getElementById("recordPatientId");
  if (recordPatientInput && recordPatientId) {
    const syncRecordPatient = () => {
      const resolvedId = resolvePatientIdFromInput("recordPatientList", recordPatientInput.value);
      recordPatientId.value = resolvedId;
      state.treatmentDraft.patientId = resolvedId;
    };
    recordPatientInput.addEventListener("change", syncRecordPatient);
    recordPatientInput.addEventListener("blur", syncRecordPatient);
  }

  const recordType = document.getElementById("recordType");
  if (recordType) {
    recordType.addEventListener("change", () => {
      state.treatmentDraft.type = recordType.value;
      render();
    });
  }

  const recordOperatorName = document.getElementById("recordOperatorName");
  if (recordOperatorName) {
    recordOperatorName.addEventListener("change", () => {
      state.treatmentDraft.operatorName = recordOperatorName.value;
    });
  }

  const recordDate = document.getElementById("recordDate");
  if (recordDate) {
    recordDate.addEventListener("change", () => {
      state.treatmentDraft.date = recordDate.value;
    });
  }

  const recordNotes = document.getElementById("recordNotes");
  if (recordNotes) {
    recordNotes.addEventListener("change", () => {
      state.treatmentDraft.notes = recordNotes.value;
    });
  }

  document.querySelectorAll(".tooth").forEach((button) => {
    button.addEventListener("click", () => {
      state.treatmentDraft.selectedTooth = button.dataset.tooth;
      render();
    });
  });

  const odontogramTreatmentInput = document.getElementById("odontogramTreatmentInput");
  const odontogramTreatmentId = document.getElementById("odontogramTreatmentId");
  if (odontogramTreatmentInput && odontogramTreatmentId) {
    const syncOdontogramTreatment = () => {
      const resolvedId = resolveDatalistValueId("odontogramTreatmentList", odontogramTreatmentInput.value);
      odontogramTreatmentId.value = resolvedId;
      state.treatmentDraft.selectedTreatmentId = resolvedId;
    };
    odontogramTreatmentInput.addEventListener("change", syncOdontogramTreatment);
    odontogramTreatmentInput.addEventListener("blur", syncOdontogramTreatment);
  }

  const addToToothBtn = document.getElementById("addToToothBtn");
  if (addToToothBtn) {
    addToToothBtn.addEventListener("click", () => {
      const treatment = treatmentById(state.treatmentDraft.selectedTreatmentId);
      if (!treatment) return alert("Selecciona un tratamiento");
      const qty = Number(document.getElementById("odontogramQty")?.value || 1);
      mergeLine({
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        quantity: qty > 0 ? qty : 1,
        unitPrice: treatment.price,
        toothCode: state.treatmentDraft.selectedTooth,
        note: `Pieza ${state.treatmentDraft.selectedTooth}`
      });
      render();
    });
  }

  const startVoiceBtn = document.getElementById("startVoiceBtn");
  if (startVoiceBtn) {
    startVoiceBtn.addEventListener("click", () => {
      if (!recognition) return;
      state.voice.listening = true;
      recognition.start();
      render();
    });
  }

  const stopVoiceBtn = document.getElementById("stopVoiceBtn");
  if (stopVoiceBtn) {
    stopVoiceBtn.addEventListener("click", () => {
      if (!recognition) return;
      state.voice.listening = false;
      recognition.stop();
      render();
    });
  }

  const voiceTranscript = document.getElementById("voiceTranscript");
  if (voiceTranscript) {
    voiceTranscript.addEventListener("input", () => {
      state.voice.transcript = voiceTranscript.value;
    });
  }

  const processVoiceBtn = document.getElementById("processVoiceBtn");
  if (processVoiceBtn) {
    processVoiceBtn.addEventListener("click", () => {
      state.parsedPreview = parseTranscriptionSmart(state.voice.transcript);
      if (state.parsedPreview.length === 0) {
        alert("No se detectaron tratamientos automaticamente. Puedes usar odontograma o añadir manual.");
      }
      render();
    });
  }

  document.querySelectorAll(".preview-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.previewIndex);
      state.parsedPreview.splice(index, 1);
      render();
    });
  });

  document.querySelectorAll(".preview-qty").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.previewIndex);
      state.parsedPreview[index].quantity = Math.max(1, Number(input.value || 1));
    });
  });

  document.querySelectorAll(".preview-tooth").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.previewIndex);
      state.parsedPreview[index].toothCode = input.value.trim() || null;
    });
  });

  document.querySelectorAll(".preview-treatment").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.previewIndex);
      const treatment = treatmentById(select.value);
      if (!treatment) return;
      state.parsedPreview[index].treatmentId = treatment.id;
      state.parsedPreview[index].treatmentName = treatment.name;
      state.parsedPreview[index].unitPrice = treatment.price;
      state.parsedPreview[index].iconKey = treatment.iconKey || "generic";
      state.parsedPreview[index].colorHex = normalizeTreatmentColorHex(treatment.colorHex);
      render();
    });
  });

  const applyParsedBtn = document.getElementById("applyParsedBtn");
  if (applyParsedBtn) {
    applyParsedBtn.addEventListener("click", () => {
      for (const line of state.parsedPreview) {
        mergeLine(line);
      }
      state.parsedPreview = [];
      render();
    });
  }

  const clearParsedBtn = document.getElementById("clearParsedBtn");
  if (clearParsedBtn) {
    clearParsedBtn.addEventListener("click", () => {
      state.parsedPreview = [];
      render();
    });
  }

  document.querySelectorAll(".line-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.lineIndex);
      state.treatmentDraft.lines.splice(index, 1);
      render();
    });
  });

  document.querySelectorAll(".line-qty").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.lineIndex);
      state.treatmentDraft.lines[index].quantity = Math.max(1, Number(input.value || 1));
      render();
    });
  });

  document.querySelectorAll(".line-tooth").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.lineIndex);
      const value = input.value.trim().toUpperCase();
      state.treatmentDraft.lines[index].toothCode = value || null;
      render();
    });
  });

  document.querySelectorAll(".line-lab-work").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.lineIndex);
      const line = state.treatmentDraft.lines[index];
      if (!line) return;
      line.isLabWork = input.checked;
      if (!line.isLabWork) {
        line.labStatus = "pending";
      }
      render();
    });
  });

  document.querySelectorAll(".line-lab-name").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.lineIndex);
      const line = state.treatmentDraft.lines[index];
      if (!line) return;
      line.labName = input.value || "";
    });
  });

  document.querySelectorAll(".line-lab-cost").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.lineIndex);
      const line = state.treatmentDraft.lines[index];
      if (!line) return;
      line.labCost = Math.max(0, Number(input.value || 0));
      render();
    });
  });

  document.querySelectorAll(".line-lab-status").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.lineIndex);
      const line = state.treatmentDraft.lines[index];
      if (!line) return;
      line.labStatus = select.value === "delivered" ? "delivered" : "pending";
    });
  });

  document.querySelectorAll(".save-lab-job").forEach((button) => {
    button.addEventListener("click", async () => {
      const recordId = button.dataset.recordId;
      const lineIndex = button.dataset.lineIndex;
      const labName = document.querySelector(`.lab-row-lab-name[data-record-id="${recordId}"][data-line-index="${lineIndex}"]`)?.value || "";
      const labCostValue = document.querySelector(`.lab-row-lab-cost[data-record-id="${recordId}"][data-line-index="${lineIndex}"]`)?.value || "0";
      const labStatus = document.querySelector(`.lab-row-status[data-record-id="${recordId}"][data-line-index="${lineIndex}"]`)?.value || "pending";
      const isLabWork = Boolean(document.querySelector(`.lab-row-is-lab[data-record-id="${recordId}"][data-line-index="${lineIndex}"]`)?.checked);

      const response = await fetch(`/api/treatment-records/${recordId}/lines/${lineIndex}/lab`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLabWork,
          labName,
          labCost: Math.max(0, Number(labCostValue || 0)),
          labStatus: labStatus === "delivered" ? "delivered" : "pending"
        })
      });
      if (!response.ok) return alert("No se pudo guardar trabajo de laboratorio");

      await fetchAll();
      render();
    });
  });

  const clearTreatmentDraftBtn = document.getElementById("clearTreatmentDraftBtn");
  if (clearTreatmentDraftBtn) {
    clearTreatmentDraftBtn.addEventListener("click", () => {
      state.treatmentDraft.lines = [];
      state.voice.transcript = "";
      state.parsedPreview = [];
      render();
    });
  }

  const saveTreatmentRecordBtn = document.getElementById("saveTreatmentRecordBtn");
  if (saveTreatmentRecordBtn) {
    saveTreatmentRecordBtn.addEventListener("click", saveTreatmentRecord);
  }

  document.querySelectorAll(".settings-view-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.view = button.dataset.view || "treatments";
      render();
    });
  });

  document.querySelectorAll(".settings-treatment-window-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.treatmentWindow = button.dataset.settingsTreatmentWindow || "catalog";
      render();
    });
  });

  const settingsTreatmentSearch = document.getElementById("settingsTreatmentSearch");
  if (settingsTreatmentSearch) {
    settingsTreatmentSearch.addEventListener("input", () => {
      state.settings.treatmentSearch = settingsTreatmentSearch.value;
      render();
    });
  }

  const settingsPatientSearch = document.getElementById("settingsPatientSearch");
  if (settingsPatientSearch) {
    settingsPatientSearch.addEventListener("input", () => {
      state.settings.patientSearch = settingsPatientSearch.value;
      render();
    });
  }

  const apiBaseConfigForm = document.getElementById("apiBaseConfigForm");
  if (apiBaseConfigForm) {
    apiBaseConfigForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("settingsApiBaseUrl");
      const nextValue = normalizeApiBaseUrl(input?.value || "");
      state.settings.apiBaseUrl = nextValue;
      saveApiBasePreference();
      alert("Conexion guardada. Reinicia la app o recarga para reconectar socket con la nueva URL.");
      render();
    });
  }

  const testApiConnectionBtn = document.getElementById("testApiConnectionBtn");
  if (testApiConnectionBtn) {
    testApiConnectionBtn.addEventListener("click", async () => {
      const input = document.getElementById("settingsApiBaseUrl");
      const nextValue = normalizeApiBaseUrl(input?.value || "");
      state.settings.apiBaseUrl = nextValue;
      saveApiBasePreference();
      const ok = await pingApiHealth().catch(() => false);
      alert(ok ? "Conexion API correcta" : "No se pudo conectar con la API");
    });
  }

  const settingsCreateTreatmentForm = document.getElementById("settingsCreateTreatmentForm");
  if (settingsCreateTreatmentForm) {
    settingsCreateTreatmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(settingsCreateTreatmentForm);
      const payload = {
        name: String(formData.get("name") || "").trim(),
        price: Number(formData.get("price") || 0),
        pieceType: formData.get("pieceType") || "pieza",
        iconKey: formData.get("iconKey") || "generic",
        colorHex: getTreatmentColorByIcon(formData.get("iconKey") || "generic")
      };
      if (!payload.name) return alert("Nombre de tratamiento obligatorio");
      const response = await fetch("/api/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return alert("No se pudo crear tratamiento");
      settingsCreateTreatmentForm.reset();
      await fetchAll();
      render();
    });
  }

  document.querySelectorAll(".save-treatment-setting").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const current = state.treatments.find((item) => item.id === id);
      const name = current?.name || "Tratamiento";
      const price = document.querySelector(`.setting-treatment-price[data-id="${id}"]`)?.value;
      const pieceType = document.querySelector(`.setting-treatment-piece[data-id="${id}"]`)?.value;
      const iconKey = document.querySelector(`.setting-treatment-icon[data-id="${id}"]`)?.value || "generic";
      const colorHex = getTreatmentColorByIcon(iconKey);
      const response = await fetch(`/api/treatments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price), pieceType, iconKey, colorHex })
      });
      if (!response.ok) return alert("No se pudo guardar tratamiento");
      await fetchAll();
      render();
    });
  });

  document.querySelectorAll(".save-patient-setting").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const firstName = document.querySelector(`.setting-patient-first[data-id="${id}"]`)?.value;
      const lastName = document.querySelector(`.setting-patient-last[data-id="${id}"]`)?.value;
      const phone = document.querySelector(`.setting-patient-phone[data-id="${id}"]`)?.value;
      const email = document.querySelector(`.setting-patient-email[data-id="${id}"]`)?.value;
      const response = await fetch(`/api/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, email })
      });
      if (!response.ok) return alert("No se pudo guardar paciente");
      await fetchAll();
      render();
    });
  });

  const reportMonth = document.getElementById("reportMonth");
  if (reportMonth) {
    reportMonth.addEventListener("change", () => {
      state.settings.reports.month = reportMonth.value;
    });
  }
  const reportOperator = document.getElementById("reportOperator");
  if (reportOperator) {
    reportOperator.addEventListener("change", () => {
      state.settings.reports.operatorName = reportOperator.value;
    });
  }
  const reportFrom = document.getElementById("reportFrom");
  if (reportFrom) {
    reportFrom.addEventListener("change", () => {
      state.settings.reports.from = reportFrom.value;
    });
  }
  const reportTo = document.getElementById("reportTo");
  if (reportTo) {
    reportTo.addEventListener("change", () => {
      state.settings.reports.to = reportTo.value;
    });
  }
  const reportPatientId = document.getElementById("reportPatientId");
  if (reportPatientId) {
    reportPatientId.addEventListener("change", () => {
      state.settings.reports.patientId = reportPatientId.value;
    });
  }

  const runDoctorEarningsReport = document.getElementById("runDoctorEarningsReport");
  if (runDoctorEarningsReport) {
    runDoctorEarningsReport.addEventListener("click", async () => {
      const query = new URLSearchParams({ month: state.settings.reports.month });
      if (state.settings.reports.operatorName) query.set("operatorName", state.settings.reports.operatorName);
      const data = await fetch(`/api/reports/doctor-earnings?${query}`).then((res) => res.json());
      state.settings.reportResults.doctorEarnings = data;
      render();
    });
  }

  const runPatientTreatmentsReport = document.getElementById("runPatientTreatmentsReport");
  if (runPatientTreatmentsReport) {
    runPatientTreatmentsReport.addEventListener("click", async () => {
      if (!state.settings.reports.patientId) return alert("Selecciona un paciente para este reporte");
      const query = new URLSearchParams({
        patientId: state.settings.reports.patientId,
        from: state.settings.reports.from,
        to: state.settings.reports.to
      });
      const data = await fetch(`/api/reports/patient-treatments?${query}`).then((res) => res.json());
      state.settings.reportResults.patientTreatments = data;
      render();
    });
  }

  const runTreatmentsSummaryReport = document.getElementById("runTreatmentsSummaryReport");
  if (runTreatmentsSummaryReport) {
    runTreatmentsSummaryReport.addEventListener("click", async () => {
      const query = new URLSearchParams({ from: state.settings.reports.from, to: state.settings.reports.to });
      const data = await fetch(`/api/reports/treatments-summary?${query}`).then((res) => res.json());
      state.settings.reportResults.treatmentsSummary = data;
      render();
    });
  }

  const exportDoctorEarningsCsv = document.getElementById("exportDoctorEarningsCsv");
  if (exportDoctorEarningsCsv) {
    exportDoctorEarningsCsv.addEventListener("click", () => {
      const rows = (state.settings.reportResults.doctorEarnings?.items || []).map((item) => ({
        usuario: item.operatorName,
        registros: item.records,
        total: item.total
      }));
      downloadCsv("ganancias-usuarios.csv", rows);
    });
  }

  const exportDoctorEarningsPdf = document.getElementById("exportDoctorEarningsPdf");
  if (exportDoctorEarningsPdf) {
    exportDoctorEarningsPdf.addEventListener("click", () => {
      const rows = (state.settings.reportResults.doctorEarnings?.items || []).map((item) => [
        item.operatorName,
        item.records,
        formatMoney(item.total)
      ]);
      const subtitle = `Mes: ${state.settings.reports.month}${state.settings.reports.operatorName ? ` | Usuario: ${state.settings.reports.operatorName}` : ""}`;
      printReportPdf({
        title: "Ganancias por usuario",
        subtitle,
        columns: ["Usuario", "Registros", "Total"],
        rows
      });
    });
  }

  const exportPatientTreatmentsCsv = document.getElementById("exportPatientTreatmentsCsv");
  if (exportPatientTreatmentsCsv) {
    exportPatientTreatmentsCsv.addEventListener("click", () => {
      const rows = (state.settings.reportResults.patientTreatments?.records || []).map((item) => ({
        fecha: item.date,
        tipo: item.type,
        lineas: item.lines?.length || 0,
        total: item.total,
        usuario: item.operatorName || ""
      }));
      downloadCsv("tratamientos-paciente.csv", rows);
    });
  }

  const exportPatientTreatmentsPdf = document.getElementById("exportPatientTreatmentsPdf");
  if (exportPatientTreatmentsPdf) {
    exportPatientTreatmentsPdf.addEventListener("click", () => {
      const rows = (state.settings.reportResults.patientTreatments?.records || []).map((item) => [
        item.date,
        item.type,
        item.lines?.length || 0,
        formatMoney(item.total),
        item.operatorName || ""
      ]);
      const selectedPatient = state.patients.find((item) => item.id === state.settings.reports.patientId);
      const subtitle = `Paciente: ${selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "N/A"} | Desde: ${state.settings.reports.from} | Hasta: ${state.settings.reports.to}`;
      printReportPdf({
        title: "Tratamientos por paciente",
        subtitle,
        columns: ["Fecha", "Tipo", "Lineas", "Total", "Usuario"],
        rows
      });
    });
  }

  const exportTreatmentsSummaryCsv = document.getElementById("exportTreatmentsSummaryCsv");
  if (exportTreatmentsSummaryCsv) {
    exportTreatmentsSummaryCsv.addEventListener("click", () => {
      const rows = (state.settings.reportResults.treatmentsSummary?.items || []).map((item) => ({
        tratamiento: item.treatmentName,
        cantidad: item.quantity,
        importe: item.amount
      }));
      downloadCsv("resumen-tratamientos.csv", rows);
    });
  }

  const exportTreatmentsSummaryPdf = document.getElementById("exportTreatmentsSummaryPdf");
  if (exportTreatmentsSummaryPdf) {
    exportTreatmentsSummaryPdf.addEventListener("click", () => {
      const rows = (state.settings.reportResults.treatmentsSummary?.items || []).map((item) => [
        item.treatmentName,
        item.quantity,
        formatMoney(item.amount)
      ]);
      const subtitle = `Desde: ${state.settings.reports.from} | Hasta: ${state.settings.reports.to}`;
      printReportPdf({
        title: "Resumen total de tratamientos",
        subtitle,
        columns: ["Tratamiento", "Cantidad", "Importe"],
        rows
      });
    });
  }

  refreshPreviewSelectDefaults();
}

async function fetchAll() {
  const [dashboard, patients, doctors, appointments, treatments, treatmentRecords, payments, expenses] = await Promise.all([
    fetch("/api/dashboard").then((res) => res.json()),
    fetch("/api/patients").then((res) => res.json()),
    fetch("/api/doctors").then((res) => res.json()),
    fetch("/api/appointments").then((res) => res.json()),
    fetch("/api/treatments").then((res) => res.json()),
    fetch("/api/treatment-records").then((res) => res.json()),
    fetch("/api/payments").then((res) => res.json()),
    fetch("/api/expenses").then((res) => (res.ok ? res.json() : []))
  ]);

  state.dashboard = dashboard;
  state.patients = patients;
  state.doctors = doctors;
  state.appointments = appointments;
  state.treatments = treatments;
  state.treatmentRecords = treatmentRecords;
  state.payments = payments;
  state.expenses = Array.isArray(expenses) ? expenses : [];

  if (!state.treatmentDraft.selectedTreatmentId && treatments.length > 0) {
    state.treatmentDraft.selectedTreatmentId = treatments[0].id;
  }

  if (state.activePatientProfile?.patient?.id) {
    const response = await fetch(`/api/patients/${state.activePatientProfile.patient.id}/profile`);
    if (response.ok) {
      state.activePatientProfile = await response.json();
    }
  }
}

function render() {
  if (!canAccessSection(state.activeSection)) {
    state.activeSection = getVisibleSections()[0] || "inicio";
  }
  applyWorkflowSession();

  buildSidebar();
  applyThemeMode();
  syncTopbarControls();
  content.innerHTML = `${renderWorkspaceBar()}${renderContent()}${renderMobileDock()}${renderWorkflowSessionModal()}`;
  attachEvents();
}

async function init() {
  initSpeechIfNeeded();
  loadAgendaPreferences();
  loadWorkflowPreferences();
  loadThemePreferences();
  loadApiBasePreference();
  applyThemeMode();
  state.ui.sessionModalOpen = !state.workflow.sessionStarted;
  try {
    await fetchAll();
  } catch (_error) {
    connectionStatus.textContent = "Sin conexion API";
    connectionStatus.style.color = "var(--danger)";
    if (isNativeShellRuntime()) {
      state.activeSection = "ajustes";
      state.settings.view = "connection";
    }
  }
  render();

  const socketClientReady = await ensureSocketClient();
  if (!socketClientReady || typeof window.io !== "function") {
    connectionStatus.textContent = "Socket no disponible";
    connectionStatus.style.color = "var(--warn)";
    return;
  }

  const socket = getSocketConnectionUrl() ? io(getSocketConnectionUrl()) : io();
  socket.on("connect", () => {
    connectionStatus.textContent = "Conectado";
    connectionStatus.style.color = "var(--ok)";
  });
  socket.on("disconnect", () => {
    connectionStatus.textContent = "Sin conexion";
    connectionStatus.style.color = "var(--danger)";
  });
  socket.on("data:changed", async () => {
    await fetchAll();
    render();
  });
}

init();
