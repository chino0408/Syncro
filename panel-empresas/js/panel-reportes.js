/* Syncro Admin — panel-reportes.js
   Incidencias que los pasajeros envían desde la app. */

function pintarReportes() {
  const lista = [...estado.reportes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const cont = $('#reportes-lista');

  if (!lista.length) {
    cont.innerHTML = vacio('No hay reportes', 'Cuando un pasajero reporte un retraso, una unidad llena o una falla, aparece acá.');
    return;
  }

  cont.innerHTML = lista.map(r => {
    const meta = ETIQUETAS_REPORTE[r.tipo] || ETIQUETAS_REPORTE.retraso;
    const icono = {
      retraso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
      lleno:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.8"/></svg>',
      falla:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0"/><path d="M12 9v4M12 17h.01"/></svg>',
    }[r.tipo];

    return `
      <div class="reporte">
        <div class="ico ${meta.clase}">${icono}</div>
        <div class="cuerpo">
          <div class="tit">${limpio(meta.texto)} · ${limpio(nombreRuta(r.rutaId))}</div>
          <div class="txt">${limpio(r.detalle)}</div>
          <div class="meta">${limpio(haceCuanto(r.fecha))}${r.visto ? '' : ' · SIN VER'}</div>
        </div>
        ${r.visto ? '' : '<div style="width:7px;height:7px;border-radius:50%;background:var(--ambar);flex-shrink:0;margin-top:6px"></div>'}
      </div>`;
  }).join('');
}

async function marcarReportesVistos() {
  const sinVer = estado.reportes.filter(r => !r.visto);
  if (!sinVer.length) return aviso('No hay reportes sin ver');

  try {
    await Api.marcarReportesVistos(sinVer.map(r => r.id));
    sinVer.forEach(r => { r.visto = true; });
    pintarReportes();
    actualizarGlobo();
    aviso('Reportes marcados como vistos');
  } catch (e) { aviso(e.message, 'error'); }
}
