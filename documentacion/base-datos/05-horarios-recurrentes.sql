-- =====================================================================
-- 05-horarios-recurrentes.sql
-- Syncro — Horarios recurrentes y generación automática de salidas
-- =====================================================================
--
-- QUÉ PROBLEMA RESUELVE
--
-- Hasta ahora cada salida se creaba a mano corriendo un script, y los
-- datos solo cubrían el día de la ejecución. Al día siguiente la app
-- quedaba vacía.
--
-- La causa está en el modelo: la tabla `viaje` guarda salidas sueltas,
-- pero en la realidad una empresa no programa salidas una por una.
-- Programa un horario: "esta ruta sale a las 6:00 de lunes a viernes".
-- Ese horario es una entidad que faltaba.
--
-- Este script la agrega y deja que la base genere las salidas sola.
--
-- ES IDEMPOTENTE: se puede correr las veces que sea sin duplicar nada.
--
-- Orden de ejecución: después de 04-salidas-proximas.sql
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LA TABLA DE HORARIOS
-- ---------------------------------------------------------------------
-- Una fila por horario recurrente. La empresa la configura una vez
-- desde el panel y no la vuelve a tocar.

CREATE TABLE IF NOT EXISTS horario_plantilla (
    id          BIGSERIAL   PRIMARY KEY,
    ruta_id     BIGINT      NOT NULL REFERENCES ruta(id)   ON DELETE CASCADE,
    hora_salida TIME        NOT NULL,
    dias        SMALLINT[]  NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
    bus_id      BIGINT      REFERENCES bus(id)    ON DELETE SET NULL,
    chofer_id   BIGINT      REFERENCES chofer(id) ON DELETE SET NULL,
    activa      BOOLEAN     NOT NULL DEFAULT TRUE,
    creada_en   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Una ruta no puede tener dos horarios a la misma hora
    CONSTRAINT horario_plantilla_unica UNIQUE (ruta_id, hora_salida),

    -- Los días tienen que ser válidos y la lista no puede venir vacía
    CONSTRAINT dias_validos CHECK (
        dias <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
        AND array_length(dias, 1) BETWEEN 1 AND 7
    )
);

COMMENT ON TABLE  horario_plantilla        IS 'Horarios recurrentes. Cada fila genera salidas concretas en la tabla viaje.';
COMMENT ON COLUMN horario_plantilla.dias   IS 'Días ISO en que aplica: 1=lunes, 2=martes ... 7=domingo.';
COMMENT ON COLUMN horario_plantilla.bus_id IS 'Bus asignado por defecto. Nulo si el despachador lo decide cada día.';

CREATE INDEX IF NOT EXISTS idx_plantilla_ruta
    ON horario_plantilla (ruta_id) WHERE activa;


-- ---------------------------------------------------------------------
-- 2. RLS: LAS PLANTILLAS HEREDAN EL ACCESO DE SU RUTA
-- ---------------------------------------------------------------------
-- En lugar de repetir la lógica de empresa, la política delega en la
-- tabla `ruta`: si el usuario puede ver la ruta, puede ver sus horarios.
-- PostgreSQL aplica las políticas de `ruta` dentro de esta subconsulta,
-- así que el aislamiento entre empresas se mantiene sin duplicar reglas.
-- Si mañana cambia el criterio de empresa, se cambia en un solo lugar.

ALTER TABLE horario_plantilla ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plantilla_sigue_a_ruta ON horario_plantilla;

CREATE POLICY plantilla_sigue_a_ruta
    ON horario_plantilla
    FOR ALL
    USING      (EXISTS (SELECT 1 FROM ruta r WHERE r.id = horario_plantilla.ruta_id))
    WITH CHECK (EXISTS (SELECT 1 FROM ruta r WHERE r.id = horario_plantilla.ruta_id));


-- ---------------------------------------------------------------------
-- 3. BACKFILL: DEDUCIR LOS HORARIOS DE LO QUE YA EXISTE
-- ---------------------------------------------------------------------
-- Toma las salidas que ya generó el script 04 y arma una plantilla por
-- cada combinación distinta de ruta y hora, quedándose con el bus y el
-- chofer de la salida más reciente. Así no hay que meter los horarios
-- a mano. Por defecto quedan los siete días; eso se ajusta después
-- desde el panel si alguna ruta no opera fines de semana.

