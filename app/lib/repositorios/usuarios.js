import { consultar, consultarUna, ejecutar } from '@/app/lib/conexion';
import bcrypt from 'bcryptjs';

const COLUMNAS = `
  id,
  nombre,
  email,
  password,
  rol,
  telefono,
  activo,
  cliente_id     AS clienteId,
  fecha_registro AS fechaRegistro
`;

function mapear(fila) {
  if (!fila) return null;
  return { ...fila, activo: Boolean(fila.activo) };
}

export async function porEmail(email) {
  const fila = await consultarUna(
    `SELECT ${COLUMNAS} FROM usuarios WHERE email = ? LIMIT 1`,
    [String(email).trim().toLowerCase()]
  );
  return mapear(fila);
}

export async function porId(id) {
  const fila = await consultarUna(`SELECT ${COLUMNAS} FROM usuarios WHERE id = ?`, [id]);
  return mapear(fila);
}

export async function listar() {
  const filas = await consultar(`SELECT ${COLUMNAS} FROM usuarios ORDER BY nombre`);
  return filas.map(mapear);
}

export async function existeEmail(email) {
  const fila = await consultarUna('SELECT 1 AS existe FROM usuarios WHERE email = ? LIMIT 1', [
    String(email).trim().toLowerCase(),
  ]);
  return Boolean(fila);
}

export async function crear(usuario, conexion = null) {
  const passwordHash = await bcrypt.hash(usuario.password, 12);
  const sql = `
    INSERT INTO usuarios (nombre, email, password, rol, telefono, activo, cliente_id, fecha_registro)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const valores = [
    usuario.nombre,
    usuario.email,
    passwordHash,
    usuario.rol,
    usuario.telefono || '',
    usuario.activo === false ? 0 : 1,
    usuario.clienteId ?? null,
    usuario.fechaRegistro,
  ];

  const resultado = conexion
    ? (await conexion.execute(sql, valores))[0]
    : await ejecutar(sql, valores);

  return resultado.insertId;
}

export async function cambiarPassword(email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const resultado = await ejecutar('UPDATE usuarios SET password = ? WHERE email = ?', [
    passwordHash,
    String(email).trim().toLowerCase(),
  ]);
  return resultado.affectedRows > 0;
}

export async function verificarPassword(passwordPlano, passwordHash) {
  return bcrypt.compare(passwordPlano, passwordHash);
}