// app/services/vehiculoService.js

// URL base para el API (puedes ajustarla según tu backend o JSON Server)
const API_URL = 'http://localhost:4000/vehiculos';

export const VehiculoService = {
  // Listar todos los vehículos
  async obtenerVehiculos() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al obtener los vehículos');
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerVehiculos:', error);
      throw error;
    }
  },

  // Registrar un nuevo vehículo
  async crearVehiculo(vehiculoData) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehiculoData),
      });
      if (!response.ok) throw new Error('Error al registrar el vehículo');
      return await response.json();
    } catch (error) {
      console.error('Error en crearVehiculo:', error);
      throw error;
    }
  },

  // Actualizar un vehículo existente
  async actualizarVehiculo(id, vehiculoData) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehiculoData),
      });
      if (!response.ok) throw new Error('Error al actualizar el vehículo');
      return await response.json();
    } catch (error) {
      console.error('Error en actualizarVehiculo:', error);
      throw error;
    }
  },

  // Eliminar un vehículo
  async eliminarVehiculo(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar el vehículo');
      return true;
    } catch (error) {
      console.error('Error en eliminarVehiculo:', error);
      throw error;
    }
  }
};