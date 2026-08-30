-- =====================================================================
-- SYNCRO — Autenticación y seguridad
-- Adapta el esquema para usar Supabase Auth y activa las políticas
-- que controlan quién puede ver y modificar cada fila.
--
-- Ejecutar DESPUÉS de 01-esquema.sql y 02-datos-ejemplo.sql
-- =====================================================================


-- =====================================================================
-- 1. ENLAZAR CON SUPABASE AUTH
--
-- Supabase guarda las cuentas en la tabla auth.users y se encarga del
-- hash de la contraseña, las sesiones y los correos de recuperación.
-- Nuestras tablas dejan de guardar la contraseña y solo apuntan a esa
-- cuenta.
-- =====================================================================

ALTER TABLE usuario
    DROP COLUMN IF EXISTS clave_hash,
    ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE administrador
    DROP COLUMN IF EXISTS clave_hash,
    ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON COLUMN usuario.auth_id IS
  'Cuenta en auth.users. La contraseña la guarda y verifica Supabase, nunca esta tabla';


-- Cuando alguien se registra, Supabase crea la fila en auth.users.
-- Este disparador crea automáticamente su fila en usuario, con el
-- nombre que vino en el formulario de registro.
CREATE OR REPLACE FUNCTION crear_usuario_al_registrarse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Las cuentas del panel de empresas no llevan perfil de pasajero.
  -- El formulario del panel marca 'empresa' al registrarse.
  IF COALESCE(NEW.raw_user_meta_data->>'tipo', 'pasajero') = 'empresa' THEN
    RETURN NEW;
  END IF;

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


-- =====================================================================
-- 2. FUNCIONES DE APOYO
--
-- Devuelven el id del usuario o de la empresa de quien está conectado.
-- Las usan las políticas de abajo para no repetir la misma subconsulta.
-- =====================================================================

CREATE OR REPLACE FUNCTION usuario_actual()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM usuario WHERE auth_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION empresa_actual()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT empresa_id FROM administrador WHERE auth_id = auth.uid() $$;

COMMENT ON FUNCTION usuario_actual() IS 'Id del pasajero conectado, o NULL si no hay sesión';
COMMENT ON FUNCTION empresa_actual() IS 'Id de la empresa del administrador conectado';



-- =====================================================================
-- 3.0 PERMISOS DE BASE
--
-- Antes de las políticas hay que conceder el acceso a los dos roles
-- que usa Supabase: anon (visitante sin sesión) y authenticated
-- (persona con sesión). Sin esto, PostgreSQL rechaza la consulta antes
-- de llegar a evaluar la política.
--
-- Conceder acceso NO significa abrir los datos: con RLS activo, la
-- política decide fila por fila qué se devuelve.
-- =====================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Que las tablas futuras hereden lo mismo
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;


-- =====================================================================
-- 3. ACTIVAR LA SEGURIDAD POR FILA
--
-- Con RLS activo, ninguna consulta devuelve filas salvo que exista una
-- política que lo permita. Es lo que impide que alguien con la clave
-- pública lea los datos de todos.
-- =====================================================================

ALTER TABLE empresa            ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrador      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario            ENABLE ROW LEVEL SECURITY;
ALTER TABLE parada             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruta               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruta_parada        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus                ENABLE ROW LEVEL SECURITY;
ALTER TABLE asiento            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chofer             ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaje              ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodo_pago        ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiquete            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruta_favorita      ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencia         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion       ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud_soporte  ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------
-- 3.1 Información pública del servicio
--
-- Rutas, paradas, horarios y empresas los ve cualquiera, incluso sin
-- iniciar sesión: es el catálogo del transporte público. Modificarlos
-- solo puede la empresa dueña.
-- ---------------------------------------------------------------------

CREATE POLICY "cualquiera ve las empresas activas" ON empresa
  FOR SELECT USING (activa = TRUE);

CREATE POLICY "la empresa edita sus datos" ON empresa
  FOR UPDATE USING (id = empresa_actual());

CREATE POLICY "cualquiera ve las paradas" ON parada
  FOR SELECT USING (TRUE);

CREATE POLICY "cualquiera ve las rutas activas" ON ruta
  FOR SELECT USING (estado = 'activa' OR empresa_id = empresa_actual());

CREATE POLICY "la empresa administra sus rutas" ON ruta
  FOR ALL USING (empresa_id = empresa_actual())
  WITH CHECK (empresa_id = empresa_actual());

CREATE POLICY "cualquiera ve el recorrido" ON ruta_parada
  FOR SELECT USING (TRUE);

CREATE POLICY "la empresa arma el recorrido" ON ruta_parada
  FOR ALL USING (EXISTS (SELECT 1 FROM ruta r WHERE r.id = ruta_id AND r.empresa_id = empresa_actual()))
  WITH CHECK (EXISTS (SELECT 1 FROM ruta r WHERE r.id = ruta_id AND r.empresa_id = empresa_actual()));

CREATE POLICY "cualquiera ve las salidas" ON viaje
  FOR SELECT USING (TRUE);

CREATE POLICY "la empresa programa sus salidas" ON viaje
  FOR ALL USING (EXISTS (SELECT 1 FROM ruta r WHERE r.id = ruta_id AND r.empresa_id = empresa_actual()))
  WITH CHECK (EXISTS (SELECT 1 FROM ruta r WHERE r.id = ruta_id AND r.empresa_id = empresa_actual()));

-- La capacidad del bus hace falta para saber cuántos asientos quedan
CREATE POLICY "cualquiera ve los buses" ON bus
  FOR SELECT USING (TRUE);

