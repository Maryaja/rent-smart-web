// app/services/reservaService.js — Paso 3: lógica de negocio central
import apiClient from './apiClient';

export const ReservaService = {
  /** filtros: { clienteId, vehiculoId, estado } */
  obtenerReservas(filtros = {}) {
    return apiClient.get('/reservas', { params: filtros });
  },

  obtenerReserva(id) {
    return apiClient.get(`/reservas/${id}`);
  },

  crearReserva(reserva) {
    return apiClient.post('/reservas', reserva, { silencioso: true });
  },

  /** Avanza el flujo: pendiente → confirmada → en_curso → finalizada */
  cambiarEstado(id, estado, extra = {}) {
    return apiClient.patch(`/reservas/${id}`, { estado, ...extra }, { silencioso: true });
  },

  confirmar(id) {
    return this.cambiarEstado(id, 'confirmada');
  },

  iniciar(id) {
    return this.cambiarEstado(id, 'en_curso');
  },

  finalizar(id) {
    return this.cambiarEstado(id, 'finalizada');
  },

  cancelar(id, motivoCancelacion = '') {
    return this.cambiarEstado(id, 'cancelada', { motivoCancelacion });
  },

  reprogramar(id, fechaInicio, fechaFin) {
    return apiClient.patch(`/reservas/${id}`, { fechaInicio, fechaFin }, { silencioso: true });
  },

  eliminarReserva(id) {
    return apiClient.delete(`/reservas/${id}`, { silencioso: true });
  },
};

/** Cálculo de tarifas replicado en el cliente para previsualizar sin llamar al API. */
export function cotizarLocalmente(precioPorDia, fechaInicio, fechaFin) {
  if (!precioPorDia || !fechaInicio || !fechaFin) return null;

  const inicio = new Date(`${fechaInicio}T00:00:00`);
  const fin = new Date(`${fechaFin}T00:00:00`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) return null;

  const dias = Math.max(1, Math.ceil((fin - inicio) / 86400000));
  let porcentajeDescuento = 0;
  if (dias >= 30) porcentajeDescuento = 0.2;
  else if (dias >= 7) porcentajeDescuento = 0.1;
  else if (dias >= 3) porcentajeDescuento = 0.05;

  const r = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const bruto = r(dias * Number(precioPorDia));
  const descuento = r(bruto * porcentajeDescuento);
  const subtotal = r(bruto - descuento);
  const impuesto = r(subtotal * 0.13);

  return {
    dias,
    tarifaDiaria: Number(precioPorDia),
    bruto,
    porcentajeDescuento,
    descuento,
    subtotal,
    impuesto,
    total: r(subtotal + impuesto),
  };
}

export default ReservaService;
