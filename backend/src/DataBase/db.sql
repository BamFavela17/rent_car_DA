﻿﻿﻿-- ==========================================================
-- SCRIPT COMPLETO DE BASE DE DATOS: SISTEMA DE ALQUILER
-- ==========================================================

-- 1. TABLA DE EMPLEADOS
CREATE TABLE IF NOT EXISTS public.employees (
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
    password VARCHAR(255) NOT NULL, -- Se recomienda almacenar Hash
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Garantiza que solo pueda existir un Administrador en el sistema
CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_admin 
ON public.employees (cargo) WHERE (cargo = 'Administrador');

-- 2. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
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
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    cargo VARCHAR(50) DEFAULT 'Cliente',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clients_fecha_vencimiento_licencia_check CHECK (fecha_vencimiento_licencia > CURRENT_DATE)
);

-- 3. TABLA DE VEHÍCULOS
CREATE TABLE IF NOT EXISTS public.vehicles (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    year_car INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    capacidad INTEGER NOT NULL,
    tarifa_diaria NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_year_car_check CHECK (year_car >= 1886),
    CONSTRAINT vehicles_capacidad_check CHECK (capacidad > 0),
    CONSTRAINT vehicles_tarifa_diaria_check CHECK (tarifa_diaria >= 0)
);