CREATE POLICY "la empresa administra su flota" ON bus
  FOR ALL USING (empresa_id = empresa_actual())
  WITH CHECK (empresa_id = empresa_actual());

CREATE POLICY "cualquiera ve los asientos" ON asiento
  FOR SELECT USING (TRUE);

CREATE POLICY "la empresa define los asientos" ON asiento
  FOR ALL USING (EXISTS (SELECT 1 FROM bus b WHERE b.id = bus_id AND b.empresa_id = empresa_actual()))
  WITH CHECK (EXISTS (SELECT 1 FROM bus b WHERE b.id = bus_id AND b.empresa_id = empresa_actual()));

-- Los choferes son datos internos: solo los ve su empresa
CREATE POLICY "la empresa administra sus choferes" ON chofer
  FOR ALL USING (empresa_id = empresa_actual())
  WITH CHECK (empresa_id = empresa_actual());


-- ---------------------------------------------------------------------
-- 3.2 Datos personales del pasajero
--
-- Cada quien ve y modifica lo suyo, y nada más.
-- ---------------------------------------------------------------------

CREATE POLICY "cada quien ve su perfil" ON usuario
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "cada quien edita su perfil" ON usuario
  FOR UPDATE USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "cada quien maneja sus métodos de pago" ON metodo_pago
  FOR ALL USING (usuario_id = usuario_actual())
  WITH CHECK (usuario_id = usuario_actual());

CREATE POLICY "cada quien maneja sus favoritas" ON ruta_favorita
  FOR ALL USING (usuario_id = usuario_actual())
  WITH CHECK (usuario_id = usuario_actual());

CREATE POLICY "cada quien ve sus notificaciones" ON notificacion
  FOR ALL USING (usuario_id = usuario_actual())
  WITH CHECK (usuario_id = usuario_actual());


-- ---------------------------------------------------------------------
-- 3.3 Compras y tiquetes
--
-- El pasajero ve los suyos. La empresa ve los de sus propias salidas,
-- porque necesita saber la ocupación y validar el abordaje.
-- ---------------------------------------------------------------------

CREATE POLICY "el pasajero ve sus compras" ON compra
  FOR SELECT USING (usuario_id = usuario_actual());

CREATE POLICY "el pasajero compra a su nombre" ON compra
  FOR INSERT WITH CHECK (usuario_id = usuario_actual());

CREATE POLICY "la empresa ve las compras de sus salidas" ON compra
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM viaje v JOIN ruta r ON r.id = v.ruta_id
    WHERE v.id = viaje_id AND r.empresa_id = empresa_actual()));

CREATE POLICY "el pasajero ve sus tiquetes" ON tiquete
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM compra c WHERE c.id = compra_id AND c.usuario_id = usuario_actual()));

CREATE POLICY "el pasajero genera sus tiquetes" ON tiquete
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM compra c WHERE c.id = compra_id AND c.usuario_id = usuario_actual()));

CREATE POLICY "la empresa ve y valida los tiquetes de sus salidas" ON tiquete
  FOR ALL USING (EXISTS (
    SELECT 1 FROM viaje v JOIN ruta r ON r.id = v.ruta_id
    WHERE v.id = viaje_id AND r.empresa_id = empresa_actual()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM viaje v JOIN ruta r ON r.id = v.ruta_id
    WHERE v.id = viaje_id AND r.empresa_id = empresa_actual()));


-- ---------------------------------------------------------------------
-- 3.4 Reportes
--
-- El pasajero envía y ve los suyos. La empresa ve los que afectan a
-- sus rutas, que es justo lo que muestra su panel.
-- ---------------------------------------------------------------------

CREATE POLICY "el pasajero envía incidencias" ON incidencia
  FOR INSERT WITH CHECK (usuario_id = usuario_actual());

CREATE POLICY "el pasajero ve sus incidencias" ON incidencia
  FOR SELECT USING (usuario_id = usuario_actual());

CREATE POLICY "la empresa ve las incidencias de sus rutas" ON incidencia
  FOR ALL USING (EXISTS (
    SELECT 1 FROM ruta r WHERE r.id = ruta_id AND r.empresa_id = empresa_actual()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ruta r WHERE r.id = ruta_id AND r.empresa_id = empresa_actual()));

CREATE POLICY "el pasajero envía solicitudes de soporte" ON solicitud_soporte
  FOR INSERT WITH CHECK (usuario_id = usuario_actual() OR usuario_id IS NULL);

CREATE POLICY "el pasajero ve sus solicitudes" ON solicitud_soporte
  FOR SELECT USING (usuario_id = usuario_actual());

CREATE POLICY "el administrador ve su propia ficha" ON administrador
  FOR SELECT USING (auth_id = auth.uid());


-- =====================================================================
-- 4. VISTA DE OCUPACIÓN, ACCESIBLE PARA TODOS
--
-- El pasajero necesita saber qué asientos están ocupados en un viaje,
-- pero no puede leer la tabla tiquete de otros. Esta función devuelve
-- solo los números de asiento, sin datos de nadie.
-- =====================================================================

CREATE OR REPLACE FUNCTION asientos_ocupados(p_viaje BIGINT)
RETURNS TABLE (numero_asiento INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.numero_asiento FROM tiquete t
  WHERE t.viaje_id = p_viaje AND t.estado <> 'cancelado'
$$;

COMMENT ON FUNCTION asientos_ocupados(BIGINT) IS
  'Números de asiento vendidos en un viaje. No expone a quién pertenecen';

GRANT EXECUTE ON FUNCTION asientos_ocupados(BIGINT) TO anon, authenticated;
