
--  RENT SMART  Datos 

USE rent_smart;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE pagos;
TRUNCATE TABLE contratos;
TRUNCATE TABLE reservas;
TRUNCATE TABLE vehiculos;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;

-- Clientes --
INSERT INTO clientes (id, nombre, documento, licencia, telefono, email, direccion, fecha_registro) VALUES
  (1, 'Carlos Mejía', '01234567-8', 'LIC-098765', '7555-1122', 'cliente@rentsmart.com', 'Col. Escalón, San Salvador', '2026-02-14'),
  (2, 'Ana Portillo', '02345678-9', 'LIC-112233', '7555-3344', 'ana@correo.com', 'Santa Tecla, La Libertad', '2026-03-02'),
  (3, 'José Hernández', '03456789-0', 'LIC-445566', '7555-5566', 'jose@correo.com', 'San Miguel, San Miguel', '2026-05-20');

-- Usuarios (contraseñas de demostración) 
INSERT INTO usuarios (id, nombre, email, password, rol, telefono, activo, cliente_id, fecha_registro) VALUES
  (1, 'Erick Rosales', 'admin@rentsmart.com', 'Admin123', 'administrador', '7000-0001', 1, NULL, '2026-01-05'),
  (2, 'Marilyn Ayala', 'operador@rentsmart.com', 'Operador123', 'operador', '7000-0002', 1, NULL, '2026-01-08'),
  (3, 'Carlos Mejía', 'cliente@rentsmart.com', 'Cliente123', 'cliente', '7555-1122', 1, 1, '2026-02-14'),
  (4, 'Ana Portillo', 'ana@correo.com', 'Cliente123', 'cliente', '7555-3344', 1, 2, '2026-03-02'),
  (5, 'José Hernández', 'jose@correo.com', 'Cliente123', 'cliente', '7555-5566', 1, 3, '2026-05-20');

-- Vehículos 
INSERT INTO vehiculos (id, marca, modelo, anio, placa, categoria, color, transmision, combustible, capacidad, kilometraje, precio_por_dia, estado, imagen_url, descripcion) VALUES
  (1, 'Toyota', 'Corolla', 2023, 'P123456', 'Sedán', 'Blanco', 'Automática', 'Gasolina', 5, 24500, 38, 'disponible', '', 'Sedán económico, ideal para ciudad y viajes cortos.'),
  (2, 'Nissan', 'Versa', 2022, 'P234567', 'Sedán', 'Gris', 'Automática', 'Gasolina', 5, 41200, 33, 'disponible', '', 'Bajo consumo de combustible y amplio maletero.'),
  (3, 'Kia', 'Sportage', 2024, 'P345678', 'SUV', 'Negro', 'Automática', 'Gasolina', 5, 12800, 58, 'disponible', '', 'SUV compacta con cámara de retroceso y sensores.'),
  (4, 'Toyota', 'Hilux', 2023, 'P456789', 'Pick-up', 'Plata', 'Manual', 'Diésel', 5, 56300, 72, 'disponible', '', 'Doble cabina 4x4, recomendada para zonas rurales.'),
  (5, 'Hyundai', 'Accent', 2021, 'P567890', 'Compacto', 'Rojo', 'Manual', 'Gasolina', 5, 78900, 28, 'mantenimiento', '', 'En taller por servicio preventivo de 80,000 km.'),
  (6, 'Honda', 'CR-V', 2024, 'P678901', 'SUV', 'Azul', 'Automática', 'Híbrido', 5, 9400, 65, 'disponible', '', 'SUV híbrida, excelente rendimiento en carretera.'),
  (7, 'Suzuki', 'Swift', 2022, 'P789012', 'Compacto', 'Blanco', 'Automática', 'Gasolina', 5, 33100, 30, 'disponible', '', 'Compacto ágil y fácil de estacionar.'),
  (8, 'Toyota', 'Hiace', 2020, 'P890123', 'Microbús', 'Blanco', 'Manual', 'Diésel', 15, 132400, 95, 'no_disponible', '', 'Retirado temporalmente de la flota por revisión mecánica.');

