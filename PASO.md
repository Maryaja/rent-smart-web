# Rama `paso-5-dashboards-api`

**Paso 5 · Dashboards, API REST y despliegue — Infraestructura / Reportes**

Parte de `paso-4-contratos-reportes`. Esta rama contiene el **proyecto completo**.

## Tareas del documento cubiertas

- [x] Desarrollar Pantalla 3 (Dashboard Administrativo) y Pantalla 4 (Dashboard Clientes)
- [x] Configurar el API REST que consume todo el equipo
- [x] Integrar Fetch con manejo global de estados de carga y error
- [x] Gestionar el despliegue, el README y la organización del repositorio

## Archivos que aporta esta rama

| Archivo | Qué hace |
| --- | --- |
| `app/admin/page.jsx` | Pantalla 3 · Dashboard administrativo |
| `app/cliente/page.jsx` | Pantalla 4 · Dashboard de clientes |
| `app/components/EstadoGlobal.jsx` | Barra de progreso y notificaciones de error globales |
| `README.md` | Documentación completa del proyecto |

Archivos modificados: `app/layout.tsx` (monta `EstadoGlobal`),
`app/context/AuthContext.jsx` (cada rol va a su dashboard) y
`app/components/Navbar.jsx`.

## Sobre el API REST

El API está repartido por los pasos anteriores (`app/api/**`), porque cada integrante
construyó los endpoints de su módulo. Lo que aporta este paso es la infraestructura
que los unifica: el formato común de respuesta, el cliente HTTP y el manejo global de
carga y error.

## Despliegue

Necesita una base MySQL accesible desde internet. El README explica los pasos para
Vercel; para la exposición suele bastar con ejecutarlo en local.
