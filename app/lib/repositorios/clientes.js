import { consultar, consultarUna, ejecutar } from '@/app/lib/conexion';
import { ESTADOS_FACTURABLES } from '@/app/lib/constantes';

const SELECT_BASE = `
  SELECT
    c.id,
    u.id           AS usuarioId,
    c.nombre,
    c.documento,
    c.licencia,
    c.telefono,
    c.email,
    c.direccion,
    c.fecha_registro AS fechaRegistro
  FROM clientes c
  LEFT JOIN usuarios u ON u.cliente_id = c.id
`;

export async function porId(id) {
  return consultarUna(`${SELECT_BASE} WHERE c.id = ?`, [id]);
}

export async function existeDocumento(documento) {
  const fila = await consultarUna('SELECT 1 AS existe FROM clientes WHERE documento = ? LIMIT 1', [
    String(documento).trim(),
  ]);
  return Boolean(fila);
}

/* Lista de clientes con el resumen de su facturación */
export async function listarConResumen(texto = null) {
  const marcadores = ESTADOS_FACTURABLES.map(() => '?').join(', ');
  const parametros = [...ESTADOS_FACTURABLES];

  let filtro = '';
  if (texto) {
    filtro = 'WHERE c.nombre LIKE ? OR c.documento LIKE ? OR c.email LIKE ?';
    const patron = `%${texto}%`;
    parametros.push(patron, patron, patron);
  }

  return consultar(
    `
    SELECT
      c.id,
      c.nombre,
      c.documento,
      c.licencia,
      c.telefono,
      c.email,
      c.direccion,
      c.fecha_registro AS fechaRegistro,
      COUNT(r.id) AS totalReservas,
      COALESCE(SUM(CASE WHEN r.estado = 'finalizada' THEN r.total ELSE 0 END), 0) AS totalFacturado
    FROM clientes c
    LEFT JOIN reservas r ON r.cliente_id = c.id AND r.estado IN (${marcadores})
    ${filtro}
    GROUP BY c.id
    ORDER BY c.nombre
    `,
    parametros
  );
}

export async function crear(cliente, conexion = null) {
  const sql = `
    INSERT INTO clientes (nombre, documento, licencia, telefono, email, direccion, fecha_registro)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const valores = [
    cliente.nombre,
    cliente.documento,
    cliente.licencia || '',
    cliente.telefono || '',
    cliente.email || '',
    cliente.direccion || '',
    cliente.fechaRegistro,
  ];

  const resultado = conexion
    ? (await conexion.execute(sql, valores))[0]
    : await ejecutar(sql, valores);

  return resultado.insertId;
}
