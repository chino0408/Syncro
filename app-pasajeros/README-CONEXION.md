# Conexión con la base de datos

La app ya no guarda nada en el navegador: todo vive en Supabase.

## Cómo está organizado

| Archivo | Qué hace |
|---|---|
| `js/config.js` | La dirección del proyecto y la clave pública |
| `js/api.js` | Todas las consultas a la base. El resto de la app no sabe que Supabase existe |
| `js/estado.js` | Copia local de lo que ya se descargó, para no consultar en cada repintado |

Si algún día se cambia de proveedor de base de datos, `api.js` es el único archivo que habría que reescribir.

## Sobre la clave

`config.js` contiene la clave **anon**, que está pensada para viajar en el navegador. No es un secreto: lo que protege la información son las políticas de seguridad por fila definidas en `03-auth-y-seguridad.sql`.

La clave **service_role** nunca debe aparecer en este proyecto: se salta todas las políticas.

## Qué cambió respecto a la demo local

| Antes | Ahora |
|---|---|
| Los datos vivían en cada navegador | Están en la nube, compartidos |
| Las contraseñas se guardaban en el navegador | Las maneja Supabase, con hash |
| Recuperar contraseña mostraba un código en pantalla | Supabase envía un correo real con un enlace |
| Los horarios se inventaban desde la hora actual | Salen de la tabla `viaje` |
| Los asientos ocupados eran aleatorios | Salen de los tiquetes realmente vendidos |
| El pago fallaba 1 de cada 8 veces a propósito | La compra se registra de verdad en la base |

## Una regla de negocio que ahora la base garantiza

Si dos personas eligen el mismo asiento al mismo tiempo, solo una compra prospera. La base rechaza la segunda por el índice único sobre `(viaje_id, numero_asiento)`, y la app muestra: *"Alguien acaba de comprar uno de esos asientos. Elegí otros."*

Eso no se podía hacer con datos en el navegador.

## Mantener las salidas al día

Los datos de ejemplo generan salidas para los próximos siete días. Cuando se acerquen a agotarse, volvé a ejecutar `04-salidas-proximas.sql` en el editor SQL de Supabase. Se puede correr las veces que haga falta: no duplica las que ya existen.
