'use client';

/** Pantalla 5 · Gestión de Vehículos (administrador / operador) */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import VehiculoService from '@/app/services/vehiculoService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { MensajeError, MensajeExito, SinResultados, ErrorCampo } from '@/app/components/Mensajes';
import { FilasEsqueleto } from '@/app/components/Cargando';
import { EstadoVehiculo } from '@/app/components/Etiqueta';
import { validarVehiculo, hayErrores } from '@/app/lib/validaciones';
import {
  moneda,
  numero,
  CATEGORIAS,
  TRANSMISIONES,
  COMBUSTIBLES,
  ETIQUETAS_ESTADO_VEHICULO,
} from '@/app/lib/formato';

const FORM_VACIO = {
  id: null,
  marca: '',
  modelo: '',
  anio: '',
  placa: '',
  categoria: '',
  color: '',
  transmision: 'Automática',
  combustible: 'Gasolina',
  capacidad: '5',
  kilometraje: '0',
  precioPorDia: '',
  estado: 'disponible',
  imagenUrl: '',
  descripcion: '',
};

function GestionVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const [filtros, setFiltros] = useState({ texto: '', estado: '', categoria: '' });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);

  const [porEliminar, setPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await VehiculoService.obtenerVehiculos();
      setVehiculos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!exito) return undefined;
    const t = setTimeout(() => setExito(null), 4000);
    return () => clearTimeout(t);
  }, [exito]);

  const filtrados = useMemo(() => {
    const texto = filtros.texto.trim().toLowerCase();
    return vehiculos.filter((v) => {
      if (filtros.estado && v.estado !== filtros.estado) return false;
      if (filtros.categoria && v.categoria !== filtros.categoria) return false;
      if (texto) {
        const buscable = `${v.marca} ${v.modelo} ${v.placa} ${v.categoria} ${v.color}`.toLowerCase();
        if (!buscable.includes(texto)) return false;
      }
      return true;
    });
  }, [vehiculos, filtros]);

  const resumen = useMemo(
    () => ({
      total: vehiculos.length,
      disponible: vehiculos.filter((v) => v.estado === 'disponible').length,
      mantenimiento: vehiculos.filter((v) => v.estado === 'mantenimiento').length,
      no_disponible: vehiculos.filter((v) => v.estado === 'no_disponible').length,
    }),
    [vehiculos]
  );

  /* ------------------------- Formulario ------------------------- */

  const abrirNuevo = () => {
    setFormulario(FORM_VACIO);
    setErrores({});
    setErrorFormulario(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (vehiculo) => {
    setFormulario({
      ...FORM_VACIO,
      ...vehiculo,
      anio: String(vehiculo.anio ?? ''),
      capacidad: String(vehiculo.capacidad ?? '5'),
      kilometraje: String(vehiculo.kilometraje ?? '0'),
      precioPorDia: String(vehiculo.precioPorDia ?? ''),
    });
    setErrores({});
    setErrorFormulario(null);
    setModalAbierto(true);
  };

  const cambiarCampo = (e) => {
    const { name, value } = e.target;
    const valor = name === 'placa' ? value.toUpperCase() : value;
    setFormulario((f) => ({ ...f, [name]: valor }));
    setErrores((err) => ({ ...err, [name]: undefined }));
  };

  const validarCampo = (e) => {
    const { name } = e.target;
    const encontrados = validarVehiculo(formulario);
    setErrores((err) => ({ ...err, [name]: encontrados[name] }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorFormulario(null);

    const encontrados = validarVehiculo(formulario);
    setErrores(encontrados);
    if (hayErrores(encontrados)) return;

    setGuardando(true);
    try {
      const formData = new FormData();
      Object.entries(formulario).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const inputFile = document.getElementById('imagen');
      if (inputFile && inputFile.files[0]) {
        formData.append('imagen', inputFile.files[0]);
      }

      if (formulario.id) {
        const res = await fetch(`/api/vehiculos/${formulario.id}`, {
          method: 'PUT',
          body: formData,
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al actualizar');
        
        const actualizado = data.data;
        setVehiculos((lista) => lista.map((v) => (v.id === actualizado.id ? actualizado : v)));
        setExito(`Vehículo ${actualizado.marca} ${actualizado.modelo} actualizado correctamente.`);
      } else {
        const res = await fetch('/api/vehiculos', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al registrar');

        const creado = data.data;
        setVehiculos((lista) => [...lista, creado].sort((a, b) => a.marca.localeCompare(b.marca)));
        setExito(`Vehículo ${creado.marca} ${creado.modelo} registrado correctamente.`);
      }
      setModalAbierto(false);
    } catch (err) {
      setErrorFormulario(err.message);
      if (err.errores) setErrores(err.errores);
    } finally {
      setGuardando(false);
    }
  };

  /* -------------------------- Acciones -------------------------- */

  const confirmarEliminacion = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await VehiculoService.eliminarVehiculo(porEliminar.id);
      setVehiculos((lista) => lista.filter((v) => v.id !== porEliminar.id));
      setExito(`Vehículo ${porEliminar.marca} ${porEliminar.modelo} eliminado.`);
      setPorEliminar(null);
    } catch (err) {
      setError(err.message);
      setPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const cambiarDisponibilidad = async (vehiculo, estado) => {
    try {
      const actualizado = await VehiculoService.cambiarEstado(vehiculo.id, estado);
      setVehiculos((lista) => lista.map((v) => (v.id === actualizado.id ? actualizado : v)));
      setExito(`${vehiculo.marca} ${vehiculo.modelo}: ${ETIQUETAS_ESTADO_VEHICULO[estado]}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const claseInput = (campo) =>
    `mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
      errores[campo] ? 'border-red-400' : 'border-slate-300 focus:border-blue-500'
    }`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de vehículos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra el catálogo, la disponibilidad y las tarifas de la flota.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Nuevo vehículo
        </button>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { clave: '', etiqueta: 'Toda la flota', valor: resumen.total, color: 'text-slate-900' },
          { clave: 'disponible', etiqueta: 'Disponibles', valor: resumen.disponible, color: 'text-emerald-700' },
          { clave: 'mantenimiento', etiqueta: 'En mantenimiento', valor: resumen.mantenimiento, color: 'text-amber-700' },
          { clave: 'no_disponible', etiqueta: 'No disponibles', valor: resumen.no_disponible, color: 'text-red-700' },
        ].map((c) => (
          <button
            key={c.etiqueta}
            type="button"
            onClick={() => setFiltros((f) => ({ ...f, estado: c.clave }))}
            className={`rounded-xl border bg-white p-4 text-left transition hover:border-blue-300 ${
              filtros.estado === c.clave ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.etiqueta}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.valor}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="search"
          value={filtros.texto}
          onChange={(e) => setFiltros((f) => ({ ...f, texto: e.target.value }))}
          placeholder="Buscar por marca, modelo, placa o color…"
          className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        />
        <select
          value={filtros.categoria}
          onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFiltros({ texto: '', estado: '', categoria: '' })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <div className="mt-6">
        <MensajeExito mensaje={exito} />
        <MensajeError mensaje={error} onReintentar={cargar} />
      </div>

      {!cargando && filtrados.length === 0 ? (
        <SinResultados
          titulo="No hay vehículos que coincidan"
          descripcion="Ajusta los filtros o registra un vehículo nuevo."
          accion={
            <button
              type="button"
              onClick={abrirNuevo}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Nuevo vehículo
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Vehículo', 'Categoría', 'Placa', 'Precio/día', 'Estado', 'Acciones'].map((th, i) => (
                    <th
                      key={th}
                      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                        i === 5 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cargando ? (
                  <FilasEsqueleto filas={5} columnas={6} />
                ) : (
                  filtrados.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/vehiculos/${v.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-700"
                        >
                          {v.marca} {v.modelo}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {v.anio} · {v.color} · {numero(v.kilometraje)} km
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{v.categoria}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{v.placa}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {moneda(v.precioPorDia)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <EstadoVehiculo estado={v.estado} />
                          <select
                            value={v.estado}
                            onChange={(e) => cambiarDisponibilidad(v, e.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-600 outline-none focus:border-blue-500"
                            aria-label={`Cambiar estado de ${v.marca} ${v.modelo}`}
                            title="Cambiar disponibilidad"
                          >
                            {Object.entries(ETIQUETAS_ESTADO_VEHICULO).map(([clave, etiqueta]) => (
                              <option key={clave} value={clave}>
                                {etiqueta}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Link
                          href={`/vehiculos/${v.id}`}
                          className="font-medium text-slate-600 hover:text-slate-900"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => abrirEdicion(v)}
                          className="ml-4 font-medium text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorEliminar(v)}
                          className="ml-4 font-medium text-red-600 hover:text-red-800"
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
        </div>
      )}

      {/* ----------------------- Modal alta/edición ----------------------- */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {formulario.id ? 'Editar vehículo' : 'Registrar nuevo vehículo'}
              </h2>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </header>

            <form onSubmit={guardar} noValidate className="px-6 py-5">
              <MensajeError mensaje={errorFormulario} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-slate-700">
                    Marca *
                  </label>
                  <input
                    id="marca"
                    name="marca"
                    value={formulario.marca}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('marca')}
                    placeholder="Toyota"
                  />
                  <ErrorCampo mensaje={errores.marca} />
                </div>

                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium text-slate-700">
                    Modelo *
                  </label>
                  <input
                    id="modelo"
                    name="modelo"
                    value={formulario.modelo}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('modelo')}
                    placeholder="Corolla"
                  />
                  <ErrorCampo mensaje={errores.modelo} />
                </div>

                <div>
                  <label htmlFor="anio" className="block text-sm font-medium text-slate-700">
                    Año *
                  </label>
                  <input
                    id="anio"
                    name="anio"
                    type="number"
                    value={formulario.anio}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('anio')}
                    placeholder="2023"
                  />
                  <ErrorCampo mensaje={errores.anio} />
                </div>

                <div>
                  <label htmlFor="placa" className="block text-sm font-medium text-slate-700">
                    Placa *
                  </label>
                  <input
                    id="placa"
                    name="placa"
                    value={formulario.placa}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={`${claseInput('placa')} font-mono uppercase`}
                    placeholder="P123456"
                  />
                  <ErrorCampo mensaje={errores.placa} />
                </div>

                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-slate-700">
                    Categoría *
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={formulario.categoria}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('categoria')}
                  >
                    <option value="">Selecciona…</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ErrorCampo mensaje={errores.categoria} />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-slate-700">
                    Color *
                  </label>
                  <input
                    id="color"
                    name="color"
                    value={formulario.color}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('color')}
                    placeholder="Blanco"
                  />
                  <ErrorCampo mensaje={errores.color} />
                </div>

                <div>
                  <label htmlFor="transmision" className="block text-sm font-medium text-slate-700">
                    Transmisión
                  </label>
                  <select
                    id="transmision"
                    name="transmision"
                    value={formulario.transmision}
                    onChange={cambiarCampo}
                    className={claseInput('transmision')}
                  >
                    {TRANSMISIONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="combustible" className="block text-sm font-medium text-slate-700">
                    Combustible
                  </label>
                  <select
                    id="combustible"
                    name="combustible"
                    value={formulario.combustible}
                    onChange={cambiarCampo}
                    className={claseInput('combustible')}
                  >
                    {COMBUSTIBLES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="capacidad" className="block text-sm font-medium text-slate-700">
                    Capacidad (pasajeros)
                  </label>
                  <input
                    id="capacidad"
                    name="capacidad"
                    type="number"
                    value={formulario.capacidad}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('capacidad')}
                  />
                  <ErrorCampo mensaje={errores.capacidad} />
                </div>

                <div>
                  <label htmlFor="kilometraje" className="block text-sm font-medium text-slate-700">
                    Kilometraje
                  </label>
                  <input
                    id="kilometraje"
                    name="kilometraje"
                    type="number"
                    value={formulario.kilometraje}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('kilometraje')}
                  />
                  <ErrorCampo mensaje={errores.kilometraje} />
                </div>

                <div>
                  <label htmlFor="precioPorDia" className="block text-sm font-medium text-slate-700">
                    Precio por día (USD) *
                  </label>
                  <input
                    id="precioPorDia"
                    name="precioPorDia"
                    type="number"
                    step="0.01"
                    value={formulario.precioPorDia}
                    onChange={cambiarCampo}
                    onBlur={validarCampo}
                    className={claseInput('precioPorDia')}
                    placeholder="38.00"
                  />
                  <ErrorCampo mensaje={errores.precioPorDia} />
                </div>

                <div>
                  <label htmlFor="estado" className="block text-sm font-medium text-slate-700">
                    Estado de disponibilidad
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarCampo}
                    className={claseInput('estado')}
                  >
                    {Object.entries(ETIQUETAS_ESTADO_VEHICULO).map(([clave, etiqueta]) => (
                      <option key={clave} value={clave}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                  <ErrorCampo mensaje={errores.estado} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={2}
                    value={formulario.descripcion}
                    onChange={cambiarCampo}
                    className={claseInput('descripcion')}
                    placeholder="Detalles que el cliente verá en la ficha del vehículo."
                  />
                </div>

                {/* Campo para cargar la foto del vehículo */}
                <div className="sm:col-span-2">
                  <label htmlFor="imagen" className="block text-sm font-medium text-slate-700">
                    Foto del vehículo
                  </label>
                  <input
                    id="imagen"
                    name="imagen"
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <footer className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : formulario.id ? 'Guardar cambios' : 'Registrar vehículo'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------- Confirmar eliminación ----------------------- */}
      {porEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Eliminar vehículo</h2>
            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas eliminar{' '}
              <strong>
                {porEliminar.marca} {porEliminar.modelo}
              </strong>{' '}
              ({porEliminar.placa})? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPorEliminar(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={eliminando}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestionVehiculosPage() {
  return (
    <RutaProtegida roles={['administrador', 'operador']}>
      <GestionVehiculos />
    </RutaProtegida>
  );
}