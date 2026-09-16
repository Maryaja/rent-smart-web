'use client';
import { useState, useEffect } from "react";
import { VehiculoService } from "@/app/services/vehiculoService";

export default function GestionVehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el formulario de nuevo vehículo o edición
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    idVehiculo: null,
    marca: "",
    modelo: "",
    anio: "",
    placa: "",
    categoria: "",
    precioPorDia: "",
    estado: "Disponible",
    imagenUrl: ""
  });

  // Cargar vehículos al iniciar la página
  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const data = await VehiculoService.obtenerVehiculos();
      setVehiculos(data);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar los vehículos. Revisa la conexión con el backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.idVehiculo) {
        // Actualizar vehículo existente
        await VehiculoService.actualizarVehiculo(formData.idVehiculo, formData);
      } else {
        // Crear nuevo vehículo
        await VehiculoService.crearVehiculo(formData);
      }
      setShowModal(false);
      resetForm();
      cargarVehiculos();
    } catch (err) {
      alert("Error al guardar el vehículo");
      console.error(err);
    }
  };

  const handleEditar = (vehiculo) => {
    setFormData(vehiculo);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      try {
        await VehiculoService.eliminarVehiculo(id);
        cargarVehiculos();
      } catch (err) {
        alert("Error al eliminar el vehículo");
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      idVehiculo: null,
      marca: "",
      modelo: "",
      anio: "",
      placa: "",
      categoria: "",
      precioPorDia: "",
      estado: "Disponible",
      imagenUrl: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Vehículos</h1>
            <p className="text-gray-600 mt-1">Administra el catálogo de vehículos disponibles para renta.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow transition"
          >
            + Nuevo Vehículo
          </button>
        </div>

        {/* Mensajes de error o carga */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Cargando vehículos...</p>
          </div>
        ) : (
          /* Tabla de vehículos */
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio/Día</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehiculos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No hay vehículos registrados.
                    </td>
                  </tr>
                ) : (
                  vehiculos.map((v) => (
                    <tr key={v.idVehiculo || v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{v.marca} {v.modelo}</div>
                        <div className="text-sm text-gray-500">Año: {v.anio}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.categoria}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.placa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${v.precioPorDia}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          v.estado === 'Disponible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {v.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditar(v)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(v.idVehiculo || v.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal para Crear / Editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                {formData.idVehiculo ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marca</label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modelo</label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Año</label>
                    <input
                      type="number"
                      name="anio"
                      value={formData.anio}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Placa</label>
                    <input
                      type="text"
                      name="placa"
                      value={formData.placa}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <input
                      type="text"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio por Día ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="precioPorDia"
                      value={formData.precioPorDia}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}