-- 4. TABLA DE ALQUILERES
CREATE TABLE IF NOT EXISTS public.rentals (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    vehiculo_id INTEGER NOT NULL,
    empleado_id INTEGER NOT NULL, -- Nombre estandarizado
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

-- Índices para optimizar búsquedas de disponibilidad y reportes
CREATE INDEX IF NOT EXISTS idx_rentals_vehiculo_fechas ON public.rentals (vehiculo_id, fecha_inicio, fecha_fin) WHERE estado_alquiler IN ('activo', 'proceso', 'en_proceso');
CREATE INDEX IF NOT EXISTS idx_rentals_cliente ON public.rentals (cliente_id);
CREATE INDEX IF NOT EXISTS idx_rentals_estado ON public.rentals (estado_alquiler);

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
CREATE TABLE IF NOT EXISTS public.maintenance (
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
-- 7. LÓGICA DE AUTOMATIZACIÓN DE ESTADOS (TRIGGER)
-- ==========================================================

-- Función que sincroniza el estado del alquiler basado en los pagos
CREATE OR REPLACE FUNCTION public.update_rental_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el pago se marca como 'pagado'
    IF (NEW.estado_pago = 'pagado') THEN
        -- Verificamos si ya no quedan pagos pendientes para este alquiler específico
        IF NOT EXISTS (
            SELECT 1 FROM public.payments 
            WHERE alquiler_id = NEW.alquiler_id 
              AND estado_pago = 'pendiente'
              AND id != NEW.id -- Ignoramos el registro actual que está cambiando
        ) THEN
            -- Actualizamos el alquiler a 'finalizado' automáticamente
            UPDATE public.rentals 
            SET estado_alquiler = 'finalizado' 
            WHERE id = NEW.alquiler_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara después de insertar o actualizar un pago
CREATE TRIGGER trigger_update_rental_status
AFTER INSERT OR UPDATE OF estado_pago ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_rental_status_on_payment();

-- Función que libera el vehículo cuando el alquiler finaliza
CREATE OR REPLACE FUNCTION public.update_vehicle_availability_on_rental_finish()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificamos si el estado cambió a 'finalizado'
    IF (NEW.estado_alquiler = 'finalizado' AND (OLD.estado_alquiler IS NULL OR OLD.estado_alquiler != 'finalizado')) THEN
        -- Actualizamos el estado del vehículo a disponible (TRUE)
        UPDATE public.vehicles 
        SET estado = TRUE 
        WHERE id = NEW.vehiculo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara al actualizar el estado de un alquiler
CREATE TRIGGER trigger_update_vehicle_on_rental_finish
AFTER UPDATE OF estado_alquiler ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.update_vehicle_availability_on_rental_finish();

-- ==========================================================
-- DATOS DE PRUEBA (INSERTS)
-- ==========================================================

-- 10 INSERCIONES PARA LA TABLA: employees
INSERT INTO public.employees (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password) VALUES
('CC', '1001', 'Carlos', 'Gomez', 'carlos.gomez@rentas.com', '555-0101', 'Administrador', '2023-01-15', 'cgomez', 'hash_secure_1'),
('CC', '1002', 'Lucia', 'Mendez', 'lucia.m@rentas.com', '555-0102', 'Cliente', '2023-02-10', 'lmendez', 'hash_secure_2'),
('CC', '1003', 'Roberto', 'Sanz', 'roberto.s@rentas.com', '555-0103', 'Cliente', '2022-11-20', 'rsanz', 'hash_secure_3'),
('CC', '1004', 'Maria', 'Casas', 'm.casas@rentas.com', '555-0104', 'Cliente', '2023-03-05', 'mcasas', 'hash_secure_4'),
('CC', '1005', 'Ricardo', 'Luna', 'r.luna@rentas.com', '555-0105', 'Cliente', '2023-04-12', 'rluna', 'hash_secure_5'),
('CC', '1006', 'Ana', 'Rojas', 'ana.rojas@rentas.com', '555-0106', 'Cliente', '2023-05-01', 'arojas', 'hash_secure_6'),
('CC', '1007', 'Diego', 'Paz', 'd.paz@rentas.com', '555-0107', 'Cliente', '2023-06-15', 'dpaz', 'hash_secure_7'),
('CC', '1008', 'Elena', 'Soto', 'e.soto@rentas.com', '555-0108', 'Cliente', '2023-07-20', 'esoto', 'hash_secure_8'),
('CC', '1009', 'Fernando', 'Ruiz', 'f.ruiz@rentas.com', '555-0109', 'Cliente', '2023-08-10', 'fruiz', 'hash_secure_9'),
('CC', '1010', 'Sonia', 'Leal', 's.leal@rentas.com', '555-0110', 'Cliente', '2022-05-25', 'sleal', 'hash_secure_10');

-- ==========================================================
-- 10 INSERCIONES PARA LA TABLA: clients
-- ==========================================================
INSERT INTO public.clients (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, direccion, fecha_nacimiento, licencia_conduccion, fecha_vencimiento_licencia) VALUES
('CC', '2001', 'Alberto', 'Ruiz', 'alberto@gmail.com', '666-101', 'Av. Reforma 12', '1985-03-20', 'LIC-001', '2028-10-10'),
('CC', '2002', 'Beatriz', 'Luna', 'beatriz@yahoo.com', '666-102', 'Calle Sur 45', '1992-07-12', 'LIC-002', '2027-05-15'),
('CC', '2003', 'Camilo', 'Daza', 'camilo.d@outlook.com', '666-103', 'Carrera 7 89', '1988-11-30', 'LIC-003', '2029-01-20'),
('CC', '2004', 'Daniela', 'Perez', 'daniela@mail.com', '666-104', 'Transversal 5', '1995-02-14', 'LIC-004', '2030-03-12'),
('CC', '2005', 'Eduardo', 'Vega', 'edu@gmail.com', '666-105', 'Diagonal 10', '1980-09-05', 'LIC-005', '2026-11-18'),
('CC', '2006', 'Fabiola', 'Gil', 'fabi@mail.com', '666-106', 'Manzana B Lote 3', '1993-12-24', 'LIC-006', '2027-08-22'),
('CC', '2007', 'Gabriel', 'Mora', 'gabriel.m@gmail.com', '666-107', 'Callejón 8', '1987-04-18', 'LIC-007', '2028-12-05'),
('CC', '2008', 'Helena', 'Rios', 'helena.r@yahoo.com', '666-108', 'Av. Central 77', '1991-06-08', 'LIC-008', '2029-06-30'),
('CC', '2009', 'Ivan', 'Toro', 'ivan.t@mail.com', '666-109', 'Calle 50 #12', '1984-01-10', 'LIC-009', '2030-01-01'),
('CC', '2010', 'Julia', 'Ortiz', 'julia.o@gmail.com', '666-110', 'Carrera 15 #4', '1996-08-22', 'LIC-010', '2027-02-28');

-- ==========================================================
-- 10 INSERCIONES PARA LA TABLA: vehicles
-- ==========================================================
INSERT INTO public.vehicles (placa, marca, modelo, year_car, color, tipo, capacidad, tarifa_diaria, image_url) VALUES
('ABC-001', 'Toyota', 'Corolla', 2022, 'Gris', 'Sedan', 5, 85.00, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'),
('ABC-002', 'Nissan', 'Versa', 2023, 'Azul', 'Sedan', 5, 80.00, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'),
('ABC-003', 'Ford', 'Explorer', 2021, 'Negro', 'SUV', 7, 150.00, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'),
('ABC-004', 'Chevrolet', 'Onix', 2022, 'Blanco', 'Hatchback', 5, 70.00, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800'),
('ABC-005', 'Jeep', 'Wrangler', 2020, 'Rojo', '4x4', 4, 180.00, 'https://images.unsplash.com/photo-1539101105283-34e8e670d87a?auto=format&fit=crop&q=80&w=800'),
('ABC-006', 'Kia', 'Sportage', 2023, 'Plateado', 'SUV', 5, 130.00, 'https://images.unsplash.com/photo-1606159068539-43f36b734ed8?auto=format&fit=crop&q=80&w=800'),
('ABC-007', 'Mazda', 'CX-5', 2022, 'Vino', 'SUV', 5, 140.00, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'),
('ABC-008', 'Hyundai', 'Tucson', 2021, 'Blanco', 'SUV', 5, 125.00, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'),
('ABC-009', 'Volkswagen', 'Jetta', 2023, 'Gris', 'Sedan', 5, 95.00, 'https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&q=80&w=800'),
('ABC-010', 'Renault', 'Duster', 2022, 'Verde', 'SUV', 5, 110.00, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800');

-- ==========================================================
-- 10 INSERCIONES PARA LA TABLA: rentals
-- ==========================================================
INSERT INTO public.rentals (cliente_id, vehiculo_id, empleado_id, fecha_inicio, hora_inicio, fecha_fin, hora_fin, kilometraje_inicio, kilometraje_fin, total, forma_pago) VALUES
(1, 1, 1, '2024-04-01', '08:00', '2024-04-03', '08:00', 10000, 10250, 170.00, 'TC'),
(2, 2, 1, '2024-04-02', '09:00', '2024-04-04', '09:00', 5000, 5100, 160.00, 'Efectivo'),
(3, 3, 2, '2024-04-03', '10:00', '2024-04-06', '10:00', 12000, 12400, 450.00, 'Transferencia'),
(4, 4, 2, '2024-04-04', '11:00', '2024-04-05', '11:00', 8000, 8150, 70.00, 'TC'),
(5, 5, 5, '2024-04-05', '08:00', '2024-04-07', '08:00', 15000, 15300, 360.00, 'Débito'),
(6, 6, 5, '2024-04-06', '09:00', '2024-04-08', '09:00', 2000, 2100, 260.00, 'TC'),
(7, 7, 7, '2024-04-07', '10:30', '2024-04-10', '10:30', 4500, 4800, 420.00, 'Efectivo'),
(8, 8, 7, '2024-04-08', '08:30', '2024-04-09', '08:30', 7200, 7350, 125.00, 'Transferencia'),
(9, 9, 8, '2024-04-09', '14:00', '2024-04-12', '14:00', 1100, 1500, 285.00, 'TC'),
(10, 10, 8, '2024-04-10', '16:00', '2024-04-12', '16:00', 3300, 3600, 220.00, 'Débito');

-- ==========================================================
-- 10 INSERCIONES PARA LA TABLA: payments
-- ==========================================================
INSERT INTO public.payments (alquiler_id, monto, fecha_pago, hora_pago, forma_pago, referencia_pago, estado_pago) VALUES
(1, 170.00, '2024-04-01', '08:15', 'TC', 'REF-001', 'pagado'),
(2, 160.00, '2024-04-02', '09:30', 'Efectivo', NULL, 'pagado'),
(3, 450.00, '2024-04-03', '10:10', 'Transferencia', 'TR-9988', 'pagado'),
(4, 70.00, '2024-04-04', '11:05', 'TC', 'REF-002', 'pagado'),
(5, 180.00, '2024-04-05', '08:20', 'Débito', 'REF-003', 'pendiente'),
(6, 260.00, '2024-04-06', '09:45', 'TC', 'REF-004', 'pagado'),
(7, 210.00, '2024-04-07', '10:40', 'Efectivo', NULL, 'pendiente'),
(8, 125.00, '2024-04-08', '08:50', 'Transferencia', 'TR-5544', 'pagado'),
(9, 285.00, '2024-04-09', '14:20', 'TC', 'REF-005', 'pagado'),
(10, 220.00, '2024-04-10', '16:30', 'Débito', 'REF-006', 'pagado');

-- ==========================================================
-- 10 INSERCIONES PARA LA TABLA: maintenance
-- ==========================================================
INSERT INTO public.maintenance (vehiculo_id, fecha_mantenimiento, fechafinal_mantenimiento, fecha_proximo_mantenimiento, tipo_mantenimiento, descripcion, costo, taller, responsable) VALUES
(1, '2024-01-10', '2024-01-11', '2024-07-10', 'Preventivo', 'Cambio de aceite y filtros', 120.00, 'Taller Express', 'Mario Diaz'),
(2, '2024-01-15', '2024-01-15', '2024-07-15', 'Limpieza', 'Lavado de motor y tapicería', 60.00, 'Clean Car', 'Jose Perez'),
(3, '2024-02-05', '2024-02-07', '2024-08-05', 'Correctivo', 'Cambio de pastillas de frenos', 250.00, 'Speed Master', 'Luis Torres'),
(4, '2024-02-20', '2024-02-20', '2024-08-20', 'Preventivo', 'Revisión de niveles', 45.00, 'Taller Express', 'Mario Diaz'),
(5, '2024-03-01', '2024-03-04', '2024-09-01', 'Correctivo', 'Reparación de suspensión', 480.00, 'OffRoad Tech', 'Andres Gil'),
(6, '2024-03-10', '2024-03-10', '2024-09-10', 'Preventivo', 'Rotación de llantas', 35.00, 'Taller Express', 'Mario Diaz'),
(7, '2024-03-15', '2024-03-16', '2024-09-15', 'Correctivo', 'Cambio de batería', 150.00, 'Energy Car', 'Felipe Ruiz'),
(8, '2024-03-20', '2024-03-21', '2024-09-20', 'Preventivo', 'Sincronización', 180.00, 'Speed Master', 'Luis Torres'),
(9, '2024-03-25', '2024-03-25', '2024-09-25', 'Limpieza', 'Detallado estético', 90.00, 'Clean Car', 'Jose Perez'),
(10, '2024-04-01', '2024-04-01', '2024-10-01', 'Preventivo', 'Revisión general', 100.00, 'Taller Express', 'Mario Diaz');
