-- =====================================================================
-- SYNCRO — Esquema de base de datos
-- PostgreSQL 15 o superior (probado en Supabase)
--
-- Orden de ejecución:
--   1. 01-esquema.sql      (este archivo)
--   2. 02-datos-ejemplo.sql
--
-- Para volver a empezar de cero, ejecutar antes:
--   DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- =====================================================================


-- =====================================================================
-- TIPOS ENUMERADOS
-- Se usan en lugar de texto libre para que la base rechace valores
-- que no existen. Es más seguro que un CHECK con una lista de textos.
-- =====================================================================

CREATE TYPE estado_ruta      AS ENUM ('activa', 'pausada');
CREATE TYPE estado_bus       AS ENUM ('activo', 'taller', 'baja');
CREATE TYPE estado_chofer    AS ENUM ('disponible', 'incapacidad', 'inactivo');
CREATE TYPE estado_viaje     AS ENUM ('programado', 'en_curso', 'finalizado', 'cancelado');
CREATE TYPE estado_tiquete   AS ENUM ('valido', 'usado', 'cancelado');
CREATE TYPE estado_pago      AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado');
CREATE TYPE tipo_asiento     AS ENUM ('normal', 'accesible');
CREATE TYPE tipo_metodo_pago AS ENUM ('tarjeta', 'sinpe');
CREATE TYPE tipo_incidencia  AS ENUM ('retraso', 'lleno', 'falla', 'accidente');
CREATE TYPE estado_incidencia AS ENUM ('nueva', 'vista', 'atendida', 'descartada');
CREATE TYPE tipo_notificacion AS ENUM ('compra', 'viaje', 'incidencia', 'sistema');
CREATE TYPE estado_solicitud  AS ENUM ('en_espera', 'respondida', 'cerrada');


-- =====================================================================
-- EMPRESAS Y PERSONAS
-- =====================================================================

