
--- tabla de empleados ---
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(255) NOT NULL,
    numero_identificacion VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    fecha_contratacion DATE NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--- tabla de clientes ---
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(255) NOT NULL,
    numero_identificacion VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    licencia_conduccion VARCHAR(50) NOT NULL,
    fecha_vencimiento_licencia DATE NOT NULL check (fecha_vencimiento_licencia > CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--- tabla de vehiculos ---
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    year_car INTEGER NOT NULL check (year_car >= 1886),
    color VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,  
    capacidad INTEGER NOT NULL check (capacidad > 0),
    tarifa_diaria NUMERIC(10, 2) NOT NULL check (tarifa_diaria >= 0),
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--- tabla de alquileres ---
CREATE TABLE IF NOT EXISTS rentals (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    vehiculo_id INTEGER NOT NULL,
    id_empleado INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_fin TIME NOT NULL,
    kilometraje_inicio INTEGER NOT NULL CHECK (kilometraje_inicio >= 0),
    kilometraje_fin INTEGER CHECK (kilometraje_fin >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    forma_pago VARCHAR(50) NOT NULL,
    estado_alquiler VARCHAR(20) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Las restricciones van aquí abajo
    FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (vehiculo_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_empleado) REFERENCES employees(id) ON DELETE RESTRICT
);

--- tabla de pagos  ---
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    alquiler_id INTEGER NOT NULL,
    monto NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
    fecha_pago DATE NOT NULL,
    hora_pago TIME NOT NULL,
    forma_pago VARCHAR(50) NOT NULL,
    referencia_pago VARCHAR(255),
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alquiler_id) REFERENCES rentals(id) ON DELETE RESTRICT
);

--- tabla de mantenimiento  ---
CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    fechafinal_mantenimiento DATE NOT NULL CHECK (fechafinal_mantenimiento >= fecha_mantenimiento),
    fecha_proximo_mantenimiento DATE NOT NULL CHECK (fecha_proximo_mantenimiento > fechafinal_mantenimiento),
    tipo_mantenimiento VARCHAR(50) NOT NULL,
    descripcion TEXT,
    costo NUMERIC(10, 2) NOT NULL CHECK (costo >= 0),
    estado_mantenimiento VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    taller VARCHAR(100) NOT NULL,
    responsable VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehiculo_id) REFERENCES vehicles(id) ON DELETE RESTRICT
);

-- 1. Empleado
INSERT INTO employees (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password)
VALUES ('CC', '111', 'Admin', 'Gym', 'admin@gym.com', '123', 'Gerente', CURRENT_DATE, 'admin1', '1234');

-- 2. Cliente
INSERT INTO clients (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, direccion, fecha_nacimiento, licencia_conduccion, fecha_vencimiento_licencia)
VALUES ('CC', '222', 'Juan', 'Perez', 'juan@mail.com', '444', 'Calle 1', '1990-01-01', 'LIC123', '2030-01-01');

-- 3. Vehículo
INSERT INTO vehicles (placa, marca, modelo, year_car, color, tipo, capacidad, tarifa_diaria)
VALUES ('GIM-123', 'Toyota', 'Hilux', 2024, 'Blanco', 'Camioneta', 5, 150.00);