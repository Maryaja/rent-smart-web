import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { redondear, hoy } from '@/app/lib/utilidades';
import * as repoPagos from '@/app/lib/repositorios/pagos';
import * as repoReservas from '@/app/lib/repositorios/reservas';
import * as repoContratos from '@/app/lib/repositorios/contratos';

/** GET /api/pagos?reservaId=&contratoId= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const pagos = await repoPagos.listar({
    reservaId: searchParams.get('reservaId') || undefined,
    contratoId: searchParams.get('contratoId') || undefined,
  });
  return ok(pagos);
});

/** POST /api/pagos { reservaId, monto, metodo } */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = {};
  if (!body.reservaId) errores.reservaId = 'Indica la reserva.';
  const monto = Number(body.monto);
  if (!body.monto) errores.monto = 'Indica el monto.';
  else if (Number.isNaN(monto) || monto <= 0) errores.monto = 'El monto debe ser mayor que cero.';
  if (Object.keys(errores).length) return invalido(errores);

  const reserva = await repoReservas.porId(Number(body.reservaId));
  if (!reserva) return invalido({ reservaId: 'La reserva no existe.' });

  const contrato = await repoContratos.porReserva(reserva.id);

  const pago = await repoPagos.crear({
    reservaId: reserva.id,
    contratoId: contrato ? contrato.id : null,
    monto: redondear(monto),
    metodo: body.metodo || 'efectivo',
    estado: 'pagado',
    fecha: hoy(),
  });

  return creado(pago);
});
