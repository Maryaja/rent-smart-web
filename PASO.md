# Rama `contratos-reportes`

**Paso 4 · Contratos y reportes — `ContratoService` / `ReporteService`**

Parte de `paso-3-reservas`.

## Tareas del documento cubiertas

- [x] Desarrollar Pantalla 8 (Gestión de Contratos): generación automática y almacenamiento digital
- [x] Desarrollar el módulo de Reportes (ingresos mensuales, vehículos más solicitados, ocupación)
- [x] Conectar esta lógica con los datos reales del API (no solo datos mock)

## Archivos que aporta esta rama

| Archivo | Qué hace |
| --- | --- |
| `app/lib/facturacion.js` | Qué ocurre al confirmar, finalizar o cancelar una reserva |
| `app/lib/repositorios/contratos.js` | SQL de la tabla `contratos` |
| `app/lib/repositorios/pagos.js` | SQL de la tabla `pagos` |
| `app/lib/repositorios/reportes.js` | Las consultas `GROUP BY` de los reportes |
| `app/contratos/page.jsx` | Pantalla 8 · Gestión de contratos |
| `app/contratos/[id]/page.jsx` | Documento imprimible y descargable |
| `app/reportes/page.jsx` | Módulo de reportes |
| `app/services/contratoService.js` | `ContratoService` |
| `app/services/reporteService.js` | `ReporteService` + exportación a CSV |
| `app/api/contratos/route.js` | `GET` lista · `POST` generar desde reserva |
| `app/api/contratos/[id]/route.js` | `GET` documento + pagos · `PATCH` estado |
| `app/api/reportes/route.js` | Ingresos, demanda y ocupación |
| `app/api/pagos/route.js` | `GET` lista · `POST` registrar pago |

Archivos modificados: `app/api/reservas/[id]/route.js` (confirmar una reserva ahora
genera el contrato y el anticipo) y `app/mis-reservas/page.jsx` (el cliente ya puede
ver su contrato).

## Detalle destacable

Los agregados los calcula MySQL, no JavaScript:

```sql
SELECT DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes,
       COUNT(*) AS reservas, SUM(total) AS ingresos
FROM reservas
WHERE estado IN ('confirmada', 'en_curso', 'finalizada')
  AND fecha_inicio BETWEEN ? AND ?
GROUP BY mes ORDER BY mes
```

`generarContrato()` es idempotente: si la reserva ya tiene contrato vigente, lo
devuelve en vez de crear un duplicado.

## Probar

Confirma una reserva en `/reservas` y observa que el contrato se genera solo. Ábrelo
en `/contratos` y prueba **Imprimir / PDF**. Luego ve a `/reportes` y cambia el período.
