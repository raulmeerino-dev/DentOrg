# DentOrg - MVP en 4 semanas

## Objetivo del MVP

Lanzar una primera version funcional para uso real en clinica dental, con interfaz unica para todos los usuarios y sincronizacion en tiempo real.

## Alcance cerrado del MVP

- Pacientes
- Agenda y citas
- Presupuestos y tratamientos
- Sesiones clinicas
- Cobros y pagos
- Inventario basico
- Trabajos de laboratorio
- Notificaciones
- Auditoria

---

## Semana 1 - Base operativa y agenda

### Entregables

- Proyecto backend y frontend iniciales.
- Autenticacion con usuario unico `usuario`.
- Modulo Pacientes (alta, edicion, busqueda).
- Modulo Agenda (crear, mover y cancelar citas).
- Estado de cita: `scheduled`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`.

### Criterios de aceptacion

- Se puede crear un paciente en menos de 60 segundos.
- Se puede agendar una cita en menos de 30 segundos.
- Dos dispositivos abiertos ven el mismo cambio de cita en tiempo real (max 2 segundos).

---

## Semana 2 - Tratamiento y presupuesto

### Entregables

- Presupuesto por paciente con lineas de tratamiento.
- Aceptacion de presupuesto.
- Registro de sesion clinica por cita.
- Historial clinico cronologico.

### Criterios de aceptacion

- Desde una cita completada se puede crear una sesion clinica.
- Un presupuesto calcula subtotal, descuento y total.
- El estado del tratamiento se actualiza correctamente: `draft`, `proposed`, `accepted`, `in_progress`, `completed`.

---

## Semana 3 - Cobro, almacen y laboratorio

### Entregables

- Facturas y pagos parciales/totales.
- Caja diaria basica.
- Inventario: articulos + movimientos de entrada/salida/ajuste.
- Trabajo de laboratorio con estados.

### Criterios de aceptacion

- Cada pago afecta saldo pendiente de la factura.
- Si una sesion consume material, se registra salida de stock.
- Trabajo de laboratorio visible con estado: `created`, `sent`, `in_lab`, `received`, `delivered`.

---

## Semana 4 - Comunicacion, calidad y salida a produccion

### Entregables

- Notificaciones internas en tiempo real.
- Recordatorios de cita (email o WhatsApp si integracion activa).
- Auditoria completa de acciones criticas.
- Endurecimiento final: validaciones, UX, rendimiento basico.
- Piloto interno y checklist de salida.

### Criterios de aceptacion

- Cambio critico (cobro, cancelacion, edicion de historia) queda auditado.
- Se emiten recordatorios de citas del dia siguiente.
- Flujo completo funcional: paciente -> cita -> sesion -> cobro -> cierre.

---

## Riesgos y mitigaciones

- Riesgo: caidas de conectividad.  
  Mitigacion: reintentos automaticos y estados de sincronizacion en UI.

- Riesgo: errores por uso simultaneo.  
  Mitigacion: bloqueo optimista y aviso de registro actualizado por otro usuario.

- Riesgo: datos incompletos en carga inicial.  
  Mitigacion: campos obligatorios minimos y validacion de formularios.

---

## Definicion de listo (DoD) por modulo

- Funciona en desktop y tablet.
- Tiene validacion de datos basica.
- Tiene mensajes de error entendibles.
- Tiene auditoria en acciones clave.
- Tiene prueba funcional manual del flujo principal.
