'use client';

/** Mis reservas (portal del cliente). */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ReservaService from '@/app/services/reservaService';
import ContratoService from '@/app/services/contratoService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { useAuth } from '@/app/context/AuthContext';
import Cargando from '@/app/components/Cargando';
import { MensajeError, MensajeExito, SinResultados } from '@/app/components/Mensajes';
import { EstadoReserva } from '@/app/components/Etiqueta';
import { moneda, fechaLarga } from '@/app/lib/formato';

function MisReservas() {
  const { clienteId } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [porCancelar, setPorCancelar] = useState(null);
  const [contrato, setContrato] = useState(null);

  const cargar = useCallback(async () => {
    if (!clienteId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      setReservas(await ReservaService.obtenerReservas({ clienteId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [clienteId]);

  // Carga inicial de datos desde el API. La regla del compilador de React
  // desaconseja invocar setState dentro de un efecto; aquí es intencional
  // porque es el punto donde la pantalla se sincroniza con el servidor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const cancelar = async () => {
    if (!porCancelar) return;
    try {
      const actualizada = await ReservaService.cancelar(porCancelar.id, 'Cancelada por el cliente');
      setReservas((lista) => lista.map((r) => (r.id === actualizada.id ? actualizada : r)));
      setExito(`Tu reserva ${porCancelar.codigo} fue cancelada.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPorCancelar(null);
    }
  };

  const verContrato = async (reservaId) => {
    const reserva = reservas.find((r) => r.id === reservaId);
    if (!reserva?.contratoId) return;
    try {
      setContrato(await ContratoService.obtenerContrato(reserva.contratoId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (cargando) return <Cargando mensaje="Cargando tus reservas…" />;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis reservas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta el estado de tus rentas y descarga tus contratos.
          </p>
        </div>
        <Link
          href="/buscar"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Reservar otro vehículo
        </Link>
      </header>

      <div className="mt-6">
        <MensajeExito mensaje={exito} />
        <MensajeError mensaje={error} onReintentar={cargar} />
      </div>

      {reservas.length === 0 ? (
        <SinResultados
          titulo="Aún no tienes reservas"
          descripcion="Busca un vehículo disponible y haz tu primera reserva."
          accion={
            <Link
              href="/buscar"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Buscar vehículos
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {reservas.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900">{r.codigo}</span>
                    <EstadoReserva estado={r.estado} />
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    {r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo}` : 'Vehículo'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {fechaLarga(r.fechaInicio)} → {fechaLarga(r.fechaFin)} · {r.dias}{' '}
                    {r.dias === 1 ? 'día' : 'días'}
                  </p>
                  {r.lugarEntrega && (
                    <p className="mt-1 text-sm text-slate-500">Entrega: {r.lugarEntrega}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{moneda(r.total)}</p>
                  <p className="text-xs text-slate-500">impuestos incluidos</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                {r.vehiculo && (
                  <Link
                    href={`/vehiculos/${r.vehiculo.id}`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Ver vehículo
                  </Link>
                )}
                {r.contratoId && (
                  <button
                    type="button"
                    onClick={() => verContrato(r.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Ver contrato {r.contratoCodigo}
                  </button>
                )}
                {['pendiente', 'confirmada'].includes(r.estado) && (
                  <button
                    type="button"
                    onClick={() => setPorCancelar(r)}
                    className="ml-auto text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Cancelar reserva
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Confirmación de cancelación */}
      {porCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Cancelar reserva</h2>
            <p className="mt-2 text-sm text-slate-600">
              ¿Deseas cancelar la reserva <strong>{porCancelar.codigo}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPorCancelar(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contrato en modal */}
      {contrato && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Contrato {contrato.codigo}</h2>
              <button
                type="button"
                onClick={() => setContrato(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </header>
            <div className="space-y-4 px-6 py-5 text-sm">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Vehículo</dt>
                  <dd className="font-medium text-slate-900">
                    {contrato.vehiculo?.marca} {contrato.vehiculo?.modelo} ({contrato.vehiculo?.placa})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Período</dt>
                  <dd className="font-medium text-slate-900">
                    {fechaLarga(contrato.fechaInicio)} → {fechaLarga(contrato.fechaFin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Monto total</dt>
                  <dd className="font-medium text-slate-900">{moneda(contrato.montoTotal)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Depósito</dt>
                  <dd className="font-medium text-slate-900">{moneda(contrato.deposito)}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-xs uppercase text-slate-500">Condiciones</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                  {String(contrato.condiciones)
                    .split('\n')
                    .map((linea, i) => (
                      <li key={i}>{linea}</li>
                    ))}
                </ul>
              </div>
            </div>
            <footer className="flex justify-end border-t border-slate-200 px-6 py-4">
              <Link
                href={`/contratos/${contrato.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Abrir versión imprimible
              </Link>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MisReservasPage() {
  return (
    <RutaProtegida roles={['cliente']}>
      <MisReservas />
    </RutaProtegida>
  );
}
