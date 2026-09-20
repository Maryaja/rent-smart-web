import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { esTextoVacio, REGEX_EMAIL } from '@/app/lib/validaciones';
import * as repoClientes from '@/app/lib/repositorios/clientes';
import { hoy } from '@/app/lib/utilidades';

/** GET /api/clientes?texto= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const clientes = await repoClientes.listarConResumen(searchParams.get('texto') || null);
  return ok(clientes);
});

/** POST /api/clientes — alta desde el mostrador (operador/administrador). */
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
  if (await repoClientes.existeDocumento(documento))
    return invalido({ documento: 'Ya existe un cliente con este documento.' });

  const id = await repoClientes.crear({
    nombre: String(body.nombre).trim(),
    documento,
    licencia: String(body.licencia || '').trim(),
    telefono: String(body.telefono).trim(),
    email: String(body.email || '').trim().toLowerCase(),
    direccion: String(body.direccion || '').trim(),
    fechaRegistro: hoy(),
  });

  return creado(await repoClientes.porId(id));
});
