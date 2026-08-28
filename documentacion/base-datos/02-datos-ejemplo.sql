-- =====================================================================
-- SYNCRO — Datos de ejemplo
-- Reproduce el contenido de la demo: una empresa autobusera de
-- Costa Rica con sus rutas, flota, choferes y salidas del día.
--
-- Ejecutar después de 01-esquema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Empresa y su administrador
-- ---------------------------------------------------------------------
INSERT INTO empresa (id, nombre, cedula_juridica, telefono, correo) VALUES
    (1, 'Transportes Unidos del Valle', '3-101-482910', '2222-4488', 'admin@transportescr.com');

-- La clave real se guarda como hash. Acá va un marcador de posición:
-- en producción se genera con bcrypt o con el sistema de Supabase.
INSERT INTO administrador (empresa_id, nombre, correo, clave_hash) VALUES
    (1, 'Administración', 'admin@transportescr.com', '$2a$10$EJEMPLO.NO.USAR.EN.PRODUCCION');


-- ---------------------------------------------------------------------
-- Paradas, con coordenadas reales
-- ---------------------------------------------------------------------
INSERT INTO parada (id, nombre, latitud, longitud, provincia) VALUES
    ( 1, 'San José (Terminal)',  9.9333000, -84.0833000, 'San José'),
    ( 2, 'Curridabat',           9.9178000, -84.0333000, 'San José'),
    ( 3, 'Tres Ríos',            9.9060000, -84.0089000, 'Cartago'),
    ( 4, 'Taras',                9.8790000, -83.9560000, 'Cartago'),
    ( 5, 'Cartago Centro',       9.8644000, -83.9194000, 'Cartago'),
    ( 6, 'La Uruca',             9.9508000, -84.1178000, 'San José'),
    ( 7, 'Río Segundo',          9.9880000, -84.1930000, 'Alajuela'),
    ( 8, 'Alajuela Centro',     10.0162000, -84.2116000, 'Alajuela'),
    ( 9, 'Heredia Centro',       9.9981000, -84.1197000, 'Heredia'),
    (10, 'Santo Domingo',        9.9797000, -84.0897000, 'Heredia'),
    (11, 'Tibás',                9.9600000, -84.0800000, 'San José'),
    (12, 'Atenas',               9.9800000, -84.3800000, 'Alajuela'),
    (13, 'Orotina',              9.9070000, -84.5230000, 'Alajuela'),
    (14, 'Caldera',              9.9150000, -84.7200000, 'Puntarenas'),
    (15, 'Puntarenas Centro',    9.9763000, -84.8384000, 'Puntarenas'),
    (16, 'Paraíso',              9.8383000, -83.8656000, 'Cartago'),
    (17, 'Cervantes',            9.8770000, -83.8180000, 'Cartago'),
    (18, 'Turrialba Centro',     9.9047000, -83.6811000, 'Cartago');


-- ---------------------------------------------------------------------
-- Rutas
-- ---------------------------------------------------------------------
INSERT INTO ruta (id, empresa_id, origen, destino, precio, frecuencia_min, duracion_min, estado) VALUES
    (1, 1, 'San José', 'Cartago',     650.00, 15,  45, 'activa'),
    (2, 1, 'San José', 'Alajuela',    700.00, 20,  50, 'activa'),
    (3, 1, 'Heredia',  'San José',    600.00, 10,  35, 'activa'),
    (4, 1, 'San José', 'Puntarenas', 2900.00, 60, 130, 'activa'),
    (5, 1, 'Cartago',  'Turrialba',  1450.00, 30,  75, 'pausada');

-- Recorrido de cada ruta, en orden
INSERT INTO ruta_parada (ruta_id, parada_id, orden) VALUES
    -- San José -> Cartago
    (1,  1, 1), (1,  2, 2), (1,  3, 3), (1,  4, 4), (1,  5, 5),
    -- San José -> Alajuela
    (2,  1, 1), (2,  6, 2), (2,  7, 3), (2,  8, 4),
    -- Heredia -> San José
    (3,  9, 1), (3, 10, 2), (3, 11, 3), (3,  1, 4),
    -- San José -> Puntarenas
    (4,  1, 1), (4, 12, 2), (4, 13, 3), (4, 14, 4), (4, 15, 5),
    -- Cartago -> Turrialba
    (5,  5, 1), (5, 16, 2), (5, 17, 3), (5, 18, 4);


