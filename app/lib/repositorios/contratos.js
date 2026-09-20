/** Repositorio de contratos. */

import { consultar, consultarUna, ejecutar, enTransaccion } from '@/app/lib/conexion';
import { codigo } from '@/app/lib/utilidades';

const SELECT_EXPANDIDO = `
  SELECT
    ct.id,
    ct.codigo,
    ct.reserva_id    AS reservaId,
    ct.cliente_id    AS clienteId,
    ct.vehiculo_id   AS vehiculoId,
    ct.fecha_emision AS fechaEmision,
    ct.fecha_inicio  AS fechaInicio,
    ct.fecha_fin     AS fechaFin,
    ct.monto_total   AS montoTotal,
    ct.deposito,
    ct.estado,
    ct.condiciones,
    r.codigo         AS reservaCodigo,
    r.estado         AS estadoReserva,
    v.marca          AS vehiculoMarca,
    v.modelo         AS vehiculoModelo,
    v.placa          AS vehiculoPlaca,
    v.categoria      AS vehiculoCategoria,
    c.nombre         AS clienteNombre,
    c.documento      AS clienteDocumento,
    c.email          AS clienteEmail,
    c.direccion      AS clienteDireccion,
    c.licencia       AS clienteLicencia
  FROM contratos ct
  JOIN reservas  r ON r.id = ct.reserva_id
  JOIN vehiculos v ON v.id = ct.vehiculo_id
  JOIN clientes  c ON c.id = ct.cliente_id
`;

function expandir(fila) {
  if (!fila) return null;
  const {
    vehiculoMarca, vehiculoModelo, vehiculoPlaca, vehiculoCategoria,
    clienteNombre, clienteDocumento, clienteEmail, clienteDireccion, clienteLicencia,
    ...contrato
  } = fila;

  return {
    ...contrato,
    vehiculo: {
      id: contrato.vehiculoId,
      marca: vehiculoMarca,
      modelo: vehiculoModelo,
      placa: vehiculoPlaca,
      categoria: vehiculoCategoria,
    },
    cliente: {
      id: contrato.clienteId,
      nombre: clienteNombre,
      documento: clienteDocumento,
      email: clienteEmail,
      direccion: clienteDireccion,
      licencia: clienteLicencia,
    },
  };
}

/** filtros: { clienteId, estado, texto } */
export async function listar(filtros = {}) {
  const condiciones = [];
  const parametros = [];

  if (filtros.clienteId) {
    condiciones.push('ct.cliente_id = ?');
    parametros.push(Number(filtros.clienteId));
  }
  if (filtros.estado) {
    condiciones.push('ct.estado = ?');
    parametros.push(filtros.estado);
  }
  if (filtros.texto) {
    condiciones.push(
      '(ct.codigo LIKE ? OR r.codigo LIKE ? OR c.nombre LIKE ? OR v.placa LIKE ? OR v.marca LIKE ? OR v.modelo LIKE ?)'
    );
    const patron = `%${filtros.texto}%`;
    parametros.push(patron, patron, patron, patron, patron, patron);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar(
    `${SELECT_EXPANDIDO} ${donde} ORDER BY ct.fecha_emision DESC, ct.id DESC`,
    parametros
  );
  return filas.map(expandir);
}

export async function porId(id) {
  return expandir(await consultarUna(`${SELECT_EXPANDIDO} WHERE ct.id = ?`, [id]));
}

export async function porReserva(reservaId) {
  return expandir(
    await consultarUna(
      `${SELECT_EXPANDIDO} WHERE ct.reserva_id = ? AND ct.estado <> 'anulado' LIMIT 1`,
      [reservaId]
    )
  );
}

/** Crea el contrato y le asigna su código, igual que las reservas. */
export async function crear(contrato) {
  const id = await enTransaccion(async (cx) => {
    const [resultado] = await cx.execute(
      `
      INSERT INTO contratos
        (reserva_id, cliente_id, vehiculo_id, fecha_emision, fecha_inicio, fecha_fin,
         monto_total, deposito, estado, condiciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        contrato.reservaId, contrato.clienteId, contrato.vehiculoId,
        contrato.fechaEmision, contrato.fechaInicio, contrato.fechaFin,
        contrato.montoTotal, contrato.deposito, contrato.estado, contrato.condiciones,
      ]
    );
    const nuevoId = resultado.insertId;
    await cx.execute('UPDATE contratos SET codigo = ? WHERE id = ?', [codigo('CT', nuevoId), nuevoId]);
    return nuevoId;
  });

  return porId(id);
}

export async function cambiarEstado(id, estado) {
  await ejecutar('UPDATE contratos SET estado = ? WHERE id = ?', [estado, id]);
  return porId(id);
}

export async function actualizarCondiciones(id, condiciones) {
  await ejecutar('UPDATE contratos SET condiciones = ? WHERE id = ?', [condiciones, id]);
  return porId(id);
}

/** Cierra o anula el contrato vigente de una reserva. */
export async function cambiarEstadoPorReserva(reservaId, estado) {
  await ejecutar("UPDATE contratos SET estado = ? WHERE reserva_id = ? AND estado = 'vigente'", [
    estado,
    reservaId,
  ]);
}

export async function actualizarVigencia(reservaId, fechaInicio, fechaFin, montoTotal, deposito) {
  await ejecutar(
    `UPDATE contratos
     SET fecha_inicio = ?, fecha_fin = ?, monto_total = ?, deposito = ?
     WHERE reserva_id = ? AND estado = 'vigente'`,
    [fechaInicio, fechaFin, montoTotal, deposito, reservaId]
  );
}

export async function totales() {
  const filas = await consultar(
    'SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(monto_total), 0) AS monto FROM contratos GROUP BY estado'
  );
  return filas;
}
