import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { generarContrato } from '@/app/lib/facturacion';
import * as repoContratos from '@/app/lib/repositorios/contratos';
import * as repoReservas from '@/app/lib/repositorios/reservas';

/** GET /api/contratos?clienteId=&estado=&texto= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const contratos = await repoContratos.listar({
    clienteId: searchParams.get('clienteId') || undefined,
    estado: searchParams.get('estado') || undefined,
    texto: searchParams.get('texto') || undefined,
  });
  return ok(contratos);
});

/**
 * POST /api/contratos { reservaId }
 * Generación del contrato a partir de una reserva confirmada.
 */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');
  if (!body.reservaId) return invalido({ reservaId: 'Indica la reserva de origen.' });

  const reserva = await repoReservas.porId(Number(body.reservaId));
  if (!reserva) return invalido({ reservaId: 'La reserva no existe.' });

  if (!['confirmada', 'en_curso'].includes(reserva.estado))
    return error(
      `Solo se genera contrato para reservas confirmadas o en curso (esta está "${reserva.estado}").`,
      409
    );

  return creado(await generarContrato(reserva));
});
