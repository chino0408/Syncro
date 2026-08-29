# Syncro — Demo funcional

Demo navegable de la app móvil de Syncro. Corre entera en el teléfono, sin servidor ni base de datos: los datos se guardan en el almacenamiento del navegador.

---

## Estructura del proyecto

```
syncro-proyecto/
│
├── index.html              ← Punto de entrada: las 12 pantallas
├── manifest.json           ← Datos de instalación como app (nombre, colores, ícono)
├── README.md
│
├── css/
│   └── estilos.css         ← Todos los estilos y la paleta de marca
│
├── assets/
│   └── icons/
│       ├── logo.png        ← LOGO OFICIAL (reemplazar, ver abajo)
│       ├── icon-512.png    ← Ícono de instalación en Android
│       └── icon-192.png
│
└── js/                     ← Un archivo por responsabilidad
    ├── almacenamiento.js       Guardar y leer datos del navegador
    ├── datos.js                Catálogo de rutas y métodos de pago
    ├── estado.js               Estado de la app y persistencia
    ├── utilidades.js           Formato de fechas, colones, avisos
    ├── navegacion.js           Cambio entre pantallas
    ├── auth.js                 Registro, inicio y cierre de sesión
    ├── mapa.js                 Dibujo del mapa esquemático
    ├── pantalla-home.js
    ├── pantalla-rutas.js
    ├── pantalla-detalle-ruta.js
    ├── pantalla-compra.js
    ├── pantalla-tiquetes.js    Lista de tiquetes y código QR
    ├── notificaciones.js
    ├── pantalla-perfil.js
    ├── ayuda.js
    └── app.js                  Eventos de clic y arranque
```

### El orden de carga importa

Los archivos JS se cargan en orden en `index.html` y cada uno usa lo que definió el anterior. Si agregás un archivo nuevo, sumalo a la lista de `<script>` **respetando la dependencia**: primero los que definen cosas (datos, estado, utilidades), después los que las usan (pantallas), y `app.js` siempre de último, porque es el que conecta los eventos y arranca la app.

---

## Cambiar el logo

El logo está en **un solo lugar**: `assets/icons/logo.png`. Reemplazá ese archivo por el logo oficial de la marca y se actualiza en toda la app.

Se usa en tres puntos, todos ya conectados a ese archivo:

1. La pantalla de bienvenida (`index.html`, etiqueta `<img class="marca-logo">`).
2. El ícono al instalar la app (`manifest.json`).
3. El ícono en Safari/iPhone (`<link rel="apple-touch-icon">`).

**Formato recomendado:** SVG, porque se ve nítido en cualquier tamaño. Si solo tenés PNG, usá uno de al menos 512×512 con fondo transparente, guardalo como `logo.png` y cambiá las tres referencias de `logo.png` a `logo.png`.

**Para los íconos de instalación en Android** hacen falta además `icon-512.png` e `icon-192.png` (cuadrados, con el fondo incluido, no transparente). Se pueden exportar desde el mismo archivo de diseño.

---

## Cómo abrirlo en VS Code

1. Abrí la carpeta `syncro-proyecto` con **Archivo → Abrir carpeta**.
2. Instalá la extensión **Live Server** (de Ritwick Dey).
3. Clic derecho sobre `index.html` → **Open with Live Server**.

Se abre en el navegador y se recarga solo cada vez que guardás un cambio.

> Se puede abrir el `index.html` con doble clic, pero conviene usar Live Server: algunas funciones del navegador (como la instalación de la app) solo funcionan sirviendo los archivos, no abriéndolos directo del disco.

---

## Qué hace la demo

- **Registro e inicio de sesión** con validación y manejo de errores.
- **Home** con la tarjeta de próximo viaje (o su estado vacío) y buscador de origen/destino.
- **Rutas**: buscador en tiempo real, pestañas Todas/Favoritas, favoritos con estrella, botón "Mi ubicación", y detalle con recorrido, paradas y horarios del día.
- **Compra**: resumen, método de pago, pago simulado (con caso de fallo) y generación del tiquete.
- **Tiquetes**: lista del viaje más próximo al menos próximo, con código QR e información del viaje.
- **Notificaciones**: aviso de compra completada y aviso automático 15 minutos antes de cada salida.
- **Perfil** con estadísticas y cierre de sesión.
- **Ayuda**: reportar un problema (con folio) e introducción a la app.

### Cuenta de prueba

```
Correo:      demo@syncro.cr
Contraseña:  123456
```

---

## Cómo correrlo en el teléfono

### Opción 1 — En la red local (para desarrollar)

Con la computadora y el teléfono en el mismo WiFi, desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Buscá la IP de tu computadora (`ipconfig` en Windows) y en el teléfono entrá a `http://192.168.X.X:8000`.

### Opción 2 — GitHub Pages (recomendada para la presentación)

Es gratis, da HTTPS, y con HTTPS el teléfono permite **instalar la app** con su ícono.

1. Creá un repositorio en GitHub y subí la carpeta completa.
2. Entrá a **Settings → Pages**.
3. En "Source" elegí la rama `main` y la carpeta `/ (root)`. Guardá.
4. Al minuto te da una dirección tipo `https://tuusuario.github.io/syncro-demo/`.

Desde el teléfono, abrí esa dirección y:

- **Android (Chrome)**: menú ⋮ → "Agregar a pantalla principal".
- **iPhone (Safari)**: botón Compartir → "Agregar a inicio".

---

## Límites de la demo

Cosas resueltas de forma simulada, para trabajarlas en las siguientes etapas:

- **El pago es falso.** Hay una espera de 1 segundo y 1 de cada 8 pagos falla a propósito, para poder mostrar el camino de error.
- **El QR es un patrón visual**, no un código escaneable. Para que un lector real lo lea hay que generar un QR estándar.
- **El mapa es un esquema dibujado**, no usa geolocalización ni datos geográficos reales.
- **Los datos viven en el teléfono.** Si se borran los datos del navegador, se pierden los tiquetes.
- **Las rutas son fijas**, escritas en `js/datos.js`. No hay panel de empresas todavía.

## Siguientes pasos sugeridos

1. QR real con una librería de generación de códigos.
2. Backend con Spring Boot + PostgreSQL para que los datos no vivan solo en el teléfono.
3. Mapa real con geolocalización del dispositivo.
4. Panel web B2B para que las empresas publiquen sus rutas.