INSERT INTO horario_plantilla (ruta_id, hora_salida, bus_id, chofer_id)
SELECT DISTINCT ON (v.ruta_id, date_trunc('minute', v.sale_en AT TIME ZONE 'America/Costa_Rica')::TIME)
       v.ruta_id,
       date_trunc('minute', v.sale_en AT TIME ZONE 'America/Costa_Rica')::TIME,
       v.bus_id,
       v.chofer_id
FROM   viaje v
JOIN   ruta  r ON r.id = v.ruta_id
WHERE  r.estado = 'activa'
ORDER  BY v.ruta_id,
          date_trunc('minute', v.sale_en AT TIME ZONE 'America/Costa_Rica')::TIME,
          v.sale_en DESC
ON CONFLICT (ruta_id, hora_salida) DO NOTHING;


-- ---------------------------------------------------------------------
-- 4. LA FUNCIÓN GENERADORA
-- ---------------------------------------------------------------------
-- Recorre las plantillas activas, las cruza con los próximos N días y
-- crea las salidas que falten. Devuelve cuántas creó.
--
-- Sobre la zona horaria: `sale_en` es timestamptz, o sea que se guarda
-- en UTC. La fecha se arma explícitamente en America/Costa_Rica y se
-- convierte; si no, el servidor la interpretaría en UTC y las salidas
-- aparecerían corridas seis horas.

CREATE OR REPLACE FUNCTION generar_salidas(dias_adelante INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $funcion$
DECLARE
    creadas INTEGER;
BEGIN
    IF dias_adelante < 1 OR dias_adelante > 60 THEN
        RAISE EXCEPTION 'dias_adelante debe estar entre 1 y 60 (se recibió %)', dias_adelante;
    END IF;

    WITH fechas AS (
        SELECT ((now() AT TIME ZONE 'America/Costa_Rica')::DATE + d) AS dia
        FROM   generate_series(0, dias_adelante - 1) AS d
    ),
    candidatas AS (
        SELECT p.ruta_id,
               p.bus_id,
               p.chofer_id,
               (f.dia + p.hora_salida) AT TIME ZONE 'America/Costa_Rica' AS sale_en
        FROM   horario_plantilla p
        JOIN   ruta r ON r.id = p.ruta_id
        CROSS  JOIN fechas f
        WHERE  p.activa
          AND  r.estado = 'activa'
          AND  EXTRACT(ISODOW FROM f.dia)::SMALLINT = ANY (p.dias)
    ),
    nuevas AS (
        INSERT INTO viaje (ruta_id, bus_id, chofer_id, sale_en)
        SELECT c.ruta_id, c.bus_id, c.chofer_id, c.sale_en
        FROM   candidatas c
        WHERE  c.sale_en > now()          -- nunca crea salidas en el pasado
          AND  NOT EXISTS (
                   SELECT 1 FROM viaje v
                   WHERE  v.ruta_id = c.ruta_id
                     AND  v.sale_en = c.sale_en
               )
        RETURNING 1
    )
    SELECT count(*) INTO creadas FROM nuevas;

    RETURN creadas;
END;
$funcion$;

COMMENT ON FUNCTION generar_salidas(INTEGER)
    IS 'Genera las salidas de los próximos N días a partir de horario_plantilla. Idempotente.';

-- La función es SECURITY DEFINER porque el job automático la corre sin
-- sesión de usuario. No devuelve datos de ninguna empresa, solo un
-- conteo, así que no expone información entre empresas.
REVOKE EXECUTE ON FUNCTION generar_salidas(INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION generar_salidas(INTEGER) TO authenticated;


-- ---------------------------------------------------------------------
-- 5. CANDADO CONTRA DUPLICADOS
-- ---------------------------------------------------------------------
-- Que no puedan existir dos salidas de la misma ruta a la misma hora.
--
-- El esquema original (01-esquema.sql) ya trae la restricción
-- `salida_unica UNIQUE (ruta_id, sale_en)`, así que normalmente acá no
-- hay nada que hacer. Este bloque solo crea el índice si esa restricción
-- no estuviera, para que el script también sirva sobre una base donde
-- se haya quitado. Crear un segundo índice idéntico costaría escritura y
-- espacio sin aportar nada.

DO $bloque$
DECLARE
    ya_existe  BOOLEAN;
    duplicados INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM   pg_index i
        JOIN   pg_class t ON t.oid = i.indrelid
        WHERE  t.relname = 'viaje'
          AND  i.indisunique
          AND  i.indnatts = 2
          AND  (SELECT array_agg(a.attname::TEXT ORDER BY a.attname::TEXT)
                FROM   pg_attribute a
                WHERE  a.attrelid = t.oid
                  AND  a.attnum = ANY (i.indkey)) = ARRAY['ruta_id','sale_en']::TEXT[]
    ) INTO ya_existe;

    IF ya_existe THEN
        RAISE NOTICE 'La unicidad de (ruta_id, sale_en) ya estaba garantizada. No se crea nada.';
        RETURN;
    END IF;

    SELECT count(*) INTO duplicados
    FROM (
        SELECT ruta_id, sale_en
        FROM   viaje
        GROUP  BY ruta_id, sale_en
        HAVING count(*) > 1
    ) d;

    IF duplicados = 0 THEN
        CREATE UNIQUE INDEX idx_viaje_unico ON viaje (ruta_id, sale_en);
        RAISE NOTICE 'Índice único creado sobre viaje (ruta_id, sale_en).';
    ELSE
        RAISE NOTICE 'Índice único NO creado: hay % combinaciones de ruta+hora repetidas.', duplicados;
        RAISE NOTICE 'Revisá los duplicados con la consulta de verificación al final del script.';
    END IF;
END;
$bloque$;


-- ---------------------------------------------------------------------
-- 6. PRIMERA GENERACIÓN
-- ---------------------------------------------------------------------

SELECT generar_salidas(7) AS salidas_creadas;


-- ---------------------------------------------------------------------
-- 7. EL JOB AUTOMÁTICO
-- ---------------------------------------------------------------------
-- pg_cron corre en UTC. Las 08:00 UTC son las 2:00 a.m. en Costa Rica,
-- que es cuando menos molesta.
--
-- Si esta sección da error, hay que habilitar pg_cron primero en
-- Supabase: Database > Extensions > buscar "pg_cron" > activar.
-- Después se vuelve a correr solo esta sección.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Borra el job anterior si ya existía, para poder re-ejecutar el script
SELECT cron.unschedule('syncro-generar-salidas')
WHERE  EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'syncro-generar-salidas');

