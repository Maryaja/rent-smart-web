/*
 * Utilidades de sesión
 */

const DURACION_HORAS = 8;

export function crearToken(usuario) {
  const payload = {
    sub: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    exp: Date.now() + DURACION_HORAS * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

export function leerToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* Función para quitar la contraseña antes de enviar el usuario al cliente. */
export function sanitizarUsuario(usuario) {
  if (!usuario) return null;
  const resto = { ...usuario };
  delete resto.password;
  return resto;
}
