// app/services/clienteService.js
import apiClient from './apiClient';

export const ClienteService = {
  obtenerClientes(filtros = {}) {
    return apiClient.get('/clientes', { params: filtros });
  },

  crearCliente(cliente) {
    return apiClient.post('/clientes', cliente, { silencioso: true });
  },
};

export default ClienteService;
