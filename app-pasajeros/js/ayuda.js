/* Syncro — ayuda.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 16. Ayuda: reporte ---------- */
function prepararReporte() {
  $('#reporte-form').style.display = 'block';
  $('#reporte-enviado').style.display = 'none';
  if (estado.sesion) {
    $('#rep-nombre').value = estado.sesion.nombre;
    $('#rep-correo').value = estado.sesion.correo;
  }
  $('#rep-detalle').value = '';
  ocultarError('#reporte-error');
}

function enviarReporte() {
  const nombre = $('#rep-nombre').value.trim();
  const correo = $('#rep-correo').value.trim();
  const detalle = $('#rep-detalle').value.trim();

  if (!nombre || !correo || !detalle) {
    return mostrarError('#reporte-error', 'Completá los tres campos para enviar el reporte.');
  }
  ocultarError('#reporte-error');

  const folio = 'SOP-' + Date.now().toString().slice(-6);
  estado.reportes.push({ folio, nombre, correo, detalle, fecha: new Date().toISOString(), estado: 'en espera' });
  persistir();

  $('#reporte-form').style.display = 'none';
  const cont = $('#reporte-enviado');
  cont.style.display = 'block';
  cont.innerHTML = `
    <div class="vacio" style="padding-top:30px;">
      <span class="vacio-icono" style="color:var(--verde)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>
      </span>
      <div class="vacio-titulo">Reporte enviado</div>
      <div class="vacio-texto">
        Soporte lo está revisando. Te responden a <strong style="color:var(--blanco)">${correo}</strong>.
      </div>
      <div class="card" style="width:100%; margin-top:8px;">
        <div class="resumen-linea"><span class="etq">Folio</span><span style="font-family:var(--display); font-weight:500;">${folio}</span></div>
        <div class="resumen-linea"><span class="etq">Estado</span><span style="color:var(--ambar)">En espera de respuesta</span></div>
      </div>
    </div>
    <button class="btn btn-secundario" data-ir="home">Volver al inicio</button>`;
  toast('Reporte enviado a soporte');
}
