/*
 * RENT SMART · Conexión a MySQL.
 *
 * Un único pool de conexiones para toda la aplicación. Se guarda en
 * globalThis para que el recargado automático de `next dev` no abra un
 * pool nuevo en cada cambio de archivo.
 *
 * Las credenciales se leen de variables de entorno (.env.local).
 */

import mysql from 'mysql2/promise';

function crearPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'iriguchi.proxy.rlwy.net',
    port: Number(process.env.DB_PORT || 38365),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'nkFUmZcWroWYOmEmAGtcoOaihQoFlXIc',
    database: process.env.DB_NAME || 'rent_smart',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL || 10),
    queueLimit: 0,
    // Las fechas llegan como 'YYYY-MM-DD' y los DECIMAL como números,
    // que es como los espera el resto de la aplicación.
    dateStrings: true,
    decimalNumbers: true,
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
  });
}

export function obtenerPool() {
  if (!globalThis.__RENT_SMART_POOL__) {
    globalThis.__RENT_SMART_POOL__ = crearPool();
  }
  return globalThis.__RENT_SMART_POOL__;
}

/*
 * Ejecuta una consulta con parámetros y devuelve las filas.
 * Siempre con `?` — nunca concatenando valores — para evitar inyección SQL.
 */
export async function consultar(sql, parametros = []) {
  const [filas] = await obtenerPool().execute(sql, parametros);
  return filas;
}

/** Devuelve la primera fila, o null si la consulta no trajo ninguna. */
export async function consultarUna(sql, parametros = []) {
  const filas = await consultar(sql, parametros);
  return filas.length > 0 ? filas[0] : null;
}

/*
 * Ejecuta INSERT / UPDATE / DELETE.
 * Devuelve { insertId, affectedRows }.
 */
export async function ejecutar(sql, parametros = []) {
  const [resultado] = await obtenerPool().execute(sql, parametros);
  return resultado;
}

/*
 * Corre varias operaciones dentro de una transacción.
 * Si alguna falla, se revierte todo.
 *
 *   await enTransaccion(async (cx) => {
 *     await cx.execute('INSERT ...', [...]);
 *     await cx.execute('UPDATE ...', [...]);
 *   });
 */
export async function enTransaccion(trabajo) {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await trabajo(conexion);
    await conexion.commit();
    return resultado;
  } catch (e) {
    await conexion.rollback();
    throw e;
  } finally {
    conexion.release();
  }
}

/* Códigos de error de MySQL que conviene distinguir en el API. */
export const ERROR_DUPLICADO = 'ER_DUP_ENTRY';
export const ERROR_LLAVE_FORANEA = 'ER_ROW_IS_REFERENCED_2';
