/* Syncro — pantalla-asientos.js
   Selección de asientos. Va entre la elección del horario y el pago.

   El bus se ve desde arriba: 12 filas de 2 asientos, pasillo,
   2 asientos. La numeración sigue la convención de los buses:
   el par izquierdo va de izquierda a derecha y el derecho al revés,
   de manera que los números crecen hacia el pasillo.

   Fila 1:  1  2  |  4  3
   Fila 2:  5  6  |  8  7   <- los cuatro accesibles
   Fila 3:  9 10  | 12 11 */

const CAPACIDAD_BUS = 48;              // 12 filas de 4
const ASIENTOS_ACCESIBLES = [5, 6, 7, 8];
const MAXIMO_POR_COMPRA = 8;

/* Qué asientos ya están vendidos en una salida.
   Se calcula a partir de la hora, así el resultado es siempre el
   mismo para el mismo viaje y no cambia al repintar la pantalla. */
function asientosVendidos(horaSalida) {
  let semilla = 0;
  const texto = String(horaSalida);
  for (let i = 0; i < texto.length; i++) {
    semilla = (semilla * 31 + texto.charCodeAt(i)) >>> 0;
  }
  const aleatorio = () => {
    semilla = (semilla * 1664525 + 1013904223) >>> 0;
    return semilla / 4294967296;
  };

  // Los asientos accesibles nunca se venden: quedan siempre
  // disponibles para quien los necesite.
  const vendibles = CAPACIDAD_BUS - ASIENTOS_ACCESIBLES.length;
  const vendidos = new Set();
  const cuantos = Math.floor(vendibles * (0.25 + aleatorio() * 0.35));

  while (vendidos.size < cuantos) {
    const n = 1 + Math.floor(aleatorio() * CAPACIDAD_BUS);
    if (!esAccesible(n)) vendidos.add(n);
  }
  return vendidos;
}

function esAccesible(numero) {
  return ASIENTOS_ACCESIBLES.includes(numero);
}

/* Se llama al tocar un horario en el detalle de la ruta */
function elegirHorario(indice) {
  const ruta = RUTAS.find(r => r.id === estado.rutaAbierta);
  const salida = estado._salidas[indice];

  estado.compra = {
    rutaId: ruta.id,
    hora: salida.hora,
    precio: ruta.precio,
    asientos: [],
  };
  estado._vendidos = asientosVendidos(salida.hora);
  ir('asientos');
}

function pintarAsientos() {
  const c = estado.compra;
  if (!c) return ir('rutas');
  const ruta = RUTAS.find(r => r.id === c.rutaId);
  const vendidos = estado._vendidos;

  $('#asientos-titulo').textContent = ruta.origen + ' → ' + ruta.destino;
  $('#asientos-sub').textContent = `${fechaRelativa(c.hora)} · ${horaCorta(c.hora)}`;

  const libres = CAPACIDAD_BUS - vendidos.size;
  $('#asientos-disponibles').textContent =
    `${libres} de ${CAPACIDAD_BUS} asientos disponibles`;

  // Cada fila: los dos de la izquierda en orden, los dos de la
  // derecha invertidos, como en los buses reales.
  const filas = [];
  for (let n = 1; n <= CAPACIDAD_BUS; n += 4) {
    filas.push({ izq: [n, n + 1], der: [n + 3, n + 2] });
  }

  $('#bus-asientos').innerHTML = filas.map(fila => `
    <div class="bus-fila">
      <div class="bus-par">
        ${asientoHTML(fila.izq[0], vendidos)}
        ${asientoHTML(fila.izq[1], vendidos)}
      </div>
      <div class="bus-pasillo"></div>
      <div class="bus-par">
        ${asientoHTML(fila.der[0], vendidos)}
        ${asientoHTML(fila.der[1], vendidos)}
      </div>
    </div>`).join('');

  actualizarResumenAsientos();
}

/* Dibujo de una butaca vista desde arriba: respaldo, cojín y
   dos apoyabrazos. Los colores vienen de las variables CSS que
   define cada estado. */
