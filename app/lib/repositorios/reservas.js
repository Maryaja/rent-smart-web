/** Repositorio de reservas. */

import { consultar, consultarUna, ejecutar, enTransaccion } from '@/app/lib/conexion';
import { ESTADOS_QUE_OCUPAN } from '@/app/lib/constantes';
import { codigo } from '@/app/lib/utilidades';

const COLUMNAS = `
  r.id,
  r.codigo,
  r.vehiculo_id          AS vehiculoId,
  r.cliente_id           AS clienteId,
  r.fecha_inicio         AS fechaInicio,
  r.fecha_fin            AS fechaFin,
  r.dias,
  r.tarifa_diaria        AS tarifaDiaria,
  r.porcentaje_descuento AS porcentajeDescuento,
  r.descuento,
  r.subtotal,
  r.impuesto,
  r.total,
  r.estado,
  r.lugar_entrega        AS lugarEntrega,
  r.observaciones,
  r.motivo_cancelacion   AS motivoCancelacion,
  r.fecha_creacion       AS fechaCreacion
`;

/**
 * Trae en el mismo SELECT los datos del vehículo, del cliente y del
 * contrato asociado. Un solo viaje a la base en lugar de tres.
 */
const SELECT_EXPANDIDO = `
  SELECT
    ${COLUMNAS},
    v.marca        AS vehiculoMarca,
    v.modelo       AS vehiculoModelo,
    v.placa        AS vehiculoPlaca,
    v.categoria    AS vehiculoCategoria,
    c.nombre       AS clienteNombre,
    c.documento    AS clienteDocumento,
    c.email        AS clienteEmail,
    ct.id          AS contratoId,
    ct.codigo      AS contratoCodigo
  FROM reservas r
  JOIN vehiculos v ON v.id = r.vehiculo_id
  JOIN clientes  c ON c.id = r.cliente_id
  LEFT JOIN contratos ct ON ct.reserva_id = r.id AND ct.estado <> 'anulado'
`;

/** Convierte las columnas planas del JOIN en objetos anidados. */
function expandir(fila) {
  if (!fila) return null;
  const {
    vehiculoMarca, vehiculoModelo, vehiculoPlaca, vehiculoCategoria,
    clienteNombre, clienteDocumento, clienteEmail,
    ...reserva
  } = fila;

  return {
    ...reserva,
    vehiculo: {
      id: reserva.vehiculoId,
      marca: vehiculoMarca,
      modelo: vehiculoModelo,
      placa: vehiculoPlaca,
      categoria: vehiculoCategoria,
    },
    cliente: {
      id: reserva.clienteId,
      nombre: clienteNombre,
      documento: clienteDocumento,
      email: clienteEmail,
    },
  };
}

