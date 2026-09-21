import { vehiculosDisponibles, calcularTarifa } from '@/app/lib/negocio';
import { ok, manejar } from '@/app/lib/http';

/**
 * GET /api/vehiculos/disponibles?fechaInicio=&fechaFin=&categoria=&texto=&precioMin=&precioMax=
 * Devuelve los vehículos libres en el rango con la cotización ya calculada.
 */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const fechaInicio = searchParams.get('fechaInicio');
  const fechaFin = searchParams.get('fechaFin');

  const filtros = {
    categoria: searchParams.get('categoria') || undefined,
    transmision: searchParams.get('transmision') || undefined,
    texto: searchParams.get('texto') || undefined,
    precioMin: searchParams.get('precioMin') || undefined,
    precioMax: searchParams.get('precioMax') || undefined,
  };

  const libres = await vehiculosDisponibles(fechaInicio, fechaFin, filtros);

  const lista = libres.map((vehiculo) =>
    fechaInicio && fechaFin
      ? { ...vehiculo, cotizacion: calcularTarifa(vehiculo.precioPorDia, fechaInicio, fechaFin) }
      : { ...vehiculo, cotizacion: null }
  );

  return ok(lista);
});
