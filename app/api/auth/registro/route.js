import { db } from '@/app/lib/db';
import { creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { validarRegistro, hayErrores } from '@/app/lib/validaciones';
import { crearToken, sanitizarUsuario } from '@/app/lib/sesion';

/** Registro público: siempre crea un usuario con rol "cliente" + su ficha de Cliente. */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarRegistro(body);
  if (hayErrores(errores)) return invalido(errores);

  const email = String(body.email).trim().toLowerCase();
  if (db.usuarios.some((u) => u.email.toLowerCase() === email))
    return invalido({ email: 'Ya existe una cuenta con este correo.' }, 'El correo ya está registrado.');

  const documento = String(body.documento).trim();
  if (db.clientes.some((c) => c.documento === documento))
    return invalido({ documento: 'Ya existe un cliente con este documento.' });

  const hoy = new Date().toISOString().slice(0, 10);

  const clienteId = db.siguienteId('clientes');
  const cliente = {
    id: clienteId,
    usuarioId: null,
    nombre: String(body.nombre).trim(),
    documento,
    licencia: String(body.licencia || '').trim(),
    telefono: String(body.telefono).trim(),
    email,
    direccion: String(body.direccion || '').trim(),
    fechaRegistro: hoy,
  };

  const usuarioId = db.siguienteId('usuarios');
  const usuario = {
    id: usuarioId,
    nombre: cliente.nombre,
    email,
    password: body.password,
    rol: 'cliente',
    telefono: cliente.telefono,
    activo: true,
    clienteId,
    fechaRegistro: hoy,
  };

  cliente.usuarioId = usuarioId;
  db.clientes.push(cliente);
  db.usuarios.push(usuario);

  return creado({
    usuario: sanitizarUsuario(usuario),
    cliente,
    token: crearToken(usuario),
  });
});
