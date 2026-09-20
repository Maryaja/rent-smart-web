'use client';

/** Pantalla 3 · Dashboard Administrativo */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ReporteService from '@/app/services/reporteService';
import ReservaService from '@/app/services/reservaService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { useAuth } from '@/app/context/AuthContext';
import Cargando from '@/app/components/Cargando';
import { MensajeError, SinResultados } from '@/app/components/Mensajes';
import { TarjetaKpi, Panel, BarraComparativa } from '@/app/components/Tarjetas';
import { EstadoReserva } from '@/app/components/Etiqueta';
import { moneda, numero, fechaCorta, hoyIso } from '@/app/lib/formato';

const ACCESOS = [
  { href: '/vehiculos', titulo: 'Vehículos', texto: 'Alta, edición y disponibilidad', icono: '🚗' },
  { href: '/reservas', titulo: 'Reservas', texto: 'Confirmar, entregar y cerrar', icono: '📅' },
  { href: '/contratos', titulo: 'Contratos', texto: 'Documentos generados', icono: '📄' },
  { href: '/reportes', titulo: 'Reportes', texto: 'Ingresos y ocupación', icono: '📈' },
];

function DashboardAdmin() {
  const { usuario, esAdministrador } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [datos, listaReservas] = await Promise.all([
        ReporteService.obtenerReportes({ desde: hoyIso(-365), hasta: hoyIso() }),
        ReservaService.obtenerReservas(),
      ]);
      setReporte(datos);
      setReservas(listaReservas);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial de datos desde el API. La regla del compilador de React
  // desaconseja invocar setState dentro de un efecto; aquí es intencional
  // porque es el punto donde la pantalla se sincroniza con el servidor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const reintentar = () => {
    setCargando(true);
    setError(null);
    cargar();
  };

  if (cargando) return <Cargando mensaje="Preparando tu panel…" />;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <MensajeError mensaje={error} onReintentar={reintentar} />
      </div>
    );
  }

  const pendientes = reservas.filter((r) => r.estado === 'pendiente');
  const enCurso = reservas.filter((r) => r.estado === 'en_curso');
  const proximasEntregas = reservas
    .filter((r) => r.estado === 'confirmada' && r.fechaInicio >= hoyIso())
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .slice(0, 5);
  const devolucionesHoy = reservas.filter(
    (r) => r.estado === 'en_curso' && r.fechaFin <= hoyIso(1)
  );

  const topVehiculos = reporte.vehiculosMasSolicitados.filter((v) => v.reservas > 0).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Hola, {usuario.nombre.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen operativo de los últimos 12 meses · perfil {esAdministrador ? 'administrador' : 'operador'}.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaKpi
          titulo="Ingresos (12 meses)"
          valor={moneda(reporte.resumen.totalIngresos)}
          detalle={`Ticket promedio ${moneda(reporte.resumen.ticketPromedio)}`}
          icono="💵"
          color="verde"
        />
        <TarjetaKpi
          titulo="Vehículos disponibles"
          valor={`${reporte.resumen.flota.disponibles} / ${reporte.resumen.flota.total}`}
          detalle={`${reporte.resumen.flota.rentadosHoy} rentados hoy`}
          icono="🚗"
        />
        <TarjetaKpi
          titulo="Reservas pendientes"
          valor={numero(pendientes.length)}
          detalle="Esperan confirmación"
          icono="⏳"
          color="ambar"
        />
        <TarjetaKpi
          titulo="Rentas en curso"
          valor={numero(enCurso.length)}
          detalle={`${devolucionesHoy.length} devoluciones próximas`}
          icono="🔑"
          color="violeta"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden="true">
              {a.icono}
            </span>
            <h2 className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
              {a.titulo}
            </h2>
            <p className="text-xs text-slate-500">{a.texto}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          titulo="Reservas por confirmar"
          descripcion="Al confirmar se genera el contrato automáticamente."
          acciones={
            <Link href="/reservas" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Ver todas
            </Link>
          }
          className="lg:col-span-2"
        >
          {pendientes.length === 0 ? (
            <SinResultados titulo="Todo al día" descripcion="No hay reservas esperando confirmación." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {pendientes.slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      <span className="font-mono">{r.codigo}</span> · {r.cliente?.nombre}
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.vehiculo?.marca} {r.vehiculo?.modelo} · {fechaCorta(r.fechaInicio)} →{' '}
                      {fechaCorta(r.fechaFin)}
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

        <Panel titulo="Próximas entregas">
          {proximasEntregas.length === 0 ? (
            <p className="text-sm text-slate-500">No hay entregas programadas.</p>
          ) : (
            <ul className="space-y-3">
              {proximasEntregas.map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="font-medium text-slate-900">{fechaCorta(r.fechaInicio)}</p>
                  <p className="text-slate-600">
                    {r.vehiculo?.marca} {r.vehiculo?.modelo} — {r.cliente?.nombre}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          titulo="Vehículos más solicitados"
          acciones={
            <Link href="/reportes" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Ver reportes
            </Link>
          }
        >
          {topVehiculos.length === 0 ? (
            <SinResultados titulo="Sin rentas en el período" />
          ) : (
            <ul className="space-y-4">
              {topVehiculos.map((v) => (
                <li key={v.vehiculoId}>
                  <BarraComparativa
                    etiqueta={`${v.nombre} · ${v.placa}`}
                    valor={v.reservas}
                    maximo={topVehiculos[0].reservas}
                    textoValor={`${v.reservas} rentas`}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Ingresos por mes">
          {reporte.ingresosMensuales.length === 0 ? (
            <SinResultados titulo="Sin ingresos en el período" />
          ) : (
            <div className="flex h-44 items-stretch gap-1.5">
              {reporte.ingresosMensuales.slice(-12).map((m) => {
                const maximo = Math.max(...reporte.ingresosMensuales.map((x) => x.ingresos), 1);
                return (
                  <div key={m.mes} className="flex h-full flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-blue-500"
                        style={{ height: `${Math.max(4, (m.ingresos / maximo) * 100)}%` }}
                        title={`${m.etiqueta}: ${moneda(m.ingresos)}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">{m.etiqueta.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RutaProtegida roles={['administrador', 'operador']}>
      <DashboardAdmin />
    </RutaProtegida>
  );
}