function siluetaAsiento() {
  return `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="0"  y="13" width="6"  height="24" rx="3"
            fill="var(--borde)"/>
      <rect x="34" y="13" width="6"  height="24" rx="3"
            fill="var(--borde)"/>
      <rect x="4"  y="2"  width="32" height="13" rx="5"
            fill="var(--relleno)" stroke="var(--borde)" stroke-width="1.5"/>
      <rect x="5"  y="13" width="30" height="25" rx="6"
            fill="var(--relleno)" stroke="var(--borde)" stroke-width="1.5"/>
    </svg>`;
}

function iconoSillaRuedas() {
  return `
    <span class="icono-acc">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="10" cy="3" r="1.6"/>
        <path d="M10 7v6h5l3 6"/>
        <path d="M10 10H7"/>
        <circle cx="11" cy="16" r="5.4"/>
      </svg>
    </span>`;
}

function asientoHTML(numero, vendidos) {
  if (numero > CAPACIDAD_BUS) return '<span class="asiento vacio"></span>';

  const estaVendido = vendidos.has(numero);
  const accesible = esAccesible(numero);
  const elegido = estado.compra.asientos.includes(numero);

  let clase = 'asiento';
  if (estaVendido) clase += ' vendido';
  else if (accesible) clase += ' accesible';
  else clase += ' libre';
  if (elegido) clase += ' elegido';

  const etiqueta = estaVendido
    ? `Asiento ${numero}, ocupado`
    : `Asiento ${numero}${accesible ? ', reservado para personas con discapacidad' : ''}${elegido ? ', seleccionado' : ''}`;

  // En los accesibles libres se muestra el ícono en vez del número
  const contenido = (accesible && !estaVendido && !elegido)
    ? iconoSillaRuedas()
    : `<span class="num">${numero}</span>`;

  return `
    <button class="${clase}"
            ${estaVendido ? 'disabled' : `data-asiento="${numero}"`}
            aria-label="${etiqueta}"
            aria-pressed="${elegido ? 'true' : 'false'}">
      ${siluetaAsiento()}
      ${contenido}
    </button>`;
}

function alternarAsiento(numero) {
  const n = Number(numero);
  const elegidos = estado.compra.asientos;
  const posicion = elegidos.indexOf(n);

  if (posicion >= 0) {
    elegidos.splice(posicion, 1);
  } else {
    if (elegidos.length >= MAXIMO_POR_COMPRA) {
      return toast(`Podés comprar hasta ${MAXIMO_POR_COMPRA} asientos por vez`);
    }
    elegidos.push(n);
    if (esAccesible(n)) {
      toast('Asiento reservado para personas con discapacidad');
    }
  }

  elegidos.sort((a, b) => a - b);
  pintarAsientos();
}

/* Barra inferior con el conteo y el total */
function actualizarResumenAsientos() {
  const c = estado.compra;
  const cantidad = c.asientos.length;
  const total = cantidad * c.precio;

  const detalle = $('#asientos-detalle');
  const boton = $('#btn-continuar-asientos');

  if (!cantidad) {
    detalle.innerHTML = `
      <div class="ar-etq">Ningún asiento elegido</div>
      <div class="ar-sub">Tocá los asientos verdes para elegirlos</div>`;
    boton.disabled = true;
    boton.textContent = 'Elegí un asiento';
    return;
  }

  detalle.innerHTML = `
    <div class="ar-etq">${cantidad} ${cantidad === 1 ? 'asiento' : 'asientos'}: ${c.asientos.join(', ')}</div>
    <div class="ar-total">${colones(total)}</div>`;
  boton.disabled = false;
  boton.textContent = cantidad === 1 ? 'Continuar al pago' : `Continuar con ${cantidad} asientos`;
}

function continuarAlPago() {
  if (!estado.compra.asientos.length) return;
  estado.pagoElegido = estado.metodosPago.length ? estado.metodosPago[0].id : null;
  ir('compra');
}
