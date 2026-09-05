-- =====================================================================
-- 06-panel-empresas.sql
-- Syncro — Lo que falta en la base para que el panel se conecte
-- =====================================================================
--
-- La app de pasajeros ya trabaja contra Supabase. El panel no, y al
-- revisar el esquema aparecieron tres cosas que hay que resolver
-- primero. Este script las resuelve.
--
-- Ejecutar DESPUÉS de 05-horarios-recurrentes.sql
-- Es idempotente: se puede correr las veces que haga falta.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LA CUENTA DEL ADMINISTRADOR NO EXISTE
-- ---------------------------------------------------------------------
-- El script 02 insertó la fila de `administrador` con una contraseña de
-- relleno, y el 03 quitó esa columna y agregó `auth_id`, que quedó nulo.
-- Resultado: `empresa_actual()` devuelve NULL y TODAS las políticas del
-- panel niegan el acceso. El panel no podría ni leer sus propias rutas.
--
-- La solución no es crear la cuenta desde SQL (Supabase maneja el hash
-- y la confirmación del correo). Es dejar que la cuenta se registre
-- normalmente y que la base la enlace sola con la ficha que ya existe.
--
-- Esto además define una regla de negocio razonable: una empresa no se
-- auto-registra. Syncro la da de alta, y luego su administrador reclama
-- el acceso con el correo que quedó registrado.

CREATE OR REPLACE FUNCTION crear_usuario_al_registrarse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    fichas INTEGER;
BEGIN
    -- Cuenta de empresa: no lleva perfil de pasajero.
    IF COALESCE(NEW.raw_user_meta_data->>'tipo', 'pasajero') = 'empresa' THEN

        -- Se enlaza con la ficha de administrador que ya exista para ese
        -- correo. Si no hay ninguna, la cuenta queda creada pero sin
        -- empresa: podrá iniciar sesión y no verá nada, que es lo
        -- correcto para alguien que no fue dado de alta.
        UPDATE administrador
           SET auth_id = NEW.id
         WHERE lower(correo) = lower(NEW.email)
           AND auth_id IS NULL;

        GET DIAGNOSTICS fichas = ROW_COUNT;
        IF fichas = 0 THEN
            RAISE NOTICE 'No hay ficha de administrador para %. La cuenta queda sin empresa.', NEW.email;
        END IF;

        RETURN NEW;
    END IF;

    -- Cuenta de pasajero: se crea su perfil (comportamiento original)
    INSERT INTO usuario (auth_id, nombre, correo, telefono)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'telefono'
    )
    ON CONFLICT (correo) DO UPDATE SET auth_id = EXCLUDED.auth_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS al_crear_cuenta ON auth.users;
CREATE TRIGGER al_crear_cuenta
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION crear_usuario_al_registrarse();


-- Enlace de cuentas que ya se hayan creado antes de este script
-- (por ejemplo, si el usuario se agregó a mano desde el panel de Supabase).
UPDATE administrador a
   SET auth_id = u.id
  FROM auth.users u
 WHERE lower(a.correo) = lower(u.email)
   AND a.auth_id IS NULL;


-- ---------------------------------------------------------------------
-- 2. LAS VISTAS SE SALTAN LA SEGURIDAD POR FILA
-- ---------------------------------------------------------------------
-- Una vista en PostgreSQL corre con los permisos de quien la creó, no
-- de quien la consulta. Como `vista_ocupacion_viaje` la creó el dueño
-- de la base y el script 03 dio SELECT sobre todas las tablas al rol
-- `authenticated`, cualquier persona con sesión podría consultarla y
-- ver la ocupación y las ventas de TODAS las empresas.
--
-- `security_invoker` invierte eso: la vista pasa a evaluarse con los
-- permisos de quien consulta, así que las políticas de `viaje`, `ruta`
-- y `tiquete` vuelven a aplicar.
--
-- Requiere PostgreSQL 15 o superior. Supabase ya va en 15+.

ALTER VIEW vista_ocupacion_viaje SET (security_invoker = true);
ALTER VIEW vista_recorrido       SET (security_invoker = true);