-- ---------------------------------------------------------------------
-- Flota
-- ---------------------------------------------------------------------
INSERT INTO bus (id, empresa_id, placa, modelo, anio, capacidad, estado) VALUES
    (1, 1, 'SJB-1204', 'Mercedes-Benz OF-1721', 2019, 48, 'activo'),
    (2, 1, 'SJB-1198', 'Volvo B8R',             2021, 48, 'activo'),
    (3, 1, 'SJB-0876', 'Hino RK8',              2017, 48, 'activo'),
    (4, 1, 'SJB-1350', 'Scania K250',           2022, 48, 'activo'),
    (5, 1, 'SJB-0742', 'Mercedes-Benz OH-1526', 2015, 48, 'taller');

-- Los asientos de cada bus: 48 por unidad.
-- Los números 5 a 8 quedan reservados como accesibles, igual que en la app.
INSERT INTO asiento (bus_id, numero, tipo)
SELECT b.id,
       n.numero,
       CASE WHEN n.numero BETWEEN 5 AND 8 THEN 'accesible'::tipo_asiento
            ELSE 'normal'::tipo_asiento END
FROM bus b
CROSS JOIN generate_series(1, 48) AS n(numero);


-- ---------------------------------------------------------------------
-- Choferes
-- ---------------------------------------------------------------------
INSERT INTO chofer (id, empresa_id, nombre, licencia, telefono, estado) VALUES
    (1, 1, 'Marvin Rodríguez',      'B4-108742', '8812-4409', 'disponible'),
    (2, 1, 'Kevin Mora',            'B4-220185', '8730-1192', 'disponible'),
    (3, 1, 'Luis Fernando Chaves',  'B4-091337', '8654-7781', 'disponible'),
    (4, 1, 'Óscar Jiménez',         'B4-334902', '8901-2245', 'disponible'),
    (5, 1, 'Alberto Solano',        'B4-556128', '8477-3390', 'incapacidad');


-- ---------------------------------------------------------------------
-- Pasajeros
-- ---------------------------------------------------------------------
INSERT INTO usuario (id, nombre, correo, clave_hash, telefono) VALUES
    (1, 'Usuario Demo', 'demo@syncro.cr', '$2a$10$EJEMPLO.NO.USAR.EN.PRODUCCION', '8888-1234'),
    (2, 'Ana Villalobos', 'ana@ejemplo.cr', '$2a$10$EJEMPLO.NO.USAR.EN.PRODUCCION', '8777-5566');

INSERT INTO metodo_pago (id, usuario_id, tipo, referencia) VALUES
    (1, 1, 'tarjeta', '4821'),
    (2, 1, 'sinpe',   '8888-4821'),
    (3, 2, 'tarjeta', '9012');

INSERT INTO ruta_favorita (usuario_id, ruta_id) VALUES
    (1, 1),
    (1, 3),
    (2, 2);


-- ---------------------------------------------------------------------
-- Salidas del día
-- Se generan a partir de la fecha de hoy, para que los datos sirvan
-- cualquier día que se ejecute el script.
-- ---------------------------------------------------------------------
INSERT INTO viaje (ruta_id, bus_id, chofer_id, sale_en)
SELECT
    r.id,
    -- Repartimos las unidades disponibles entre las salidas
    (ARRAY[1, 2, 3, 4])[1 + (h.hora % 4)],
    (ARRAY[1, 2, 3, 4])[1 + ((h.hora + 2) % 4)],
    CURRENT_DATE + (h.hora || ' hours')::INTERVAL
FROM ruta r
CROSS JOIN generate_series(6, 20, 3) AS h(hora)
WHERE r.estado = 'activa';

-- Algunas salidas quedan sin asignar a propósito: son las que el
-- panel marca en ámbar para que el despachador las resuelva.
UPDATE viaje SET bus_id = NULL, chofer_id = NULL
WHERE id IN (SELECT id FROM viaje ORDER BY id LIMIT 3 OFFSET 5);


