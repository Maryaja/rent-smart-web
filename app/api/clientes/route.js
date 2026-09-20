import { db } from '@/app/lib/db';
import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { esTextoVacio, REGEX_EMAIL } from '@/app/lib/validaciones';

/** GET /api/clientes?texto= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const texto = searchParams.get('texto');

  let lista = [...db.clientes];
  if (texto) {
    const t = texto.toLowerCase();
    lista = lista.filter((c) => `${c.nombre} ${c.documento} ${c.email}`.toLowerCase().includes(t));
  }

  const conResumen = lista.map((c) => {
    const reservas = db.reservas.filter((r) => r.clienteId === c.id);
    return {
      ...c,
      totalReservas: reservas.length,
      totalFacturado: reservas
        .filter((r) => r.estado === 'finalizada')
        .reduce((suma, r) => suma + r.total, 0),
    };
  });

  return ok(conResumen.sort((a, b) => a.nombre.localeCompare(b.nombre)));
});

/** POST /api/clientes — alta de cliente desde el mostrador (operador/administrador). */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = {};
  if (esTextoVacio(body.nombre)) errores.nombre = 'El nombre es obligatorio.';
  if (esTextoVacio(body.documento)) errores.documento = 'El documento es obligatorio.';
  if (esTextoVacio(body.telefono)) errores.telefono = 'El teléfono es obligatorio.';
  if (!esTextoVacio(body.email) && !REGEX_EMAIL.test(String(body.email).trim()))
    errores.email = 'Formato de correo inválido.';
  if (Object.keys(errores).length) return invalido(errores);

  const documento = String(body.documento).trim();
  if (db.clientes.some((c) => c.documento === documento))
    return invalido({ documento: 'Ya existe un cliente con este documento.' });

  const cliente = {
    id: db.siguienteId('clientes'),
    usuarioId: null,
    nombre: String(body.nombre).trim(),
    documento,
    licencia: String(body.licencia || '').trim(),
    telefono: String(body.telefono).trim(),
    email: String(body.email || '').trim().toLowerCase(),
    direccion: String(body.direccion || '').trim(),
    fechaRegistro: new Date().toISOString().slice(0, 10),
  };

  db.clientes.push(cliente);
  return creado(cliente);
});
