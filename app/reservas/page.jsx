'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReservaService from '@/app/services/reservaService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { MensajeError, MensajeExito, SinResultados } from '@/app/components/Mensajes';
import { FilasEsqueleto } from '@/app/components/Cargando';
import { EstadoReserva } from '@/app/components/Etiqueta';
import { moneda, fechaCorta, ETIQUETAS_ESTADO_RESERVA } from '@/app/lib/formato';

// Define la acción disponible para cada estado de la reserva.
const SIGUIENTE_PASO = {
  pendiente: { estado: 'confirmada', texto: 'Confirmar', clase: 'text-blue-600 hover:text-blue-800' },
  confirmada: { estado: 'en_curso', texto: 'Entregar', clase: 'text-violet-600 hover:text-violet-800' },
  en_curso: { estado: 'finalizada', texto: 'Finalizar', clase: 'text-emerald-600 hover:text-emerald-800' },
};

function GestionReservas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [texto, setTexto] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [porCancelar, setPorCancelar] = useState(null);
  const [motivo, setMotivo] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReservas(await ReservaService.obtenerReservas());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga las reservas cuando se abre la página.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!exito) return undefined;
    const t = setTimeout(() => setExito(null), 4000);
    return () => clearTimeout(t);
  }, [exito]);

  // Aplica los filtros de estado y búsqueda sobre las reservas cargadas.
  const filtradas = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return reservas.filter((r) => {
      if (filtroEstado && r.estado !== filtroEstado) return false;
      if (q) {
        const buscable = `${r.codigo} ${r.cliente?.nombre ?? ''} ${r.vehiculo?.marca ?? ''} ${r.vehiculo?.modelo ?? ''} ${r.vehiculo?.placa ?? ''}`;
        if (!buscable.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reservas, filtroEstado, texto]);

  // Calcula cuántas reservas hay en cada estado para mostrarlo en los filtros.
  const conteos = useMemo(() => {
    const base = { '': reservas.length };
    Object.keys(ETIQUETAS_ESTADO_RESERVA).forEach((e) => {
      base[e] = reservas.filter((r) => r.estado === e).length;
    });
    return base;
  }, [reservas]);

  // Cambia la reserva al siguiente estado y actualiza la lista.
  const avanzar = async (reserva, estado) => {
    setProcesando(reserva.id);
    setError(null);
    try {
      const actualizada = await ReservaService.cambiarEstado(reserva.id, estado);
      setReservas((lista) => lista.map((r) => (r.id === actualizada.id ? actualizada : r)));
      setExito(
        estado === 'confirmada'
          ? `Reserva ${reserva.codigo} confirmada. Se generó el contrato ${actualizada.contratoCodigo ?? ''} automáticamente.`
          : `Reserva ${reserva.codigo}: ${ETIQUETAS_ESTADO_RESERVA[estado].toLowerCase()}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  // Cancela la reserva seleccionada y limpia el formulario del motivo.
  const cancelar = async () => {
    if (!porCancelar) return;
    setProcesando(porCancelar.id);
    try {
      const actualizada = await ReservaService.cancelar(porCancelar.id, motivo);
      setReservas((lista) => lista.map((r) => (r.id === actualizada.id ? actualizada : r)));
      setExito(`Reserva ${porCancelar.codigo} cancelada.`);
      setPorCancelar(null);
      setMotivo('');
    } catch (err) {
      setError(err.message);
      setPorCancelar(null);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reservas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Confirma, entrega y cierra las rentas. Al confirmar se genera el contrato automáticamente.
          </p>
        </div>
        <Link
          href="/buscar"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Nueva reserva
        </Link>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {[['', 'Todas'], ...Object.entries(ETIQUETAS_ESTADO_RESERVA)].map(([clave, etiqueta]) => (
          <button
            key={clave || 'todas'}
            type="button"
            onClick={() => setFiltroEstado(clave)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              filtroEstado === clave
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {etiqueta}
            <span className="ml-1.5 text-xs text-slate-400">{conteos[clave] ?? 0}</span>
          </button>
        ))}
      </div>

      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por código, cliente, placa o modelo…"
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 sm:max-w-md"
      />

      <div className="mt-6">
        <MensajeExito mensaje={exito} />
        <MensajeError mensaje={error} onReintentar={cargar} />
      </div>

      {!cargando && filtradas.length === 0 ? (
        <SinResultados
          titulo="No hay reservas que mostrar"
          descripcion="Cambia el filtro o crea una reserva nueva desde la búsqueda de vehículos."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Código', 'Cliente', 'Vehículo', 'Período', 'Total', 'Estado', 'Acciones'].map(
                    (th, i) => (
                      <th
                        key={th}
                        className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                          i === 6 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {th}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cargando ? (
                  <FilasEsqueleto filas={6} columnas={7} />
                ) : (
                  filtradas.map((r) => {
                    const paso = SIGUIENTE_PASO[r.estado];
                    const ocupado = procesando === r.id;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono text-sm font-medium text-slate-900">
                          {r.codigo}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {r.cliente ? r.cliente.nombre : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {r.vehiculo ? (
                            <Link
                              href={`/vehiculos/${r.vehiculo.id}`}
                              className="font-medium text-slate-900 hover:text-blue-700"
                            >
                              {r.vehiculo.marca} {r.vehiculo.modelo}
                            </Link>
                          ) : (
                            '—'
                          )}
                          <p className="font-mono text-xs text-slate-500">{r.vehiculo?.placa}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {fechaCorta(r.fechaInicio)} → {fechaCorta(r.fechaFin)}
                          <p className="text-xs text-slate-500">{r.dias} días</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {moneda(r.total)}
                        </td>
                        <td className="px-5 py-4">
                          <EstadoReserva estado={r.estado} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                          {paso && (
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() => avanzar(r, paso.estado)}
                              className={`font-medium disabled:opacity-50 ${paso.clase}`}
                            >
                              {ocupado ? '…' : paso.texto}
                            </button>
                          )}
                          {['pendiente', 'confirmada'].includes(r.estado) && (
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() => setPorCancelar(r)}
                              className="ml-4 font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          )}
                          {r.contratoId && (
                            <Link
                              href={`/contratos?buscar=${r.contratoCodigo}`}
                              className="ml-4 font-medium text-slate-600 hover:text-slate-900"
                            >
                              Contrato
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {porCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Cancelar reserva {porCancelar.codigo}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              El vehículo quedará libre en esas fechas y el contrato asociado se anulará.
            </p>
            <label htmlFor="motivo" className="mt-4 block text-sm font-medium text-slate-700">
              Motivo (opcional)
            </label>
            <textarea
              id="motivo"
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPorCancelar(null);
                  setMotivo('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservasPage() {
  return (
    <RutaProtegida roles={['administrador', 'operador']}>
      <GestionReservas />
    </RutaProtegida>
  );
}
