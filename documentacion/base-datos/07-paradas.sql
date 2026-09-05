-- =====================================================================
-- 07-paradas.sql
-- Syncro — Ampliación del catálogo de paradas
-- =====================================================================
--
-- El catálogo original (02-datos-ejemplo.sql) trae 18 paradas, las
-- justas para los recorridos de ejemplo. Eso deja una limitación real:
-- al crear una ruta desde el panel, la empresa solo puede armar el
-- recorrido con paradas que ya existan, porque una parada nueva
-- necesita coordenadas y el panel no las pide.
--
-- Este script agrega 32 paradas más: las intermedias que faltaban en
-- las rutas actuales, y las de varios corredores que hoy no existen
-- pero que tendría sentido poder crear.
--
-- SOBRE LAS COORDENADAS
-- Están al nivel del centro de cada población, no del punto exacto
-- donde se detiene el bus. Alcanzan para dibujar el recorrido en el
-- mapa; si alguna parada necesita precisión de acera, hay que ajustarla
-- con el punto real.
--
-- Ejecutar DESPUÉS de 02-datos-ejemplo.sql. Es idempotente: si ya se
-- corrió, no duplica nada.
-- =====================================================================

INSERT INTO parada (id, nombre, latitud, longitud, provincia) VALUES

    -- ---- Corredor San José – Cartago -------------------------------
    (19, 'San Pedro',              9.9333000, -84.0500000, 'San José'),
    (20, 'San Diego',              9.9040000, -84.0180000, 'Cartago'),
    (21, 'La Lima',                9.8720000, -83.9400000, 'Cartago'),

    -- ---- Corredor San José – Alajuela ------------------------------
    (22, 'San Antonio de Belén',   9.9800000, -84.1800000, 'Heredia'),
    (23, 'Aeropuerto Juan Santamaría', 9.9939000, -84.2088000, 'Alajuela'),

    -- ---- Corredor Heredia – San José -------------------------------
    (24, 'San Joaquín de Flores',  9.9800000, -84.1500000, 'Heredia'),
    (25, 'Barreal de Heredia',     9.9700000, -84.1300000, 'Heredia'),
    (26, 'Calle Blancos',          9.9600000, -84.0600000, 'San José'),

    -- ---- Corredor San José – Puntarenas ----------------------------
    (27, 'San Mateo',              9.9500000, -84.5300000, 'Alajuela'),
    (28, 'Esparza',                9.9900000, -84.6600000, 'Puntarenas'),
    (29, 'Barranca',               9.9700000, -84.7200000, 'Puntarenas'),

    -- ---- Corredor Cartago – Turrialba ------------------------------
    (30, 'Pacayas',                9.9100000, -83.8200000, 'Cartago'),
    (31, 'Juan Viñas',             9.8900000, -83.7500000, 'Cartago'),

    -- ---- Occidente: Grecia, Naranjo, San Ramón ---------------------
    (32, 'Grecia',                10.0700000, -84.3100000, 'Alajuela'),
    (33, 'Sarchí',                10.0900000, -84.3500000, 'Alajuela'),
    (34, 'Naranjo',               10.1000000, -84.3800000, 'Alajuela'),
    (35, 'San Ramón',             10.0900000, -84.4700000, 'Alajuela'),
    (36, 'Palmares',              10.0500000, -84.4300000, 'Alajuela'),

    -- ---- Pacífico Central: Jacó, Quepos ----------------------------
    (37, 'Tárcoles',               9.7600000, -84.6200000, 'Puntarenas'),
    (38, 'Herradura',              9.6500000, -84.6600000, 'Puntarenas'),
    (39, 'Jacó',                   9.6100000, -84.6300000, 'Puntarenas'),
    (40, 'Parrita',                9.5200000, -84.3200000, 'Puntarenas'),
    (41, 'Quepos',                 9.4300000, -84.1600000, 'Puntarenas'),

    -- ---- Guanacaste ------------------------------------------------
    (42, 'Limonal',               10.2300000, -85.0000000, 'Guanacaste'),
    (43, 'Cañas',                 10.4300000, -85.0900000, 'Guanacaste'),
    (44, 'Bagaces',               10.5200000, -85.2500000, 'Guanacaste'),
    (45, 'Liberia',               10.6350000, -85.4400000, 'Guanacaste'),
    (46, 'Santa Cruz',            10.2600000, -85.5800000, 'Guanacaste'),
    (47, 'Nicoya',                10.1400000, -85.4500000, 'Guanacaste'),

    -- ---- Caribe ----------------------------------------------------
    (48, 'Guápiles',              10.2200000, -83.7900000, 'Limón'),
    (49, 'Guácimo',               10.2100000, -83.6900000, 'Limón'),
    (50, 'Siquirres',             10.1000000, -83.5100000, 'Limón'),
    (51, 'Limón Centro',           9.9900000, -83.0300000, 'Limón'),

    -- ---- Zona Sur --------------------------------------------------
    (52, 'San Isidro de El General', 9.3700000, -83.7000000, 'San José')

ON CONFLICT (nombre) DO NOTHING;


-- Deja la secuencia de ids por encima del último insertado, para que
-- las paradas que se creen después no choquen con estos números.
SELECT setval('parada_id_seq', (SELECT max(id) FROM parada));


-- =====================================================================
-- VERIFICACIÓN — correr después, por separado
-- =====================================================================
/*

-- Cuántas paradas hay ahora, por provincia
SELECT provincia, count(*) AS paradas
  FROM parada GROUP BY provincia ORDER BY provincia;

-- Ninguna debería salir de Costa Rica
SELECT nombre, latitud, longitud
  FROM parada
 WHERE latitud  NOT BETWEEN  8.0 AND 11.3
    OR longitud NOT BETWEEN -86.0 AND -82.5;

-- Nombres repetidos (debería devolver cero filas)
SELECT nombre, count(*) FROM parada GROUP BY nombre HAVING count(*) > 1;

*/
