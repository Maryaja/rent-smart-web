// app/services/reporteService.js — Paso 4/5: reportes y dashboards
import apiClient from './apiClient';

export const ReporteService = {
  /** Reporte completo del período: ingresos, vehículos más solicitados y ocupación. */
  obtenerReportes({ desde, hasta } = {}) {
    return apiClient.get('/reportes', { params: { desde, hasta } });
  },
};

/** Convierte el reporte a CSV para descargarlo desde el navegador. */
export function reporteACsv(reporte) {
  if (!reporte) return '';
  const lineas = [];

  lineas.push('RENT SMART - Reporte operativo');
  lineas.push(`Periodo,${reporte.periodo.desde},${reporte.periodo.hasta}`);
  lineas.push('');

  lineas.push('Ingresos mensuales');
  lineas.push('Mes,Ingresos,Reservas,Dias rentados');
  reporte.ingresosMensuales.forEach((m) =>
    lineas.push(`${m.etiqueta},${m.ingresos},${m.reservas},${m.diasRentados}`)
  );
  lineas.push('');

  lineas.push('Vehiculos mas solicitados');
  lineas.push('Vehiculo,Placa,Categoria,Reservas,Ingresos,Dias rentados');
  reporte.vehiculosMasSolicitados.forEach((v) =>
    lineas.push(`${v.nombre},${v.placa},${v.categoria},${v.reservas},${v.ingresos},${v.diasRentados}`)
  );
  lineas.push('');

  lineas.push('Ocupacion de la flota');
  lineas.push('Vehiculo,Placa,Dias rentados,Dias del periodo,Ocupacion %');
  reporte.ocupacion.forEach((o) =>
    lineas.push(`${o.nombre},${o.placa},${o.diasRentados},${o.diasPeriodo},${o.porcentaje}`)
  );

  return lineas.join('\n');
}

export default ReporteService;
