import { ok, manejar } from '@/app/lib/http';
import { ESTADOS_RESERVA } from '@/app/lib/constantes';
import { redondear, hoy } from '@/app/lib/utilidades';
import * as repoReportes from '@/app/lib/repositorios/reportes';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function diasDelRango(desde, hasta) {
  const inicio = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  return Math.max(1, Math.round((fin - inicio) / 86400000));
}

/**
 * GET /api/reportes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * Los tres reportes que pide el documento — ingresos mensuales, vehículos
 * más solicitados y ocupación de la flota — los calcula MySQL con GROUP BY;
 * aquí solo se les da formato.
 */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const hasta = searchParams.get('hasta') || hoy();
  const desde =
    searchParams.get('desde') || `${new Date().getFullYear()}-01-01`;

  const [mensuales, vehiculos, categorias, estados, clientes, totales, flota] = await Promise.all([
    repoReportes.ingresosMensuales(desde, hasta),
    repoReportes.porVehiculo(desde, hasta),
    repoReportes.porCategoria(desde, hasta),
    repoReportes.reservasPorEstado(desde, hasta),
    repoReportes.mejoresClientes(desde, hasta),
    repoReportes.totalesDelPeriodo(desde, hasta),
    repoReportes.estadoFlota(hasta),
  ]);

  const diasPeriodo = diasDelRango(desde, hasta);

  const ingresosMensuales = mensuales.map((m) => {
    const [anio, mes] = m.mes.split('-');
    return {
      mes: m.mes,
      etiqueta: `${MESES[Number(mes) - 1]} ${anio}`,
      ingresos: redondear(m.ingresos),
      reservas: Number(m.reservas),
      diasRentados: Number(m.diasRentados),
    };
  });

  const vehiculosMasSolicitados = vehiculos.map((v) => ({
    vehiculoId: v.vehiculoId,
    nombre: v.nombre,
    placa: v.placa,
    categoria: v.categoria,
    estado: v.estado,
    reservas: Number(v.reservas),
    ingresos: redondear(v.ingresos),
    diasRentados: Number(v.diasRentados),
  }));

  const ocupacion = vehiculosMasSolicitados.map((v) => ({
    vehiculoId: v.vehiculoId,
    nombre: v.nombre,
    placa: v.placa,
    diasRentados: v.diasRentados,
    diasPeriodo,
    porcentaje: redondear(Math.min(100, (v.diasRentados / diasPeriodo) * 100)),
  }));

  const ocupacionPromedio = ocupacion.length
    ? redondear(ocupacion.reduce((s, o) => s + o.porcentaje, 0) / ocupacion.length)
    : 0;

  const t = totales[0] || {};
  const totalIngresos = redondear(t.totalIngresos || 0);
  const reservasFacturables = Number(t.reservasFacturables || 0);

  const f = flota[0] || {};

  // Todos los estados aparecen, aunque la consulta no los devuelva
  const conteoEstados = new Map(estados.map((e) => [e.estado, Number(e.cantidad)]));
  const estadoReservas = ESTADOS_RESERVA.map((estado) => ({
    estado,
    cantidad: conteoEstados.get(estado) || 0,
  }));

  return ok({
    periodo: { desde, hasta, dias: diasPeriodo },
    resumen: {
      totalIngresos,
      totalReservas: Number(t.totalReservas || 0),
      reservasFacturables,
      ticketPromedio: reservasFacturables ? redondear(totalIngresos / reservasFacturables) : 0,
      ocupacionPromedio,
      clientesActivos: Number(t.clientesActivos || 0),
      flota: {
        total: Number(f.total || 0),
        disponibles: Number(f.disponibles || 0),
        mantenimiento: Number(f.mantenimiento || 0),
        noDisponibles: Number(f.noDisponibles || 0),
        rentadosHoy: Number(f.rentadosHoy || 0),
      },
    },
    ingresosMensuales,
    vehiculosMasSolicitados,
    ocupacion,
    porCategoria: categorias.map((c) => ({
      categoria: c.categoria,
      reservas: Number(c.reservas),
      ingresos: redondear(c.ingresos),
    })),
    estadoReservas,
    mejoresClientes: clientes.map((c) => ({
      clienteId: c.clienteId,
      nombre: c.nombre,
      reservas: Number(c.reservas),
      facturado: redondear(c.facturado),
    })),
  });
});
