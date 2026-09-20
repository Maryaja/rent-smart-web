// app/services/vehiculoService.js — Paso 2: gestión de vehículos
import apiClient from './apiClient';

export const VehiculoService = {
  /** Listar vehículos. filtros: { estado, categoria, texto } */
  obtenerVehiculos(filtros = {}) {
    return apiClient.get('/vehiculos', { params: filtros });
  },

  /** Obtener un vehículo con sus reservas activas (Pantalla 7). */
  obtenerVehiculo(id) {
    return apiClient.get(`/vehiculos/${id}`);
  },

  /** Vehículos libres en un rango de fechas, con la cotización calculada. */
  buscarDisponibles(filtros = {}) {
    return apiClient.get('/vehiculos/disponibles', { params: filtros });
  },

  crearVehiculo(vehiculoData) {
    const esFormData = vehiculoData instanceof FormData;
    return apiClient.post('/vehiculos', vehiculoData, { 
      silencioso: true,
      ...(esFormData && { headers: {} })
    });
  },

  actualizarVehiculo(id, vehiculoData) {
    const esFormData = vehiculoData instanceof FormData;
    return apiClient.put(`/vehiculos/${id}`, vehiculoData, { 
      silencioso: true,
      ...(esFormData && { headers: {} })
    });
  },

  eliminarVehiculo(id) {
    return apiClient.delete(`/vehiculos/${id}`, { silencioso: true });
  },

  /** Atajo para cambiar solo la disponibilidad desde la tabla. */
  cambiarEstado(id, estado) {
    return apiClient.put(`/vehiculos/${id}`, { estado }, { silencioso: true });
  },
};

export default VehiculoService;