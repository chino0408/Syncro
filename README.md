# Syncro

Plataforma digital de transporte público para Costa Rica.

Proyecto integrador — Universidad Invenio, carrera de TICE.

---

## Qué hay en este repositorio

| Carpeta | Qué contiene |
|---|---|
| `app-pasajeros/` | App móvil para el pasajero: consulta rutas, compra tiquetes con QR |
| `panel-empresas/` | Panel web para las empresas autobuseras: rutas, precios, flota, choferes y horarios |
| `documentacion/` | Diagramas de flujo, lámina de marca, wireframes y documentos del curso |

Los dos productos comparten la misma identidad visual pero se usan en contextos distintos: el pasajero necesita algo rápido y en movimiento, la empresa necesita ver muchos datos a la vez.

---

## Cómo empezar

No hace falta instalar nada ni compilar. Es HTML, CSS y JavaScript sin dependencias.

### 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/syncro.git
cd syncro
```

Reemplazá `USUARIO` por el usuario de GitHub donde esté el repo.

### 2. Abrirlo en VS Code

```bash
code .
```

O desde VS Code: **Archivo → Abrir carpeta** y elegí la carpeta `syncro`.

### 3. Levantarlo

Instalá la extensión **Live Server** (Ctrl+Shift+X, buscar "Live Server", la de Ritwick Dey).

Después, clic derecho sobre el `index.html` que quieras abrir:

- `app-pasajeros/index.html` → la app del pasajero
- `panel-empresas/index.html` → el panel de la empresa

Y elegí **Open with Live Server**.

> Si el navegador da `ERR_EMPTY_RESPONSE`, escribí la dirección a mano con `http://localhost:5500/...` en vez de `127.0.0.1`. Chrome a veces fuerza HTTPS sobre esa IP.

---

## Cuentas de prueba

**App de pasajeros**
```
Correo:      demo@syncro.cr
Contraseña:  123456
```

**Panel de empresas**
```
Correo:      admin@transportescr.com
Contraseña:  admin123
```

---

## Cómo trabajar en equipo

Para no pisarse el trabajo, cada quien trabaja en su propia rama y después se junta todo en `main`.

### Antes de empezar a trabajar

```bash
git checkout main
git pull
git checkout -b nombre-de-lo-que-vas-a-hacer
```

Ejemplos de nombres de rama: `responsive-app`, `recuperar-contrasena`, `geolocalizacion`.

### Mientras trabajás

```bash
git add .
git commit -m "Describí en una línea qué cambiaste"
git push -u origin nombre-de-tu-rama
```

### Cuando terminaste

En GitHub aparece un botón para abrir un **Pull Request**. Lo abrís, alguien más lo revisa, y se junta a `main`.

### Reglas del equipo

- No trabajar directamente en `main`.
- Hacer `git pull` antes de empezar, para partir de lo último.
- Un commit por cambio con sentido, no uno gigante al final del día.
- Si dos personas tocan el mismo archivo, avisar antes.

---

## Estructura del código

Las dos apps siguen la misma organización:

```
app/
├── index.html          Las pantallas
├── css/estilos.css     Estilos y paleta de marca
├── assets/icons/       Logo e íconos
└── js/                 Un archivo por responsabilidad
```

**El orden de carga importa.** Los `<script>` del `index.html` se cargan en orden y cada archivo usa lo que definió el anterior. Si agregás uno nuevo, sumalo respetando esa dependencia y dejá `app.js` siempre de último, porque es el que conecta los eventos y arranca todo.

---

## Identidad visual

| Rol | Nombre | HEX |
|---|---|---|
| Principal | Cian Eléctrico | `#1DCDF1` |
| Secundario | Cian Oscuro | `#10B0D4` |
| Fondo | Gris Azulado | `#163649` |
| Acento oscuro | Negro Grafito | `#0B101B` |
| Texto | Blanco Nieve | `#FFFFFF` |

**Tipografías:** Poppins SemiBold para títulos, Inter Regular para interfaz y cuerpo.

La lámina completa está en `documentacion/marca/`.

---

## Estado actual

### Funcionando

- App de pasajeros con las 12 pantallas navegables
- Panel de empresas con las 7 vistas y gestión completa
- Registro, inicio de sesión y cierre de sesión en ambas
- Compra de tiquetes con generación de QR
- Gestión de rutas, precios, flota, choferes y horarios

### En camino

- Diseño adaptable a distintos tamaños de pantalla
- Recuperación de contraseña
- Geolocalización real
- Base de datos y backend compartido
- Instalación como app en el teléfono

### Simulado por ahora

- **El pago.** No hay pasarela real; 1 de cada 8 intentos falla a propósito para poder mostrar el camino de error.
- **El código QR.** Es un patrón visual, todavía no lo lee un escáner.
- **El mapa.** Es un esquema dibujado, sin geolocalización real.
- **Los datos.** Se guardan en el navegador. El panel y la app todavía no comparten información.
- **El logo.** El archivo en `assets/icons/logo.svg` es provisional.

---

## Equipo

| Integrante | Rol |
|---|---|
| [Completar] | [Completar] |

---

## Curso

Universidad Invenio · Carrera de Tecnología de la Información y Comunicación Empresarial (TICE)
