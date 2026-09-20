
--  RENT SMART · Esquema de la base de datos 
--  Etapa 2 — Desarrollo base del proyecto 



CREATE DATABASE IF NOT EXISTS rent_smart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rent_smart;

-- Se eliminan en orden inverso a las dependencias
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS contratos;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS clientes;


-- CLIENTES ·estos son los datos del arrendatario

CREATE TABLE clientes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120)  NOT NULL,
  documento       VARCHAR(30)   NOT NULL,
  licencia        VARCHAR(40)   NOT NULL DEFAULT '',
  telefono        VARCHAR(30)   NOT NULL DEFAULT '',
  email           VARCHAR(160)  NOT NULL DEFAULT '',
  direccion       VARCHAR(200)  NOT NULL DEFAULT '',
  fecha_registro  DATE          NOT NULL,
  CONSTRAINT uq_clientes_documento UNIQUE (documento)
) ENGINE = InnoDB;


-- USUARIOS · credenciales y rol. Un usuario con rol cliente
-- apunta a su ficha en clientes.

CREATE TABLE usuarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120)  NOT NULL,
  email           VARCHAR(160)  NOT NULL,
  password        VARCHAR(255)  NOT NULL,
  rol             ENUM('administrador', 'operador', 'cliente') NOT NULL,
  telefono        VARCHAR(30)   NOT NULL DEFAULT '',
  activo          TINYINT(1)    NOT NULL DEFAULT 1,
  cliente_id      INT           NULL,
  fecha_registro  DATE          NOT NULL,
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT fk_usuarios_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL
) ENGINE = InnoDB;


-- VEHICULOS · la flota
CREATE TABLE vehiculos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  marca           VARCHAR(60)   NOT NULL,
  modelo          VARCHAR(60)   NOT NULL,
  anio            SMALLINT      NOT NULL,
  placa           VARCHAR(15)   NOT NULL,
  categoria       VARCHAR(40)   NOT NULL,
  color           VARCHAR(40)   NOT NULL,
  transmision     VARCHAR(20)   NOT NULL DEFAULT 'Automática',
  combustible     VARCHAR(20)   NOT NULL DEFAULT 'Gasolina',
  capacidad       TINYINT       NOT NULL DEFAULT 5,
  kilometraje     INT           NOT NULL DEFAULT 0,
  precio_por_dia  DECIMAL(10,2) NOT NULL,
  estado          ENUM('disponible', 'mantenimiento', 'no_disponible')
                  NOT NULL DEFAULT 'disponible',
  imagen_url      VARCHAR(255)  NOT NULL DEFAULT '',
  descripcion     TEXT          NULL,
  CONSTRAINT uq_vehiculos_placa UNIQUE (placa),
  CONSTRAINT ck_vehiculos_precio CHECK (precio_por_dia > 0)
) ENGINE = InnoDB;

CREATE INDEX ix_vehiculos_estado ON vehiculos (estado);
CREATE INDEX ix_vehiculos_categoria ON vehiculos (categoria);


-- RESERVAS · une un vehículo con un cliente en un rango de fechas

CREATE TABLE reservas (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  codigo               VARCHAR(15)   NOT NULL DEFAULT '',
  vehiculo_id          INT           NOT NULL,
  cliente_id           INT           NOT NULL,
  fecha_inicio         DATE          NOT NULL,
  fecha_fin            DATE          NOT NULL,
  dias                 SMALLINT      NOT NULL,
  tarifa_diaria        DECIMAL(10,2) NOT NULL,
  porcentaje_descuento DECIMAL(4,2)  NOT NULL DEFAULT 0,
  descuento            DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal             DECIMAL(10,2) NOT NULL,
  impuesto             DECIMAL(10,2) NOT NULL,
  total                DECIMAL(10,2) NOT NULL,
  estado               ENUM('pendiente', 'confirmada', 'en_curso', 'finalizada', 'cancelada')
                       NOT NULL DEFAULT 'pendiente',
  lugar_entrega        VARCHAR(120)  NOT NULL DEFAULT 'Sucursal San Salvador',
  observaciones        TEXT          NULL,
  motivo_cancelacion   VARCHAR(255)  NULL,
  fecha_creacion       DATE          NOT NULL,
  CONSTRAINT fk_reservas_vehiculo
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
  CONSTRAINT fk_reservas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT ck_reservas_fechas CHECK (fecha_fin > fecha_inicio)
) ENGINE = InnoDB;

-- Índice que sostiene la verificación de disponibilidad
CREATE INDEX ix_reservas_disponibilidad
  ON reservas (vehiculo_id, estado, fecha_inicio, fecha_fin);
CREATE INDEX ix_reservas_cliente ON reservas (cliente_id);

-- CONTRATOS · se generan al confirmar una reserva

CREATE TABLE contratos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(15)   NOT NULL DEFAULT '',
  reserva_id    INT           NOT NULL,
  cliente_id    INT           NOT NULL,
  vehiculo_id   INT           NOT NULL,
  fecha_emision DATE          NOT NULL,
  fecha_inicio  DATE          NOT NULL,
  fecha_fin     DATE          NOT NULL,
  monto_total   DECIMAL(10,2) NOT NULL,
  deposito      DECIMAL(10,2) NOT NULL,
  estado        ENUM('vigente', 'finalizado', 'anulado') NOT NULL DEFAULT 'vigente',
  condiciones   TEXT          NOT NULL,
  CONSTRAINT fk_contratos_reserva
    FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE,
  CONSTRAINT fk_contratos_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT fk_contratos_vehiculo
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
) ENGINE = InnoDB;

CREATE INDEX ix_contratos_reserva ON contratos (reserva_id);


-- PAGOS · anticipos y liquidaciones de cada contrato

CREATE TABLE pagos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id  INT           NOT NULL,
  contrato_id INT           NULL,
  monto       DECIMAL(10,2) NOT NULL,
  metodo      VARCHAR(30)   NOT NULL DEFAULT 'efectivo',
  estado      ENUM('anticipo', 'pagado', 'reembolsado') NOT NULL DEFAULT 'anticipo',
  referencia  VARCHAR(20)   NOT NULL DEFAULT '',
  fecha       DATE          NOT NULL,
  CONSTRAINT fk_pagos_reserva
    FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE,
  CONSTRAINT fk_pagos_contrato
    FOREIGN KEY (contrato_id) REFERENCES contratos (id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX ix_pagos_reserva ON pagos (reserva_id);
