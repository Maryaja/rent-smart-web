# RENT SMART · Plataforma Inteligente para la Gestión y Alquiler de Vehículos

Versión web — **Etapa 2: Desarrollo base del proyecto**.

**Next.js 16 (App Router)** · **React 19** · **Tailwind CSS 4** · **MySQL 8**

El API REST vive dentro del mismo proyecto como *Route Handlers* (`app/api/**`) y
habla con MySQL a través de una capa de repositorios.

---

## Índice

1. [Requisitos](#requisitos)
2. [Puesta en marcha](#puesta-en-marcha)
3. [Cuentas de prueba](#cuentas-de-prueba)
4. [Base de datos](#base-de-datos)
5. [Arquitectura](#arquitectura)
6. [Roles y permisos](#roles-y-permisos)
7. [Pantallas](#pantallas)
8. [API REST](#api-rest)
9. [Reglas de negocio](#reglas-de-negocio)
10. [Ramas del repositorio](#ramas-del-repositorio)
11. [Despliegue](#despliegue)

---

## Requisitos

- **Node.js 20.9** o superior
- **MySQL 8.0** o superior (también funciona con MariaDB 10.4+)

---

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Credenciales de la base de datos
cp .env.example .env.local        # Windows: copy .env.example .env.local
#    edita .env.local con tu usuario y contraseña de MySQL

# 3. Crear la base de datos y cargar los datos de ejemplo
npm run db:init

# 4. Arrancar
npm run dev                       # http://localhost:3000
```

`npm run db:init` crea la base `rent_smart`, sus seis tablas y un juego de datos de
ejemplo (8 vehículos, 3 clientes y 22 reservas con sus contratos y pagos). Para
recrear solo la estructura, sin datos:

```bash
npm run db:init -- --solo-esquema
```

### Variables de entorno (`.env.local`)

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=rent_smart
DB_POOL=10
NEXT_PUBLIC_API_URL=/api
```

### Si prefieres ejecutar el SQL a mano

```bash
mysql -u root -p < database/esquema.sql
mysql -u root -p < database/semilla.sql
```

También puedes abrir esos dos archivos en MySQL Workbench o phpMyAdmin.

---

## Cuentas de prueba

| Rol           | Correo                   | Contraseña   |
| ------------- | ------------------------ | ------------ |
| Administrador | admin@rentsmart.com      | Admin123     |
| Operador      | operador@rentsmart.com   | Operador123  |
| Cliente       | cliente@rentsmart.com    | Cliente123   |

La pantalla de inicio de sesión incluye botones para rellenar estas credenciales.

---

## Base de datos

Seis tablas, definidas en `database/esquema.sql`:

| Tabla | Contenido |
| --- | --- |
| `clientes` | Datos del arrendatario: nombre, DUI, licencia, dirección |
| `usuarios` | Credenciales y rol; los clientes apuntan a su ficha con `cliente_id` |
| `vehiculos` | La flota, con su tarifa diaria y su estado de disponibilidad |
| `reservas` | Une un vehículo con un cliente en un rango de fechas |
| `contratos` | Se generan al confirmar una reserva |
| `pagos` | Anticipos y liquidaciones de cada contrato |

### Relaciones

```
usuarios.cliente_id   → clientes.id
reservas.vehiculo_id  → vehiculos.id
reservas.cliente_id   → clientes.id
contratos.reserva_id  → reservas.id    (ON DELETE CASCADE)
pagos.reserva_id      → reservas.id    (ON DELETE CASCADE)
pagos.contrato_id     → contratos.id
```

### Catálogos de estados

Se modelan con `ENUM`, de modo que la propia base rechaza un valor inválido:

- **Vehículo:** `disponible` · `mantenimiento` · `no_disponible`
- **Reserva:** `pendiente` · `confirmada` · `en_curso` · `finalizada` · `cancelada`
- **Contrato:** `vigente` · `finalizado` · `anulado`
- **Pago:** `anticipo` · `pagado` · `reembolsado`

### Convención de nombres

En la base los nombres van en `snake_case` (`precio_por_dia`); en la aplicación, en
`camelCase` (`precioPorDia`). La traducción se hace con alias en cada `SELECT`, dentro
de los repositorios:

```sql
SELECT precio_por_dia AS precioPorDia FROM vehiculos
```

### Índices

`ix_reservas_disponibilidad (vehiculo_id, estado, fecha_inicio, fecha_fin)` es el que
sostiene la verificación de disponibilidad, que es la consulta más frecuente del
sistema.

---

## Arquitectura

Cinco capas; ninguna conoce los detalles de la siguiente:

```
Pantallas (app/*/page.jsx)
    ↓
Servicios (app/services/)
    ↓
apiClient.js  ──HTTP──>  API REST (app/api/**/route.js)
                              ↓
                         Reglas de negocio (app/lib/negocio.js)
                              ↓
                         Repositorios (app/lib/repositorios/)
                              ↓
                         MySQL (app/lib/conexion.js)
```

```
app/
├─ api/                    → API REST (Route Handlers)
├─ components/             → UI reutilizable
├─ context/AuthContext.jsx → estado global (usuario y rol activo)
├─ lib/
│  ├─ conexion.js          → pool de MySQL, consultas y transacciones
│  ├─ repositorios/        → TODO el SQL del proyecto vive aquí
│  ├─ negocio.js           → disponibilidad, tarifas, flujo de estados
│  ├─ facturacion.js       → contratos y pagos automáticos
│  ├─ constantes.js        → catálogos de estados, IVA, condiciones
│  ├─ validaciones.js      → validaciones compartidas cliente/servidor
│  ├─ http.js              → formato uniforme de respuestas
│  ├─ sesion.js            → emisión y lectura del token
│  └─ utilidades.js        → fechas, redondeo, códigos
├─ services/               → consumo del API desde la UI
└─ (pantallas)
database/
├─ esquema.sql             → estructura de las seis tablas
└─ semilla.sql             → datos de ejemplo
scripts/
└─ inicializar-bd.mjs      → npm run db:init
```

**Las rutas del API nunca escriben SQL.** Piden los datos a un repositorio. Eso
mantiene las consultas en un solo lugar y permite cambiarlas sin tocar el API.

### Seguridad de las consultas

Todas las consultas usan parámetros (`?`), nunca concatenación de texto:

```js
await consultar('SELECT ... FROM vehiculos WHERE placa = ?', [placa]);
```

Es lo que evita la inyección SQL.

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

La protección se implementa con `<RutaProtegida roles={[...]}>`
(`app/components/RutaProtegida.jsx`).

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

## API REST

Formato uniforme de respuesta:

```jsonc
{ "ok": true,  "data": { /* … */ } }
{ "ok": false, "mensaje": "…", "errores": { "campo": "motivo" } }
```

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/registro` | Registro de cliente (transacción cliente + usuario) |
| `POST` | `/api/auth/recuperar` | Solicita código / cambia contraseña |
| `GET`  | `/api/vehiculos` | Lista (filtros `estado`, `categoria`, `texto`) |
| `POST` | `/api/vehiculos` | Registrar vehículo |
| `GET`  | `/api/vehiculos/disponibles` | Libres en un rango, con cotización |
| `GET`  | `/api/vehiculos/:id` | Ficha + reservas activas |
| `PUT`  | `/api/vehiculos/:id` | Editar |
| `DELETE` | `/api/vehiculos/:id` | Eliminar (bloqueado si tiene reservas) |
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

---

## Reglas de negocio

### Disponibilidad

Un vehículo está libre en un rango si su estado es `disponible` y no existe otra
reserva activa cuyo período se traslape. La consulta está en
`app/lib/repositorios/reservas.js`:

```sql
SELECT r.id, r.codigo, r.fecha_inicio, r.fecha_fin
FROM reservas r
WHERE r.vehiculo_id = ?
  AND r.estado IN ('pendiente', 'confirmada', 'en_curso')
  AND r.id <> ?
  AND ? < r.fecha_fin          -- el nuevo inicio es anterior al fin existente
  AND r.fecha_inicio < ?       -- y el inicio existente es anterior al nuevo fin
LIMIT 1
```

Esas dos últimas condiciones son toda la regla del traslape.

### Cálculo de tarifas

```
bruto     = días × precio_por_dia
descuento = 5 % (≥ 3 días) · 10 % (≥ 7 días) · 20 % (≥ 30 días)
subtotal  = bruto − descuento
IVA       = subtotal × 13 %
total     = subtotal + IVA
depósito  = total × 20 %
```

### Flujo de estados de la reserva

```
pendiente ──► confirmada ──► en_curso ──► finalizada
    │              │
    └──────────────┴──► cancelada
```

- Al **confirmar** se genera el contrato y se registra el anticipo.
- Al **finalizar** se cierra el contrato y los pagos quedan como `pagado`.
- Al **cancelar** el contrato se anula, los pagos pendientes pasan a `reembolsado`
  y el vehículo vuelve a quedar libre en esas fechas.
- Cualquier transición fuera del flujo devuelve `409` con el detalle.

### Reportes

Los agregados los calcula MySQL, no JavaScript. Por ejemplo, los ingresos mensuales:

```sql
SELECT DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes,
       COUNT(*)      AS reservas,
       SUM(total)    AS ingresos
FROM reservas
WHERE estado IN ('confirmada', 'en_curso', 'finalizada')
  AND fecha_inicio BETWEEN ? AND ?
GROUP BY mes
ORDER BY mes
```

---

## Ramas del repositorio

El trabajo está separado por los cinco pasos de la Etapa 2. Cada rama parte de la
anterior, de modo que cualquiera se puede instalar y ejecutar.

| Rama | Contenido |
| --- | --- |
| `main` | Base: configuración, base de datos y componentes compartidos |
| `paso-1-autenticacion` | base + Paso 1 |
| `paso-2-gestion-vehiculos` | paso 1 + Paso 2 |
| `paso-3-reservas` | paso 2 + Paso 3 |
| `paso-4-contratos-reportes` | paso 3 + Paso 4 |
| `paso-5-dashboards-api` | paso 4 + Paso 5 = proyecto completo |

Cada rama incluye un `PASO.md` con el detalle de lo que aporta.

---

## Despliegue

Con MySQL el despliegue necesita una base accesible desde internet (PlanetScale,
Railway, Clever Cloud, Aiven o un servidor propio). En Vercel:

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. En **Settings → Environment Variables**, define `DB_HOST`, `DB_PORT`, `DB_USER`,
   `DB_PASSWORD` y `DB_NAME` apuntando a esa base.
3. Ejecuta `database/esquema.sql` y `database/semilla.sql` contra ella una sola vez.
4. **Deploy**.

Para la exposición suele bastar con ejecutarlo en local contra el MySQL de tu
máquina.