-- ---------------------------------------------------------------------
-- Una compra de ejemplo: tres asientos en la misma salida
-- ---------------------------------------------------------------------
INSERT INTO compra (id, usuario_id, viaje_id, metodo_pago_id, total, estado_pago)
SELECT 1, 1, v.id, 1, 650.00 * 3, 'aprobado'
FROM viaje v
JOIN ruta r ON r.id = v.ruta_id
WHERE r.origen = 'San José' AND r.destino = 'Cartago'
ORDER BY v.sale_en
LIMIT 1;

INSERT INTO tiquete (compra_id, viaje_id, numero_asiento, codigo_qr, precio, estado)
SELECT 1, c.viaje_id, a.numero,
       'TK' || LPAD(a.numero::TEXT, 6, '0') || '-' || c.id,
       650.00, 'valido'
FROM compra c
CROSS JOIN (VALUES (12), (13), (14)) AS a(numero)
WHERE c.id = 1;

INSERT INTO notificacion (usuario_id, tiquete_id, tipo, titulo, texto, mostrar_desde)
SELECT
    1, t.id, 'compra',
    'Compra completada',
    'Tu tiquete de San José a Cartago está listo. Asiento ' || t.numero_asiento || '.',
    NOW()
FROM tiquete t WHERE t.compra_id = 1 LIMIT 1;

INSERT INTO notificacion (usuario_id, tiquete_id, tipo, titulo, texto, mostrar_desde)
SELECT
    1, t.id, 'viaje',
    'Tu viaje sale pronto',
    'Salís de San José. Tené tu QR listo.',
    v.sale_en - INTERVAL '15 minutes'
FROM tiquete t
JOIN viaje v ON v.id = t.viaje_id
WHERE t.compra_id = 1 LIMIT 1;


-- ---------------------------------------------------------------------
-- Reportes de pasajeros
-- ---------------------------------------------------------------------
INSERT INTO incidencia (usuario_id, ruta_id, tipo, detalle, latitud, longitud, estado, creada_en) VALUES
    (1, 1, 'retraso', 'Presa fuerte a la altura de Taras, el bus lleva unos 20 minutos de atraso.',
     9.8790000, -83.9560000, 'nueva', NOW() - INTERVAL '12 minutes'),
    (2, 3, 'lleno',   'La unidad de las 6:40 salió llena, se quedó gente en la parada de Santo Domingo.',
     9.9797000, -84.0897000, 'nueva', NOW() - INTERVAL '48 minutes'),
    (1, 2, 'falla',   'El aire acondicionado no funciona en la unidad SJB-1198.',
     9.9508000, -84.1178000, 'nueva', NOW() - INTERVAL '95 minutes'),
    (2, 4, 'retraso', 'La salida de las 5:00 a Puntarenas nunca llegó a la terminal.',
     9.9333000, -84.0833000, 'vista', NOW() - INTERVAL '3 hours');

INSERT INTO solicitud_soporte (usuario_id, folio, nombre, correo, detalle, estado) VALUES
    (1, 'SOP-100234', 'Usuario Demo', 'demo@syncro.cr',
     'Pagué el tiquete pero no me apareció en la app.', 'en_espera');


-- ---------------------------------------------------------------------
-- Los contadores de las llaves seriales deben quedar por encima de
-- los ids que insertamos a mano, o el siguiente INSERT choca.
-- ---------------------------------------------------------------------
SELECT setval('empresa_id_seq',     (SELECT MAX(id) FROM empresa));
SELECT setval('parada_id_seq',      (SELECT MAX(id) FROM parada));
SELECT setval('ruta_id_seq',        (SELECT MAX(id) FROM ruta));
SELECT setval('bus_id_seq',         (SELECT MAX(id) FROM bus));
SELECT setval('chofer_id_seq',      (SELECT MAX(id) FROM chofer));
SELECT setval('usuario_id_seq',     (SELECT MAX(id) FROM usuario));
SELECT setval('metodo_pago_id_seq', (SELECT MAX(id) FROM metodo_pago));
SELECT setval('compra_id_seq',      (SELECT MAX(id) FROM compra));
