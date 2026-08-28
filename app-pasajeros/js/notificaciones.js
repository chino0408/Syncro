/* Syncro — notificaciones.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 14. Notificaciones ---------- */
function agregarNotificacion({ tipo, titulo, texto, tiqueteId, mostrarDesde }) {
  estado.notificaciones.unshift({
    id: 'N' + Date.now() + Math.floor(Math.random() * 999),
    tipo, titulo, texto, tiqueteId,
    creada: new Date().toISOString(),
    mostrarDesde: mostrarDesde || new Date().toISOString(),
    leida: false,
  });
}

function notificacionesVisibles() {
  const ahora = new Date();
  return estado.notificaciones.filter(n => new Date(n.mostrarDesde) <= ahora);
}

function actualizarPuntoNotif() {
  const hay = notificacionesVisibles().some(n => !n.leida);
  const punto = $('#punto-notif');
  if (punto) punto.style.display = hay ? 'block' : 'none';
}

function pintarNotificaciones() {
  const lista = notificacionesVisibles();
  const cont = $('#notif-lista');

  if (!lista.length) {
    cont.innerHTML = plantillaVacio('campana', 'No tenés notificaciones',
      'Acá te avisamos cuando se complete una compra y 15 minutos antes de cada viaje.') +
      `<button class="btn btn-primario" style="max-width:260px; margin:0 auto;" data-ir="home">Volver al inicio</button>`;
    return;
  }

  cont.innerHTML = lista.map(n => `
    <div class="notif" data-notif="${n.id}">
      <div class="notif-icono ${n.tipo === 'viaje' ? 'notif-viaje' : 'notif-compra'}">
        ${n.tipo === 'viaje'
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>'}
      </div>
      <div style="flex:1; min-width:0">
        <div class="notif-titulo">${n.titulo}</div>
        <div class="notif-texto">${n.texto}</div>
        <div class="notif-hora">${fechaRelativa(n.creada)} · ${horaCorta(n.creada)}</div>
      </div>
    </div>`).join('');

  // Marcar como leídas al abrir la pantalla
  estado.notificaciones.forEach(n => { n.leida = true; });
  persistir();
  actualizarPuntoNotif();
}
