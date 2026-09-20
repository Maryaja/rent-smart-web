/**
 * Lógica de negocio central (Paso 3).
 * Vive en el servidor para que la regla sea la misma venga de donde venga
 * la petición: verificación de disponibilidad, cálculo de tarifas y
 * flujo de estados de la reserva.
 */

import { db, diasEntre, redondear, IMPUESTO, PORCENTAJE_DEPOSITO } from './db';

/** Estados de reserva que "ocupan" el vehículo en el calendario. */
export const ESTADOS_QUE_OCUPAN = ['pendiente', 'confirmada', 'en_curso'];

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

/** ¿Se traslapan los rangos [aIni, aFin) y [bIni, bFin)? */
export function seTraslapan(aInicio, aFin, bInicio, bFin) {
  return aInicio < bFin && bInicio < aFin;
}

/**
 * Verifica disponibilidad de un vehículo en un rango de fechas.
 * Evita la duplicidad de reservas: si ya existe otra reserva activa
 * que se traslape, el vehículo no está disponible.
 *
 * @returns {{ disponible: boolean, motivo?: string, conflicto?: object }}
 */
export function verificarDisponibilidad(vehiculoId, fechaInicio, fechaFin, ignorarReservaId = null) {
  const vehiculo = db.vehiculos.find((v) => v.id === Number(vehiculoId));
  if (!vehiculo) return { disponible: false, motivo: 'El vehículo no existe.' };

  if (vehiculo.estado === 'mantenimiento')
    return { disponible: false, motivo: 'El vehículo está en mantenimiento.' };
  if (vehiculo.estado === 'no_disponible')
    return { disponible: false, motivo: 'El vehículo no está disponible para renta.' };

  const conflicto = db.reservas.find(
    (r) =>
      r.vehiculoId === Number(vehiculoId) &&
      r.id !== Number(ignorarReservaId) &&
      ESTADOS_QUE_OCUPAN.includes(r.estado) &&
      seTraslapan(fechaInicio, fechaFin, r.fechaInicio, r.fechaFin)
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
 * Incluye descuentos por volumen y el IVA.
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

/** Vehículos libres en un rango de fechas (para la Pantalla 6). */
export function vehiculosDisponibles(fechaInicio, fechaFin, filtros = {}) {
  return db.vehiculos.filter((v) => {
    if (v.estado !== 'disponible') return false;

    if (filtros.categoria && v.categoria !== filtros.categoria) return false;
    if (filtros.transmision && v.transmision !== filtros.transmision) return false;
    if (filtros.precioMin !== undefined && v.precioPorDia < Number(filtros.precioMin)) return false;
    if (filtros.precioMax !== undefined && v.precioPorDia > Number(filtros.precioMax)) return false;
    if (filtros.texto) {
      const texto = String(filtros.texto).toLowerCase();
      const buscable = `${v.marca} ${v.modelo} ${v.categoria} ${v.color}`.toLowerCase();
      if (!buscable.includes(texto)) return false;
    }

    if (fechaInicio && fechaFin) {
      return verificarDisponibilidad(v.id, fechaInicio, fechaFin).disponible;
    }
    return true;
  });
}

/**
 * Genera automáticamente el contrato de una reserva confirmada (Paso 4)
 * y lo guarda de forma digital. Si ya existía, lo devuelve sin duplicarlo.
 */
export function generarContrato(reserva) {
  const existente = db.contratos.find((c) => c.reservaId === reserva.id && c.estado !== 'anulado');
  if (existente) return existente;

  const id = db.siguienteId('contratos');
  const contrato = {
    id,
    codigo: `CT-${String(id).padStart(5, '0')}`,
    reservaId: reserva.id,
    clienteId: reserva.clienteId,
    vehiculoId: reserva.vehiculoId,
    fechaEmision: new Date().toISOString().slice(0, 10),
    fechaInicio: reserva.fechaInicio,
    fechaFin: reserva.fechaFin,
    montoTotal: reserva.total,
    deposito: redondear(reserva.total * PORCENTAJE_DEPOSITO),
    estado: 'vigente',
    condiciones: CONDICIONES,
  };
  db.contratos.push(contrato);
  return contrato;
}

const CONDICIONES = [
  'El arrendatario declara poseer licencia de conducir vigente.',
  'El vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.',
  'El kilometraje es libre dentro del territorio nacional.',
  'Cualquier daño no cubierto por el seguro será responsabilidad del arrendatario.',
  'La devolución tardía genera un recargo equivalente a un día de renta.',
].join('\n');

/** Adjunta los datos relacionados (vehículo y cliente) a una reserva. */
export function expandirReserva(reserva) {
  const vehiculo = db.vehiculos.find((v) => v.id === reserva.vehiculoId) || null;
  const cliente = db.clientes.find((c) => c.id === reserva.clienteId) || null;
  const contrato = db.contratos.find((c) => c.reservaId === reserva.id) || null;
  return {
    ...reserva,
    vehiculo: vehiculo
      ? { id: vehiculo.id, marca: vehiculo.marca, modelo: vehiculo.modelo, placa: vehiculo.placa, categoria: vehiculo.categoria, imagenUrl: vehiculo.imagenUrl }
      : null,
    cliente: cliente ? { id: cliente.id, nombre: cliente.nombre, documento: cliente.documento, email: cliente.email } : null,
    contratoId: contrato ? contrato.id : null,
    contratoCodigo: contrato ? contrato.codigo : null,
  };
}

export function expandirContrato(contrato) {
  const vehiculo = db.vehiculos.find((v) => v.id === contrato.vehiculoId) || null;
  const cliente = db.clientes.find((c) => c.id === contrato.clienteId) || null;
  const reserva = db.reservas.find((r) => r.id === contrato.reservaId) || null;
  return {
    ...contrato,
    vehiculo: vehiculo
      ? { id: vehiculo.id, marca: vehiculo.marca, modelo: vehiculo.modelo, placa: vehiculo.placa, categoria: vehiculo.categoria }
      : null,
    cliente: cliente
      ? { id: cliente.id, nombre: cliente.nombre, documento: cliente.documento, email: cliente.email, direccion: cliente.direccion, licencia: cliente.licencia }
      : null,
    reservaCodigo: reserva ? reserva.codigo : null,
    estadoReserva: reserva ? reserva.estado : null,
  };
}
