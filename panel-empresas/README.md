# Syncro Admin — Panel de empresas

Panel web de gestión para las empresas autobuseras que contratan Syncro. Es el lado B2B del sistema: acá la empresa publica sus rutas, define el precio de los tiquetes, registra su flota y sus choferes, y programa las salidas del día.

Los pasajeros consumen esta información desde la app móvil (proyecto `syncro-proyecto`).

---

## Por qué es panel web y no app móvil

La empresa necesita ver muchos datos a la vez: tablas de flota, horarios completos del día, ocupación por salida. Eso pide pantalla grande. El pasajero, en cambio, necesita algo rápido y en movimiento, por eso su lado sí es app móvil.

Esta separación es la que se justificó en la propuesta de la semana 4.

---

## Acceso

```
Correo:      admin@transportescr.com
Contraseña:  admin123456
```

Entra como **Transportes Unidos del Valle**, una empresa de ejemplo con 5 rutas, 5 unidades y 5 choferes ya cargados.

---

## Qué incluye

### Resumen
Cómo va el día: rutas activas, salidas programadas, cuántas están sin asignar, y lo vendido hasta el momento. Debajo, las próximas salidas con su ocupación y los últimos reportes de pasajeros.

### Horarios
La pantalla principal de la operación. Las salidas del día cuelgan de una línea de tiempo, de la primera a la última. Cada una muestra ruta, unidad asignada, chofer y ocupación.

**Las salidas sin bus o sin chofer quedan marcadas en ámbar**, porque son las que el despachador tiene que resolver antes de que llegue la hora. Las que ya salieron se atenúan.

Desde acá se programa una salida nueva, se asigna unidad y chofer, se cambia la hora o se cancela.

### Rutas y precios
Alta y edición de rutas: origen, destino, paradas en orden, frecuencia, duración y **precio del tiquete**. Una ruta pausada deja de aparecer en la app y no genera salidas.

### Flota
Unidades con placa, modelo, año, capacidad y estado. La capacidad de cada bus limita cuántos tiquetes se pueden vender en esa salida. Si una unidad pasa a taller, se libera automáticamente de las salidas que tenía asignadas.

### Choferes
Personal con licencia, teléfono y disponibilidad. Solo los disponibles aparecen al asignar una salida. Igual que con la flota, marcar a alguien en incapacidad lo libera de sus salidas.

### Reportes de pasajeros
Las incidencias que llegan desde la app: retrasos, unidades llenas y fallas mecánicas. El menú muestra cuántas están sin ver.

### Datos de la empresa
Nombre comercial, cédula jurídica y contacto. También permite restablecer los datos de ejemplo.

---

## Cómo ejecutarlo

1. Abrí VS Code → **Archivo → Abrir carpeta** → elegí `syncro-admin`.
2. Instalá la extensión **Live Server** (Ctrl+Shift+X → buscar "Live Server").
3. Clic derecho en `index.html` → **Open with Live Server**.

También funciona abriendo `index.html` con doble clic: no necesita servidor.

> Es un panel de escritorio. Se adapta a pantallas pequeñas, pero está pensado para verse en computadora.

---

## Estructura

```
syncro-admin/
├── index.html              Las 7 vistas del panel
├── css/estilos.css         Estilos y paleta de marca
├── assets/icons/           Logo e íconos
└── js/
    ├── almacenamiento.js   Guardar y leer del navegador
    ├── datos.js            Datos de ejemplo de la empresa
    ├── estado.js           Estado y generación de salidas
    ├── utilidades.js       Formato, avisos, buscadores
    ├── modal.js            Ventana de alta y edición
    ├── navegacion.js       Cambio entre vistas
    ├── auth.js             Acceso al panel
    ├── panel-resumen.js
    ├── panel-horarios.js   El riel de despacho
    ├── panel-rutas.js
    ├── panel-flota.js
    ├── panel-choferes.js
    ├── panel-reportes.js
    ├── panel-empresa.js
    └── app.js              Eventos y arranque (siempre de último)
```

El orden de carga importa: cada archivo usa lo que definió el anterior. Si agregás uno nuevo, sumalo a la lista de `<script>` respetando esa dependencia, y dejá `app.js` de último.

---

## Un formulario, una ventana

Todas las pantallas de alta y edición usan la misma ventana modal (`modal.js`). Se le pasa la lista de campos y ella arma el formulario:

```javascript
abrirModal({
  titulo: 'Nueva ruta',
  campos: [
    { id: 'ru-origen', etiqueta: 'Origen', tipo: 'texto', ancho: 'mitad' },
    { id: 'ru-precio', etiqueta: 'Precio (₡)', tipo: 'numero' },
  ],
  alGuardar: () => { /* devolver false deja la ventana abierta */ },
});
```

Por eso agregar una pantalla nueva de mantenimiento es corto: se definen los campos y la validación, no se vuelve a escribir el formulario.

---

## Límites de esta versión

- **Este panel todavía no está conectado a la base.** Guarda todo en el navegador. La app de pasajeros ya trabaja contra Supabase (PostgreSQL); conectar el panel a la misma base es la siguiente etapa, replicando el patrón `config.js` + `api.js` que usa la app.
- **Los datos de ejemplo se generan al abrir**, incluyendo las salidas del día y las ventas simuladas.
- **Una sola empresa.** El acceso valida contra la empresa de ejemplo; el sistema multiempresa llega con el backend.

## Siguientes pasos

1. Backend compartido entre el panel y la app de pasajeros.
2. Cuentas por empresa, con roles (administrador y despachador).
3. Validación de tiquetes: que el escaneo del QR en el bus descuente contra la ocupación real de la salida.
4. Reportes exportables de ventas por ruta y por período.
