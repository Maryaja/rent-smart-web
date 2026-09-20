# RENT SMART · Plataforma Inteligente para la Gestión y Alquiler de Vehículos

Versión web — **Etapa 2: Desarrollo base del proyecto**.

Aplicación construida con **Next.js 16 (App Router)**, **React 19** y **Tailwind CSS 4**.
El API REST vive dentro del mismo proyecto como *Route Handlers* (`app/api/**`), de modo
que todo el sistema se despliega con un solo `deploy` en Vercel.

---

## Índice

1. [Puesta en marcha](#puesta-en-marcha)
2. [Cuentas de prueba](#cuentas-de-prueba)
3. [Modelo de datos base](#modelo-de-datos-base)
4. [Roles y permisos](#roles-y-permisos)
5. [Pantallas](#pantallas)
6. [Arquitectura de carpetas](#arquitectura-de-carpetas)
7. [API REST](#api-rest)
8. [Reglas de negocio](#reglas-de-negocio)
9. [Despliegue en Vercel](#despliegue-en-vercel)
10. [Organización del repositorio](#organización-del-repositorio)
11. [Estado de la Etapa 2](#estado-de-la-etapa-2)

---

## Puesta en marcha

```bash
npm install
npm run dev          # http://localhost:3000
```

Otros comandos:

```bash
npm run build        # compilación de producción
npm start            # servidor de producción
npm run lint         # ESLint
```

No se requiere base de datos ni servicios externos: los datos viven en memoria
(`app/lib/db.js`) con un juego de datos semilla que ya incluye flota, clientes,
reservas históricas, contratos y pagos, para que los reportes muestren información
real desde el primer arranque.

> **Nota:** al reiniciar el servidor los datos vuelven al estado semilla. Para
> conectar un backend real basta con cambiar `NEXT_PUBLIC_API_URL` y respetar el
> contrato descrito en [API REST](#api-rest); la capa de servicios y las pantallas
> no cambian.

### Variables de entorno (opcionales)

Copia `.env.example` a `.env.local` si necesitas apuntar a otro backend:

```
NEXT_PUBLIC_API_URL=/api
```

---

## Cuentas de prueba

| Rol           | Correo                   | Contraseña   |
| ------------- | ------------------------ | ------------ |
| Administrador | admin@rentsmart.com      | Admin123     |
| Operador      | operador@rentsmart.com   | Operador123  |
| Cliente       | cliente@rentsmart.com    | Cliente123   |

La pantalla de inicio de sesión incluye botones para rellenar estas credenciales.

---

## Modelo de datos base

Entidades acordadas por el equipo, definidas en `app/lib/db.js`:

| Entidad      | Campos principales |
| ------------ | ------------------ |
| **Usuario**  | `id, nombre, email, password, rol, telefono, activo, clienteId, fechaRegistro` |
| **Cliente**  | `id, usuarioId, nombre, documento, licencia, telefono, email, direccion, fechaRegistro` |
| **Vehiculo** | `id, marca, modelo, anio, placa, categoria, color, transmision, combustible, capacidad, kilometraje, precioPorDia, estado, imagenUrl, descripcion` |
| **Reserva**  | `id, codigo, vehiculoId, clienteId, fechaInicio, fechaFin, dias, tarifaDiaria, descuento, subtotal, impuesto, total, estado, lugarEntrega, observaciones` |
| **Contrato** | `id, codigo, reservaId, clienteId, vehiculoId, fechaEmision, fechaInicio, fechaFin, montoTotal, deposito, estado, condiciones` |
| **Pago**     | `id, reservaId, contratoId, monto, metodo, estado, referencia, fecha` |

Catálogos de estados:

- **Vehículo:** `disponible` · `mantenimiento` · `no_disponible`
- **Reserva:** `pendiente` · `confirmada` · `en_curso` · `finalizada` · `cancelada`
- **Contrato:** `vigente` · `finalizado` · `anulado`

---

## Roles y permisos

| Ruta                | Administrador | Operador | Cliente |
| ------------------- | :-----------: | :------: | :-----: |
| `/admin`            | ✅ | ✅ | ❌ |
| `/vehiculos`        | ✅ | ✅ | ❌ |
| `/reservas`         | ✅ | ✅ | ❌ |
| `/contratos`        | ✅ | ✅ | ❌ |
| `/reportes`         | ✅ | ✅ | ❌ |
| `/cliente`          | ❌ | ❌ | ✅ |
| `/mis-reservas`     | ❌ | ❌ | ✅ |
| `/buscar`, `/vehiculos/[id]`, `/contratos/[id]` | ✅ | ✅ | ✅ |

La protección se implementa con el componente `<RutaProtegida roles={[...]}>`
(`app/components/RutaProtegida.jsx`): sin sesión redirige a `/login` conservando la
ruta de destino; con un rol no autorizado muestra un aviso de acceso restringido.

---

## Pantallas

| # | Pantalla | Ruta | Paso |
| - | -------- | ---- | ---- |
| 1 | Inicio de sesión | `/login` | 1 |
| 2 | Registro de clientes | `/registro` | 1 |
| — | Recuperación de contraseña | `/recuperar` | 1 |
| 3 | Dashboard administrativo | `/admin` | 5 |
| 4 | Dashboard de clientes | `/cliente` | 5 |
| 5 | Gestión de vehículos | `/vehiculos` | 2 |
| 6 | Búsqueda y reserva | `/buscar` | 3 |
| 7 | Detalle del vehículo | `/vehiculos/[id]` | 3 |
| 8 | Gestión de contratos | `/contratos` · `/contratos/[id]` | 4 |
| — | Reportes | `/reportes` | 4 |
| — | Reservas (back-office) | `/reservas` | 3 |
| — | Mis reservas (cliente) | `/mis-reservas` | 3 |

---

## Arquitectura de carpetas

Separación **UI / lógica / datos**:

```
app/
├─ api/                 → API REST (Route Handlers)
│  ├─ auth/{login,registro,recuperar}/
│  ├─ vehiculos/{,[id],disponibles}/
│  ├─ clientes/ · reservas/{,[id]} · contratos/{,[id]} · pagos/ · reportes/
├─ components/          → UI reutilizable (Navbar, RutaProtegida, Etiqueta, Tarjetas…)
├─ context/
│  └─ AuthContext.jsx   → estado global (usuario y rol activo) con Context API + useReducer
├─ lib/                 → capa de datos y reglas
│  ├─ db.js             → entidades y datos semilla
│  ├─ negocio.js        → disponibilidad, tarifas, flujo de estados, contratos
│  ├─ validaciones.js   → validaciones compartidas cliente/servidor
│  ├─ http.js           → formato uniforme de respuestas del API
│  ├─ sesion.js         → emisión y lectura del token
│  └─ formato.js        → moneda, fechas y etiquetas
├─ services/            → consumo del API desde la UI
│  ├─ apiClient.js      → fetch centralizado + estados globales de carga/error
│  ├─ usuarioService.js · vehiculoService.js · reservaService.js
│  ├─ contratoService.js · reporteService.js · clienteService.js
└─ (pantallas)          → login, registro, admin, cliente, vehiculos, buscar…
```

---

## API REST

Todas las respuestas comparten el mismo formato:

```jsonc
// Éxito
{ "ok": true, "data": { /* … */ } }

// Error
{ "ok": false, "mensaje": "…", "errores": { "campo": "motivo" } }
```

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/registro` | Registro de cliente |
| `POST` | `/api/auth/recuperar` | Solicita código / cambia contraseña |
| `GET`  | `/api/vehiculos` | Lista (filtros `estado`, `categoria`, `texto`) |
| `POST` | `/api/vehiculos` | Registrar vehículo |
| `GET`  | `/api/vehiculos/disponibles` | Libres en un rango, con cotización |
| `GET`  | `/api/vehiculos/:id` | Ficha + reservas activas |
| `PUT`  | `/api/vehiculos/:id` | Editar |
| `DELETE` | `/api/vehiculos/:id` | Eliminar (bloqueado si tiene reservas activas) |
| `GET`  | `/api/clientes` | Lista con resumen de facturación |
| `POST` | `/api/clientes` | Alta desde mostrador |
| `GET`  | `/api/reservas` | Filtros `clienteId`, `vehiculoId`, `estado` |
| `POST` | `/api/reservas` | Crear (verifica disponibilidad y calcula tarifa) |
| `GET`  | `/api/reservas/:id` | Detalle |
| `PATCH`| `/api/reservas/:id` | Cambiar estado o reprogramar fechas |
| `DELETE` | `/api/reservas/:id` | Eliminar (solo pendientes o canceladas) |
| `GET`  | `/api/contratos` | Lista |
| `POST` | `/api/contratos` | Generar desde una reserva confirmada |
| `GET`  | `/api/contratos/:id` | Documento + pagos |
| `PATCH`| `/api/contratos/:id` | Cambiar estado o condiciones |
| `GET`  | `/api/pagos` | Filtros `reservaId`, `contratoId` |
| `POST` | `/api/pagos` | Registrar pago |
| `GET`  | `/api/reportes` | Ingresos, demanda y ocupación (`desde`, `hasta`) |

El consumo se hace siempre a través de `app/services/apiClient.js`, que centraliza
la URL base, el token, el manejo de errores y emite los eventos globales de carga
(barra de progreso) y de error (notificaciones), renderizados por
`app/components/EstadoGlobal.jsx`.

---

## Reglas de negocio

**Disponibilidad.** Un vehículo está libre en un rango si su estado es `disponible`
y no existe otra reserva en `pendiente`, `confirmada` o `en_curso` cuyo período se
traslape. Esto impide la duplicidad de reservas tanto desde la UI como desde el API.

**Cálculo de tarifas.**

```
bruto     = días × precioPorDía
descuento = 5 % (≥ 3 días) · 10 % (≥ 7 días) · 20 % (≥ 30 días)
subtotal  = bruto − descuento
IVA       = subtotal × 13 %
total     = subtotal + IVA
depósito  = total × 20 %
```

**Flujo de estados de la reserva.**

```
pendiente ──► confirmada ──► en_curso ──► finalizada
    │              │
    └──────────────┴──► cancelada
```

- Al pasar a **confirmada** se genera automáticamente el contrato y el anticipo.
- Al **finalizar** se cierra el contrato y los pagos quedan como `pagado`.
- Al **cancelar** el contrato se anula, los pagos pendientes se marcan
  `reembolsado` y el vehículo vuelve a quedar libre en esas fechas.
- Cualquier transición fuera de este flujo devuelve `409` con el detalle.

---

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repo.
3. Framework: **Next.js** (se detecta solo). No hay que cambiar los comandos.
4. Variables de entorno: ninguna obligatoria. Si usarás un backend externo, agrega
   `NEXT_PUBLIC_API_URL`.
5. **Deploy**.

Cada `push` a `main` genera un despliegue de producción y cada Pull Request un
*preview deployment*.

---

## Organización del repositorio

Ramas sugeridas, una por paso de la Etapa 2:

```
main                              ← código estable y desplegado
└─ develop                        ← integración
   ├─ feature/autenticacion       (Paso 1)
   ├─ feature/gestion-vehiculos   (Paso 2)
   ├─ feature/reservas            (Paso 3)
   ├─ feature/contratos-reportes  (Paso 4)
   └─ feature/dashboards-api      (Paso 5)
```

Convención de commits: `tipo(alcance): descripción` — por ejemplo
`feat(reservas): verificar disponibilidad antes de crear`.

---

## Estado de la Etapa 2

| Paso | Módulo | Estado |
| ---- | ------ | ------ |
| 1 | Autenticación y arquitectura base · `UsuarioService` | ✅ Completo |
| 2 | Gestión de vehículos · `VehiculoService` | ✅ Completo |
| 3 | Lógica de negocio central · `ReservaService` | ✅ Completo |
| 4 | Contratos y reportes · `ContratoService` / `ReporteService` | ✅ Completo |
| 5 | Dashboards, API REST y despliegue · Infraestructura | ✅ Completo |

Detalle por paso:

**Paso 1** — Proyecto Next.js con separación UI/lógica/datos · estado global con
Context API · Pantallas 1 y 2 · rutas protegidas por rol · recuperación de
contraseña con código de verificación.

**Paso 2** — Pantalla 5 con alta, edición, baja y listado · estados de
disponibilidad · validaciones de placa, año, precio y categoría (mismas reglas en
cliente y servidor) · manejo de errores en cada operación CRUD.

**Paso 3** — Pantallas 6 y 7 · verificación de disponibilidad contra traslapes ·
cálculo de tarifas con descuentos e IVA · flujo completo de estados de la reserva.

**Paso 4** — Pantalla 8 con generación automática y versión imprimible del
contrato · módulo de reportes (ingresos mensuales, vehículos más solicitados,
ocupación, categorías y mejores clientes) alimentado por el API, no por datos mock.

**Paso 5** — Pantallas 3 y 4 · API REST completa en `app/api` · `apiClient` con
manejo global de carga y error · README, `.env.example` y configuración lista para
Vercel.
