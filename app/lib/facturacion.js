/**
 * Facturación (Paso 4): lo que ocurre automáticamente cuando una reserva
 * cambia de estado — generación del contrato, anticipo, liquidación y
 * reembolso.
 *
 * Está separado de `negocio.js` a propósito: ahí viven las reglas de la
 * reserva; aquí, sus consecuencias documentales y de cobro.
 */

import { CONDICIONES_ESTANDAR, PORCENTAJE_DEPOSITO } from '@/app/lib/constantes';
import { redondear, hoy } from '@/app/lib/utilidades';
import * as repoContratos from '@/app/lib/repositorios/contratos';
import * as repoPagos from '@/app/lib/repositorios/pagos';

/**
 * Genera el contrato de una reserva. Es idempotente: si ya existe uno
 * vigente para esa reserva, lo devuelve en vez de crear un duplicado.
 */
export async function generarContrato(reserva) {
  const existente = await repoContratos.porReserva(reserva.id);
  if (existente) return existente;

  return repoContratos.crear({
    reservaId: reserva.id,
    clienteId: reserva.clienteId,
    vehiculoId: reserva.vehiculoId,
    fechaEmision: hoy(),
    fechaInicio: reserva.fechaInicio,
    fechaFin: reserva.fechaFin,
    montoTotal: reserva.total,
    deposito: redondear(reserva.total * PORCENTAJE_DEPOSITO),
    estado: 'vigente',
    condiciones: CONDICIONES_ESTANDAR,
  });
}

/** Al confirmar: contrato + anticipo del 20 %. */
export async function alConfirmar(reserva, metodoPago = 'tarjeta') {
  const contrato = await generarContrato(reserva);

  if (!(await repoPagos.existeParaReserva(reserva.id))) {
    await repoPagos.crear({
      reservaId: reserva.id,
      contratoId: contrato.id,
      monto: contrato.deposito,
      metodo: metodoPago,
      estado: 'anticipo',
      fecha: hoy(),
    });
  }

  return contrato;
}

/** Al finalizar: se cierra el contrato y se liquidan los pagos. */
export async function alFinalizar(reserva) {
  await repoContratos.cambiarEstadoPorReserva(reserva.id, 'finalizado');
  await repoPagos.liquidar(reserva.id, reserva.total);
}

/** Al cancelar: se anula el contrato y se reembolsa lo no cobrado. */
export async function alCancelar(reserva) {
  await repoContratos.cambiarEstadoPorReserva(reserva.id, 'anulado');
  await repoPagos.reembolsar(reserva.id);
}

/** Al reprogramar: el contrato vigente sigue las nuevas fechas y montos. */
export async function alReprogramar(reserva) {
  await repoContratos.actualizarVigencia(
    reserva.id,
    reserva.fechaInicio,
    reserva.fechaFin,
    reserva.total,
    redondear(reserva.total * PORCENTAJE_DEPOSITO)
  );
}
