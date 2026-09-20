/**
 * Repositorio de reportes.
 *
 * Aquí se ve la ventaja de tener los datos en MySQL: los agregados
 * (sumas, conteos, agrupaciones por mes) los calcula el motor de la base
 * con GROUP BY, no JavaScript recorriendo arreglos.
 */

import { consultar } from '@/app/lib/conexion';
import { ESTADOS_FACTURABLES, ESTADOS_QUE_OCUPAN } from '@/app/lib/constantes';

const MARCADORES_FACTURABLES = ESTADOS_FACTURABLES.map(() => '?').join(', ');

/** Ingresos, reservas y días rentados agrupados por mes. */
export function ingresosMensuales(desde, hasta) {
  return consultar(
    `
    SELECT
      DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes,
      COUNT(*)                           AS reservas,
      COALESCE(SUM(total), 0)            AS ingresos,
      COALESCE(SUM(dias), 0)             AS diasRentados
    FROM reservas
    WHERE estado IN (${MARCADORES_FACTURABLES})
      AND fecha_inicio BETWEEN ? AND ?
    GROUP BY mes
    ORDER BY mes
    `,
    [...ESTADOS_FACTURABLES, desde, hasta]
  );
}

/**
 * Demanda y ocupación por unidad.
 *
 * `diasRentados` recorta cada reserva a la ventana consultada con
 * GREATEST/LEAST: si una renta empieza en diciembre y termina en enero,
 * al consultar enero solo cuentan los días de enero.
 */
export function porVehiculo(desde, hasta) {
  return consultar(
    `
    SELECT
      v.id                        AS vehiculoId,
      CONCAT(v.marca, ' ', v.modelo) AS nombre,
      v.placa,
      v.categoria,
      v.estado,
      COUNT(r.id)                 AS reservas,
      COALESCE(SUM(r.total), 0)   AS ingresos,
      COALESCE(SUM(
        GREATEST(DATEDIFF(LEAST(r.fecha_fin, ?), GREATEST(r.fecha_inicio, ?)), 0)
      ), 0)                       AS diasRentados
    FROM vehiculos v
    LEFT JOIN reservas r
      ON r.vehiculo_id = v.id
     AND r.estado IN (${MARCADORES_FACTURABLES})
     AND r.fecha_inicio BETWEEN ? AND ?
    GROUP BY v.id
    ORDER BY reservas DESC, ingresos DESC
    `,
    [hasta, desde, ...ESTADOS_FACTURABLES, desde, hasta]
  );
}

/** Ingresos y rentas por categoría de vehículo. */
export function porCategoria(desde, hasta) {
  return consultar(
    `
    SELECT
      v.categoria,
      COUNT(r.id)               AS reservas,
      COALESCE(SUM(r.total), 0) AS ingresos
    FROM reservas r
    JOIN vehiculos v ON v.id = r.vehiculo_id
    WHERE r.estado IN (${MARCADORES_FACTURABLES})
      AND r.fecha_inicio BETWEEN ? AND ?
    GROUP BY v.categoria
    ORDER BY ingresos DESC
    `,
    [...ESTADOS_FACTURABLES, desde, hasta]
  );
}

/** Cuántas reservas hay en cada estado dentro del período. */
export function reservasPorEstado(desde, hasta) {
  return consultar(
    `
    SELECT estado, COUNT(*) AS cantidad
    FROM reservas
    WHERE fecha_inicio BETWEEN ? AND ?
    GROUP BY estado
    `,
    [desde, hasta]
  );
}

/** Clientes ordenados por facturación. */
export function mejoresClientes(desde, hasta, limite = 5) {
  return consultar(
    `
    SELECT
      c.id                      AS clienteId,
      c.nombre,
      COUNT(r.id)               AS reservas,
      COALESCE(SUM(r.total), 0) AS facturado
    FROM clientes c
    JOIN reservas r ON r.cliente_id = c.id
    WHERE r.estado IN (${MARCADORES_FACTURABLES})
      AND r.fecha_inicio BETWEEN ? AND ?
    GROUP BY c.id
    ORDER BY facturado DESC
    LIMIT ${Number(limite)}
    `,
    [...ESTADOS_FACTURABLES, desde, hasta]
  );
}

/** Totales del período: ingresos, número de reservas y clientes distintos. */
export function totalesDelPeriodo(desde, hasta) {
  return consultar(
    `
    SELECT
      COUNT(*)                                   AS totalReservas,
      SUM(estado IN (${MARCADORES_FACTURABLES})) AS reservasFacturables,
      COALESCE(SUM(CASE WHEN estado IN (${MARCADORES_FACTURABLES}) THEN total ELSE 0 END), 0)
                                                 AS totalIngresos,
      COUNT(DISTINCT CASE WHEN estado IN (${MARCADORES_FACTURABLES}) THEN cliente_id END)
                                                 AS clientesActivos
    FROM reservas
    WHERE fecha_inicio BETWEEN ? AND ?
    `,
    [...ESTADOS_FACTURABLES, ...ESTADOS_FACTURABLES, ...ESTADOS_FACTURABLES, desde, hasta]
  );
}

/** Estado actual de la flota y cuántas unidades están rentadas en una fecha. */
export function estadoFlota(fecha) {
  const marcadoresOcupan = ESTADOS_QUE_OCUPAN.map(() => '?').join(', ');
  return consultar(
    `
    SELECT
      COUNT(*)                                        AS total,
      SUM(v.estado = 'disponible')                    AS disponibles,
      SUM(v.estado = 'mantenimiento')                 AS mantenimiento,
      SUM(v.estado = 'no_disponible')                 AS noDisponibles,
      SUM(EXISTS (
        SELECT 1 FROM reservas r
        WHERE r.vehiculo_id = v.id
          AND r.estado IN (${marcadoresOcupan})
          AND r.fecha_inicio <= ?
          AND r.fecha_fin >= ?
      ))                                              AS rentadosHoy
    FROM vehiculos v
    `,
    [...ESTADOS_QUE_OCUPAN, fecha, fecha]
  );
}
