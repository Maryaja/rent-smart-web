import { db } from '@/app/lib/db';
import { ok, creado, error, invalido, leerJson, manejar } from '@/app/lib/http';
import { validarVehiculo, hayErrores } from '@/app/lib/validaciones';

/** GET /api/vehiculos?estado=&categoria=&texto= */
export const GET = manejar(async (request) => {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado');
  const categoria = searchParams.get('categoria');
  const texto = searchParams.get('texto');

  let resultado = [...db.vehiculos];

  if (estado) resultado = resultado.filter((v) => v.estado === estado);
  if (categoria) resultado = resultado.filter((v) => v.categoria === categoria);
  if (texto) {
    const t = texto.toLowerCase();
    resultado = resultado.filter((v) =>
      `${v.marca} ${v.modelo} ${v.placa} ${v.categoria} ${v.color}`.toLowerCase().includes(t)
    );
  }

  resultado.sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo));
  return ok(resultado);
});

/** POST /api/vehiculos */
export const POST = manejar(async (request) => {
  const body = await leerJson(request);
  if (!body) return error('El cuerpo de la petición no es un JSON válido.');

  const errores = validarVehiculo(body);
  if (hayErrores(errores)) return invalido(errores);

  const placa = String(body.placa).trim().toUpperCase();
  if (db.vehiculos.some((v) => v.placa === placa))
    return invalido({ placa: 'Ya existe un vehículo registrado con esta placa.' });

  const vehiculo = {
    id: db.siguienteId('vehiculos'),
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
  };

  db.vehiculos.push(vehiculo);
  return creado(vehiculo);
});
