/* Syncro Admin — panel-resumen.js
   Lo primero que ve la empresa al entrar: cómo va el día. */

function pintarResumen() {
  const ahora = new Date();
  const activas = estado.rutas.filter(r => r.estado === 'activa').length;
  const sinAsignar = pendientes().length;
  const vendidos = estado.salidas.reduce((a, s) => a + (s.vendidos || 0), 0);
  const ingresos = estado.salidas.reduce((a, s) => {
    const r = buscarRuta(s.rutaId);
    return a + (s.vendidos || 0) * (r ? r.precio : 0);
  }, 0);

  $('#resumen-indicadores').innerHTML = `
    ${indicador('Rutas activas', activas, `de ${estado.rutas.length} publicadas`)}
    ${indicador('Salidas de hoy', estado.salidas.length, 'Programadas en total')}
    ${indicador('Sin asignar', sinAsignar, sinAsignar ? 'Falta bus o chofer' : 'Todo asignado', sinAsignar > 0)}
    ${indicador('Vendido hoy', colones(ingresos), `${vendidos} tiquetes`)}
  `;

  /* Próximas salidas */
  const proximas = estado.salidas
    .filter(s => new Date(s.hora) > ahora)
    .sort((a, b) => new Date(a.hora) - new Date(b.hora))
    .slice(0, 6);

  const contSalidas = $('#resumen-salidas');
  if (!proximas.length) {
    contSalidas.innerHTML = vacio('No queda nada por salir hoy',
      'Programá las salidas de mañana para que los pasajeros puedan comprar con anticipación.');
  } else {
    contSalidas.innerHTML = `
      <table class="tabla">
        <thead><tr><th>Hora</th><th>Ruta</th><th>Unidad</th><th>Chofer</th><th>Ocupación</th></tr></thead>
        <tbody>
          ${proximas.map(s => {
            const bus = buscarBus(s.busId);
            const chofer = buscarChofer(s.choferId);
            const cap = bus ? bus.capacidad : (s._cap || 44);
            const pct = Math.min(100, Math.round((s.vendidos / cap) * 100));
            return `
              <tr>
                <td class="hora" style="color:var(--cian)">${hora(s.hora)}</td>
                <td><div class="principal">${limpio(nombreRuta(s.rutaId))}</div></td>
                <td class="placa">${bus ? limpio(bus.placa) : '<span style="color:var(--ambar)">Sin asignar</span>'}</td>
                <td>${chofer ? limpio(chofer.nombre) : '<span style="color:var(--ambar)">Sin asignar</span>'}</td>
                <td style="min-width:120px">
                  <div class="cifra" style="font-family:var(--dato);font-size:11.5px;color:var(--tenue);margin-bottom:5px">${s.vendidos}/${cap}</div>
                  <div class="barra-ocupacion"><i class="${pct >= 90 ? 'lleno' : ''}" style="width:${pct}%"></i></div>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  /* Últimos reportes */
  const ultimos = [...estado.reportes]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 4);

  const contRep = $('#resumen-reportes');
  if (!ultimos.length) {
    contRep.innerHTML = vacio('Sin reportes', 'Los pasajeros no han reportado incidencias.');
  } else {
    contRep.innerHTML = ultimos.map(r => {
      const meta = ETIQUETAS_REPORTE[r.tipo] || ETIQUETAS_REPORTE.retraso;
      return `
        <div class="reporte">
          <div class="ico ${meta.clase}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0"/><path d="M12 9v4M12 17h.01"/></svg>
          </div>
          <div class="cuerpo">
            <div class="tit">${limpio(meta.texto)}</div>
            <div class="txt">${limpio(nombreRuta(r.rutaId))}</div>
            <div class="meta">${limpio(haceCuanto(r.fecha))}</div>
          </div>
        </div>`;
    }).join('');
  }
}
