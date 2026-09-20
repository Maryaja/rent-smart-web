import { db } from '@/app/lib/db';
import { ok, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { validarLogin, hayErrores } from '@/app/lib/validaciones';
import { crearToken, sanitizarUsuario } from '@/app/lib/sesion';

export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarLogin(body);
  if (hayErrores(errores)) return invalido(errores);

  const email = String(body.email).trim().toLowerCase();
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === email);

  if (!usuario || usuario.password !== body.password)
    return error('Correo o contraseña incorrectos.', 401);

  if (!usuario.activo) return error('La cuenta está desactivada. Contacta al administrador.', 403);

  const cliente = usuario.clienteId ? db.clientes.find((c) => c.id === usuario.clienteId) : null;

  return ok({
    usuario: sanitizarUsuario(usuario),
    cliente,
    token: crearToken(usuario),
  });
});
