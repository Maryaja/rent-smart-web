'use client';

/** Pantalla 6 · Búsqueda y Reserva */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VehiculoService from '@/app/services/vehiculoService';
import ReservaService from '@/app/services/reservaService';
import ClienteService from '@/app/services/clienteService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { useAuth } from '@/app/context/AuthContext';
import { MensajeError, MensajeExito, SinResultados } from '@/app/components/Mensajes';
import Cargando from '@/app/components/Cargando';
import { moneda, hoyIso, fechaLarga, CATEGORIAS, TRANSMISIONES } from '@/app/lib/formato';

function Buscador() {
  const router = useRouter();
  const { esPersonal, clienteId, usuario } = useAuth();

  const [criterios, setCriterios] = useState({
    fechaInicio: hoyIso(1),
    fechaFin: hoyIso(4),
    categoria: '',
    transmision: '',
    texto: '',
    precioMax: '',
  });

  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const [buscado, setBuscado] = useState(false);

  // Reserva
  const [seleccionado, setSeleccionado] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteElegido, setClienteElegido] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [reservando, setReservando] = useState(false);
  const [errorReserva, setErrorReserva] = useState(null);
  const [exito, setExito] = useState(null);

  const fechasValidas = useMemo(
    () =>
      Boolean(criterios.fechaInicio) &&
      Boolean(criterios.fechaFin) &&
      criterios.fechaFin > criterios.fechaInicio,
    [criterios.fechaInicio, criterios.fechaFin]
  );

  const buscar = useCallback(async () => {
    if (!fechasValidas) {
      setError('La fecha de devolución debe ser posterior a la de retiro.');
      return;
    }
    setError(null);
    setBuscando(true);
    try {
      const data = await VehiculoService.buscarDisponibles(criterios);
      setResultados(data);
      setBuscado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }, [criterios, fechasValidas]);

  // Primera búsqueda automática al entrar a la pantalla.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El personal necesita elegir a nombre de quién reserva
  useEffect(() => {
    if (!esPersonal) return;
    ClienteService.obtenerClientes()
      .then(setClientes)
      .catch(() => setClientes([]));
  }, [esPersonal]);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setCriterios((c) => ({ ...c, [name]: value }));
  };

  const abrirReserva = (vehiculo) => {
    setSeleccionado(vehiculo);
    setErrorReserva(null);
    setObservaciones('');
    setClienteElegido(esPersonal ? '' : String(clienteId || ''));
  };

  const confirmarReserva = async (e) => {
    e.preventDefault();
    setErrorReserva(null);

    const destino = esPersonal ? Number(clienteElegido) : clienteId;
    if (!destino) {
      setErrorReserva('Selecciona el cliente a nombre de quien va la reserva.');
      return;
    }

    setReservando(true);
    try {
      const reserva = await ReservaService.crearReserva({
        vehiculoId: seleccionado.id,
        clienteId: destino,
        fechaInicio: criterios.fechaInicio,
        fechaFin: criterios.fechaFin,
        observaciones,
      });
      setSeleccionado(null);
      setExito(
        `Reserva ${reserva.codigo} creada por ${moneda(reserva.total)}. Queda en estado "pendiente" hasta su confirmación.`
      );
      buscar();
      setTimeout(() => router.push(esPersonal ? '/reservas' : '/mis-reservas'), 1800);
    } catch (err) {
      setErrorReserva(err.message);
    } finally {
      setReservando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buscar y reservar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Elige las fechas y te mostramos únicamente los vehículos libres en ese período.
        </p>
      </header>

      {/* ----------------------------- Filtros ----------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="fechaInicio" className="block text-sm font-medium text-slate-700">
              Retiro
            </label>
            <input
              id="fechaInicio"
              name="fechaInicio"
              type="date"
              min={hoyIso()}
              value={criterios.fechaInicio}
              onChange={cambiar}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label htmlFor="fechaFin" className="block text-sm font-medium text-slate-700">
              Devolución
            </label>
            <input
              id="fechaFin"
              name="fechaFin"
              type="date"
              min={criterios.fechaInicio || hoyIso()}
              value={criterios.fechaFin}
              onChange={cambiar}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-slate-700">
              Categoría
            </label>
            <select
              id="categoria"
              name="categoria"
              value={criterios.categoria}
              onChange={cambiar}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transmision" className="block text-sm font-medium text-slate-700">
              Transmisión
            </label>
            <select
              id="transmision"
              name="transmision"
              value={criterios.transmision}
              onChange={cambiar}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Cualquiera</option>
              {TRANSMISIONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="texto" className="block text-sm font-medium text-slate-700">
              Marca o modelo
            </label>
            <input
              id="texto"
              name="texto"
              type="search"
              value={criterios.texto}
              onChange={cambiar}
              placeholder="Ej. Toyota, SUV, Corolla…"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label htmlFor="precioMax" className="block text-sm font-medium text-slate-700">
              Precio máx. por día
            </label>
            <input
              id="precioMax"
              name="precioMax"
              type="number"
              min="0"
              value={criterios.precioMax}
              onChange={cambiar}
              placeholder="Sin límite"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={buscando || !fechasValidas}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {buscando ? 'Buscando…' : 'Buscar disponibles'}
            </button>
          </div>
        </div>

        {!fechasValidas && (
          <p className="mt-3 text-sm font-medium text-red-600">
            La fecha de devolución debe ser posterior a la de retiro.
          </p>
        )}
      </form>

      <div className="mt-6">
        <MensajeExito mensaje={exito} />
        <MensajeError mensaje={error} onReintentar={buscar} />
      </div>

      {/* ---------------------------- Resultados ---------------------------- */}
      {buscando ? (
        <Cargando mensaje="Consultando la disponibilidad…" />
      ) : resultados.length === 0 && buscado ? (
        <SinResultados
          titulo="No hay vehículos libres en esas fechas"
          descripcion="Prueba con otro rango de fechas o quita algunos filtros."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            <strong>{resultados.length}</strong>{' '}
            {resultados.length === 1 ? 'vehículo disponible' : 'vehículos disponibles'} del{' '}
            {fechaLarga(criterios.fechaInicio)} al {fechaLarga(criterios.fechaFin)}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map((v) => (
              <article
                key={v.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="grid h-36 place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-5xl">
                  🚗
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {v.marca} {v.modelo}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {v.anio} · {v.categoria} · {v.transmision}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {moneda(v.precioPorDia)}/día
                    </span>
                  </div>

                  {v.descripcion && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{v.descripcion}</p>
                  )}

                  {v.cotizacion && (
                    <dl className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <dt>
                          {v.cotizacion.dias} {v.cotizacion.dias === 1 ? 'día' : 'días'} ×{' '}
                          {moneda(v.cotizacion.tarifaDiaria)}
                        </dt>
                        <dd>{moneda(v.cotizacion.bruto)}</dd>
                      </div>
                      {v.cotizacion.descuento > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <dt>Descuento {(v.cotizacion.porcentajeDescuento * 100).toFixed(0)}%</dt>
                          <dd>−{moneda(v.cotizacion.descuento)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <dt>IVA (13%)</dt>
                        <dd>{moneda(v.cotizacion.impuesto)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                        <dt>Total</dt>
                        <dd>{moneda(v.cotizacion.total)}</dd>
                      </div>
                    </dl>
                  )}

                  <div className="mt-auto flex gap-2 pt-4">
                    <Link
                      href={`/vehiculos/${v.id}`}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalle
                    </Link>
                    <button
                      type="button"
                      onClick={() => abrirReserva(v)}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* ------------------------ Modal de reserva ------------------------ */}
      {seleccionado && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
          <form
            onSubmit={confirmarReserva}
            className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">Confirmar reserva</h2>
            <p className="mt-1 text-sm text-slate-500">
              {seleccionado.marca} {seleccionado.modelo} · {seleccionado.placa}
            </p>

            <MensajeError mensaje={errorReserva} />

            <dl className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Retiro</dt>
                <dd className="font-medium text-slate-900">{fechaLarga(criterios.fechaInicio)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Devolución</dt>
                <dd className="font-medium text-slate-900">{fechaLarga(criterios.fechaFin)}</dd>
              </div>
              {seleccionado.cotizacion && (
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                  <dt className="font-semibold text-slate-900">Total a pagar</dt>
                  <dd className="font-bold text-blue-700">
                    {moneda(seleccionado.cotizacion.total)}
                  </dd>
                </div>
              )}
            </dl>

            {esPersonal ? (
              <div className="mt-4">
                <label htmlFor="cliente" className="block text-sm font-medium text-slate-700">
                  Cliente *
                </label>
                <select
                  id="cliente"
                  value={clienteElegido}
                  onChange={(e) => setClienteElegido(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Selecciona un cliente…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {c.documento}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
                La reserva se registrará a nombre de <strong>{usuario.nombre}</strong>.
              </p>
            )}

            <div className="mt-4">
              <label htmlFor="observaciones" className="block text-sm font-medium text-slate-700">
                Observaciones (opcional)
              </label>
              <textarea
                id="observaciones"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Silla para niño, entrega en aeropuerto…"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSeleccionado(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={reservando}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {reservando ? 'Reservando…' : 'Confirmar reserva'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function BuscarPage() {
  return (
    <RutaProtegida>
      <Buscador />
    </RutaProtegida>
  );
}
