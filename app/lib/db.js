/**
 * RENT SMART - "Base de datos" en memoria compartida por todos los Route Handlers.
 *
 * Modelo de datos base acordado por el equipo (Etapa 2):
 *   Usuario · Vehiculo · Cliente · Reserva · Contrato · Pago
 *
 * Se guarda en globalThis para que sobreviva al hot-reload de `next dev`
 * y para que todas las rutas /api/* compartan la misma instancia.
 * En producción (serverless) los datos se reinician con cada instancia:
 * es suficiente para el alcance académico de la Etapa 2 y permite
 * sustituir este archivo por un backend real sin tocar la capa de servicios.
 */

const ESTADOS_VEHICULO = ['disponible', 'mantenimiento', 'no_disponible'];
const ESTADOS_RESERVA = ['pendiente', 'confirmada', 'en_curso', 'finalizada', 'cancelada'];
const ESTADOS_CONTRATO = ['vigente', 'finalizado', 'anulado'];
const ROLES = ['administrador', 'operador', 'cliente'];

const IMPUESTO = 0.13; // IVA El Salvador
const PORCENTAJE_DEPOSITO = 0.2;

function fecha(anio, mes, dia) {
  // mes 1-12
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function crearSemilla() {
  const usuarios = [
    {
      id: 1,
      nombre: 'Erick Rosales',
      email: 'admin@rentsmart.com',
      password: 'Admin123',
      rol: 'administrador',
      telefono: '7000-0001',
      activo: true,
      clienteId: null,
      fechaRegistro: fecha(2026, 1, 5),
    },
    {
      id: 2,
      nombre: 'Marilyn Ayala',
      email: 'operador@rentsmart.com',
      password: 'Operador123',
      rol: 'operador',
      telefono: '7000-0002',
      activo: true,
      clienteId: null,
      fechaRegistro: fecha(2026, 1, 8),
    },
    {
      id: 3,
      nombre: 'Carlos Mejía',
      email: 'cliente@rentsmart.com',
      password: 'Cliente123',
      rol: 'cliente',
      telefono: '7555-1122',
      activo: true,
      clienteId: 1,
      fechaRegistro: fecha(2026, 2, 14),
    },
    {
      id: 4,
      nombre: 'Ana Portillo',
      email: 'ana@correo.com',
      password: 'Cliente123',
      rol: 'cliente',
      telefono: '7555-3344',
      activo: true,
      clienteId: 2,
      fechaRegistro: fecha(2026, 3, 2),
    },
    {
      id: 5,
      nombre: 'José Hernández',
      email: 'jose@correo.com',
      password: 'Cliente123',
      rol: 'cliente',
      telefono: '7555-5566',
      activo: true,
      clienteId: 3,
      fechaRegistro: fecha(2026, 5, 20),
    },
  ];

  const clientes = [
    {
      id: 1,
      usuarioId: 3,
      nombre: 'Carlos Mejía',
      documento: '01234567-8',
      licencia: 'LIC-098765',
      telefono: '7555-1122',
      email: 'cliente@rentsmart.com',
      direccion: 'Col. Escalón, San Salvador',
      fechaRegistro: fecha(2026, 2, 14),
    },
    {
      id: 2,
      usuarioId: 4,
      nombre: 'Ana Portillo',
      documento: '02345678-9',
      licencia: 'LIC-112233',
      telefono: '7555-3344',
      email: 'ana@correo.com',
      direccion: 'Santa Tecla, La Libertad',
      fechaRegistro: fecha(2026, 3, 2),
    },
    {
      id: 3,
      usuarioId: 5,
      nombre: 'José Hernández',
      documento: '03456789-0',
      licencia: 'LIC-445566',
      telefono: '7555-5566',
      email: 'jose@correo.com',
      direccion: 'San Miguel, San Miguel',
      fechaRegistro: fecha(2026, 5, 20),
    },
  ];

  const vehiculos = [
    {
      id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2023,
      placa: 'P123456',
      categoria: 'Sedán',
      color: 'Blanco',
      transmision: 'Automática',
      combustible: 'Gasolina',
      capacidad: 5,
      kilometraje: 24500,
      precioPorDia: 38,
      estado: 'disponible',
      imagenUrl: '',
      descripcion: 'Sedán económico, ideal para ciudad y viajes cortos.',
    },
    {
      id: 2,
      marca: 'Nissan',
      modelo: 'Versa',
      anio: 2022,
      placa: 'P234567',
      categoria: 'Sedán',
      color: 'Gris',
      transmision: 'Automática',
      combustible: 'Gasolina',
      capacidad: 5,
      kilometraje: 41200,
      precioPorDia: 33,
      estado: 'disponible',
      imagenUrl: '',
      descripcion: 'Bajo consumo de combustible y amplio maletero.',
    },
    {
      id: 3,
      marca: 'Kia',
      modelo: 'Sportage',
      anio: 2024,
      placa: 'P345678',
      categoria: 'SUV',
      color: 'Negro',
      transmision: 'Automática',
      combustible: 'Gasolina',
      capacidad: 5,
      kilometraje: 12800,
      precioPorDia: 58,
      estado: 'disponible',
      imagenUrl: '',
      descripcion: 'SUV compacta con cámara de retroceso y sensores.',
    },
    {
      id: 4,
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2023,
      placa: 'P456789',
      categoria: 'Pick-up',
      color: 'Plata',
      transmision: 'Manual',
      combustible: 'Diésel',
      capacidad: 5,
      kilometraje: 56300,
      precioPorDia: 72,
      estado: 'disponible',
      imagenUrl: '',
      descripcion: 'Doble cabina 4x4, recomendada para zonas rurales.',
    },
    {
      id: 5,
      marca: 'Hyundai',
      modelo: 'Accent',
      anio: 2021,
      placa: 'P567890',
      categoria: 'Compacto',
      color: 'Rojo',
      transmision: 'Manual',
      combustible: 'Gasolina',
      capacidad: 5,
      kilometraje: 78900,
      precioPorDia: 28,
      estado: 'mantenimiento',
      imagenUrl: '',
      descripcion: 'En taller por servicio preventivo de 80,000 km.',
    },
    {
      id: 6,
      marca: 'Honda',
      modelo: 'CR-V',
      anio: 2024,
      placa: 'P678901',
      categoria: 'SUV',
      color: 'Azul',
      transmision: 'Automática',
      combustible: 'Híbrido',
      capacidad: 5,
      kilometraje: 9400,
      precioPorDia: 65,
      estado: 'disponible',
      imagenUrl: '',
      descripcion: 'SUV híbrida, excelente rendimiento en carretera.',
    },
    {
      id: 7,
      marca: 'Suzuki',
      modelo: 'Swift',
      anio: 2022,
      placa: 'P789012',
      categoria: 'Compacto',
      color: 'Blanco',
      transmision: 'Automática',
      combustible: 'Gasolina',
      capacidad: 5,
      kilometraje: 33100,
      precioPorDia: 30,
      estado: 'disponible',
      imagenUrl: '',
      descripcion: 'Compacto ágil y fácil de estacionar.',
    },
    {
      id: 8,
      marca: 'Toyota',
      modelo: 'Hiace',
      anio: 2020,
      placa: 'P890123',
      categoria: 'Microbús',
      color: 'Blanco',
      transmision: 'Manual',
      combustible: 'Diésel',
      capacidad: 15,
      kilometraje: 132400,
      precioPorDia: 95,
      estado: 'no_disponible',
      imagenUrl: '',
      descripcion: 'Retirado temporalmente de la flota por revisión mecánica.',
    },
  ];

  // Reservas históricas (para que los reportes tengan datos reales)
  const historico = [
    [1, 1, fecha(2026, 1, 10), fecha(2026, 1, 14), 'finalizada'],
    [3, 2, fecha(2026, 1, 20), fecha(2026, 1, 25), 'finalizada'],
    [2, 3, fecha(2026, 2, 5), fecha(2026, 2, 8), 'finalizada'],
    [1, 2, fecha(2026, 2, 18), fecha(2026, 2, 22), 'finalizada'],
    [4, 1, fecha(2026, 3, 3), fecha(2026, 3, 10), 'finalizada'],
    [3, 3, fecha(2026, 3, 15), fecha(2026, 3, 19), 'finalizada'],
    [6, 2, fecha(2026, 4, 2), fecha(2026, 4, 6), 'finalizada'],
    [1, 1, fecha(2026, 4, 12), fecha(2026, 4, 15), 'finalizada'],
    [7, 3, fecha(2026, 5, 8), fecha(2026, 5, 12), 'finalizada'],
    [3, 1, fecha(2026, 5, 20), fecha(2026, 5, 27), 'finalizada'],
    [4, 2, fecha(2026, 6, 4), fecha(2026, 6, 9), 'finalizada'],
    [2, 3, fecha(2026, 6, 18), fecha(2026, 6, 21), 'finalizada'],
    [6, 1, fecha(2026, 7, 1), fecha(2026, 7, 8), 'finalizada'],
    [3, 2, fecha(2026, 7, 14), fecha(2026, 7, 18), 'finalizada'],
    [1, 3, fecha(2026, 8, 3), fecha(2026, 8, 7), 'finalizada'],
    [4, 1, fecha(2026, 8, 20), fecha(2026, 8, 26), 'finalizada'],
    [3, 3, fecha(2026, 9, 2), fecha(2026, 9, 6), 'finalizada'],
    [7, 2, fecha(2026, 9, 10), fecha(2026, 9, 14), 'finalizada'],
    // Activas / futuras respecto al 17-09-2026
    [6, 1, fecha(2026, 9, 15), fecha(2026, 9, 19), 'en_curso'],
    [2, 2, fecha(2026, 9, 22), fecha(2026, 9, 26), 'confirmada'],
    [1, 3, fecha(2026, 10, 1), fecha(2026, 10, 5), 'pendiente'],
    [4, 1, fecha(2026, 9, 12), fecha(2026, 9, 13), 'cancelada'],
  ];

  const reservas = [];
  const contratos = [];
  const pagos = [];

  historico.forEach(([vehiculoId, clienteId, fechaInicio, fechaFin, estado], i) => {
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    const dias = diasEntre(fechaInicio, fechaFin);
    const subtotal = redondear(dias * vehiculo.precioPorDia);
    const impuesto = redondear(subtotal * IMPUESTO);
    const total = redondear(subtotal + impuesto);
    const id = i + 1;

    reservas.push({
      id,
      codigo: `RS-${String(id).padStart(5, '0')}`,
      vehiculoId,
      clienteId,
      fechaInicio,
      fechaFin,
      dias,
      tarifaDiaria: vehiculo.precioPorDia,
      subtotal,
      impuesto,
      total,
      estado,
      lugarEntrega: 'Sucursal San Salvador',
      observaciones: '',
      fechaCreacion: fechaInicio,
    });

    // Toda reserva que pasó de "pendiente" genera contrato y pago
    if (['confirmada', 'en_curso', 'finalizada'].includes(estado)) {
      const contratoId = contratos.length + 1;
      contratos.push({
        id: contratoId,
        codigo: `CT-${String(contratoId).padStart(5, '0')}`,
        reservaId: id,
        clienteId,
        vehiculoId,
        fechaEmision: fechaInicio,
        fechaInicio,
        fechaFin,
        montoTotal: total,
        deposito: redondear(total * PORCENTAJE_DEPOSITO),
        estado: estado === 'finalizada' ? 'finalizado' : 'vigente',
        condiciones: CONDICIONES_ESTANDAR,
      });

      const pagoId = pagos.length + 1;
      pagos.push({
        id: pagoId,
        reservaId: id,
        contratoId,
        monto: total,
        metodo: 'tarjeta',
        estado: estado === 'finalizada' ? 'pagado' : 'anticipo',
        referencia: `PG-${String(pagoId).padStart(5, '0')}`,
        fecha: fechaInicio,
      });
    }
  });

  return {
    usuarios,
    clientes,
    vehiculos,
    reservas,
    contratos,
    pagos,
    secuencias: {
      usuarios: usuarios.length,
      clientes: clientes.length,
      vehiculos: vehiculos.length,
      reservas: reservas.length,
      contratos: contratos.length,
      pagos: pagos.length,
    },
  };
}

const CONDICIONES_ESTANDAR = [
  'El arrendatario declara poseer licencia de conducir vigente.',
  'El vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.',
  'El kilometraje es libre dentro del territorio nacional.',
  'Cualquier daño no cubierto por el seguro será responsabilidad del arrendatario.',
  'La devolución tardía genera un recargo equivalente a un día de renta.',
].join('\n');

/* ------------------------------------------------------------------ */
/* Utilidades de fechas y montos                                       */
/* ------------------------------------------------------------------ */

export function diasEntre(fechaInicio, fechaFin) {
  const inicio = new Date(`${fechaInicio}T00:00:00`);
  const fin = new Date(`${fechaFin}T00:00:00`);
  const ms = fin.getTime() - inicio.getTime();
  const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return dias <= 0 ? 1 : dias; // mínimo un día de renta
}

export function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Acceso a la base                                                    */
/* ------------------------------------------------------------------ */

function obtenerInstancia() {
  if (!globalThis.__RENT_SMART_DB__) {
    globalThis.__RENT_SMART_DB__ = crearSemilla();
  }
  return globalThis.__RENT_SMART_DB__;
}

export const db = {
  get usuarios() {
    return obtenerInstancia().usuarios;
  },
  get clientes() {
    return obtenerInstancia().clientes;
  },
  get vehiculos() {
    return obtenerInstancia().vehiculos;
  },
  get reservas() {
    return obtenerInstancia().reservas;
  },
  get contratos() {
    return obtenerInstancia().contratos;
  },
  get pagos() {
    return obtenerInstancia().pagos;
  },
  /** Devuelve el siguiente id autoincremental de una colección. */
  siguienteId(coleccion) {
    const instancia = obtenerInstancia();
    instancia.secuencias[coleccion] = (instancia.secuencias[coleccion] || 0) + 1;
    return instancia.secuencias[coleccion];
  },
  /** Reinicia la base al estado semilla (útil para pruebas). */
  reiniciar() {
    globalThis.__RENT_SMART_DB__ = crearSemilla();
    return globalThis.__RENT_SMART_DB__;
  },
};

export {
  ESTADOS_VEHICULO,
  ESTADOS_RESERVA,
  ESTADOS_CONTRATO,
  ROLES,
  IMPUESTO,
  PORCENTAJE_DEPOSITO,
  CONDICIONES_ESTANDAR,
};
