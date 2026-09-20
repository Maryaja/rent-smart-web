/**
 * Cliente HTTP único de la aplicación (Paso 5).
 *
 * - Centraliza la URL base, las cabeceras y el token de sesión.
 * - Normaliza la respuesta del API ({ ok, data, mensaje, errores }).
 * - Emite eventos globales de carga y error para que la UI muestre
 *   la barra de progreso y las notificaciones sin repetir código en
 *   cada pantalla.
 *
 * Se usa fetch (nativo en Next.js) en lugar de Axios para no agregar
 * dependencias; la interfaz expuesta es equivalente.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const CLAVE_TOKEN = 'rentsmart.token';

/* --------------------- Bus de eventos global ----------------------- */

const suscriptores = { carga: new Set(), error: new Set() };
let peticionesEnCurso = 0;

function emitir(evento, dato) {
  suscriptores[evento].forEach((fn) => {
    try {
      fn(dato);
    } catch (e) {
      console.error('[apiClient] suscriptor falló:', e);
    }
  });
}

export function alCambiarCarga(callback) {
  suscriptores.carga.add(callback);
  return () => suscriptores.carga.delete(callback);
}

export function alOcurrirError(callback) {
  suscriptores.error.add(callback);
  return () => suscriptores.error.delete(callback);
}

function iniciarPeticion() {
  peticionesEnCurso += 1;
  if (peticionesEnCurso === 1) emitir('carga', true);
}

function terminarPeticion() {
  peticionesEnCurso = Math.max(0, peticionesEnCurso - 1);
  if (peticionesEnCurso === 0) emitir('carga', false);
}

/* --------------------------- Token -------------------------------- */

export function guardarToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(CLAVE_TOKEN, token);
  else window.localStorage.removeItem(CLAVE_TOKEN);
}

export function obtenerToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CLAVE_TOKEN);
}

/* ------------------------ Error tipado ----------------------------- */

export class ApiError extends Error {
  constructor(mensaje, { status = 0, errores = null, datos = null } = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.errores = errores; // { campo: 'motivo' }
    this.datos = datos;
  }
}

/* --------------------------- Núcleo -------------------------------- */

function construirUrl(ruta, params) {
  const base = ruta.startsWith('http') ? ruta : `${API_BASE}${ruta}`;
  if (!params) return base;

  const limpios = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!limpios.length) return base;

  const query = new URLSearchParams(limpios.map(([k, v]) => [k, String(v)])).toString();
  return `${base}${base.includes('?') ? '&' : '?'}${query}`;
}

async function peticion(metodo, ruta, { body, params, silencioso = false } = {}) {
  const url = construirUrl(ruta, params);
  const token = obtenerToken();

  iniciarPeticion();
  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    let cuerpo = null;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = null;
    }

    if (!respuesta.ok || (cuerpo && cuerpo.ok === false)) {
      const mensaje =
        (cuerpo && cuerpo.mensaje) ||
        `Error ${respuesta.status}: no se pudo completar la operación.`;
      const err = new ApiError(mensaje, {
        status: respuesta.status,
        errores: cuerpo ? cuerpo.errores : null,
        datos: cuerpo,
      });
      if (!silencioso) emitir('error', err);
      throw err;
    }

    return cuerpo ? cuerpo.data : null;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Fallo de red / servidor caído
    const err = new ApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
      { status: 0 }
    );
    if (!silencioso) emitir('error', err);
    throw err;
  } finally {
    terminarPeticion();
  }
}

export const apiClient = {
  get: (ruta, opciones) => peticion('GET', ruta, opciones),
  post: (ruta, body, opciones) => peticion('POST', ruta, { ...opciones, body }),
  put: (ruta, body, opciones) => peticion('PUT', ruta, { ...opciones, body }),
  patch: (ruta, body, opciones) => peticion('PATCH', ruta, { ...opciones, body }),
  delete: (ruta, opciones) => peticion('DELETE', ruta, opciones),
};

export default apiClient;
