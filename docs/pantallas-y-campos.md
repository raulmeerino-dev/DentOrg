# DentOrg - Pantallas y campos (interfaz unica)

Todos los usuarios usan estas mismas pantallas.

## 1. Inicio

### Objetivo

Dar visibilidad rapida de operacion diaria.

### Componentes

- Citas de hoy
- Pacientes en espera
- Cobros pendientes del dia
- Alertas de stock minimo
- Trabajos de laboratorio pendientes

---

## 2. Pacientes

### Tabla principal

- Nombre completo
- DNI/NIE
- Telefono
- Email
- Fecha de nacimiento
- Ultima visita
- Saldo pendiente

### Formulario alta/edicion

- Nombre
- Apellidos
- Documento identificativo
- Fecha de nacimiento
- Telefono principal
- Telefono secundario
- Email
- Direccion
- Observaciones
- Alergias
- Antecedentes medicos
- Consentimiento de datos (si/no)

---

## 3. Agenda

### Vista

- Calendario diario/semanal
- Filtros por box
- Filtros por usuario

### Cita (crear/editar)

- Paciente
- Fecha y hora inicio
- Duracion (min)
- Box/sillon
- Motivo
- Estado
- Notas internas

### Acciones

- Confirmar cita
- Check-in
- Marcar como completada
- Reagendar
- Cancelar

---

## 4. Presupuestos y tratamientos

### Presupuesto

- Paciente
- Fecha
- Estado
- Lineas de tratamiento
- Subtotal
- Descuento
- Total
- Notas

### Linea de tratamiento

- Pieza/zona
- Procedimiento
- Cantidad
- Precio unitario
- Importe

### Tratamiento

- Estado del plan
- Proxima sesion sugerida
- Observaciones clinicas

---

## 5. Sesion clinica

### Datos de sesion

- Paciente
- Cita vinculada
- Fecha
- Acto realizado
- Piezas intervenidas
- Diagnostico
- Evolucion
- Recomendaciones

### Consumo de material

- Material
- Cantidad usada
- Observacion

---

## 6. Cobros

### Factura

- Paciente
- Fecha
- Conceptos
- Base
- Impuestos
- Total
- Estado

### Pago

- Fecha
- Metodo (`efectivo`, `tarjeta`, `transferencia`)
- Importe
- Referencia
- Observaciones

### Indicadores

- Total cobrado hoy
- Pendiente total
- Facturas vencidas

---

## 7. Inventario

### Articulos

- Nombre
- SKU/codigo
- Categoria
- Stock actual
- Stock minimo
- Ubicacion
- Estado

### Movimiento

- Tipo (`entrada`, `salida`, `ajuste`)
- Fecha
- Articulo
- Cantidad
- Motivo
- Usuario

---

## 8. Trabajos de laboratorio

### Registro

- Paciente
- Tipo de trabajo
- Laboratorio
- Fecha envio
- Fecha prevista
- Estado
- Coste
- Notas

### Estados

- created
- sent
- in_lab
- received
- delivered

---

## 9. Comunicacion

### Interna

- Avisos de cita modificada
- Avisos de cobro pendiente
- Avisos de laboratorio recibido

### Paciente

- Confirmacion de cita
- Recordatorio 24h antes
- Aviso de reprogramacion

---

## 10. Auditoria

### Registro minimo

- Usuario
- Fecha y hora
- Modulo
- Accion
- Id del registro afectado
- Valores antes/despues (cuando aplique)

---

## Reglas UX para todas las pantallas

- Busqueda global siempre visible arriba.
- Boton de accion principal fijo (Crear/Guardar).
- Tablas con filtros rapidos y ordenacion.
- Estados con color y etiqueta clara.
- Confirmacion en acciones criticas.
- Maximo 3 clics para llegar a cualquier operacion frecuente.
