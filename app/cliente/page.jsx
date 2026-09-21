'use client';

/** Pantalla 4 · Dashboard de Clientes */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReservaService from '@/app/services/reservaService';
import VehiculoService from '@/app/services/vehiculoService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { useAuth } from '@/app/context/AuthContext';
import Cargando from '@/app/components/Cargando';
import { MensajeError } from '@/app/components/Mensajes';
import { TarjetaKpi, Panel } from '@/app/components/Tarjetas';
import { EstadoReserva } from '@/app/components/Etiqueta';
import { moneda, fechaLarga, hoyIso } from '@/app/lib/formato';

function DashboardCliente() {
  const { usuario, cliente, clienteId } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [sugeridos, setSugeridos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [misReservas, disponibles] = await Promise.all([
        clienteId ? ReservaService.obtenerReservas({ clienteId }) : Promise.resolve([]),
        VehiculoService.buscarDisponibles({ fechaInicio: hoyIso(1), fechaFin: hoyIso(4) }),
      ]);
      setReservas(misReservas);
      setSugeridos(disponibles.slice(0, 3));
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

  const resumen = useMemo(() => {
    const activas = reservas.filter((r) =>
      ['pendiente', 'confirmada', 'en_curso'].includes(r.estado)
    );
    const finalizadas = reservas.filter((r) => r.estado === 'finalizada');
    return {
      activas: activas.length,
      historicas: finalizadas.length,
      gastoTotal: finalizadas.reduce((s, r) => s + r.total, 0),
      proxima: activas.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))[0] || null,
    };
  }, [reservas]);

  if (cargando) return <Cargando mensaje="Cargando tu panel…" />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hola, {usuario.nombre.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aquí está el resumen de tus rentas con RENT SMART.
          </p>
        </div>
        <Link
          href="/buscar"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Reservar un vehículo
        </Link>
      </header>

      <MensajeError mensaje={error} onReintentar={cargar} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <TarjetaKpi titulo="Reservas activas" valor={resumen.activas} icono="📅" />
        <TarjetaKpi titulo="Rentas completadas" valor={resumen.historicas} icono="✅" color="verde" />
        <TarjetaKpi
          titulo="Total invertido"
          valor={moneda(resumen.gastoTotal)}
          detalle="En rentas finalizadas"
          icono="💳"
          color="violeta"
        />
      </div>

      {resumen.proxima && (
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Tu próxima renta
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {resumen.proxima.vehiculo?.marca} {resumen.proxima.vehiculo?.modelo}
              </h2>
              <p className="mt-1 text-sm text-slate-700">
                {fechaLarga(resumen.proxima.fechaInicio)} → {fechaLarga(resumen.proxima.fechaFin)} ·{' '}
                {resumen.proxima.lugarEntrega}
              </p>
              <div className="mt-2">
                <EstadoReserva estado={resumen.proxima.estado} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{moneda(resumen.proxima.total)}</p>
              <Link
                href="/mis-reservas"
                className="mt-1 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Ver mis reservas →
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          titulo="Historial reciente"
          acciones={
            <Link href="/mis-reservas" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Ver todo
            </Link>
          }
          className="lg:col-span-2"
        >
          {reservas.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">Todavía no has hecho ninguna reserva.</p>
              <Link
                href="/buscar"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Buscar vehículos
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {reservas.slice(0, 5).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {r.vehiculo?.marca} {r.vehiculo?.modelo}
                    </p>
                    <p className="text-sm text-slate-500">
                      {fechaLarga(r.fechaInicio)} → {fechaLarga(r.fechaFin)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{moneda(r.total)}</span>
                    <EstadoReserva estado={r.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Mis datos">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-500">Nombre</dt>
              <dd className="font-medium text-slate-900">{usuario.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Correo</dt>
              <dd className="text-slate-700">{usuario.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Teléfono</dt>
              <dd className="text-slate-700">{usuario.telefono || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Documento</dt>
              <dd className="text-slate-700">{cliente?.documento || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Licencia</dt>
              <dd className="text-slate-700">{cliente?.licencia || '—'}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      {sugeridos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">Disponibles esta semana</h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-3">
            {sugeridos.map((v) => (
              <Link
                key={v.id}
                href={`/vehiculos/${v.id}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">
                  🚗
                </span>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  {v.marca} {v.modelo}
                </h3>
                <p className="text-xs text-slate-500">
                  {v.categoria} · {v.transmision}
                </p>
                <p className="mt-2 text-sm font-bold text-blue-700">
                  {moneda(v.precioPorDia)} <span className="font-normal text-slate-500">/ día</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ClientePage() {
  return (
    <RutaProtegida roles={['cliente']}>
      <DashboardCliente />
    </RutaProtegida>
  );
}