-- Empresa autobusera que contrata Syncro
CREATE TABLE empresa (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(120)  NOT NULL,
    cedula_juridica VARCHAR(20)   NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    correo          VARCHAR(160)  NOT NULL UNIQUE,
    activa          BOOLEAN       NOT NULL DEFAULT TRUE,
    creada_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE empresa IS 'Empresas autobuseras que publican rutas en la plataforma';

-- Pasajero que usa la app móvil
CREATE TABLE usuario (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(120) NOT NULL,
    correo         VARCHAR(160) NOT NULL UNIQUE,
    clave_hash     VARCHAR(255) NOT NULL,
    telefono       VARCHAR(20),
    aviso_viaje    BOOLEAN      NOT NULL DEFAULT TRUE,
    aviso_compra   BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- El correo debe tener forma de correo
    CONSTRAINT correo_valido CHECK (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

COMMENT ON TABLE usuario IS 'Pasajeros registrados en la app';
COMMENT ON COLUMN usuario.clave_hash IS 'Nunca se guarda la contraseña en texto plano';

-- Administrador que entra al panel de una empresa
CREATE TABLE administrador (
    id         BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT       NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre     VARCHAR(120) NOT NULL,
    correo     VARCHAR(160) NOT NULL UNIQUE,
    clave_hash VARCHAR(255) NOT NULL,
    creado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE administrador IS 'Usuarios del panel web, pertenecen a una empresa';


-- =====================================================================
-- RUTAS Y PARADAS
-- =====================================================================

-- Punto geográfico donde para un bus
CREATE TABLE parada (
    id       BIGSERIAL PRIMARY KEY,
    nombre   VARCHAR(120)     NOT NULL UNIQUE,
    latitud  NUMERIC(10, 7)   NOT NULL,
    longitud NUMERIC(10, 7)   NOT NULL,
    provincia VARCHAR(60),

    CONSTRAINT latitud_valida  CHECK (latitud  BETWEEN  -90 AND  90),
    CONSTRAINT longitud_valida CHECK (longitud BETWEEN -180 AND 180)
);

COMMENT ON TABLE parada IS 'Paradas físicas, compartidas entre rutas';

-- Ruta: es la PLANTILLA de un recorrido, no una salida concreta.
-- Ejemplo: "San José -> Cartago, 650 colones, cada 15 minutos".
CREATE TABLE ruta (
    id          BIGSERIAL PRIMARY KEY,
    empresa_id  BIGINT       NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    origen      VARCHAR(120) NOT NULL,
    destino     VARCHAR(120) NOT NULL,
    precio      NUMERIC(10,2) NOT NULL,
    frecuencia_min INTEGER   NOT NULL,
    duracion_min   INTEGER   NOT NULL,
    estado      estado_ruta  NOT NULL DEFAULT 'activa',
    creada_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT precio_positivo     CHECK (precio > 0),
    CONSTRAINT frecuencia_positiva CHECK (frecuencia_min > 0),
    CONSTRAINT duracion_positiva   CHECK (duracion_min > 0),
    CONSTRAINT origen_distinto_destino CHECK (origen <> destino),
    -- Una empresa no puede publicar dos veces la misma ruta
    CONSTRAINT ruta_unica_por_empresa UNIQUE (empresa_id, origen, destino)
);

COMMENT ON TABLE ruta IS 'Plantilla de recorrido. Las salidas concretas están en viaje';

-- Relación muchos a muchos entre ruta y parada.
-- Lleva un atributo propio, "orden", que dice en qué posición del
-- recorrido va cada parada. Por eso necesita tabla propia.
CREATE TABLE ruta_parada (
    ruta_id   BIGINT  NOT NULL REFERENCES ruta(id)   ON DELETE CASCADE,
    parada_id BIGINT  NOT NULL REFERENCES parada(id) ON DELETE RESTRICT,
    orden     INTEGER NOT NULL,

    PRIMARY KEY (ruta_id, parada_id),
    CONSTRAINT orden_positivo CHECK (orden > 0),
    -- No puede haber dos paradas en la misma posición de una ruta
    CONSTRAINT orden_unico_por_ruta UNIQUE (ruta_id, orden)
);

COMMENT ON TABLE ruta_parada IS 'Qué paradas tiene cada ruta y en qué orden';


-- =====================================================================
-- FLOTA
-- =====================================================================

CREATE TABLE bus (
    id         BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT       NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    placa      VARCHAR(15)  NOT NULL UNIQUE,
    modelo     VARCHAR(120) NOT NULL,
    anio       INTEGER      NOT NULL,
    capacidad  INTEGER      NOT NULL,
    estado     estado_bus   NOT NULL DEFAULT 'activo',

    CONSTRAINT anio_valido      CHECK (anio BETWEEN 1970 AND 2100),
    CONSTRAINT capacidad_valida CHECK (capacidad BETWEEN 1 AND 100)
);

COMMENT ON TABLE bus IS 'Unidades de la flota de cada empresa';

-- Los asientos de cada bus. Tabla propia porque cada asiento tiene
-- su tipo: los accesibles están reservados para personas con
-- discapacidad y no se venden como asientos normales.
CREATE TABLE asiento (
    bus_id BIGINT       NOT NULL REFERENCES bus(id) ON DELETE CASCADE,
    numero INTEGER      NOT NULL,
    tipo   tipo_asiento NOT NULL DEFAULT 'normal',

    PRIMARY KEY (bus_id, numero),
    CONSTRAINT numero_positivo CHECK (numero > 0)
);

COMMENT ON TABLE asiento IS 'Asientos de cada bus, con su tipo';

CREATE TABLE chofer (
    id         BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT        NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre     VARCHAR(120)  NOT NULL,
    licencia   VARCHAR(30)   NOT NULL UNIQUE,
    telefono   VARCHAR(20),
    estado     estado_chofer NOT NULL DEFAULT 'disponible'
);

COMMENT ON TABLE chofer IS 'Personal de conducción de cada empresa';


-- =====================================================================
-- VIAJES
-- =====================================================================

-- Viaje: una SALIDA CONCRETA de una ruta.
-- Ejemplo: "la salida de San José -> Cartago de hoy a las 2:30 pm,
-- con el bus SJB-1204 y el chofer Marvin".
-- El tiquete se ata al viaje, no a la ruta.
CREATE TABLE viaje (
    id         BIGSERIAL PRIMARY KEY,
    ruta_id    BIGINT       NOT NULL REFERENCES ruta(id)   ON DELETE CASCADE,
    bus_id     BIGINT           NULL REFERENCES bus(id)    ON DELETE SET NULL,
    chofer_id  BIGINT           NULL REFERENCES chofer(id) ON DELETE SET NULL,
    sale_en    TIMESTAMPTZ  NOT NULL,
    estado     estado_viaje NOT NULL DEFAULT 'programado',
    creado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Una misma ruta no puede tener dos salidas a la misma hora
    CONSTRAINT salida_unica UNIQUE (ruta_id, sale_en)
);

COMMENT ON TABLE viaje IS 'Salida concreta de una ruta, con su bus y chofer';
COMMENT ON COLUMN viaje.bus_id IS 'Puede ser NULL: la salida existe antes de asignar unidad';


-- =====================================================================
-- COMPRAS Y TIQUETES
-- =====================================================================

CREATE TABLE metodo_pago (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT           NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tipo        tipo_metodo_pago NOT NULL,
    referencia  VARCHAR(30)      NOT NULL,
    creado_en   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE metodo_pago IS 'Medios de pago guardados por el pasajero';
COMMENT ON COLUMN metodo_pago.referencia IS 'Últimos 4 dígitos de la tarjeta o teléfono SINPE. Nunca el número completo';

-- Una compra puede incluir varios asientos del mismo viaje.
-- Por eso se separa de tiquete: los datos del pago van una sola vez.
CREATE TABLE compra (
    id             BIGSERIAL PRIMARY KEY,
    usuario_id     BIGINT        NOT NULL REFERENCES usuario(id)     ON DELETE RESTRICT,
    viaje_id       BIGINT        NOT NULL REFERENCES viaje(id)       ON DELETE RESTRICT,
    metodo_pago_id BIGINT            NULL REFERENCES metodo_pago(id) ON DELETE SET NULL,
    total          NUMERIC(10,2) NOT NULL,
    estado_pago    estado_pago   NOT NULL DEFAULT 'pendiente',
    comprada_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT total_no_negativo CHECK (total >= 0)
);

COMMENT ON TABLE compra IS 'Una transacción: puede cubrir varios asientos del mismo viaje';

-- Un tiquete por asiento. Cada uno tiene su código QR.
CREATE TABLE tiquete (
    id              BIGSERIAL PRIMARY KEY,
    compra_id       BIGINT         NOT NULL REFERENCES compra(id) ON DELETE CASCADE,
    numero_asiento  INTEGER        NOT NULL,
    codigo_qr       VARCHAR(64)    NOT NULL UNIQUE,
    precio          NUMERIC(10,2)  NOT NULL,
    estado          estado_tiquete NOT NULL DEFAULT 'valido',
    validado_en     TIMESTAMPTZ        NULL,

    CONSTRAINT precio_tiquete_positivo CHECK (precio > 0),
    CONSTRAINT asiento_positivo        CHECK (numero_asiento > 0)
);

COMMENT ON TABLE tiquete IS 'Un tiquete por asiento comprado, con su código QR';

-- Regla clave del negocio: un asiento no se puede vender dos veces
-- en el mismo viaje. Como el viaje está en compra y no en tiquete,
-- se resuelve con una columna redundante controlada y un índice único.
ALTER TABLE tiquete ADD COLUMN viaje_id BIGINT;

-- Se completa desde la compra y queda protegida por la llave foránea
ALTER TABLE tiquete
    ADD CONSTRAINT tiquete_viaje_fk FOREIGN KEY (viaje_id)
    REFERENCES viaje(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX asiento_unico_por_viaje
    ON tiquete (viaje_id, numero_asiento)
    WHERE estado <> 'cancelado';

COMMENT ON INDEX asiento_unico_por_viaje IS
    'Impide vender el mismo asiento dos veces en un viaje. Los cancelados quedan libres';


-- =====================================================================
-- INTERACCIÓN DEL PASAJERO
-- =====================================================================

-- Relación muchos a muchos entre usuario y ruta
CREATE TABLE ruta_favorita (
    usuario_id  BIGINT      NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    ruta_id     BIGINT      NOT NULL REFERENCES ruta(id)    ON DELETE CASCADE,
    marcada_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (usuario_id, ruta_id)
);

COMMENT ON TABLE ruta_favorita IS 'Rutas que cada pasajero marcó con estrella';

-- Reportes que los pasajeros envían desde la app
CREATE TABLE incidencia (
    id         BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT            NULL REFERENCES usuario(id) ON DELETE SET NULL,
    ruta_id    BIGINT        NOT NULL REFERENCES ruta(id)    ON DELETE CASCADE,
    viaje_id   BIGINT            NULL REFERENCES viaje(id)   ON DELETE SET NULL,
    tipo       tipo_incidencia   NOT NULL,
    detalle    TEXT,
    latitud    NUMERIC(10,7),
    longitud   NUMERIC(10,7),
    estado     estado_incidencia NOT NULL DEFAULT 'nueva',
    creada_en  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE incidencia IS 'Retrasos, unidades llenas y fallas reportadas por pasajeros';

CREATE TABLE notificacion (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    BIGINT            NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tiquete_id    BIGINT                NULL REFERENCES tiquete(id) ON DELETE CASCADE,
    tipo          tipo_notificacion NOT NULL,
    titulo        VARCHAR(120)      NOT NULL,
    texto         TEXT              NOT NULL,
    mostrar_desde TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    leida         BOOLEAN           NOT NULL DEFAULT FALSE,
    creada_en     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notificacion IS 'Avisos de compra y recordatorios de viaje';
COMMENT ON COLUMN notificacion.mostrar_desde IS 'El recordatorio de viaje se programa 15 minutos antes de la salida';

-- Reportes de problemas enviados desde la pantalla de Ayuda
CREATE TABLE solicitud_soporte (
    id         BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT           NULL REFERENCES usuario(id) ON DELETE SET NULL,
    folio      VARCHAR(20)      NOT NULL UNIQUE,
    nombre     VARCHAR(120)     NOT NULL,
    correo     VARCHAR(160)     NOT NULL,
    detalle    TEXT             NOT NULL,
    estado     estado_solicitud NOT NULL DEFAULT 'en_espera',
    creada_en  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE solicitud_soporte IS 'Reportes de problemas con la compra, enviados desde Ayuda';


-- =====================================================================
-- ÍNDICES
-- Las llaves primarias y las columnas UNIQUE ya tienen índice.
-- Acá se agregan los de las consultas más frecuentes de la app.
-- =====================================================================

-- Buscar rutas por origen y destino: la consulta principal del pasajero
CREATE INDEX idx_ruta_origen_destino ON ruta (origen, destino) WHERE estado = 'activa';
CREATE INDEX idx_ruta_empresa        ON ruta (empresa_id);

-- Las salidas del día, ordenadas por hora: la vista del panel
CREATE INDEX idx_viaje_sale_en ON viaje (sale_en);
CREATE INDEX idx_viaje_ruta    ON viaje (ruta_id, sale_en);
CREATE INDEX idx_viaje_bus     ON viaje (bus_id)    WHERE bus_id    IS NOT NULL;
CREATE INDEX idx_viaje_chofer  ON viaje (chofer_id) WHERE chofer_id IS NOT NULL;

-- Los tiquetes del pasajero, del más próximo al menos próximo
CREATE INDEX idx_compra_usuario  ON compra (usuario_id, comprada_en DESC);
CREATE INDEX idx_tiquete_compra  ON tiquete (compra_id);

-- Notificaciones pendientes de mostrar
CREATE INDEX idx_notificacion_usuario
    ON notificacion (usuario_id, mostrar_desde DESC);
CREATE INDEX idx_notificacion_sin_leer
    ON notificacion (usuario_id) WHERE leida = FALSE;

-- Reportes que la empresa todavía no ha visto
CREATE INDEX idx_incidencia_ruta   ON incidencia (ruta_id, creada_en DESC);
CREATE INDEX idx_incidencia_nuevas ON incidencia (estado) WHERE estado = 'nueva';

CREATE INDEX idx_parada_nombre ON parada (nombre);


-- =====================================================================
-- VISTAS
-- Consultas frecuentes, ya resueltas.
-- =====================================================================

-- Ocupación de cada viaje: cuántos asientos se vendieron y cuántos quedan
CREATE VIEW vista_ocupacion_viaje AS
SELECT
    v.id                AS viaje_id,
    v.ruta_id,
    v.sale_en,
    r.origen,
    r.destino,
    r.precio,
    b.placa,
    c.nombre            AS chofer,
    COALESCE(b.capacidad, 0)                AS capacidad,
    COUNT(t.id)                             AS vendidos,
    COALESCE(b.capacidad, 0) - COUNT(t.id)  AS disponibles
FROM viaje v
JOIN ruta r        ON r.id = v.ruta_id
LEFT JOIN bus b    ON b.id = v.bus_id
LEFT JOIN chofer c ON c.id = v.chofer_id
LEFT JOIN tiquete t ON t.viaje_id = v.id AND t.estado <> 'cancelado'
GROUP BY v.id, v.ruta_id, v.sale_en, r.origen, r.destino, r.precio,
         b.placa, c.nombre, b.capacidad;

COMMENT ON VIEW vista_ocupacion_viaje IS 'Ocupación por salida, para el panel de la empresa';

-- El recorrido completo de cada ruta, en orden
CREATE VIEW vista_recorrido AS
SELECT
    r.id      AS ruta_id,
    r.origen,
    r.destino,
    rp.orden,
    p.nombre  AS parada,
    p.latitud,
    p.longitud
FROM ruta r
JOIN ruta_parada rp ON rp.ruta_id = r.id
JOIN parada p       ON p.id = rp.parada_id
ORDER BY r.id, rp.orden;

COMMENT ON VIEW vista_recorrido IS 'Paradas de cada ruta en orden, para dibujar el mapa';
