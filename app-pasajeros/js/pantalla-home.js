/* Syncro — pantalla-home.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 7. Pantalla: Home ---------- */
function pintarHome() {
  if (!estado.sesion) return ir('bienvenida');

  $('#home-nombre').textContent = estado.sesion.nombre.split(' ')[0];
  $('#home-avatar').textContent = iniciales(estado.sesion.nombre);

  // Llenar los selectores de origen y destino
  const lugares = [...new Set(RUTAS.flatMap(r => [r.origen, r.destino]))].sort();
  const origen = $('#home-origen'), destino = $('#home-destino');
  if (origen.options.length <= 1) {
    lugares.forEach(l => {
      origen.add(new Option(l, l));
      destino.add(new Option(l, l));
    });
  }

  // Tarjeta de próximo viaje
  const proximo = tiquetesOrdenados().find(t => new Date(t.hora) > new Date());
  const cont = $('#home-proximo');
  if (proximo) {
    const ruta = RUTAS.find(r => r.id === proximo.rutaId);
    cont.innerHTML = `
      <div class="card">
        <div class="eyebrow">Próximo viaje</div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div style="font-family:var(--display); font-weight:500; font-size:15px;">${ruta.origen} → ${ruta.destino}</div>
          <div style="font-size:13px; color:var(--texto-tenue);">${fechaRelativa(proximo.hora)} ${horaCorta(proximo.hora)}</div>
        </div>
        <button class="btn btn-primario" data-ver-tiquete="${proximo.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>
          Ver mi tiquete
        </button>
      </div>`;
  } else {
    cont.innerHTML = `
      <div class="card">
        <div class="eyebrow">Próximo viaje</div>
        <div style="font-size:13.5px; color:var(--texto-tenue); line-height:1.6; margin-bottom:12px;">
          No tenés viajes próximos. Buscá una ruta y comprá tu tiquete.
        </div>
        <button class="btn btn-secundario" data-ir="tiquetes">Ver mis tiquetes</button>
      </div>`;
  }

  actualizarPuntoNotif();
}

function buscarDesdeHome() {
  const o = $('#home-origen').value;
  const d = $('#home-destino').value;
  if (!o || !d) { return toast('Elegí un origen y un destino.'); }
  if (o === d) { return toast('El origen y el destino no pueden ser el mismo.'); }

  estado.filtro = '';
  $('#rutas-buscar').value = '';
  const coincide = RUTAS.find(r =>
    (r.origen === o && r.destino === d) || (r.origen === d && r.destino === o)
  );
  if (coincide) {
    abrirRuta(coincide.id);
  } else {
    ir('rutas');
    toast('No hay ruta directa. Estas son todas las disponibles.');
  }
}
