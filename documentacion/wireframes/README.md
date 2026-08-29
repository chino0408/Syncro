# Wireframes de Syncro

`wireframes.html` contiene las 22 pantallas de la app de pasajeros en baja fidelidad, más una portada y una página de referencia: 24 páginas en total.

## Cómo verlo

Abrilo con doble clic, o con Live Server desde VS Code.

## Cómo llevarlo a Canva

El archivo está preparado para importarse: cada pantalla lleva la marca `data-document-role="page"`, así que Canva la convierte en una página editable del documento, con su nombre.

Para importarlo hace falta que el archivo esté publicado en una dirección web. Como el repositorio se despliega en Netlify, queda disponible en:

```
https://TU-SITIO.netlify.app/documentacion/wireframes/wireframes.html
```

Con esa dirección, Canva lo importa como un documento de 24 páginas.

## Qué incluye

| # | Pantalla | Sección |
|---|---|---|
| 01 | Bienvenida — Iniciar sesión | Acceso |
| 02 | Registro | Acceso |
| 03 | Home — con próximo viaje | Principal |
| 04 | Home — sin viajes | Principal |
| 05 | Rutas — listado | Rutas |
| 06 | Detalle de ruta | Rutas |
| 07 | Selección de asientos | Compra |
| 08 | Confirmar compra | Compra |
| 09 | Tiquetes — listado | Tiquetes |
| 10 | Tiquete — código QR | Tiquetes |
| 11 | Notificaciones | Avisos |
| 12 | Perfil | Cuenta |
| 13 | Mi ubicación | Rutas |
| 14 | Ayuda | Soporte |
| 15 | Ayuda — reportar un problema | Soporte |
| 16 | Ayuda — reporte enviado | Soporte |
| 17 | Ayuda — comenzar | Soporte |
| 18 | Iniciar sesión — error | Estados |
| 19 | Registro — error | Estados |
| 20 | Rutas — sin resultados | Estados |
| 21 | Pago fallido | Estados |
| 22 | Tiquetes y notificaciones — vacíos | Estados |

## Especificaciones

- Marco: 390 × 844 px, la proporción real de un teléfono
- Márgenes laterales: 18 px
- Espaciado base: múltiplos de 4 px
- Botones y campos: 35 px de alto
- Barra de navegación: 55 px

Solo se usan cuatro grises: `#FFFFFF` fondo, `#C9C9C4` bordes, `#DCDCD8` bloques, `#C2C2BC` elementos fuertes. Sin color de marca ni texto real: en esta etapa se evalúa la estructura, no el aspecto.

## Cómo se generó

Las pantallas se arman con un vocabulario de piezas reutilizables (campo, botón, fila, tarjeta, mapa, estado vacío). Eso garantiza que todas usen las mismas medidas, que era el problema de generarlas una por una.

Cada pantalla lleva anotaciones numeradas que explican la decisión de estructura, no solo el dibujo. Eso es lo que suele pesar en la evaluación.
