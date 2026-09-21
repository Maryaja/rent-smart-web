'use client';

/** Pantalla 8 · Gestión de Contratos */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ContratoService from '@/app/services/contratoService';
import ReservaService from '@/app/services/reservaService';
import RutaProtegida from '@/app/components/RutaProtegida';
import { MensajeError, MensajeExito, SinResultados } from '@/app/components/Mensajes';
import Cargando, { FilasEsqueleto } from '@/app/components/Cargando';
import { EstadoContrato } from '@/app/components/Etiqueta';
import { moneda, fechaCorta, ETIQUETAS_ESTADO_CONTRATO } from '@/app/lib/formato';

function GestionContratos() {
  const parametros = useSearchParams();
  const [contratos, setContratos] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [texto, setTexto] = useState(parametros.get('buscar') || '');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [generando, setGenerando] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaContratos, reservas] = await Promise.all([
        ContratoService.obtenerContratos(),
        ReservaService.obtenerReservas(),
      ]);
      setContratos(listaContratos);
      // Reservas confirmadas o en curso a las que aún les falta contrato
      setPendientes(
        reservas.filter((r) => ['confirmada', 'en_curso'].includes(r.estado) && !r.contratoId)
      );
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

  useEffect(() => {
    if (!exito) return undefined;
    const t = setTimeout(() => setExito(null), 4000);
    return () => clearTimeout(t);
  }, [exito]);

  const filtrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return contratos.filter((c) => {
      if (filtroEstado && c.estado !== filtroEstado) return false;
      if (q) {
        const buscable = `${c.codigo} ${c.reservaCodigo ?? ''} ${c.cliente?.nombre ?? ''} ${c.vehiculo?.placa ?? ''} ${c.vehiculo?.marca ?? ''} ${c.vehiculo?.modelo ?? ''}`;
        if (!buscable.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [contratos, texto, filtroEstado]);

  const totales = useMemo(
    () => ({
      vigentes: contratos.filter((c) => c.estado === 'vigente').length,
      finalizados: contratos.filter((c) => c.estado === 'finalizado').length,
      montoVigente: contratos
        .filter((c) => c.estado === 'vigente')
        .reduce((s, c) => s + c.montoTotal, 0),
    }),
    [contratos]
  );

  const generar = async (reserva) => {
    setGenerando(reserva.id);
    setError(null);
    try {
      const contrato = await ContratoService.generarDesdeReserva(reserva.id);
      setContratos((lista) => [contrato, ...lista]);
      setPendientes((lista) => lista.filter((r) => r.id !== reserva.id));
      setExito(`Contrato ${contrato.codigo} generado para la reserva ${reserva.codigo}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contratos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Los contratos se generan automáticamente al confirmar una reserva y quedan almacenados de
          forma digital.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vigentes</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{totales.vigentes}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Finalizados</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{totales.finalizados}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Monto en contratos vigentes
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{moneda(totales.montoVigente)}</p>
        </div>
      </div>

      {pendientes.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            Reservas sin contrato ({pendientes.length})
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Estas reservas están activas pero no tienen contrato generado.
          </p>
          <ul className="mt-3 space-y-2">
            {pendientes.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3"
              >
                <span className="text-sm text-slate-700">
                  <strong className="font-mono">{r.codigo}</strong> · {r.cliente?.nombre} ·{' '}
                  {r.vehiculo?.marca} {r.vehiculo?.modelo}
                </span>
                <button
                  type="button"
                  onClick={() => generar(r)}
                  disabled={generando === r.id}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {generando === r.id ? 'Generando…' : 'Generar contrato'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por código, cliente o placa…"
          className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ETIQUETAS_ESTADO_CONTRATO).map(([clave, etiqueta]) => (
            <option key={clave} value={clave}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <MensajeExito mensaje={exito} />
        <MensajeError mensaje={error} onReintentar={cargar} />
      </div>

      {!cargando && filtrados.length === 0 ? (
        <SinResultados
          titulo="No hay contratos registrados"
          descripcion="Confirma una reserva para que el sistema genere su contrato."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Contrato', 'Cliente', 'Vehículo', 'Vigencia', 'Monto', 'Estado', ''].map(
                    (th, i) => (
                      <th
                        key={th || i}
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
                  filtrados.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-semibold text-slate-900">{c.codigo}</p>
                        <p className="text-xs text-slate-500">Reserva {c.reservaCodigo}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{c.cliente?.nombre ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {c.vehiculo ? `${c.vehiculo.marca} ${c.vehiculo.modelo}` : '—'}
                        <p className="font-mono text-xs text-slate-500">{c.vehiculo?.placa}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {fechaCorta(c.fechaInicio)} → {fechaCorta(c.fechaFin)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {moneda(c.montoTotal)}
                        <p className="text-xs font-normal text-slate-500">
                          Depósito {moneda(c.deposito)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <EstadoContrato estado={c.estado} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/contratos/${c.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Ver documento
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContratosPage() {
  return (
    <RutaProtegida roles={['administrador', 'operador']}>
      <Suspense fallback={<Cargando mensaje="Cargando contratos…" />}>
        <GestionContratos />
      </Suspense>
    </RutaProtegida>
  );
}
