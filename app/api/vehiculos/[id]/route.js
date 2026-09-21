import { ok, error, invalido, noEncontrado, leerJson, manejar, idNumerico } from '@/app/lib/http';
import { validarVehiculo, hayErrores } from '@/app/lib/validaciones';
import * as repoVehiculos from '@/app/lib/repositorios/vehiculos';
import * as repoReservas from '@/app/lib/repositorios/reservas';

/** GET /api/vehiculos/:id — vehículo + sus reservas activas (Pantalla 7) */
export const GET = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const vehiculo = await repoVehiculos.porId(id);
  if (!vehiculo) return noEncontrado('Vehículo');

  const reservasActivas = await repoReservas.activasDeVehiculo(id);
  return ok({ ...vehiculo, reservasActivas });
});

/** PUT /api/vehiculos/:id */
export const PUT = manejar(async (request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const vehiculo = await repoVehiculos.porId(id);
  if (!vehiculo) return noEncontrado('Vehículo');

  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarVehiculo({ ...vehiculo, ...body });
  if (hayErrores(errores)) return invalido(errores);

  const placa = String(body.placa ?? vehiculo.placa).trim().toUpperCase();
  if (await repoVehiculos.existePlaca(placa, id))
    return invalido({ placa: 'Otro vehículo ya usa esta placa.' });

  // Si se saca de circulación, no puede tener reservas activas.
  const nuevoEstado = body.estado ?? vehiculo.estado;
  if (nuevoEstado !== 'disponible' && vehiculo.estado === 'disponible') {
    const conflicto = await repoReservas.primeraActivaDeVehiculo(id);
    if (conflicto)
      return invalido(
        { estado: `No se puede cambiar el estado: la reserva ${conflicto.codigo} sigue activa.` },
        'El vehículo tiene reservas activas.'
      );
  }

  const actualizado = await repoVehiculos.actualizar(id, {
    marca: String(body.marca ?? vehiculo.marca).trim(),
    modelo: String(body.modelo ?? vehiculo.modelo).trim(),
    anio: Number(body.anio ?? vehiculo.anio),
    placa,
    categoria: String(body.categoria ?? vehiculo.categoria).trim(),
    color: String(body.color ?? vehiculo.color).trim(),
    transmision: body.transmision ?? vehiculo.transmision,
    combustible: body.combustible ?? vehiculo.combustible,
    capacidad: Number(body.capacidad ?? vehiculo.capacidad),
    kilometraje: Number(body.kilometraje ?? vehiculo.kilometraje),
    precioPorDia: Number(body.precioPorDia ?? vehiculo.precioPorDia),
    estado: nuevoEstado,
    imagenUrl: String(body.imagenUrl ?? vehiculo.imagenUrl ?? '').trim(),
    descripcion: String(body.descripcion ?? vehiculo.descripcion ?? '').trim(),
  });

  return ok(actualizado);
});

/** DELETE /api/vehiculos/:id */
export const DELETE = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const vehiculo = await repoVehiculos.porId(id);
  if (!vehiculo) return noEncontrado('Vehículo');

  const conflicto = await repoReservas.primeraActivaDeVehiculo(id);
  if (conflicto)
    return error(
      `No se puede eliminar: el vehículo tiene la reserva ${conflicto.codigo} activa. Cámbialo a "no disponible" en su lugar.`,
      409
    );

  // La llave foránea impide borrar un vehículo con historial de reservas.
  try {
    await repoVehiculos.eliminar(id);
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)
      return error(
        'No se puede eliminar: el vehículo tiene reservas registradas en su historial. Cámbialo a "no disponible".',
        409
      );
    throw e;
  }

  return ok({ eliminado: true, vehiculo });
});
