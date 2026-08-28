/* Syncro — mapa.js
   Mapas y geolocalización.

   Usa Leaflet con teselas de OpenStreetMap: es gratis y no pide
   clave de API. Si la librería no carga (por ejemplo sin internet),
   se dibuja el esquema en SVG de siempre, así la app nunca queda
   con un hueco en blanco. */

const TESELAS = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATRIBUCION = '&copy; OpenStreetMap &copy; CARTO';

let mapas = {};   // guardamos los mapas creados, por id de contenedor

function hayLeaflet() {
  return typeof L !== 'undefined' && L && typeof L.map === 'function';
}

/* Crea o reutiliza un mapa en el contenedor indicado */
function crearMapa(idContenedor, centro, zoom) {
  const nodo = document.getElementById(idContenedor);
  if (!nodo) return null;

  if (mapas[idContenedor]) {
    mapas[idContenedor].remove();
    delete mapas[idContenedor];
  }
  nodo.innerHTML = '';

  const mapa = L.map(nodo, {
    center: centro,
    zoom: zoom,
    zoomControl: false,
    attributionControl: true,
  });
  L.tileLayer(TESELAS, { attribution: ATRIBUCION, maxZoom: 19 }).addTo(mapa);
  L.control.zoom({ position: 'bottomright' }).addTo(mapa);

  mapas[idContenedor] = mapa;
  // El contenedor cambia de tamaño al mostrarse la pantalla
  setTimeout(() => mapa.invalidateSize(), 120);
  return mapa;
}

/* Marcador redondo con el color de la marca */
function marcadorPunto(color, tamano) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${tamano}px;height:${tamano}px;border-radius:50%;
           background:${color};border:2px solid #0B101B;
           box-shadow:0 0 0 2px ${color}66"></span>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
  });
}

function marcadorUsuario() {
  return L.divIcon({
    className: '',
    html: `<span class="pin-usuario"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/* ---------- Mapa del recorrido de una ruta ---------- */
function dibujarRutaEnMapa(idContenedor, ruta) {
  const puntos = ruta.paradas
    .map(p => ({ nombre: p, coord: coordenadasDe(p) }))
    .filter(p => p.coord);

  if (!hayLeaflet() || puntos.length < 2) {
    const nodo = document.getElementById(idContenedor);
    if (nodo) nodo.innerHTML = mapaSVG(ruta, false);
    return;
  }

  const mapa = crearMapa(idContenedor, puntos[0].coord, 10);
  if (!mapa) return;

  L.polyline(puntos.map(p => p.coord), {
    color: '#1DCDF1', weight: 4, opacity: .9, lineJoin: 'round',
  }).addTo(mapa);

  puntos.forEach((p, i) => {
    const extremo = i === 0 || i === puntos.length - 1;
    L.marker(p.coord, { icon: marcadorPunto(extremo ? '#1DCDF1' : '#10B0D4', extremo ? 16 : 11) })
      .addTo(mapa)
      .bindPopup(`<strong>${p.nombre}</strong>`);
  });

  mapa.fitBounds(L.latLngBounds(puntos.map(p => p.coord)), { padding: [28, 28] });
}

/* ---------- Distancia entre dos coordenadas, en kilómetros ---------- */
function distanciaKm(a, b) {
  const R = 6371;
  const rad = x => (x * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/* Las paradas más cercanas a una posición, con su distancia */
function paradasCercanas(posicion, cuantas) {
  const vistas = new Set();
  const lista = [];

  RUTAS.forEach(ruta => {
    ruta.paradas.forEach(nombre => {
      if (vistas.has(nombre)) return;
      const coord = coordenadasDe(nombre);
      if (!coord) return;
      vistas.add(nombre);
      lista.push({ nombre, coord, km: distanciaKm(posicion, coord) });
    });
  });

  return lista.sort((a, b) => a.km - b.km).slice(0, cuantas || 3);
}

/* ---------- Pedir la ubicación al dispositivo ---------- */
/* Devuelve una promesa con [lat, lng] o un error con mensaje ya
   traducido, para que la pantalla solo tenga que mostrarlo. */
function pedirUbicacion() {
  return new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) {
      return rechazar(new Error('Tu navegador no permite compartir la ubicación.'));
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolver({
        coord: [pos.coords.latitude, pos.coords.longitude],
        precision: pos.coords.accuracy,
      }),
      err => {
        const mensajes = {
          1: 'No nos diste permiso para ver tu ubicación. Podés activarlo desde los ajustes del navegador.',
          2: 'No pudimos determinar tu ubicación. Revisá que el GPS esté encendido.',
          3: 'La ubicación tardó demasiado. Probá de nuevo.',
        };
        rechazar(new Error(mensajes[err.code] || 'No pudimos obtener tu ubicación.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/* ---------- Esquema de respaldo, sin datos geográficos ----------
   Se usa cuando Leaflet no está disponible. */
function mapaSVG(ruta, soloUbicacion) {
  const ancho = 400, alto = 190;

  let lineas = '';
  for (let x = 0; x <= ancho; x += 40) lineas += `<line x1="${x}" y1="0" x2="${x}" y2="${alto}" stroke="#1DCDF1" stroke-opacity="0.06"/>`;
  for (let y = 0; y <= alto; y += 40) lineas += `<line x1="0" y1="${y}" x2="${ancho}" y2="${y}" stroke="#1DCDF1" stroke-opacity="0.06"/>`;

  if (soloUbicacion) {
    return `<svg class="mapa" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMid slice">
      ${lineas}
      <circle cx="200" cy="95" r="6" fill="#1DCDF1" class="pulso"/>
      <circle cx="200" cy="95" r="8" fill="#1DCDF1"/>
      <circle cx="200" cy="95" r="14" fill="none" stroke="#1DCDF1" stroke-opacity=".45"/>
      <text x="200" y="128" fill="#8CA3B3" font-size="11" text-anchor="middle" font-family="Inter, sans-serif">Estás aquí</text>
    </svg>`;
  }

  const n = ruta.paradas.length;
  const puntos = ruta.paradas.map((p, i) => {
    const x = 42 + (i * (ancho - 84)) / (n - 1);
    const y = 62 + Math.sin(i * 1.25) * 42;
    return { x, y, nombre: p };
  });

  const trazo = puntos.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');

  const marcas = puntos.map((p, i) => {
    const esExtremo = i === 0 || i === n - 1;
    return `
      <circle cx="${p.x}" cy="${p.y}" r="${esExtremo ? 7 : 4.5}" fill="${esExtremo ? '#1DCDF1' : '#163649'}" stroke="#1DCDF1" stroke-width="2"/>
      ${esExtremo ? `<text x="${p.x}" y="${p.y + (p.y > 90 ? 22 : -14)}" fill="#FFFFFF" font-size="10.5" text-anchor="middle" font-family="Inter, sans-serif">${p.nombre.split(' (')[0]}</text>` : ''}`;
  }).join('');

  return `<svg class="mapa" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMid slice">
    ${lineas}
    <path d="${trazo}" fill="none" stroke="#10B0D4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    ${marcas}
  </svg>`;
}
