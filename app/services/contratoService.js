// app/services/contratoService.js — Paso 4: contratos
import apiClient from './apiClient';

export const ContratoService = {
  /** filtros: { clienteId, estado, texto } */
  obtenerContratos(filtros = {}) {
    return apiClient.get('/contratos', { params: filtros });
  },

  obtenerContrato(id) {
    return apiClient.get(`/contratos/${id}`);
  },

  /** Generación automática a partir de una reserva confirmada. */
  generarDesdeReserva(reservaId) {
    return apiClient.post('/contratos', { reservaId }, { silencioso: true });
  },

  cambiarEstado(id, estado) {
    return apiClient.patch(`/contratos/${id}`, { estado }, { silencioso: true });
  },
};

export default ContratoService;
