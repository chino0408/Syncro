# Base de datos de Syncro

Modelo relacional en PostgreSQL. Probado en PostgreSQL 16 y compatible con Supabase.

| Archivo | Qué contiene |
|---|---|
| `modelo-entidad-relacion.drawio` | Diagrama entidad-relación, abrir en draw.io |
| `01-esquema.sql` | Tipos, tablas, restricciones, índices y vistas |
| `02-datos-ejemplo.sql` | Datos de prueba que reproducen la demo |

---

## Cómo cargarla en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto. Guardá bien la contraseña de la base, no se puede recuperar.
2. En el menú izquierdo: **SQL Editor** → **New query**.
3. Pegá el contenido de `01-esquema.sql` y ejecutá con **Run**.
4. Nueva consulta, pegá `02-datos-ejemplo.sql` y ejecutá.
5. Andá a **Table Editor**: deberías ver las 17 tablas con datos.

Para empezar de cero en cualquier momento, ejecutá antes:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## Las 17 tablas

### Empresas y personas

| Tabla | Qué guarda |
|---|---|
| `empresa` | Autobuseras que contratan Syncro |
| `administrador` | Quien entra al panel web, pertenece a una empresa |
| `usuario` | Pasajeros de la app móvil |

### Rutas

| Tabla | Qué guarda |
|---|---|
| `parada` | Puntos físicos con sus coordenadas |
| `ruta` | La plantilla del recorrido |
| `ruta_parada` | Qué paradas tiene cada ruta y en qué orden |

### Flota

| Tabla | Qué guarda |
|---|---|
| `bus` | Unidades de cada empresa |
| `asiento` | Los asientos de cada bus, con su tipo |
| `chofer` | Personal de conducción |

### Operación

| Tabla | Qué guarda |
|---|---|
| `viaje` | Una salida concreta, con bus y chofer asignados |
| `compra` | Una transacción, puede cubrir varios asientos |
| `tiquete` | Un tiquete por asiento, con su código QR |
| `metodo_pago` | Medios de pago guardados por el pasajero |

### Interacción

| Tabla | Qué guarda |
|---|---|
| `ruta_favorita` | Rutas marcadas con estrella |
| `incidencia` | Retrasos y fallas reportadas desde la app |
| `notificacion` | Avisos de compra y recordatorios de viaje |
| `solicitud_soporte` | Reportes enviados desde la pantalla de Ayuda |

---

## Tres decisiones de diseño que conviene poder explicar

### 1. `ruta` y `viaje` son cosas distintas

Es la distinción más importante del modelo, y el error más común es confundirlas.

- **`ruta`** es la plantilla: *San José → Cartago, ₡650, sale cada 15 minutos*.
- **`viaje`** es una salida concreta: *hoy a las 2:30 p.m., bus SJB-1204, chofer Marvin*.

El tiquete se ata al **viaje**, no a la ruta. Si estuviera atado a la ruta no habría forma de saber en qué salida viaja la persona, ni de controlar cuántos asientos quedan.

Por eso `viaje.bus_id` puede ser NULL: la salida se programa antes de asignarle unidad. Esas son las que el panel marca en ámbar.

### 2. `compra` y `tiquete` están separadas

Un pasajero puede comprar cinco asientos en una sola operación. Si todo estuviera en `tiquete`, los datos del pago (total, método, fecha) se repetirían cinco veces.

Separándolos:
- `compra` guarda una vez el pago.
- `tiquete` guarda un registro por asiento, cada uno con su código QR.

Esto es normalización: **un dato, un solo lugar**.

### 3. Las tablas asociativas llevan llave primaria compuesta

`ruta_parada`, `asiento` y `ruta_favorita` resuelven relaciones de muchos a muchos. Su llave primaria son dos columnas juntas:

```sql
PRIMARY KEY (ruta_id, parada_id)
```

`ruta_parada` además tiene un **atributo propio**: `orden`. Ese es el caso clásico donde la relación necesita guardar datos que no pertenecen a ninguna de las dos tablas — el orden de una parada no es propiedad de la parada ni de la ruta, sino de su combinación.

---

## Reglas de negocio que aplica la base

No dependen de la app: aunque alguien inserte datos a mano, la base los rechaza.

