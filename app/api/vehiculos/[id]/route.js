import { db } from '@/app/lib/db';
import { ok, error, invalido, noEncontrado, leerJson, manejar, idNumerico } from '@/app/lib/http';
import { validarVehiculo, hayErrores } from '@/app/lib/validaciones';
import { ESTADOS_QUE_OCUPAN, expandirReserva } from '@/app/lib/negocio';

function buscar(id) {
  return db.vehiculos.find((v) => v.id === id);
}

/** GET /api/vehiculos/:id  -> vehículo + sus reservas activas (Pantalla 7) */
export const GET = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const vehiculo = buscar(id);
  if (!vehiculo) return noEncontrado('Vehículo');

  const reservasActivas = db.reservas
    .filter((r) => r.vehiculoId === id && ESTADOS_QUE_OCUPAN.includes(r.estado))
    .map(expandirReserva)
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

  return ok({ ...vehiculo, reservasActivas });
});

/** PUT /api/vehiculos/:id */
export const PUT = manejar(async (request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const vehiculo = buscar(id);
  if (!vehiculo) return noEncontrado('Vehículo');

  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarVehiculo({ ...vehiculo, ...body });
  if (hayErrores(errores)) return invalido(errores);

  const placa = String(body.placa ?? vehiculo.placa).trim().toUpperCase();
  if (db.vehiculos.some((v) => v.placa === placa && v.id !== id))
    return invalido({ placa: 'Otro vehículo ya usa esta placa.' });

  // Si se saca de circulación, no puede tener reservas activas.
  const nuevoEstado = body.estado ?? vehiculo.estado;
  if (nuevoEstado !== 'disponible' && vehiculo.estado === 'disponible') {
    const conflicto = db.reservas.find(
      (r) => r.vehiculoId === id && ESTADOS_QUE_OCUPAN.includes(r.estado)
    );
    if (conflicto)
      return invalido(
        { estado: `No se puede cambiar el estado: la reserva ${conflicto.codigo} sigue activa.` },
        'El vehículo tiene reservas activas.'
      );
  }

  Object.assign(vehiculo, {
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

  return ok(vehiculo);
});

/** DELETE /api/vehiculos/:id */
export const DELETE = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const indice = db.vehiculos.findIndex((v) => v.id === id);
  if (indice === -1) return noEncontrado('Vehículo');

  const conflicto = db.reservas.find(
    (r) => r.vehiculoId === id && ESTADOS_QUE_OCUPAN.includes(r.estado)
  );
  if (conflicto)
    return error(
      `No se puede eliminar: el vehículo tiene la reserva ${conflicto.codigo} activa. Cámbialo a "no disponible" en su lugar.`,
      409
    );

  const [eliminado] = db.vehiculos.splice(indice, 1);
  return ok({ eliminado: true, vehiculo: eliminado });
});