SELECT cron.schedule(
    'syncro-generar-salidas',
    '0 8 * * *',
    $job$ SELECT generar_salidas(7); $job$
);


-- =====================================================================
-- VERIFICACIÓN — correr después, por separado
-- =====================================================================
/*

-- Horarios que quedaron configurados
SELECT p.id,
       r.origen || ' → ' || r.destino AS ruta,
       p.hora_salida,
       p.dias,
       b.placa      AS bus,
       c.nombre     AS chofer,
       p.activa
FROM   horario_plantilla p
JOIN   ruta   r ON r.id = p.ruta_id
LEFT   JOIN bus    b ON b.id = p.bus_id
LEFT   JOIN chofer c ON c.id = p.chofer_id
ORDER  BY r.origen, p.hora_salida;

-- Cuántas salidas hay por día de aquí en adelante
SELECT (sale_en AT TIME ZONE 'America/Costa_Rica')::DATE AS dia,
       count(*) AS salidas
FROM   viaje
WHERE  sale_en > now()
GROUP  BY 1
ORDER  BY 1;

-- Las próximas diez salidas, en hora de Costa Rica
SELECT r.origen || ' → ' || r.destino AS ruta,
       to_char(v.sale_en AT TIME ZONE 'America/Costa_Rica', 'DD/MM HH24:MI') AS sale,
       COALESCE(b.placa,  'sin asignar') AS bus,
       COALESCE(c.nombre, 'sin asignar') AS chofer
FROM   viaje v
JOIN   ruta r ON r.id = v.ruta_id
LEFT   JOIN bus    b ON b.id = v.bus_id
LEFT   JOIN chofer c ON c.id = v.chofer_id
WHERE  v.sale_en > now()
ORDER  BY v.sale_en
LIMIT  10;

-- Buscar duplicados (debería devolver cero filas)
SELECT ruta_id, sale_en, count(*)
FROM   viaje
GROUP  BY ruta_id, sale_en
HAVING count(*) > 1;

-- Estado del job automático
SELECT jobid, jobname, schedule, active FROM cron.job;

-- Últimas corridas del job
SELECT start_time, status, return_message
FROM   cron.job_run_details
WHERE  jobname = 'syncro-generar-salidas'
ORDER  BY start_time DESC
LIMIT  5;

*/
