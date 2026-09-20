/** Repositorio de pagos. */

import { consultar, ejecutar } from '@/app/lib/conexion';
import { codigo } from '@/app/lib/utilidades';

const COLUMNAS = `
  id,
  reserva_id  AS reservaId,
  contrato_id AS contratoId,
  monto,
  metodo,
  estado,
  referencia,
  fecha
`;

/** filtros: { reservaId, contratoId } */
export async function listar(filtros = {}) {
  const condiciones = [];
  const parametros = [];

  if (filtros.reservaId) {
    condiciones.push('reserva_id = ?');
    parametros.push(Number(filtros.reservaId));
  }
  if (filtros.contratoId) {
    condiciones.push('contrato_id = ?');
    parametros.push(Number(filtros.contratoId));
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(`SELECT ${COLUMNAS} FROM pagos ${donde} ORDER BY fecha DESC, id DESC`, parametros);
}

export async function crear(pago) {
  const resultado = await ejecutar(
    `INSERT INTO pagos (reserva_id, contrato_id, monto, metodo, estado, fecha)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pago.reservaId, pago.contratoId ?? null, pago.monto, pago.metodo, pago.estado, pago.fecha]
  );
  const id = resultado.insertId;
  await ejecutar('UPDATE pagos SET referencia = ? WHERE id = ?', [codigo('PG', id), id]);
  return (await listar({ reservaId: pago.reservaId })).find((p) => p.id === id);
}

export async function existeParaReserva(reservaId) {
  const filas = await consultar('SELECT 1 AS existe FROM pagos WHERE reserva_id = ? LIMIT 1', [
    reservaId,
  ]);
  return filas.length > 0;
}

/** Liquida los pagos pendientes de una reserva al finalizarla. */
export async function liquidar(reservaId, montoTotal) {
  await ejecutar(
    "UPDATE pagos SET estado = 'pagado', monto = ? WHERE reserva_id = ? AND estado <> 'pagado'",
    [montoTotal, reservaId]
  );
}

/** Marca como reembolsados los pagos pendientes de una reserva cancelada. */
export async function reembolsar(reservaId) {
  await ejecutar(
    "UPDATE pagos SET estado = 'reembolsado' WHERE reserva_id = ? AND estado <> 'pagado'",
    [reservaId]
  );
}
