import { creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { validarRegistro, hayErrores } from '@/app/lib/validaciones';
import { crearToken, sanitizarUsuario } from '@/app/lib/sesion';
import { enTransaccion } from '@/app/lib/conexion';
import * as repoUsuarios from '@/app/lib/repositorios/usuarios';
import * as repoClientes from '@/app/lib/repositorios/clientes';
import { hoy } from '@/app/lib/utilidades';

/* Registro de cliente: crea la ficha de Cliente y su Usuario con rol "cliente" */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarRegistro(body);
  if (hayErrores(errores)) return invalido(errores);

  const email = String(body.email).trim().toLowerCase();
  if (await repoUsuarios.existeEmail(email))
    return invalido({ email: 'Ya existe una cuenta con este correo.' }, 'El correo ya está registrado.');

  const documento = String(body.documento).trim();
  if (await repoClientes.existeDocumento(documento))
    return invalido({ documento: 'Ya existe un cliente con este documento.' });

  const fechaRegistro = hoy();

  // Cliente y usuario se crean juntos
  const { clienteId, usuarioId } = await enTransaccion(async (cx) => {
    const nuevoClienteId = await repoClientes.crear(
      {
        nombre: String(body.nombre).trim(),
        documento,
        licencia: String(body.licencia || '').trim(),
        telefono: String(body.telefono).trim(),
        email,
        direccion: String(body.direccion || '').trim(),
        fechaRegistro,
      },
      cx
    );

    const nuevoUsuarioId = await repoUsuarios.crear(
      {
        nombre: String(body.nombre).trim(),
        email,
        password: body.password,
        rol: 'cliente',
        telefono: String(body.telefono).trim(),
        activo: true,
        clienteId: nuevoClienteId,
        fechaRegistro,
      },
      cx
    );

    return { clienteId: nuevoClienteId, usuarioId: nuevoUsuarioId };
  });

  const usuario = await repoUsuarios.porId(usuarioId);
  const cliente = await repoClientes.porId(clienteId);

  return creado({
    usuario: sanitizarUsuario(usuario),
    cliente,
    token: crearToken(usuario),
  });
});
