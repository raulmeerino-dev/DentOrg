import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import {
  createAppointment,
  createDoctor,
  createExpense,
  createPatient,
  createPayment,
  createTreatmentCatalogItem,
  createTreatmentRecord,
  getAppointments,
  getDashboard,
  getDoctors,
  getExpenses,
  getPatientProfile,
  getPatients,
  getPayments,
  getReportDoctorEarnings,
  getReportPatientTreatments,
  getReportTreatmentsSummary,
  getTreatmentCatalog,
  getTreatmentRecords,
  updateAppointment,
  updateAppointmentNotes,
  updateTreatmentRecordLabLine,
  updateDoctor,
  updatePatient,
  updateAppointmentStatus,
  updateTreatmentCatalogItem
} from "./store.js";

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 4010;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "DentOrg API" });
});

app.get("/api/dashboard", (_req, res) => {
  res.json(getDashboard());
});

app.get("/api/patients", (_req, res) => {
  res.json(getPatients());
});

app.get("/api/doctors", (_req, res) => {
  res.json(getDoctors());
});

app.post("/api/doctors", (req, res) => {
  const { name } = req.body || {};
  if (!String(name || "").trim()) {
    return res.status(400).json({ error: "name es obligatorio" });
  }
  const doctor = createDoctor(req.body || {});
  io.emit("data:changed", { resource: "doctors" });
  return res.status(201).json(doctor);
});

app.patch("/api/doctors/:id", (req, res) => {
  const updated = updateDoctor(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: "Doctor no encontrado" });
  }
  io.emit("data:changed", { resource: "doctors" });
  return res.json(updated);
});

app.post("/api/patients", (req, res) => {
  const { firstName, lastName, phone } = req.body || {};
  if (!firstName || !lastName || !phone) {
    return res.status(400).json({
      error: "Campos obligatorios: firstName, lastName, phone"
    });
  }

  const patient = createPatient(req.body);
  io.emit("data:changed", { resource: "patients" });
  return res.status(201).json(patient);
});

app.patch("/api/patients/:id", (req, res) => {
  const updated = updatePatient(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: "Paciente no encontrado" });
  }
  io.emit("data:changed", { resource: "patients" });
  return res.json(updated);
});

app.get("/api/patients/:id/profile", (req, res) => {
  const profile = getPatientProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: "Paciente no encontrado" });
  }
  return res.json(profile);
});

app.get("/api/appointments", (_req, res) => {
  res.json(getAppointments());
});

app.post("/api/appointments", (req, res) => {
  const { patientId, patientName, startAt } = req.body || {};
  if (!patientId || !patientName || !startAt) {
    return res.status(400).json({
      error: "Campos obligatorios: patientId, patientName, startAt"
    });
  }

  const appointment = createAppointment(req.body);
  io.emit("data:changed", { resource: "appointments" });
  return res.status(201).json(appointment);
});

app.patch("/api/appointments/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: "status es obligatorio" });
  }

  const updated = updateAppointmentStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }

  io.emit("data:changed", { resource: "appointments" });
  return res.json(updated);
});

app.patch("/api/appointments/:id", (req, res) => {
  const updated = updateAppointment(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }

  io.emit("data:changed", { resource: "appointments" });
  return res.json(updated);
});

app.patch("/api/appointments/:id/notes", (req, res) => {
  const notes = String(req.body?.notes || "");
  const updated = updateAppointmentNotes(req.params.id, notes);
  if (!updated) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }

  io.emit("data:changed", { resource: "appointments" });
  return res.json(updated);
});

app.get("/api/treatments", (_req, res) => {
  res.json(getTreatmentCatalog());
});

app.post("/api/treatments", (req, res) => {
  const { name, price } = req.body || {};
  if (!name || Number.isNaN(Number(price))) {
    return res.status(400).json({ error: "Campos obligatorios: name, price" });
  }

  const treatment = createTreatmentCatalogItem(req.body);
  io.emit("data:changed", { resource: "treatments" });
  return res.status(201).json(treatment);
});

app.patch("/api/treatments/:id", (req, res) => {
  const updated = updateTreatmentCatalogItem(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: "Tratamiento no encontrado" });
  }
  io.emit("data:changed", { resource: "treatments" });
  return res.json(updated);
});

app.get("/api/treatment-records", (_req, res) => {
  res.json(getTreatmentRecords());
});

app.post("/api/treatment-records", (req, res) => {
  const { patientId, patientName, lines } = req.body || {};
  if (!patientId || !patientName || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({
      error: "Campos obligatorios: patientId, patientName, lines"
    });
  }

  const record = createTreatmentRecord(req.body);
  io.emit("data:changed", { resource: "treatment-records" });
  return res.status(201).json(record);
});

app.patch("/api/treatment-records/:recordId/lines/:lineIndex/lab", (req, res) => {
  const updated = updateTreatmentRecordLabLine(req.params.recordId, req.params.lineIndex, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: "Linea de trabajo de laboratorio no encontrada" });
  }
  io.emit("data:changed", { resource: "treatment-records" });
  return res.json(updated);
});

app.get("/api/payments", (_req, res) => {
  res.json(getPayments());
});

app.post("/api/payments", (req, res) => {
  const { patientId, amount } = req.body || {};
  if (!patientId || Number.isNaN(Number(amount))) {
    return res.status(400).json({ error: "Campos obligatorios: patientId, amount" });
  }

  const payment = createPayment(req.body);
  io.emit("data:changed", { resource: "payments" });
  return res.status(201).json(payment);
});

app.get("/api/expenses", (_req, res) => {
  res.json(getExpenses());
});

app.post("/api/expenses", (req, res) => {
  const { amount } = req.body || {};
  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Campo obligatorio: amount > 0" });
  }

  const expense = createExpense(req.body || {});
  io.emit("data:changed", { resource: "expenses" });
  return res.status(201).json(expense);
});

app.get("/api/reports/doctor-earnings", (req, res) => {
  const data = getReportDoctorEarnings({
    operatorName: req.query.operatorName,
    month: req.query.month
  });
  return res.json(data);
});

app.get("/api/reports/patient-treatments", (req, res) => {
  const { patientId, from, to } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: "patientId es obligatorio" });
  }
  const data = getReportPatientTreatments({ patientId, from, to });
  return res.json(data);
});

app.get("/api/reports/treatments-summary", (req, res) => {
  const data = getReportTreatmentsSummary({
    from: req.query.from,
    to: req.query.to
  });
  return res.json(data);
});

io.on("connection", (socket) => {
  socket.emit("connected", { ok: true, at: new Date().toISOString() });
});

httpServer.listen(PORT, () => {
  console.log(`DentOrg ejecutandose en http://localhost:${PORT}`);
});
