/** Repositorio de vehículos. */

import { consultar, consultarUna, ejecutar } from '@/app/lib/conexion';

const COLUMNAS = `
  id,
  marca,
  modelo,
  anio,
  placa,
  categoria,
  color,
  transmision,
  combustible,
  capacidad,
  kilometraje,
  precio_por_dia AS precioPorDia,
  estado,
  imagen_url     AS imagenUrl,
  descripcion
`;

/** filtros: { estado, categoria, texto } */
export async function listar(filtros = {}) {
  const condiciones = [];
  const parametros = [];

  if (filtros.estado) {
    condiciones.push('estado = ?');
    parametros.push(filtros.estado);
  }
  if (filtros.categoria) {
    condiciones.push('categoria = ?');
    parametros.push(filtros.categoria);
  }
  if (filtros.texto) {
    condiciones.push(
      '(marca LIKE ? OR modelo LIKE ? OR placa LIKE ? OR categoria LIKE ? OR color LIKE ?)'
    );
    const patron = `%${filtros.texto}%`;
    parametros.push(patron, patron, patron, patron, patron);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(`SELECT ${COLUMNAS} FROM vehiculos ${donde} ORDER BY marca, modelo`, parametros);
}

export async function porId(id) {
  return consultarUna(`SELECT ${COLUMNAS} FROM vehiculos WHERE id = ?`, [id]);
}

export async function existePlaca(placa, exceptoId = null) {
  const fila = await consultarUna(
    'SELECT 1 AS existe FROM vehiculos WHERE placa = ? AND id <> ? LIMIT 1',
    [placa, exceptoId ?? 0]
  );
  return Boolean(fila);
}

export async function crear(v) {
  const resultado = await ejecutar(
    `
    INSERT INTO vehiculos
      (marca, modelo, anio, placa, categoria, color, transmision, combustible,
       capacidad, kilometraje, precio_por_dia, estado, imagen_url, descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      v.marca, v.modelo, v.anio, v.placa, v.categoria, v.color,
      v.transmision, v.combustible, v.capacidad, v.kilometraje,
      v.precioPorDia, v.estado, v.imagenUrl, v.descripcion,
    ]
  );
  return porId(resultado.insertId);
}

export async function actualizar(id, v) {
  await ejecutar(
    `
    UPDATE vehiculos SET
      marca = ?, modelo = ?, anio = ?, placa = ?, categoria = ?, color = ?,
      transmision = ?, combustible = ?, capacidad = ?, kilometraje = ?,
      precio_por_dia = ?, estado = ?, imagen_url = ?, descripcion = ?
    WHERE id = ?
    `,
    [
      v.marca, v.modelo, v.anio, v.placa, v.categoria, v.color,
      v.transmision, v.combustible, v.capacidad, v.kilometraje,
      v.precioPorDia, v.estado, v.imagenUrl, v.descripcion, id,
    ]
  );
  return porId(id);
}

export async function eliminar(id) {
  const resultado = await ejecutar('DELETE FROM vehiculos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

/** Conteo por estado, para las tarjetas de la pantalla de gestión. */
export async function resumenPorEstado() {
  const filas = await consultar(
    'SELECT estado, COUNT(*) AS cantidad FROM vehiculos GROUP BY estado'
  );
  const resumen = { disponible: 0, mantenimiento: 0, no_disponible: 0, total: 0 };
  filas.forEach((f) => {
    resumen[f.estado] = Number(f.cantidad);
    resumen.total += Number(f.cantidad);
  });
  return resumen;
}

export { COLUMNAS };
