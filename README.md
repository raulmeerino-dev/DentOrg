# DentOrg

App de gestion integral para clinica dental con interfaz unica para todos los usuarios.

## Estado actual

Primera version funcional implementada con:

- Backend API (`Express`) con persistencia local en `data/db.json`
- UI web unificada para todos los usuarios
- Sincronizacion en tiempo real con `Socket.IO`
- Modulos funcionales iniciales: `Inicio`, `Pacientes`, `Agenda`, `Tratamientos`
- En `Tratamientos`: dictado por voz, parser local, previsualizacion editable y odontograma interactivo
- Catalogo completo de tratamientos y precios importado desde `PresDent 2.0` (81 tratamientos)
- Navegacion con iconos, paneles reorganizados y accesos rapidos para carga de tratamientos
- Nuevo modulo `Ajustes`: edicion de pacientes y tratamientos/precios
- Reportes exportables (CSV): ganancias por usuario/mes, tratamientos de paciente por rango y resumen total por rango
- Perfiles completos de paciente: citas, presupuestos, tratamientos realizados, pagos y saldos pendientes
- Modulos preparados para siguiente sprint: `Cobros`, `Inventario`, `Trabajos`, `Comunicacion`

## Principios de producto

- Un solo tipo de usuario: `usuario`
- Misma interfaz y opciones para toda la clinica
- Datos compartidos y actualizacion en vivo
- Flujo operativo simple y rapido

## Estructura del proyecto

- `src/server.js`: API REST + eventos tiempo real
- `src/store.js`: logica de datos y persistencia local
- `public/index.html`: layout principal
- `public/styles.css`: estilos UI
- `public/app.js`: logica de frontend
- `docs/MVP-4-semanas.md`: roadmap de entrega
- `docs/pantallas-y-campos.md`: detalle funcional

## Endpoints implementados

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/patients`
- `POST /api/patients`
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- `GET /api/treatments`
- `POST /api/treatments`
- `PATCH /api/treatments/:id`
- `GET /api/treatment-records`
- `POST /api/treatment-records`
- `GET /api/patients/:id/profile`
- `GET /api/payments`
- `POST /api/payments`
- `PATCH /api/patients/:id`
- `GET /api/reports/doctor-earnings`
- `GET /api/reports/patient-treatments`
- `GET /api/reports/treatments-summary`

## Flujo de tratamientos por voz

1. Ir a `Tratamientos`.
2. Seleccionar paciente y tipo (`Presupuesto` o `Tratamiento realizado`).
3. Dictar con `Iniciar grabacion` y luego `Procesar texto`.
4. Revisar/editar previsualizacion detectada.
5. Aplicar lineas y ajustar en el odontograma interactivo.
6. Guardar el registro.

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar servidor:

```bash
npm start
```

3. Abrir en navegador:

`http://localhost:4010`

## APK e IPA (Capacitor)

La app ya queda preparada para empaquetado nativo con `Capacitor`.

### Scripts disponibles

- `npm run mobile:init:android` -> crea el proyecto Android (`android/`)
- `npm run mobile:init:ios` -> crea el proyecto iOS (`ios/`, requiere macOS)
- `npm run mobile:sync` -> sincroniza los cambios web al proyecto nativo
- `npm run mobile:android` -> abre Android Studio
- `npm run mobile:ipa` -> abre Xcode (solo macOS)

### Flujo recomendado

1. `npm install`
2. `npm run mobile:init:android`
3. `npm run mobile:sync`
4. `npm run mobile:android`
5. Desde Android Studio: Build > Generate Signed Bundle / APK

Para iOS (en Mac):

1. `npm run mobile:init:ios`
2. `npm run mobile:sync`
3. `npm run mobile:ipa`
4. Archivar y exportar IPA desde Xcode

### Configuración de API para móvil

En `Ajustes > Conexion` puedes definir la URL base de la API:

- En web local: dejar vacío
- En APK/IPA: usar URL pública o IP LAN (ejemplo `http://192.168.1.20:4010`)

La configuración se guarda en `localStorage` con clave `dentorg:api-base-url`.

## Siguiente desarrollo recomendado

- Completar modulos de tratamientos y cobros
- Agregar auditoria de acciones criticas
- Incorporar control de inventario y laboratorio end-to-end
- Migrar de persistencia local a PostgreSQL
