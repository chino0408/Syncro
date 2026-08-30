# Poner Syncro en Supabase — paso a paso

Al terminar vas a tener la base de datos en la nube, con autenticación real y las políticas de seguridad activas. Toma unos 15 minutos.

---

## 1. Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta (podés usar tu GitHub).
2. **New project**.
3. Completá:
   - **Name:** `syncro`
   - **Database Password:** generá una y **guardala en un lugar seguro**. No se puede recuperar después.
   - **Region:** elegí `East US` o `West US`, que son las más cercanas a Costa Rica.
4. **Create new project**. Tarda un par de minutos en quedar listo.

---

## 2. Cargar la base de datos

En el menú izquierdo entrá a **SQL Editor** y ejecutá los tres archivos **en orden**, uno por consulta:

| Orden | Archivo | Qué hace |
|---|---|---|
| 1 | `01-esquema.sql` | Crea las 17 tablas, índices y vistas |
| 2 | `02-datos-ejemplo.sql` | Carga la empresa, rutas, flota y salidas de prueba |
| 3 | `03-auth-y-seguridad.sql` | Conecta con el sistema de cuentas y activa las políticas |

Para cada uno: **New query** → pegar el contenido → **Run**.

Si algo falla, no sigas: revisá el mensaje antes de pasar al siguiente. Ejecutarlos fuera de orden da errores en cadena.

Al terminar, entrá a **Table Editor**: deberías ver las 17 tablas con datos.

---

## 3. Configurar el registro de cuentas

En **Authentication → Providers → Email**:

- **Enable Email provider**: activado.
- **Confirm email**: desactivalo por ahora. Si lo dejás activo, cada cuenta nueva tiene que confirmar por correo antes de poder entrar, y eso complica las pruebas y la demostración en clase.

> Para la entrega final podés activarlo: ahí sí se ve mejor que el sistema mande correos de verdad.

---

## 4. Copiar las dos claves

En **Project Settings → API** vas a ver:

- **Project URL** — algo como `https://abcdefghijk.supabase.co`
- **anon public** — una clave larga que empieza con `eyJ...`

Copiá las dos. Son las que necesito para conectar la app.

### Sobre la clave `anon`

Esta clave **va en el código del navegador y eso está bien**: no es un secreto. Lo que protege los datos son las políticas del paso 2, que definen fila por fila quién puede ver qué.

Lo que **nunca** va en el código es la clave `service_role`, que aparece más abajo en esa misma pantalla. Esa se salta todas las políticas. No la copies ni la pegues en ningún archivo del proyecto.

---

## 5. Crear las cuentas de prueba

Como ahora las contraseñas las maneja Supabase, hay que crear las cuentas ahí.

En **Authentication → Users → Add user → Create new user**:

**Pasajero de prueba**
```
Email:    demo@syncro.cr
Password: demo123456
```
Marcá **Auto Confirm User**.

**Administrador de la empresa**
```
Email:    admin@transportescr.com
Password: admin123456
```
Marcá **Auto Confirm User**.

Después, en **SQL Editor**, ejecutá esto para enlazar al administrador con su empresa:

```sql
UPDATE administrador
SET auth_id = (SELECT id FROM auth.users WHERE email = 'admin@transportescr.com')
WHERE correo = 'admin@transportescr.com';
```

> El pasajero se enlaza solo: hay un disparador que crea su perfil al registrarse.

---

## 6. Comprobar que quedó bien

En **SQL Editor**, ejecutá:

```sql
SELECT 'usuarios' AS tabla, COUNT(*) FROM usuario
UNION ALL SELECT 'rutas', COUNT(*) FROM ruta
UNION ALL SELECT 'salidas de hoy', COUNT(*) FROM viaje
UNION ALL SELECT 'buses', COUNT(*) FROM bus
UNION ALL SELECT 'asientos', COUNT(*) FROM asiento;
```

Deberías ver rutas, buses, 240 asientos y salidas. Si `usuario` da 1, el disparador funcionó.

Y para verificar que el administrador quedó enlazado:

```sql
SELECT nombre, correo, auth_id IS NOT NULL AS enlazado FROM administrador;
```

La columna `enlazado` tiene que decir `true`.

---

## Qué cambia respecto a la demo actual

| Antes | Ahora |
|---|---|
| Los datos vivían en cada navegador | Viven en la nube, compartidos |
| La app y el panel no se veían entre sí | Una ruta publicada en el panel le aparece al pasajero |
| Contraseñas guardadas en el navegador | Las maneja Supabase, con hash |
| Recuperar contraseña era simulado | Supabase manda correos de verdad |
| Los asientos ocupados eran inventados | Salen de los tiquetes realmente vendidos |

---

## Cuando termines

Pasame estos dos datos y conecto la app:

```
Project URL:  https://xxxxx.supabase.co
anon key:     eyJhbGci...
```

Y recordá: la clave `service_role` no me la pases ni la pongas en el repositorio.
