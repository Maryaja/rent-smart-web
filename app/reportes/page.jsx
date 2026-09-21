'use client';

/**
 * Módulo de Reportes (Paso 4).
 * Todos los datos vienen del API (/api/reportes): ingresos mensuales,
 * vehículos más solicitados y ocupación de la flota.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReporteService, { reporteACsv } from '@/app/services/reporteService';
import RutaProtegida from '@/app/components/RutaProtegida';
import Cargando from '@/app/components/Cargando';
import { MensajeError, SinResultados } from '@/app/components/Mensajes';
import { TarjetaKpi, Panel, BarraComparativa } from '@/app/components/Tarjetas';
import { moneda, numero, fechaLarga, hoyIso, ETIQUETAS_ESTADO_RESERVA } from '@/app/lib/formato';

const PERIODOS = [
  { clave: 'anio', etiqueta: 'Este año' },
  { clave: 'semestre', etiqueta: 'Últimos 6 meses' },
  { clave: 'trimestre', etiqueta: 'Últimos 3 meses' },
  { clave: 'mes', etiqueta: 'Últimos 30 días' },
];

function rangoDe(clave) {
  const hasta = hoyIso();
  const hoy = new Date();
  if (clave === 'mes') return { desde: hoyIso(-30), hasta };
  if (clave === 'trimestre')
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate()).toISOString().slice(0, 10), hasta };
  if (clave === 'semestre')
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth() - 6, hoy.getDate()).toISOString().slice(0, 10), hasta };
  return { desde: new Date(hoy.getFullYear(), 0, 1).toISOString().slice(0, 10), hasta };
}

function Reportes() {
  const [periodo, setPeriodo] = useState('anio');
  const [rango, setRango] = useState(() => rangoDe('anio'));
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReporte(await ReporteService.obtenerReportes(rango));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [rango]);

  // Carga inicial de datos desde el API. La regla del compilador de React
  // desaconseja invocar setState dentro de un efecto; aquí es intencional
  // porque es el punto donde la pantalla se sincroniza con el servidor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const elegirPeriodo = (clave) => {
    setPeriodo(clave);
    setRango(rangoDe(clave));
  };

  const maxIngreso = useMemo(
    () => (reporte ? Math.max(...reporte.ingresosMensuales.map((m) => m.ingresos), 1) : 1),
    [reporte]
  );

  const topVehiculos = useMemo(
    () => (reporte ? reporte.vehiculosMasSolicitados.filter((v) => v.reservas > 0).slice(0, 8) : []),
    [reporte]
  );

  const descargarCsv = () => {
    if (!reporte) return;
    const blob = new Blob([reporteACsv(reporte)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `rentsmart-reporte-${rango.desde}-a-${rango.hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  if (cargando && !reporte) return <Cargando mensaje="Calculando los reportes…" />;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresos, demanda por unidad y ocupación de la flota.
          </p>
        </div>
        <button
          type="button"
          onClick={descargarCsv}
          disabled={!reporte}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Descargar CSV
        </button>
      </header>

      {/* --------------------------- Período --------------------------- */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.clave}
              type="button"
              onClick={() => elegirPeriodo(p.clave)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                periodo === p.clave
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="desde" className="block text-xs font-medium text-slate-600">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              value={rango.desde}
              onChange={(e) => {
                setPeriodo('');
                setRango((r) => ({ ...r, desde: e.target.value }));
              }}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="hasta" className="block text-xs font-medium text-slate-600">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              value={rango.hasta}
              onChange={(e) => {
                setPeriodo('');
                setRango((r) => ({ ...r, hasta: e.target.value }));
              }}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <MensajeError mensaje={error} onReintentar={cargar} />

      {reporte && (
        <>
          <p className="mt-4 text-sm text-slate-500">
            Período analizado: {fechaLarga(reporte.periodo.desde)} — {fechaLarga(reporte.periodo.hasta)}{' '}
            ({reporte.periodo.dias} días)
          </p>

          {/* ------------------------- Indicadores ------------------------- */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TarjetaKpi
              titulo="Ingresos del período"
              valor={moneda(reporte.resumen.totalIngresos)}
              detalle={`${reporte.resumen.reservasFacturables} rentas facturables`}
              icono="💵"
              color="verde"
            />
            <TarjetaKpi
              titulo="Ticket promedio"
              valor={moneda(reporte.resumen.ticketPromedio)}
              detalle="Por renta"
              icono="🧾"
            />
            <TarjetaKpi
              titulo="Ocupación de la flota"
              valor={`${reporte.resumen.ocupacionPromedio}%`}
              detalle={`${reporte.resumen.flota.total} unidades`}
              icono="📊"
              color="violeta"
            />
            <TarjetaKpi
              titulo="Clientes activos"
              valor={numero(reporte.resumen.clientesActivos)}
              detalle="Con al menos una renta"
              icono="👥"
              color="ambar"
            />
          </div>

          {/* --------------------- Ingresos mensuales --------------------- */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel
              titulo="Ingresos mensuales"
              descripcion="Total facturado por mes dentro del período."
              className="lg:col-span-2"
            >
              {reporte.ingresosMensuales.length === 0 ? (
                <SinResultados titulo="Sin ingresos en este período" />
              ) : (
                <>
                  <div className="flex h-64 items-stretch gap-2">
                    {reporte.ingresosMensuales.map((m) => (
                      <div key={m.mes} className="flex h-full flex-1 flex-col items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500">
                          {moneda(m.ingresos).replace('.00', '')}
                        </span>
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-md bg-blue-500 transition-all hover:bg-blue-600"
                            style={{ height: `${Math.max(4, (m.ingresos / maxIngreso) * 100)}%` }}
                            title={`${m.etiqueta}: ${moneda(m.ingresos)} · ${m.reservas} reservas`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{m.etiqueta}</span>
                      </div>
                    ))}
                  </div>
                  <table className="mt-6 w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                        <th className="py-2">Mes</th>
                        <th className="py-2 text-right">Reservas</th>
                        <th className="py-2 text-right">Días rentados</th>
                        <th className="py-2 text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.ingresosMensuales.map((m) => (
                        <tr key={m.mes} className="border-b border-slate-100">
                          <td className="py-2 text-slate-700">{m.etiqueta}</td>
                          <td className="py-2 text-right text-slate-700">{m.reservas}</td>
                          <td className="py-2 text-right text-slate-700">{m.diasRentados}</td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            {moneda(m.ingresos)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </Panel>

            <div className="space-y-6">
              <Panel titulo="Estado de la flota">
                <ul className="space-y-3 text-sm">
                  {[
                    ['Disponibles', reporte.resumen.flota.disponibles, 'text-emerald-700'],
                    ['Rentados hoy', reporte.resumen.flota.rentadosHoy, 'text-violet-700'],
                    ['En mantenimiento', reporte.resumen.flota.mantenimiento, 'text-amber-700'],
                    ['No disponibles', reporte.resumen.flota.noDisponibles, 'text-red-700'],
                  ].map(([etiqueta, valor, clase]) => (
                    <li key={etiqueta} className="flex items-center justify-between">
                      <span className="text-slate-600">{etiqueta}</span>
                      <span className={`text-lg font-bold ${clase}`}>{valor}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel titulo="Reservas por estado">
                <ul className="space-y-3">
                  {reporte.estadoReservas.map((e) => (
                    <li key={e.estado}>
                      <BarraComparativa
                        etiqueta={ETIQUETAS_ESTADO_RESERVA[e.estado]}
                        valor={e.cantidad}
                        maximo={Math.max(...reporte.estadoReservas.map((x) => x.cantidad), 1)}
                        textoValor={e.cantidad}
                      />
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>

          {/* ---------------- Vehículos más solicitados ---------------- */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel
              titulo="Vehículos más solicitados"
              descripcion="Ordenados por número de rentas en el período."
            >
              {topVehiculos.length === 0 ? (
                <SinResultados titulo="Sin rentas registradas" />
              ) : (
                <ul className="space-y-4">
                  {topVehiculos.map((v) => (
                    <li key={v.vehiculoId}>
                      <BarraComparativa
                        etiqueta={`${v.nombre} · ${v.placa}`}
                        valor={v.reservas}
                        maximo={topVehiculos[0].reservas}
                        textoValor={`${v.reservas} rentas · ${moneda(v.ingresos)}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              titulo="Ocupación por unidad"
              descripcion={`Días rentados sobre ${reporte.periodo.dias} días del período.`}
            >
              <ul className="space-y-4">
                {reporte.ocupacion.slice(0, 8).map((o) => (
                  <li key={o.vehiculoId}>
                    <BarraComparativa
                      etiqueta={`${o.nombre} · ${o.placa}`}
                      valor={o.porcentaje}
                      maximo={100}
                      textoValor={`${o.porcentaje}% (${o.diasRentados} días)`}
                      color={
                        o.porcentaje >= 60
                          ? 'bg-emerald-500'
                          : o.porcentaje >= 30
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                      }
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* -------------------- Categorías y clientes -------------------- */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel titulo="Ingresos por categoría">
              {reporte.porCategoria.length === 0 ? (
                <SinResultados titulo="Sin datos" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2">Categoría</th>
                      <th className="py-2 text-right">Rentas</th>
                      <th className="py-2 text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.porCategoria.map((c) => (
                      <tr key={c.categoria} className="border-b border-slate-100">
                        <td className="py-2 text-slate-700">{c.categoria}</td>
                        <td className="py-2 text-right text-slate-700">{c.reservas}</td>
                        <td className="py-2 text-right font-medium text-slate-900">
                          {moneda(c.ingresos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel titulo="Clientes con mayor facturación">
              {reporte.mejoresClientes.length === 0 ? (
                <SinResultados titulo="Sin datos" />
              ) : (
                <ol className="space-y-3">
                  {reporte.mejoresClientes.map((c, i) => (
                    <li key={c.clienteId} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {i + 1}
                        </span>
                        {c.nombre}
                      </span>
                      <span className="text-sm text-slate-500">
                        {c.reservas} rentas ·{' '}
                        <strong className="text-slate-900">{moneda(c.facturado)}</strong>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReportesPage() {
  return (
    <RutaProtegida roles={['administrador', 'operador']}>
      <Reportes />
    </RutaProtegida>
  );
}
