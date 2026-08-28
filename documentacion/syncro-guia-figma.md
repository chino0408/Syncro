# Syncro — Guía de construcción en Figma

Sprints 3 y 4 · Semanas 6 a 9 · Wireframes y mockups

---

## Configuración base

| Ajuste | Valor |
|---|---|
| Tamaño del marco | **390 × 844** (Frame → Phone → iPhone 14) |
| Márgenes laterales | 18 px |
| Espaciado base | 4 px (todos los valores son múltiplos: 4, 8, 12, 16, 24, 32) |
| Radio de esquina | 12 px tarjetas · 11 px campos · 16 px botones |
| Alto navegación inferior | 68 px + área segura |

**Rejilla:** con el marco seleccionado, panel derecho → *Layout grid* → Columns: 4, Margin 18, Gutter 16. Sirve para alinear, no se ve en la entrega.

---

## Cómo organizar el archivo

Creá **una página por sprint**, para que quede evidencia del proceso:

```
Página 1 · Wireframes      ← sprint 3 (semanas 6-7)
Página 2 · Mockups         ← sprint 4 (semanas 8-9)
Página 3 · Componentes     ← lo reutilizable
```

Dentro de cada página, ordená los marcos en filas por sección, siguiendo el orden de la lámina:

```
Fila 1   Acceso        Bienvenida · Registro
Fila 2   Principal     Home con viaje · Home vacío
Fila 3   Rutas         Listado · Detalle
Fila 4   Compra        Confirmar compra
Fila 5   Tiquetes      Listado · QR
Fila 6   Otros         Notificaciones · Perfil · Ayuda
```

Nombrá cada marco `01 Bienvenida`, `02 Registro`, etc. Los nombres aparecen en el prototipo y facilitan revisar con el profesor.

---

## Sprint 3 — Wireframes (semanas 6-7)

### Paleta de grises

Solo estos cinco valores. Nada de color todavía.

| Uso | Hex |
|---|---|
| Fondo del marco | `#FFFFFF` |
| Bordes y separadores | `#C9C9C4` |
| Bloques y texto secundario | `#DCDCD8` |
| Bloques fuertes, botones, texto principal | `#C2C2BC` |
| Anotaciones | `#3A3A38` |

### Convenciones

- **Texto** → rectángulo gris. El ancho sugiere el largo real del contenido: un título es más ancho y más alto que una línea de detalle.
- **Imagen, mapa o QR** → rectángulo con dos diagonales cruzadas.
- **Íconos** → cuadrado redondeado, sin dibujar el ícono.
- **Botón principal** → rectángulo relleno con una barra blanca al centro.
- **Botón secundario** → mismo rectángulo, solo borde.

No uses texto real ni Lorem Ipsum: en baja fidelidad el texto distrae de lo que se está evaluando, que es la estructura.

### Orden de trabajo recomendado

1. **Home con viaje** primero. Es la pantalla más densa y de ahí salen casi todos los componentes.
2. **Rutas** y **Detalle de ruta**, que reutilizan la fila de lista.
3. **Tiquetes** y **QR**.
4. **Bienvenida** y **Registro**, que comparten estructura.
5. **Notificaciones**, **Perfil** y **Ayuda**.
6. Al final los estados vacíos (Home sin viajes).

### Componentes a crear

Hacelos componentes de una vez (`Ctrl/Cmd + Alt + K`). En el sprint 4 les cambiás el estilo una sola vez y se actualizan las 12 pantallas.

| Componente | Dónde se usa |
|---|---|
| `barra-estado` | las 12 pantallas |
| `nav-inferior` | 9 pantallas (todas menos compra, bienvenida y registro) |
| `fila-lista` | rutas, tiquetes, horarios, notificaciones |
| `campo-formulario` | login, registro, buscadores, reporte |
| `boton-primario` / `boton-secundario` | todas |
| `tarjeta` | home, compra, QR, perfil |
| `encabezado-con-volver` | detalle, compra, QR, notificaciones, ayuda |

Usá **Auto Layout** (`Shift + A`) en filas, tarjetas y pilas de campos. Así, cuando cambies un texto o un tamaño, todo se reacomoda solo.

---

## Sprint 4 — Mockups (semanas 8-9)

Duplicá la página de wireframes y renombrala. Sobre esa copia aplicás la identidad, sin volver a dibujar nada.

### Estilos a crear primero

En Figma, panel derecho → *Styles* → crear estilos de color y de texto. Después se aplican con un clic.

**Color** (paleta oficial de Syncro):

| Nombre del estilo | Hex |
|---|---|
| `marca/cian` | `#1DCDF1` |
| `marca/cian-oscuro` | `#10B0D4` |
| `fondo/superficie` | `#163649` |
| `fondo/base` | `#0B101B` |
| `texto/principal` | `#FFFFFF` |
| `texto/tenue` | `#8CA3B3` |

**Texto** (Poppins SemiBold para títulos, Inter Regular para el resto):

| Nombre del estilo | Fuente | Tamaño |
|---|---|---|
| `titulo/pantalla` | Poppins SemiBold | 22 |
| `titulo/tarjeta` | Poppins Medium | 15 |
| `cuerpo/normal` | Inter Regular | 14 |
| `cuerpo/detalle` | Inter Regular | 12 |
| `etiqueta/superior` | Inter Medium | 11, mayúsculas, +0.08 em |

### Orden de trabajo

1. Crear todos los estilos de color y texto.
2. Aplicarlos a los **componentes**, no a las pantallas. Al ser componentes, el cambio se propaga solo.
3. Reemplazar los cuadrados de ícono por íconos reales.
4. Cambiar las barras grises por texto real (usá el contenido de la demo: rutas de Costa Rica, precios en colones).
5. Reemplazar los rectángulos con aspa por el mapa, el QR y el logo.
6. Revisar contraste: el texto tenue sobre fondo oscuro debe seguir siendo legible.

---

## Atajos que te van a servir

| Atajo | Qué hace |
|---|---|
| `Shift + A` | Auto Layout a la selección |
| `Ctrl/Cmd + Alt + K` | Crear componente |
| `Ctrl/Cmd + D` | Duplicar |
| `Alt` + arrastrar | Duplicar arrastrando |
| `Alt` + pasar el mouse | Ver distancias entre elementos |
| `Ctrl/Cmd + G` | Agrupar |

---

## Para la entrega

- **Wireframes:** exportá la página completa a PDF (*File → Export frames to PDF*) o compartí el enlace del archivo en modo *Can view*.
- **Mockups:** lo mismo, más el enlace del prototipo si ya conectaste las pantallas.
- Dejá visibles las anotaciones numeradas: muestran que cada decisión tiene una razón, no es solo dibujo.

Si el profesor pide justificar el diseño, la línea es: **cada pantalla sale de un diagrama de flujo**, y cada diagrama de flujo sale de la investigación del sprint 1. Ese encadenamiento es lo que se está evaluando.