-- Reservas 
INSERT INTO reservas (id, codigo, vehiculo_id, cliente_id, fecha_inicio, fecha_fin, dias, tarifa_diaria, porcentaje_descuento, descuento, subtotal, impuesto, total, estado, lugar_entrega, observaciones, fecha_creacion) VALUES
  (1, 'RS-00001', 1, 1, '2026-01-10', '2026-01-14', 4, 38, 0, 0, 152, 19.76, 171.76, 'finalizada', 'Sucursal San Salvador', '', '2026-01-10'),
  (2, 'RS-00002', 3, 2, '2026-01-20', '2026-01-25', 5, 58, 0, 0, 290, 37.7, 327.7, 'finalizada', 'Sucursal San Salvador', '', '2026-01-20'),
  (3, 'RS-00003', 2, 3, '2026-02-05', '2026-02-08', 3, 33, 0, 0, 99, 12.87, 111.87, 'finalizada', 'Sucursal San Salvador', '', '2026-02-05'),
  (4, 'RS-00004', 1, 2, '2026-02-18', '2026-02-22', 4, 38, 0, 0, 152, 19.76, 171.76, 'finalizada', 'Sucursal San Salvador', '', '2026-02-18'),
  (5, 'RS-00005', 4, 1, '2026-03-03', '2026-03-10', 7, 72, 0, 0, 504, 65.52, 569.52, 'finalizada', 'Sucursal San Salvador', '', '2026-03-03'),
  (6, 'RS-00006', 3, 3, '2026-03-15', '2026-03-19', 4, 58, 0, 0, 232, 30.16, 262.16, 'finalizada', 'Sucursal San Salvador', '', '2026-03-15'),
  (7, 'RS-00007', 6, 2, '2026-04-02', '2026-04-06', 4, 65, 0, 0, 260, 33.8, 293.8, 'finalizada', 'Sucursal San Salvador', '', '2026-04-02'),
  (8, 'RS-00008', 1, 1, '2026-04-12', '2026-04-15', 3, 38, 0, 0, 114, 14.82, 128.82, 'finalizada', 'Sucursal San Salvador', '', '2026-04-12'),
  (9, 'RS-00009', 7, 3, '2026-05-08', '2026-05-12', 4, 30, 0, 0, 120, 15.6, 135.6, 'finalizada', 'Sucursal San Salvador', '', '2026-05-08'),
  (10, 'RS-00010', 3, 1, '2026-05-20', '2026-05-27', 7, 58, 0, 0, 406, 52.78, 458.78, 'finalizada', 'Sucursal San Salvador', '', '2026-05-20'),
  (11, 'RS-00011', 4, 2, '2026-06-04', '2026-06-09', 5, 72, 0, 0, 360, 46.8, 406.8, 'finalizada', 'Sucursal San Salvador', '', '2026-06-04'),
  (12, 'RS-00012', 2, 3, '2026-06-18', '2026-06-21', 3, 33, 0, 0, 99, 12.87, 111.87, 'finalizada', 'Sucursal San Salvador', '', '2026-06-18'),
  (13, 'RS-00013', 6, 1, '2026-07-01', '2026-07-08', 7, 65, 0, 0, 455, 59.15, 514.15, 'finalizada', 'Sucursal San Salvador', '', '2026-07-01'),
  (14, 'RS-00014', 3, 2, '2026-07-14', '2026-07-18', 4, 58, 0, 0, 232, 30.16, 262.16, 'finalizada', 'Sucursal San Salvador', '', '2026-07-14'),
  (15, 'RS-00015', 1, 3, '2026-08-03', '2026-08-07', 4, 38, 0, 0, 152, 19.76, 171.76, 'finalizada', 'Sucursal San Salvador', '', '2026-08-03'),
  (16, 'RS-00016', 4, 1, '2026-08-20', '2026-08-26', 6, 72, 0, 0, 432, 56.16, 488.16, 'finalizada', 'Sucursal San Salvador', '', '2026-08-20'),
  (17, 'RS-00017', 3, 3, '2026-09-02', '2026-09-06', 4, 58, 0, 0, 232, 30.16, 262.16, 'finalizada', 'Sucursal San Salvador', '', '2026-09-02'),
  (18, 'RS-00018', 7, 2, '2026-09-10', '2026-09-14', 4, 30, 0, 0, 120, 15.6, 135.6, 'finalizada', 'Sucursal San Salvador', '', '2026-09-10'),
  (19, 'RS-00019', 6, 1, '2026-09-15', '2026-09-19', 4, 65, 0, 0, 260, 33.8, 293.8, 'en_curso', 'Sucursal San Salvador', '', '2026-09-15'),
  (20, 'RS-00020', 2, 2, '2026-09-22', '2026-09-26', 4, 33, 0, 0, 132, 17.16, 149.16, 'confirmada', 'Sucursal San Salvador', '', '2026-09-22'),
  (21, 'RS-00021', 1, 3, '2026-10-01', '2026-10-05', 4, 38, 0, 0, 152, 19.76, 171.76, 'pendiente', 'Sucursal San Salvador', '', '2026-10-01'),
  (22, 'RS-00022', 4, 1, '2026-09-12', '2026-09-13', 1, 72, 0, 0, 72, 9.36, 81.36, 'cancelada', 'Sucursal San Salvador', '', '2026-09-12');

