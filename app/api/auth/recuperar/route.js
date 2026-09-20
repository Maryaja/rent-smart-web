import { db } from '@/app/lib/db';
import { ok, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { REGEX_EMAIL, esTextoVacio } from '@/app/lib/validaciones';

/**
 * Recuperación de contraseña (simulada, según lo pedido en el documento).
 *
 * POST { email }                      -> genera y devuelve un código de 6 dígitos
 * POST { email, codigo, password }    -> valida el código y cambia la contraseña
 *
 * Los códigos viven en memoria y expiran a los 10 minutos. En un sistema real
 * se enviarían por correo y nunca se devolverían en la respuesta.
 */

function almacenCodigos() {
  if (!globalThis.__RENT_SMART_CODIGOS__) globalThis.__RENT_SMART_CODIGOS__ = new Map();
  return globalThis.__RENT_SMART_CODIGOS__;
}

export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  if (esTextoVacio(body.email) || !REGEX_EMAIL.test(String(body.email).trim()))
    return invalido({ email: 'Ingresa un correo válido.' });

  const email = String(body.email).trim().toLowerCase();
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === email);
  const codigos = almacenCodigos();

  // Paso 1: solicitar el código
  if (esTextoVacio(body.codigo)) {
    // Respuesta uniforme para no revelar qué correos existen.
    if (!usuario) {
      return ok({
        enviado: true,
        mensaje: 'Si el correo está registrado, recibirás un código de verificación.',
      });
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    codigos.set(email, { codigo, expira: Date.now() + 10 * 60 * 1000 });

    return ok({
      enviado: true,
      mensaje: 'Si el correo está registrado, recibirás un código de verificación.',
      // Solo por ser un entorno de demostración:
      codigoDemo: codigo,
    });
  }

  // Paso 2: confirmar el código y cambiar la contraseña
  const registro = codigos.get(email);
  if (!registro || registro.expira < Date.now()) {
    codigos.delete(email);
    return invalido({ codigo: 'El código expiró. Solicita uno nuevo.' });
  }
  if (registro.codigo !== String(body.codigo).trim())
    return invalido({ codigo: 'El código no es correcto.' });

  if (esTextoVacio(body.password) || String(body.password).length < 8)
    return invalido({ password: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  if (!/[A-Za-z]/.test(body.password) || !/[0-9]/.test(body.password))
    return invalido({ password: 'La contraseña debe combinar letras y números.' });

  if (usuario) usuario.password = body.password;
  codigos.delete(email);

  return ok({ actualizado: true, mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
});
