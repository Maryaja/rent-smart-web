# RENT SMART · Plataforma Inteligente para la Gestión y Alquiler de Vehículos

Versión web — **Etapa 2: Desarrollo base del proyecto**.

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · **MySQL 8**

## Ramas del repositorio



| Rama | Contenido |
| --- | --- |
| `main` | Base: configuración, base de datos y componentes compartidos |
| `paso-1-autenticacion` | base + Paso 1 |
| `paso-2-gestion-vehiculos` | paso 1 + Paso 2 |
| `paso-3-reservas` | paso 2 + Paso 3 |
| `paso-4-contratos-reportes` | paso 3 + Paso 4 |
| `paso-5-dashboards-api` | paso 4 + Paso 5 = proyecto completo |

Cada rama incluye un `PASO.md` con el detalle de lo que aporta.

## Ejecutar

```bash
npm install
cp .env.example .env.local     # ajusta usuario y contraseña de MySQL
npm run db:init                # crea la base y carga los datos de ejemplo
npm run dev                    # http://localhost:3000
```

Requiere **Node.js 20.9+** y **MySQL 8** (o MariaDB 10.4+).

## Esta rama (`main`)

Contiene el andamiaje que todos los módulos comparten:

- Configuración del proyecto (Next.js, TypeScript, Tailwind, ESLint)
- `database/esquema.sql` — las seis tablas y sus relaciones
- `database/semilla.sql` — datos de ejemplo
- `scripts/inicializar-bd.mjs` — `npm run db:init`
- `app/lib/conexion.js` — pool de MySQL, consultas y transacciones
- `app/lib/constantes.js` — catálogos de estados, IVA, condiciones
- `app/lib/http.js` — formato uniforme de respuestas del API
- `app/lib/validaciones.js` — validaciones compartidas cliente/servidor
- `app/lib/utilidades.js` y `app/lib/formato.js`
- `app/components/` — UI reutilizable sin lógica de negocio

La documentación completa está en el README de la rama `paso-5-dashboards-api`.
