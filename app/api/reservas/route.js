import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { validarReserva, hayErrores } from '@/app/lib/validaciones';
import { verificarDisponibilidad, calcularTarifa } from '@/app/lib/negocio';
import { hoy } from '@/app/lib/utilidades';
import * as repoReservas from '@/app/lib/repositorios/reservas';
import * as repoVehiculos from '@/app/lib/repositorios/vehiculos';
import * as repoClientes from '@/app/lib/repositorios/clientes';

/** GET /api/reservas?clienteId=&vehiculoId=&estado= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const reservas = await repoReservas.listar({
    clienteId: searchParams.get('clienteId') || undefined,
    vehiculoId: searchParams.get('vehiculoId') || undefined,
    estado: searchParams.get('estado') || undefined,
  });
  return ok(reservas);
});

/** POST /api/reservas — verifica disponibilidad y calcula la tarifa. */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarReserva(body);
  if (hayErrores(errores)) return invalido(errores);

  const vehiculoId = Number(body.vehiculoId);
  const clienteId = Number(body.clienteId);

  const vehiculo = await repoVehiculos.porId(vehiculoId);
  if (!vehiculo) return invalido({ vehiculoId: 'El vehículo no existe.' });

  const cliente = await repoClientes.porId(clienteId);
  if (!cliente) return invalido({ clienteId: 'El cliente no existe.' });

  const disponibilidad = await verificarDisponibilidad(vehiculoId, body.fechaInicio, body.fechaFin);
  if (!disponibilidad.disponible) return error(disponibilidad.motivo, 409);

  const tarifa = calcularTarifa(vehiculo.precioPorDia, body.fechaInicio, body.fechaFin);

  const reserva = await repoReservas.crear({
    vehiculoId,
    clienteId,
    fechaInicio: body.fechaInicio,
    fechaFin: body.fechaFin,
    dias: tarifa.dias,
    tarifaDiaria: tarifa.tarifaDiaria,
    porcentajeDescuento: tarifa.porcentajeDescuento,
    descuento: tarifa.descuento,
    subtotal: tarifa.subtotal,
    impuesto: tarifa.impuesto,
    total: tarifa.total,
    estado: 'pendiente',
    lugarEntrega: String(body.lugarEntrega || 'Sucursal San Salvador').trim(),
    observaciones: String(body.observaciones || '').trim(),
    fechaCreacion: hoy(),
  });

  return creado(reserva);
});
