
-- ==========================================================
-- SCRIPT COMPLETO DE BASE DE DATOS: SISTEMA DE ALQUILER
-- ==========================================================

-- 1. TABLA DE EMPLEADOS
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(50) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    fecha_contratacion DATE NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(50) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    licencia_conduccion VARCHAR(50) NOT NULL,
    fecha_vencimiento_licencia DATE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clients_fecha_vencimiento_licencia_check CHECK (fecha_vencimiento_licencia > CURRENT_DATE)
);

-- 3. TABLA DE VEHÍCULOS
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    year_car INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    capacidad INTEGER NOT NULL,
    tarifa_diaria NUMERIC(10, 2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_year_car_check CHECK (year_car >= 1886),
    CONSTRAINT vehicles_capacidad_check CHECK (capacidad > 0),
    CONSTRAINT vehicles_tarifa_diaria_check CHECK (tarifa_diaria >= 0)
);

-- 4. TABLA DE ALQUILERES
CREATE TABLE IF NOT EXISTS rentals (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    vehiculo_id INTEGER NOT NULL,
    empleado_id INTEGER NOT NULL, 
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME WITHOUT TIME ZONE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_fin TIME WITHOUT TIME ZONE NOT NULL,
    kilometraje_inicio INTEGER NOT NULL CHECK (kilometraje_inicio >= 0),
    kilometraje_fin INTEGER CHECK (kilometraje_fin >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    forma_pago VARCHAR(50) NOT NULL,
    estado_alquiler VARCHAR(20) NOT NULL DEFAULT 'activo',
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vehiculo_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES public.employees(id) ON DELETE CASCADE
);

-- 5. TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    alquiler_id INTEGER NOT NULL,
    monto NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
    fecha_pago DATE NOT NULL,
    hora_pago TIME WITHOUT TIME ZONE NOT NULL,
    forma_pago VARCHAR(50) NOT NULL,
    referencia_pago VARCHAR(255),
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alquiler_id) REFERENCES public.rentals(id) ON DELETE CASCADE
);

-- 6. TABLA DE MANTENIMIENTO
CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    fechafinal_mantenimiento DATE NOT NULL,
    fecha_proximo_mantenimiento DATE NOT NULL,
    tipo_mantenimiento VARCHAR(50) NOT NULL,
    descripcion TEXT,
    costo NUMERIC(10, 2) NOT NULL CHECK (costo >= 0),
    estado_mantenimiento VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    taller VARCHAR(100) NOT NULL,
    responsable VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehiculo_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
    CONSTRAINT maintenance_dates_check CHECK (fechafinal_mantenimiento >= fecha_mantenimiento),
    CONSTRAINT maintenance_next_check CHECK (fecha_proximo_mantenimiento > fechafinal_mantenimiento)
);

-- ==========================================================
-- DATOS DE PRUEBA (INSERTS)
-- ==========================================================

-- Insertar Empleado
INSERT INTO public.employees (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password)
VALUES ('CC', '111', 'Admin', 'Sistema', 'admin@rentas.com', '1234567', 'Gerente', CURRENT_DATE, 'admin1', 'hash_password_aqui');

-- Insertar Cliente
INSERT INTO public.clients (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, direccion, fecha_nacimiento, licencia_conduccion, fecha_vencimiento_licencia)
VALUES ('CC', '222', 'Juan', 'Perez', 'juan@mail.com', '5551234', 'Calle Falsa 123', '1990-05-15', 'LIC-999', '2030-12-31');

-- Insertar Vehículo
INSERT INTO public.vehicles (placa, marca, modelo, year_car, color, tipo, capacidad, tarifa_diaria)
VALUES ('ABC-123', 'Toyota', 'Hilux', 2024, 'Blanco', 'Pick-up', 5, 120.50);