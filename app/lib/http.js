/**
 * Helpers para que todos los Route Handlers respondan con el mismo formato.
 *
 *   Éxito  -> { ok: true,  data: ... }
 *   Error  -> { ok: false, mensaje: '...', errores?: { campo: 'motivo' } }
 */

export function ok(data, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function creado(data) {
  return ok(data, 201);
}

export function error(mensaje, status = 400, errores) {
  return Response.json({ ok: false, mensaje, errores }, { status });
}

export function noEncontrado(recurso = 'Recurso') {
  return error(`${recurso} no encontrado.`, 404);
}

export function invalido(errores, mensaje = 'Hay campos con errores de validación.') {
  return error(mensaje, 422, errores);
}

/** Lee el JSON del request sin reventar si viene vacío o malformado. */
export async function leerJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Envuelve un handler para convertir cualquier excepción en un 500 con formato. */
export function manejar(handler) {
  return async (request, contexto) => {
    try {
      return await handler(request, contexto);
    } catch (e) {
      console.error('[API] Error no controlado:', e);
      return error('Ocurrió un error inesperado en el servidor.', 500);
    }
  };
}

/** Convierte el id de la URL (string) a número validado. */
export function idNumerico(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}
