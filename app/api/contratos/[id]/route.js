import { ok, error, noEncontrado, leerJson, manejar, idNumerico } from '@/app/lib/http';
import { ESTADOS_CONTRATO } from '@/app/lib/constantes';
import * as repoContratos from '@/app/lib/repositorios/contratos';
import * as repoPagos from '@/app/lib/repositorios/pagos';

/** GET /api/contratos/:id — documento completo con sus pagos. */
export const GET = manejar(async (_request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  const contrato = await repoContratos.porId(id);
  if (!contrato) return noEncontrado('Contrato');

  const pagos = await repoPagos.listar({ contratoId: id });
  return ok({ ...contrato, pagos });
});

/** PATCH /api/contratos/:id { estado, condiciones } */
export const PATCH = manejar(async (request, { params }) => {
  const { id: crudo } = await params;
  const id = idNumerico(crudo);
  if (!id) return error('Identificador inválido.');

  let contrato = await repoContratos.porId(id);
  if (!contrato) return noEncontrado('Contrato');

  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  if (body.estado && !ESTADOS_CONTRATO.includes(body.estado))
    return error(`Estado inválido. Permitidos: ${ESTADOS_CONTRATO.join(', ')}.`);

  if (body.estado) contrato = await repoContratos.cambiarEstado(id, body.estado);
  if (body.condiciones !== undefined)
    contrato = await repoContratos.actualizarCondiciones(id, String(body.condiciones));

  return ok(contrato);
});
