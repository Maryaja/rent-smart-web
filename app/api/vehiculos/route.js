import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { validarVehiculo, hayErrores } from '@/app/lib/validaciones';
import * as repoVehiculos from '@/app/lib/repositorios/vehiculos';

/** GET /api/vehiculos?estado=&categoria=&texto= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const vehiculos = await repoVehiculos.listar({
    estado: searchParams.get('estado') || undefined,
    categoria: searchParams.get('categoria') || undefined,
    texto: searchParams.get('texto') || undefined,
  });
  return ok(vehiculos);
});

/** POST /api/vehiculos */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarVehiculo(body);
  if (hayErrores(errores)) return invalido(errores);

  const placa = String(body.placa).trim().toUpperCase();
  if (await repoVehiculos.existePlaca(placa))
    return invalido({ placa: 'Ya existe un vehículo registrado con esta placa.' });

  const vehiculo = await repoVehiculos.crear({
    marca: String(body.marca).trim(),
    modelo: String(body.modelo).trim(),
    anio: Number(body.anio),
    placa,
    categoria: String(body.categoria).trim(),
    color: String(body.color).trim(),
    transmision: body.transmision || 'Automática',
    combustible: body.combustible || 'Gasolina',
    capacidad: body.capacidad ? Number(body.capacidad) : 5,
    kilometraje: body.kilometraje ? Number(body.kilometraje) : 0,
    precioPorDia: Number(body.precioPorDia),
    estado: body.estado || 'disponible',
    imagenUrl: String(body.imagenUrl || '').trim(),
    descripcion: String(body.descripcion || '').trim(),
  });

  return creado(vehiculo);
});
