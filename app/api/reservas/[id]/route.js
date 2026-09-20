import { ok, error, invalido, noEncontrado, leerJson, manejar, idNumerico } from '@/app/lib/http';
import { puedeTransicionar, TRANSICIONES, verificarDisponibilidad, calcularTarifa } from '@/app/lib/negocio';
import { alConfirmar, alFinalizar, alCancelar, alReprogramar } from '@/app/lib/facturacion';
import * as repoReservas from '@/app/lib/repositorios/reservas';
import * as repoVehiculos from '@/app/lib/repositorios/vehiculos';

/** GET /api/reservas/:id */
export const GET = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const reserva = await repoReservas.porId(id);
  if (!reserva) return noEncontrado('Reserva');
  return ok(reserva);
});

/**
 * PATCH /api/reservas/:id
 * Body { estado }                  -> avanza el flujo de estados
 * Body { fechaInicio, fechaFin }   -> reprograma recalculando disponibilidad y tarifa
 */
export const PATCH = manejar(async (request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  let reserva = await repoReservas.porId(id);
  if (!reserva) return noEncontrado('Reserva');

  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  // --- Reprogramación de fechas ---
  if (body.fechaInicio || body.fechaFin) {
    if (!['pendiente', 'confirmada'].includes(reserva.estado))
      return error(`Una reserva en estado "${reserva.estado}" ya no se puede reprogramar.`, 409);

    const fechaInicio = body.fechaInicio || reserva.fechaInicio;
    const fechaFin = body.fechaFin || reserva.fechaFin;
    if (fechaFin <= fechaInicio)
      return invalido({ fechaFin: 'La devolución debe ser posterior al inicio.' });

    const disponibilidad = await verificarDisponibilidad(
      reserva.vehiculoId,
      fechaInicio,
      fechaFin,
      id
    );
    if (!disponibilidad.disponible) return error(disponibilidad.motivo, 409);

    const vehiculo = await repoVehiculos.porId(reserva.vehiculoId);
    const tarifa = calcularTarifa(vehiculo.precioPorDia, fechaInicio, fechaFin);

    reserva = await repoReservas.reprogramar(id, fechaInicio, fechaFin, tarifa);
    await alReprogramar(reserva);
  }

  // --- Cambio de estado ---
  if (body.estado && body.estado !== reserva.estado) {
    if (!puedeTransicionar(reserva.estado, body.estado)) {
      const permitidas = TRANSICIONES[reserva.estado] || [];
      return error(
        permitidas.length
          ? `No se puede pasar de "${reserva.estado}" a "${body.estado}". Transiciones válidas: ${permitidas.join(', ')}.`
          : `La reserva está en estado "${reserva.estado}" y ya no admite cambios.`,
        409
      );
    }

    const motivo = body.estado === 'cancelada' ? String(body.motivoCancelacion || '').trim() : null;
    reserva = await repoReservas.cambiarEstado(id, body.estado, motivo);

    if (body.estado === 'confirmada') await alConfirmar(reserva, body.metodoPago);
    if (body.estado === 'finalizada') await alFinalizar(reserva);
    if (body.estado === 'cancelada') await alCancelar(reserva);
  }

  return ok(await repoReservas.porId(id));
});

/** DELETE /api/reservas/:id — solo si nunca se confirmó. */
export const DELETE = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const reserva = await repoReservas.porId(id);
  if (!reserva) return noEncontrado('Reserva');

  if (!['pendiente', 'cancelada'].includes(reserva.estado))
    return error('Solo se pueden eliminar reservas pendientes o canceladas.', 409);

  await repoReservas.eliminar(id);
  return ok({ eliminada: true, reserva });
});