-- ---------------------------------------------------------------------
-- 3. UN BUS NUEVO NACE SIN ASIENTOS
-- ---------------------------------------------------------------------
-- Los asientos de los buses de ejemplo se insertaron a mano en el
-- script 02. Si la empresa agrega una unidad desde el panel, esa unidad
-- queda sin filas en `asiento`, y el mapa de asientos de la app de
-- pasajeros aparecería vacío.
--
-- Este disparador los genera solo, a partir de la capacidad: los cuatro
-- primeros quedan como accesibles, igual que en los datos de ejemplo.

CREATE OR REPLACE FUNCTION generar_asientos_del_bus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Al cambiar la capacidad, se quitan los asientos que sobran.
    -- No se tocan los que ya existen, para no perder su tipo.
    DELETE FROM asiento
     WHERE bus_id = NEW.id
       AND numero > NEW.capacidad;

    INSERT INTO asiento (bus_id, numero, tipo)
    SELECT NEW.id,
           n,
           CASE WHEN n <= 4 THEN 'accesible'::tipo_asiento
                ELSE 'normal'::tipo_asiento END
      FROM generate_series(1, NEW.capacidad) AS n
    ON CONFLICT (bus_id, numero) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS al_guardar_bus ON bus;
CREATE TRIGGER al_guardar_bus
    AFTER INSERT OR UPDATE OF capacidad ON bus
    FOR EACH ROW EXECUTE FUNCTION generar_asientos_del_bus();


-- Generar los asientos que falten en los buses que ya existen
INSERT INTO asiento (bus_id, numero, tipo)
SELECT b.id,
       n,
       CASE WHEN n <= 4 THEN 'accesible'::tipo_asiento
            ELSE 'normal'::tipo_asiento END
  FROM bus b
  CROSS JOIN LATERAL generate_series(1, b.capacidad) AS n
ON CONFLICT (bus_id, numero) DO NOTHING;


-- ---------------------------------------------------------------------
-- 4. LO QUE RLS **NO** FILTRA (nota para quien escriba el panel)
-- ---------------------------------------------------------------------
-- Comprobado sobre este mismo esquema, con dos empresas cargadas:
--
--   tabla    filtrada por RLS   quien la ve
--   ------   ----------------   ---------------------------------------
--   chofer   SÍ                 solo su empresa
--   ruta     NO                 cualquiera ve las rutas activas
--   bus      NO                 cualquiera (la capacidad es pública)
--   viaje    NO                 cualquiera ve las salidas
--
-- Es deliberado: rutas, buses y salidas son el catálogo del transporte
-- público, y el pasajero necesita leerlos sin sesión. RLS protege la
-- ESCRITURA de esas tablas, no la lectura.
--
-- Consecuencia para el panel: no alcanza con confiar en las políticas.
-- Cada consulta de lectura tiene que filtrar por empresa a mano, o la
-- empresa vería la flota y las rutas de las demás en su propio panel.
--
--   .eq('empresa_id', idDeLaEmpresa)        para ruta y bus
--   .in('ruta_id', idsDeSusRutas)           para viaje y vista_ocupacion_viaje
--
-- No hace falta ninguna política nueva para esto.


-- =====================================================================
-- VERIFICACIÓN — correr después, por separado
-- =====================================================================
/*

-- ¿Quedó enlazada la cuenta del administrador?
SELECT a.correo,
       a.auth_id IS NOT NULL AS enlazada,
       e.nombre               AS empresa
  FROM administrador a
  JOIN empresa e ON e.id = a.empresa_id;

-- Si "enlazada" dice false, falta registrar la cuenta. Dos caminos:
--   a) Desde el panel: la pantalla de acceso permite crear la cuenta
--      de empresa con ese mismo correo.
--   b) Desde Supabase: Authentication > Users > Add user, con el correo
--      admin@transportescr.com. Después volvé a correr este script.

-- ¿Las vistas ya respetan RLS?
SELECT c.relname, c.reloptions
  FROM pg_class c
 WHERE c.relname IN ('vista_ocupacion_viaje', 'vista_recorrido');

-- ¿Todos los buses tienen sus asientos?
SELECT b.placa, b.capacidad, count(a.numero) AS asientos
  FROM bus b LEFT JOIN asiento a ON a.bus_id = b.id
 GROUP BY b.id, b.placa, b.capacidad
 ORDER BY b.placa;

*/
