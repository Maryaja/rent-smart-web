/* Página prueba del proyecto*/

const CARACTERISTICAS = [
  {
    icono: '🚗',
    titulo: 'Flota siempre al día',
    texto: 'Alta, edición y baja de vehículos con control de disponibilidad y mantenimiento.',
  },
  {
    icono: '📅',
    titulo: 'Reservas sin choques',
    texto: 'El sistema verifica la disponibilidad real y evita que dos clientes reserven la misma unidad.',
  },
  {
    icono: '📄',
    titulo: 'Contratos automáticos',
    texto: 'Al confirmar una reserva se genera el contrato y queda almacenado de forma digital.',
  },
  {
    icono: '📈',
    titulo: 'Reportes de operación',
    texto: 'Ingresos por mes, vehículos más solicitados y ocupación de la flota en un solo lugar.',
  },
];

export default function Inicio() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Plataforma inteligente de alquiler
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            RENT <span className="text-blue-600">SMART</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Gestiona tu flota, tus reservas y tus contratos desde un solo sistema.
          </p>
          <p className="mt-8 inline-block rounded-lg bg-slate-100 px-5 py-3 text-sm text-slate-600">
            Rama base: configuración, base de datos MySQL y componentes compartidos.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARACTERISTICAS.map((c) => (
            <article key={c.titulo} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-2xl" aria-hidden="true">
                {c.icono}
              </span>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{c.titulo}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.texto}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