-- Contratos 
INSERT INTO contratos (id, codigo, reserva_id, cliente_id, vehiculo_id, fecha_emision, fecha_inicio, fecha_fin, monto_total, deposito, estado, condiciones) VALUES
  (1, 'CT-00001', 1, 1, 1, '2026-01-10', '2026-01-10', '2026-01-14', 171.76, 34.35, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (2, 'CT-00002', 2, 2, 3, '2026-01-20', '2026-01-20', '2026-01-25', 327.7, 65.54, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (3, 'CT-00003', 3, 3, 2, '2026-02-05', '2026-02-05', '2026-02-08', 111.87, 22.37, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (4, 'CT-00004', 4, 2, 1, '2026-02-18', '2026-02-18', '2026-02-22', 171.76, 34.35, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (5, 'CT-00005', 5, 1, 4, '2026-03-03', '2026-03-03', '2026-03-10', 569.52, 113.9, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (6, 'CT-00006', 6, 3, 3, '2026-03-15', '2026-03-15', '2026-03-19', 262.16, 52.43, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (7, 'CT-00007', 7, 2, 6, '2026-04-02', '2026-04-02', '2026-04-06', 293.8, 58.76, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (8, 'CT-00008', 8, 1, 1, '2026-04-12', '2026-04-12', '2026-04-15', 128.82, 25.76, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (9, 'CT-00009', 9, 3, 7, '2026-05-08', '2026-05-08', '2026-05-12', 135.6, 27.12, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (10, 'CT-00010', 10, 1, 3, '2026-05-20', '2026-05-20', '2026-05-27', 458.78, 91.76, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (11, 'CT-00011', 11, 2, 4, '2026-06-04', '2026-06-04', '2026-06-09', 406.8, 81.36, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (12, 'CT-00012', 12, 3, 2, '2026-06-18', '2026-06-18', '2026-06-21', 111.87, 22.37, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (13, 'CT-00013', 13, 1, 6, '2026-07-01', '2026-07-01', '2026-07-08', 514.15, 102.83, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (14, 'CT-00014', 14, 2, 3, '2026-07-14', '2026-07-14', '2026-07-18', 262.16, 52.43, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (15, 'CT-00015', 15, 3, 1, '2026-08-03', '2026-08-03', '2026-08-07', 171.76, 34.35, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (16, 'CT-00016', 16, 1, 4, '2026-08-20', '2026-08-20', '2026-08-26', 488.16, 97.63, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (17, 'CT-00017', 17, 3, 3, '2026-09-02', '2026-09-02', '2026-09-06', 262.16, 52.43, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (18, 'CT-00018', 18, 2, 7, '2026-09-10', '2026-09-10', '2026-09-14', 135.6, 27.12, 'finalizado', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (19, 'CT-00019', 19, 1, 6, '2026-09-15', '2026-09-15', '2026-09-19', 293.8, 58.76, 'vigente', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.'),
  (20, 'CT-00020', 20, 2, 2, '2026-09-22', '2026-09-22', '2026-09-26', 149.16, 29.83, 'vigente', 'El arrendatario declara poseer licencia de conducir vigente.\nEl vehículo se entrega con tanque lleno y debe devolverse en las mismas condiciones.\nEl kilometraje es libre dentro del territorio nacional.\nCualquier daño no cubierto por el seguro será responsabilidad del arrendatario.\nLa devolución tardía genera un recargo equivalente a un día de renta.');

-- Pagos 
INSERT INTO pagos (id, reserva_id, contrato_id, monto, metodo, estado, referencia, fecha) VALUES
  (1, 1, 1, 171.76, 'tarjeta', 'pagado', 'PG-00001', '2026-01-10'),
  (2, 2, 2, 327.7, 'tarjeta', 'pagado', 'PG-00002', '2026-01-20'),
  (3, 3, 3, 111.87, 'tarjeta', 'pagado', 'PG-00003', '2026-02-05'),
  (4, 4, 4, 171.76, 'tarjeta', 'pagado', 'PG-00004', '2026-02-18'),
  (5, 5, 5, 569.52, 'tarjeta', 'pagado', 'PG-00005', '2026-03-03'),
  (6, 6, 6, 262.16, 'tarjeta', 'pagado', 'PG-00006', '2026-03-15'),
  (7, 7, 7, 293.8, 'tarjeta', 'pagado', 'PG-00007', '2026-04-02'),
  (8, 8, 8, 128.82, 'tarjeta', 'pagado', 'PG-00008', '2026-04-12'),
  (9, 9, 9, 135.6, 'tarjeta', 'pagado', 'PG-00009', '2026-05-08'),
  (10, 10, 10, 458.78, 'tarjeta', 'pagado', 'PG-00010', '2026-05-20'),
  (11, 11, 11, 406.8, 'tarjeta', 'pagado', 'PG-00011', '2026-06-04'),
  (12, 12, 12, 111.87, 'tarjeta', 'pagado', 'PG-00012', '2026-06-18'),
  (13, 13, 13, 514.15, 'tarjeta', 'pagado', 'PG-00013', '2026-07-01'),
  (14, 14, 14, 262.16, 'tarjeta', 'pagado', 'PG-00014', '2026-07-14'),
  (15, 15, 15, 171.76, 'tarjeta', 'pagado', 'PG-00015', '2026-08-03'),
  (16, 16, 16, 488.16, 'tarjeta', 'pagado', 'PG-00016', '2026-08-20'),
  (17, 17, 17, 262.16, 'tarjeta', 'pagado', 'PG-00017', '2026-09-02'),
  (18, 18, 18, 135.6, 'tarjeta', 'pagado', 'PG-00018', '2026-09-10'),
  (19, 19, 19, 293.8, 'tarjeta', 'anticipo', 'PG-00019', '2026-09-15'),
  (20, 20, 20, 149.16, 'tarjeta', 'anticipo', 'PG-00020', '2026-09-22');