| Regla | Cómo se aplica |
|---|---|
| Un asiento no se vende dos veces en el mismo viaje | Índice único sobre `(viaje_id, numero_asiento)` |
| Un asiento cancelado vuelve a estar libre | El índice excluye los cancelados |
| Una ruta no puede tener el mismo origen y destino | `CHECK (origen <> destino)` |
| Los precios y duraciones son positivos | `CHECK (precio > 0)` y similares |
| El correo tiene forma de correo | `CHECK` con expresión regular |
| Dos paradas no ocupan la misma posición en una ruta | `UNIQUE (ruta_id, orden)` |
| No se repiten placas ni licencias | `UNIQUE` en esas columnas |
| Una ruta no tiene dos salidas a la misma hora | `UNIQUE (ruta_id, sale_en)` |
| Las coordenadas están en rango válido | `CHECK` sobre latitud y longitud |

Todas fueron probadas: al intentar violarlas, PostgreSQL rechaza la operación.

---

## Qué pasa al borrar

| Acción | Consecuencia | Por qué |
|---|---|---|
| Se borra una empresa | Se borran sus rutas, buses y choferes | `ON DELETE CASCADE` |
| Se borra un bus | Sus salidas quedan sin unidad, no se borran | `ON DELETE SET NULL` |
| Se borra un chofer | Igual: la salida queda sin chofer | `ON DELETE SET NULL` |
| Se intenta borrar un usuario con compras | No se permite | `ON DELETE RESTRICT` |
| Se borra una compra | Se borran sus tiquetes | `ON DELETE CASCADE` |

La lógica: **la información histórica no se pierde por borrar un recurso**. Que un bus salga de circulación no puede eliminar los viajes que hizo.

---

## Vistas incluidas

**`vista_ocupacion_viaje`** — Cada salida con su bus, chofer, cuántos asientos se vendieron y cuántos quedan. Es lo que alimenta el riel de despacho del panel.

```sql
SELECT * FROM vista_ocupacion_viaje ORDER BY sale_en;
```

**`vista_recorrido`** — Las paradas de cada ruta en orden, con coordenadas. Es lo que usa la app para dibujar el mapa.

```sql
SELECT * FROM vista_recorrido WHERE ruta_id = 1;
```

---

## Consultas de ejemplo

**Buscar rutas entre dos lugares**

```sql
SELECT origen, destino, precio, frecuencia_min
FROM ruta
WHERE origen = 'San José' AND destino = 'Cartago'
  AND estado = 'activa';
```

**Asientos ocupados de un viaje**, para pintar el bus

```sql
SELECT numero_asiento
FROM tiquete
WHERE viaje_id = 11 AND estado <> 'cancelado';
```

**Tiquetes de un pasajero**, del más próximo al menos próximo

```sql
SELECT v.sale_en, r.origen, r.destino, t.numero_asiento, t.codigo_qr
FROM tiquete t
JOIN compra c ON c.id = t.compra_id
JOIN viaje  v ON v.id = t.viaje_id
JOIN ruta   r ON r.id = v.ruta_id
WHERE c.usuario_id = 1 AND t.estado <> 'cancelado'
ORDER BY v.sale_en;
```

**Salidas sin asignar**, la alerta del panel

```sql
SELECT COUNT(*) FROM viaje
WHERE bus_id IS NULL OR chofer_id IS NULL;
```

**Ingresos por ruta**

```sql
SELECT r.origen, r.destino, COUNT(t.id) AS tiquetes, SUM(t.precio) AS total
FROM tiquete t
JOIN viaje v ON v.id = t.viaje_id
JOIN ruta  r ON r.id = v.ruta_id
WHERE t.estado <> 'cancelado'
GROUP BY r.id, r.origen, r.destino;
```

---

## Sobre las contraseñas

En `usuario` y `administrador` la columna se llama `clave_hash`, no `clave`. **Nunca se guarda la contraseña en texto plano.**

Los datos de ejemplo traen un marcador de posición que no sirve para entrar. Cuando conectemos la app, la autenticación la maneja Supabase Auth, que hace el hash con bcrypt automáticamente.

Lo mismo con `metodo_pago.referencia`: solo guarda los últimos cuatro dígitos de la tarjeta o el teléfono SINPE, nunca el número completo.

---

## Pendiente para el siguiente paso

- Políticas de seguridad a nivel de fila (RLS) en Supabase, para que cada usuario solo vea sus propios datos y cada empresa solo su operación.
- Conectar la app y el panel a la base.
- Autenticación real con Supabase Auth, que reemplaza el código de verificación simulado de la recuperación de contraseña.
