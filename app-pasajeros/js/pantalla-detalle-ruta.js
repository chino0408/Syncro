/* Syncro — pantalla-detalle-ruta.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 10. Pantalla: Detalle de ruta ---------- */
function abrirRuta(id) {
  estado.rutaAbierta = id;
  ir('detalle-ruta');
}

function pintarDetalleRuta() {
  const ruta = RUTAS.find(r => r.id === estado.rutaAbierta);
  if (!ruta) return ir('rutas');

  $('#detalle-titulo').textContent = ruta.origen + ' → ' + ruta.destino;
  $('#detalle-mapa').innerHTML = '<div id="mapa-ruta" class="mapa-real"></div>';
  dibujarRutaEnMapa('mapa-ruta', ruta);

  $('#detalle-paradas').innerHTML = ruta.paradas.map((p, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:7px 0;">
      <div style="width:10px; height:10px; border-radius:50%; background:${i === 0 || i === ruta.paradas.length - 1 ? 'var(--cian)' : 'var(--fondo-2)'}; border:2px solid var(--cian); flex-shrink:0;"></div>
      <div style="font-size:13.5px;">${p}</div>
    </div>`).join('');

  const salidas = proximasSalidas(ruta);
  $('#detalle-horarios').innerHTML = salidas.map((s, i) => `
    <div class="fila" data-elegir-horario="${i}">
      <div class="fila-izq">
        <div class="fila-icono">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div>
          <div class="fila-titulo">${horaCorta(s.hora)}</div>
          <div class="fila-sub">${s.asientos} asientos disponibles</div>
        </div>
      </div>
      <div style="font-family:var(--display); font-weight:600; color:var(--cian); font-size:14px;">${colones(ruta.precio)}</div>
    </div>`).join('');

  // Guardamos las salidas calculadas para usarlas al elegir
  estado._salidas = salidas;
}
