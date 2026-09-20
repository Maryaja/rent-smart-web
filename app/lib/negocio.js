/**
 * Lógica de negocio central (Paso 3).
 *
 * Vive en el servidor para que la regla sea la misma venga de donde venga
 * la petición. Las consultas están en los repositorios; aquí solo están
 * las reglas: disponibilidad, tarifas y flujo de estados.
 */

import { IMPUESTO, PORCENTAJE_DEPOSITO } from '@/app/lib/constantes';
import { diasEntre, redondear } from '@/app/lib/utilidades';
import * as repoVehiculos from '@/app/lib/repositorios/vehiculos';
import * as repoReservas from '@/app/lib/repositorios/reservas';

/** Transiciones permitidas del flujo de la reserva. */
export const TRANSICIONES = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['en_curso', 'cancelada'],
  en_curso: ['finalizada'],
  finalizada: [],
  cancelada: [],
};

export function puedeTransicionar(estadoActual, estadoNuevo) {
  return (TRANSICIONES[estadoActual] || []).includes(estadoNuevo);
}

/**
 * Verifica la disponibilidad de un vehículo en un rango de fechas.
 *
 * El traslape lo resuelve la base de datos (ver `buscarTraslape`):
 * dos rangos chocan si cada uno empieza antes de que el otro termine.
 *
 * @returns {{ disponible: boolean, motivo?: string, conflicto?: object }}
 */
export async function verificarDisponibilidad(
  vehiculoId,
  fechaInicio,
  fechaFin,
  ignorarReservaId = null
) {
  const vehiculo = await repoVehiculos.porId(Number(vehiculoId));
  if (!vehiculo) return { disponible: false, motivo: 'El vehículo no existe.' };

  if (vehiculo.estado === 'mantenimiento')
    return { disponible: false, motivo: 'El vehículo está en mantenimiento.' };
  if (vehiculo.estado === 'no_disponible')
    return { disponible: false, motivo: 'El vehículo no está disponible para renta.' };

  const conflicto = await repoReservas.buscarTraslape(
    vehiculoId,
    fechaInicio,
    fechaFin,
    ignorarReservaId
  );

  if (conflicto) {
    return {
      disponible: false,
      motivo: `Ya existe la reserva ${conflicto.codigo} del ${conflicto.fechaInicio} al ${conflicto.fechaFin}.`,
      conflicto,
    };
  }

  return { disponible: true };
}

/**
 * Cálculo de tarifas según el período de renta.
 * Aplica descuento por volumen y el IVA.
 */
export function calcularTarifa(precioPorDia, fechaInicio, fechaFin) {
  const dias = diasEntre(fechaInicio, fechaFin);
  const tarifaDiaria = Number(precioPorDia);

  let porcentajeDescuento = 0;
  if (dias >= 30) porcentajeDescuento = 0.2;
  else if (dias >= 7) porcentajeDescuento = 0.1;
  else if (dias >= 3) porcentajeDescuento = 0.05;

  const bruto = redondear(dias * tarifaDiaria);
  const descuento = redondear(bruto * porcentajeDescuento);
  const subtotal = redondear(bruto - descuento);
  const impuesto = redondear(subtotal * IMPUESTO);
  const total = redondear(subtotal + impuesto);

  return {
    dias,
    tarifaDiaria,
    bruto,
    porcentajeDescuento,
    descuento,
    subtotal,
    impuesto,
    total,
    deposito: redondear(total * PORCENTAJE_DEPOSITO),
  };
}

/**
 * Vehículos libres en un rango de fechas (Pantalla 6).
 * Filtra primero en SQL y luego descarta los que tengan traslape.
 */
export async function vehiculosDisponibles(fechaInicio, fechaFin, filtros = {}) {
  const candidatos = await repoVehiculos.listar({
    estado: 'disponible',
    categoria: filtros.categoria,
    texto: filtros.texto,
  });

  const libres = [];
  for (const vehiculo of candidatos) {
    if (filtros.transmision && vehiculo.transmision !== filtros.transmision) continue;
    if (filtros.precioMin !== undefined && vehiculo.precioPorDia < Number(filtros.precioMin)) continue;
    if (filtros.precioMax !== undefined && vehiculo.precioPorDia > Number(filtros.precioMax)) continue;

    if (fechaInicio && fechaFin) {
      const conflicto = await repoReservas.buscarTraslape(vehiculo.id, fechaInicio, fechaFin);
      if (conflicto) continue;
    }
    libres.push(vehiculo);
  }

  return libres;
}