/** filtros: { clienteId, vehiculoId, estado } */
export async function listar(filtros = {}) {
  const condiciones = [];
  const parametros = [];

  if (filtros.clienteId) {
    condiciones.push('r.cliente_id = ?');
    parametros.push(Number(filtros.clienteId));
  }
  if (filtros.vehiculoId) {
    condiciones.push('r.vehiculo_id = ?');
    parametros.push(Number(filtros.vehiculoId));
  }
  if (filtros.estado) {
    condiciones.push('r.estado = ?');
    parametros.push(filtros.estado);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar(
    `${SELECT_EXPANDIDO} ${donde} ORDER BY r.fecha_inicio DESC, r.id DESC`,
    parametros
  );
  return filas.map(expandir);
}

export async function porId(id) {
  const fila = await consultarUna(`${SELECT_EXPANDIDO} WHERE r.id = ?`, [id]);
  return expandir(fila);
}

/** Reservas activas de un vehículo (calendario de ocupación). */
export async function activasDeVehiculo(vehiculoId) {
  const marcadores = ESTADOS_QUE_OCUPAN.map(() => '?').join(', ');
  const filas = await consultar(
    `${SELECT_EXPANDIDO}
     WHERE r.vehiculo_id = ? AND r.estado IN (${marcadores})
     ORDER BY r.fecha_inicio`,
    [Number(vehiculoId), ...ESTADOS_QUE_OCUPAN]
  );
  return filas.map(expandir);
}

/**
 * Busca una reserva activa que se traslape con el rango dado.
 * Dos rangos se traslapan si cada uno empieza antes de que el otro termine.
 * Esta consulta es la que impide la duplicidad de reservas.
 */
export async function buscarTraslape(vehiculoId, fechaInicio, fechaFin, ignorarReservaId = null) {
  const marcadores = ESTADOS_QUE_OCUPAN.map(() => '?').join(', ');
  return consultarUna(
    `
    SELECT r.id, r.codigo, r.fecha_inicio AS fechaInicio, r.fecha_fin AS fechaFin, r.estado
    FROM reservas r
    WHERE r.vehiculo_id = ?
      AND r.estado IN (${marcadores})
      AND r.id <> ?
      AND ? < r.fecha_fin
      AND r.fecha_inicio < ?
    LIMIT 1
    `,
    [Number(vehiculoId), ...ESTADOS_QUE_OCUPAN, ignorarReservaId ?? 0, fechaInicio, fechaFin]
  );
}

/**
 * Crea la reserva y le asigna su código dentro de una transacción:
 * el código depende del id que asigna AUTO_INCREMENT.
 */
export async function crear(reserva) {
  const id = await enTransaccion(async (cx) => {
    const [resultado] = await cx.execute(
      `
      INSERT INTO reservas
        (vehiculo_id, cliente_id, fecha_inicio, fecha_fin, dias, tarifa_diaria,
         porcentaje_descuento, descuento, subtotal, impuesto, total, estado,
         lugar_entrega, observaciones, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        reserva.vehiculoId, reserva.clienteId, reserva.fechaInicio, reserva.fechaFin,
        reserva.dias, reserva.tarifaDiaria, reserva.porcentajeDescuento, reserva.descuento,
        reserva.subtotal, reserva.impuesto, reserva.total, reserva.estado,
        reserva.lugarEntrega, reserva.observaciones, reserva.fechaCreacion,
      ]
    );
    const nuevoId = resultado.insertId;
    await cx.execute('UPDATE reservas SET codigo = ? WHERE id = ?', [codigo('RS', nuevoId), nuevoId]);
    return nuevoId;
  });

  return porId(id);
}

export async function cambiarEstado(id, estado, motivoCancelacion = null) {
  await ejecutar('UPDATE reservas SET estado = ?, motivo_cancelacion = ? WHERE id = ?', [
    estado,
    motivoCancelacion,
    id,
  ]);
  return porId(id);
}

export async function reprogramar(id, fechaInicio, fechaFin, tarifa) {
  await ejecutar(
    `
    UPDATE reservas SET
      fecha_inicio = ?, fecha_fin = ?, dias = ?, tarifa_diaria = ?,
      porcentaje_descuento = ?, descuento = ?, subtotal = ?, impuesto = ?, total = ?
    WHERE id = ?
    `,
    [
      fechaInicio, fechaFin, tarifa.dias, tarifa.tarifaDiaria,
      tarifa.porcentajeDescuento, tarifa.descuento, tarifa.subtotal,
      tarifa.impuesto, tarifa.total, id,
    ]
  );
  return porId(id);
}

export async function eliminar(id) {
  const resultado = await ejecutar('DELETE FROM reservas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

/** ¿El vehículo tiene alguna reserva que lo esté ocupando? */
export async function primeraActivaDeVehiculo(vehiculoId) {
  const marcadores = ESTADOS_QUE_OCUPAN.map(() => '?').join(', ');
  return consultarUna(
    `SELECT id, codigo, estado FROM reservas
     WHERE vehiculo_id = ? AND estado IN (${marcadores})
     ORDER BY fecha_inicio LIMIT 1`,
    [Number(vehiculoId), ...ESTADOS_QUE_OCUPAN]
  );
}
