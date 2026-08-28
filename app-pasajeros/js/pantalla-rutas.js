/* Syncro — pantalla-rutas.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 8. Pantalla: Rutas ---------- */
function rutasVisibles() {
  let lista = RUTAS;
  if (estado.tabRutas === 'favoritas') {
    lista = lista.filter(r => estado.favoritas.includes(r.id));
  }
  const f = estado.filtro.trim().toLowerCase();
  if (f) {
    lista = lista.filter(r =>
      (r.origen + ' ' + r.destino).toLowerCase().includes(f) ||
      r.paradas.some(p => p.toLowerCase().includes(f))
    );
  }
  return lista;
}

function pintarRutas() {
  const cont = $('#rutas-lista');
  const lista = rutasVisibles();

  if (!lista.length) {
    cont.innerHTML = estado.tabRutas === 'favoritas'
      ? plantillaVacio('estrella', 'Todavía no tenés favoritas', 'Tocá la estrella de una ruta para tenerla siempre a mano.')
      : plantillaVacio('busqueda', 'Sin resultados', 'Probá con otro nombre de ruta o de parada.');
    return;
  }

  cont.innerHTML = lista.map(r => {
    const esFav = estado.favoritas.includes(r.id);
    return `
      <div class="fila" data-abrir-ruta="${r.id}">
        <div class="fila-izq">
          <div class="fila-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12"/><path d="M2 17h20M6 21v-2M18 21v-2M4 11h16"/></svg>
          </div>
          <div style="min-width:0">
            <div class="fila-titulo">${r.origen} → ${r.destino}</div>
            <div class="fila-sub">Sale cada ${r.frecuencia} min · ${colones(r.precio)}</div>
          </div>
        </div>
        <button class="estrella ${esFav ? 'activa' : ''}" data-fav="${r.id}" aria-label="${esFav ? 'Quitar de favoritas' : 'Agregar a favoritas'}">
          <svg viewBox="0 0 24 24" fill="${esFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
        </button>
      </div>`;
  }).join('');
}

function plantillaVacio(icono, titulo, texto) {
  const iconos = {
    estrella: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    busqueda: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    tiquete: '<path d="M2 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>',
    campana: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    tarjeta: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  };
  return `
    <div class="vacio">
      <span class="vacio-icono">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${iconos[icono] || iconos.busqueda}</svg>
      </span>
      <div class="vacio-titulo">${titulo}</div>
      <div class="vacio-texto">${texto}</div>
    </div>`;
}

function alternarFavorita(id) {
  const i = estado.favoritas.indexOf(id);
  if (i >= 0) { estado.favoritas.splice(i, 1); toast('Quitada de favoritas'); }
  else { estado.favoritas.push(id); toast('Agregada a favoritas'); }
  persistir();
  pintarRutas();
}

/* ---------- Mi ubicación ----------
   Pide la ubicación al dispositivo y muestra un mapa real con la
   posición y las paradas más cercanas. */
async function mostrarMiUbicacion() {
  const cont = $('#rutas-mapa-ubicacion');

  // Segundo toque: se oculta
  if (cont.style.display !== 'none') {
    cont.style.display = 'none';
    cont.innerHTML = '';
    return;
  }

  cont.style.display = 'block';
  cont.innerHTML = `
    <div class="ubicacion-cargando">
      <span class="girador"></span>
      Buscando tu ubicación…
    </div>`;

  try {
    const { coord, precision } = await pedirUbicacion();
    const cercanas = paradasCercanas(coord, 3);

    cont.innerHTML = `
      <div id="mapa-ubicacion" class="mapa-real"></div>
      <div class="cercanas">
        <div class="cercanas-titulo">Paradas más cercanas</div>
        ${cercanas.map(p => `
          <div class="cercana">
            <span class="cn-nombre">${p.nombre}</span>
            <span class="cn-km">${formatoDistancia(p.km)}</span>
          </div>`).join('')}
      </div>
      <p class="ubicacion-precision">Precisión aproximada: ${Math.round(precision)} m</p>`;

    if (hayLeaflet()) {
      const mapa = crearMapa('mapa-ubicacion', coord, 13);
      if (mapa) {
        L.marker(coord, { icon: marcadorUsuario() }).addTo(mapa)
          .bindPopup('<strong>Estás acá</strong>');
        L.circle(coord, {
          radius: precision, color: '#1DCDF1', weight: 1,
          fillColor: '#1DCDF1', fillOpacity: .1,
        }).addTo(mapa);

        cercanas.forEach(p => {
          L.marker(p.coord, { icon: marcadorPunto('#10B0D4', 12) }).addTo(mapa)
            .bindPopup(`<strong>${p.nombre}</strong><br>${formatoDistancia(p.km)}`);
        });
      }
    } else {
      // Sin Leaflet mostramos el esquema, pero los datos siguen siendo reales
      $('#mapa-ubicacion').innerHTML = mapaSVG(null, true);
    }
  } catch (error) {
    cont.innerHTML = `
      <div class="ubicacion-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><path d="M12 7v4M12 15h.01"/>
        </svg>
        <div>
          <div class="ue-titulo">No pudimos ubicarte</div>
          <div class="ue-texto">${error.message}</div>
        </div>
      </div>
      <button class="btn btn-secundario" data-accion="mi-ubicacion" style="margin-top:12px">Reintentar</button>`;
  }
}

function formatoDistancia(km) {
  if (km < 1) return Math.round(km * 1000) + ' m';
  return km.toFixed(1).replace('.', ',') + ' km';
}
