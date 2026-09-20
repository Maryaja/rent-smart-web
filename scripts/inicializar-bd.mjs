/**
 * Crea la base de datos de RENT SMART y la llena con datos de ejemplo.

 */

import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const RAIZ = process.cwd();

/** Lector mínimo de .env.local, para no depender de dotenv. */
function cargarEnv() {
  for (const archivo of ['.env.local', '.env']) {
    const ruta = path.join(RAIZ, archivo);
    if (!fs.existsSync(ruta)) continue;

    for (const linea of fs.readFileSync(ruta, 'utf8').split('\n')) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith('#')) continue;
      const separador = limpia.indexOf('=');
      if (separador === -1) continue;
      const clave = limpia.slice(0, separador).trim();
      const valor = limpia.slice(separador + 1).trim().replace(/^["']|["']$/g, '');
      if (!(clave in process.env)) process.env[clave] = valor;
    }
  }
}

function leerSql(nombre) {
  return fs.readFileSync(path.join(RAIZ, 'database', nombre), 'utf8');
}

async function main() {
  cargarEnv();

  const soloEsquema = process.argv.includes('--solo-esquema');

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // el .sql trae varias sentencias
  });

  try {
    console.log('Creando el esquema…');
    await conexion.query(leerSql('esquema.sql'));
    console.log('  Tablas creadas.');

    if (!soloEsquema) {
      console.log('Insertando los datos de ejemplo…');
      await conexion.query(leerSql('semilla.sql'));
      console.log('  Datos insertados.');
    }

    const nombreBd = process.env.DB_NAME || 'rent_smart';
    const [filas] = await conexion.query(
      `SELECT TABLE_NAME AS tabla, TABLE_ROWS AS filas
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [nombreBd]
    );

    console.log(`\nBase de datos "${nombreBd}" lista:`);
    filas.forEach((f) => console.log(`  ${f.tabla}`));
    console.log('\nYa puedes ejecutar: npm run dev');
  } finally {
    await conexion.end();
  }
}

main().catch((e) => {
  console.error('\nNo se pudo inicializar la base de datos.');
  console.error(e.message);
  console.error('\nRevisa que MySQL esté corriendo y que .env.local tenga las credenciales correctas.');
  process.exit(1);
});
