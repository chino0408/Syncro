/* Syncro Admin — panel-horarios.js
   El riel de despacho: el día se lee de arriba hacia abajo.
   Cada salida cuelga de la línea de tiempo. Las que no tienen bus
   o chofer asignado quedan marcadas en ámbar, porque son las que
   el despachador tiene que resolver. */

function salidasFiltradas() {
  const f = estado.filtros.horarios.trim().toLowerCase();
  let lista = [...estado.salidas].sort((a, b) => new Date(a.hora) - new Date(b.hora));
  if (!f) return lista;

  return lista.filter(s => {
    const ruta = buscarRuta(s.rutaId);
    const bus = buscarBus(s.busId);
    const chofer = buscarChofer(s.choferId);
    const texto = [
      ruta ? ruta.origen + ' ' + ruta.destino : '',
      bus ? bus.placa : '',
      chofer ? chofer.nombre : '',
      hora(s.hora),
    ].join(' ').toLowerCase();
    return texto.includes(f);
  });
}

function pendientes() {
  return estado.salidas.filter(s => !s.busId || !s.choferId);
}

function pintarHorarios() {
  $('#horarios-fecha').textContent = fechaLarga(new Date());

  const total = estado.salidas.length;
  const sinAsignar = pendientes().length;
  const ahora = new Date();
  const porSalir = estado.salidas.filter(s => new Date(s.hora) > ahora).length;
  const vendidos = estado.salidas.reduce((a, s) => a + (s.vendidos || 0), 0);

  $('#horarios-indicadores').innerHTML = `
    ${indicador('Salidas programadas', total, 'En el día de hoy')}
    ${indicador('Por salir', porSalir, 'Todavía no han salido')}
    ${indicador('Sin asignar', sinAsignar, sinAsignar ? 'Requieren bus o chofer' : 'Todo asignado', sinAsignar > 0)}
    ${indicador('Tiquetes vendidos', vendidos, 'Suma del día')}
  `;

  const lista = salidasFiltradas();
  const cont = $('#horarios-riel');

  if (!lista.length) {
    cont.innerHTML = estado.filtros.horarios
      ? vacio('Sin coincidencias', 'Ninguna salida coincide con lo que buscaste. Probá con otra ruta, placa o chofer.')
      : vacio('No hay salidas programadas', 'Programá la primera salida del día para que aparezca en la app de los pasajeros.',
              '<button class="btn btn-primario" data-accion="nueva-salida" style="margin-top:6px">Programar salida</button>');
    return;
  }

  cont.innerHTML = `<div class="riel">${lista.map(filaSalida).join('')}</div>`;
}

function filaSalida(s) {
  const ruta = buscarRuta(s.rutaId);
  const bus = buscarBus(s.busId);
  const chofer = buscarChofer(s.choferId);
  const salio = new Date(s.hora) < new Date();
  const falta = !bus || !chofer;

  const cap = bus ? bus.capacidad : (s._cap || 44);
  const pct = Math.min(100, Math.round((s.vendidos / cap) * 100));

  const clase = salio ? 'salio' : (falta ? 'pendiente' : '');

  return `
    <div class="riel-hora ${clase}">
      <span class="marca">${hora(s.hora)}</span>
      <span class="punto"></span>
      <div class="salida ${clase}">
        <div class="ruta">
          <div class="nom">${limpio(ruta ? ruta.origen + ' → ' + ruta.destino : 'Ruta eliminada')}</div>
          <div class="det">${ruta ? colones(ruta.precio) + ' · ' + ruta.duracion + ' min' : '—'}</div>
        </div>

        <div class="asignado">
          <div class="campo-mini">
            <div class="k">Unidad</div>
            <div class="v ${bus ? '' : 'falta'}" style="${bus ? 'font-family:var(--dato)' : ''}">
              ${bus ? limpio(bus.placa) : 'Sin asignar'}
            </div>
          </div>
          <div class="campo-mini">
            <div class="k">Chofer</div>
            <div class="v ${chofer ? '' : 'falta'}">${chofer ? limpio(chofer.nombre.split(' ')[0] + ' ' + (chofer.nombre.split(' ')[1] || '')) : 'Sin asignar'}</div>
          </div>
        </div>

        <div class="ocupacion">
          <div class="cifra">${s.vendidos}/${cap} asientos</div>
          <div class="barra-ocupacion"><i class="${pct >= 90 ? 'lleno' : ''}" style="width:${pct}%"></i></div>
        </div>

        <div style="display:flex; gap:6px;">
          <button class="btn-icono" data-editar-salida="${s.id}" title="Asignar unidad y chofer" aria-label="Asignar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          </button>
          <button class="btn-icono" data-borrar-salida="${s.id}" title="Cancelar salida" aria-label="Cancelar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

function indicador(etq, valor, pie, esAlerta) {
  return `
    <div class="indicador ${esAlerta ? 'alerta' : ''}">
      <div class="etq">${limpio(etq)}</div>
      <div class="valor">${limpio(valor)}</div>
      <div class="pie">${limpio(pie)}</div>
    </div>`;
}

/* ---------- Alta y edición de salidas ---------- */

function opcionesRutas() {
  return estado.rutas.filter(r => r.estado === 'activa')
    .map(r => ({ valor: r.id, texto: `${r.origen} → ${r.destino}` }));
}

function opcionesBuses(incluirVacio) {
  const base = incluirVacio ? [{ valor: '', texto: 'Sin asignar' }] : [];
  return base.concat(
    estado.flota.filter(b => b.estado === 'activo')
      .map(b => ({ valor: b.id, texto: `${b.placa} · ${b.capacidad} asientos` }))
  );
}

function opcionesChoferes(incluirVacio) {
  const base = incluirVacio ? [{ valor: '', texto: 'Sin asignar' }] : [];
  return base.concat(
    estado.choferes.filter(c => c.estado === 'disponible')
      .map(c => ({ valor: c.id, texto: c.nombre }))
  );
}

function nuevaSalida() {
  if (!estado.rutas.some(r => r.estado === 'activa')) {
    return aviso('Primero publicá una ruta activa', 'error');
  }
  restablecerBotonModal();
  abrirModal({
    titulo: 'Programar salida',
    sub: 'La salida aparece en la app en cuanto la guardés.',
    campos: [
      { id: 'sal-ruta', etiqueta: 'Ruta', tipo: 'select', opciones: opcionesRutas() },
      { id: 'sal-hora', etiqueta: 'Hora de salida', tipo: 'texto', marcador: '14:30', ayuda: 'Formato de 24 horas, por ejemplo 06:15 o 18:40.', ancho: 'mitad' },
      { id: 'sal-bus', etiqueta: 'Unidad', tipo: 'select', opciones: opcionesBuses(true), ancho: 'mitad' },
      { id: 'sal-chofer', etiqueta: 'Chofer', tipo: 'select', opciones: opcionesChoferes(true) },
    ],
    guardarTexto: 'Programar salida',
    alGuardar: async () => {
      const rutaId = valorCampo('sal-ruta');
      const h = valorCampo('sal-hora');
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(h)) {
        errorModal('Escribí la hora en formato de 24 horas, por ejemplo 06:15.');
        return false;
      }
      const [hh, mm] = h.split(':').map(Number);
      const fecha = new Date();
      fecha.setHours(hh, mm, 0, 0);

      const busId = valorCampo('sal-bus') || null;
      const bus = busId ? buscarBus(busId) : null;
      const choferId = valorCampo('sal-chofer') || null;

      try {
        const id = await Api.crearSalida({
          rutaId, busId, choferId, hora: fecha.toISOString(),
        });
        estado.salidas.push({
          id, rutaId, hora: fecha.toISOString(), busId, choferId,
          vendidos: 0,
          _cap: bus ? bus.capacidad : 44,
        });
        pintarHorarios();
        aviso('Salida programada');
        return true;
      } catch (e) { errorModal(e.message); return false; }
    },
  });
}

function editarSalida(id) {
  const s = estado.salidas.find(x => x.id === id);
  if (!s) return;
  const ruta = buscarRuta(s.rutaId);

  restablecerBotonModal();
  abrirModal({
    titulo: 'Asignar unidad y chofer',
    sub: `${ruta ? ruta.origen + ' → ' + ruta.destino : ''} · salida ${horaAmPm(s.hora)}`,
    campos: [
      { id: 'ed-bus', etiqueta: 'Unidad', tipo: 'select', valor: s.busId || '', opciones: opcionesBuses(true), ancho: 'mitad' },
      { id: 'ed-chofer', etiqueta: 'Chofer', tipo: 'select', valor: s.choferId || '', opciones: opcionesChoferes(true), ancho: 'mitad' },
      { id: 'ed-hora', etiqueta: 'Hora de salida', tipo: 'texto', valor: hora(s.hora), ayuda: 'Formato de 24 horas.' },
    ],
    guardarTexto: 'Guardar asignación',
    alGuardar: async () => {
      const h = valorCampo('ed-hora');
      if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(h)) {
        errorModal('Escribí la hora en formato de 24 horas, por ejemplo 06:15.');
        return false;
      }
      const [hh, mm] = h.split(':').map(Number);
      const fecha = new Date(s.hora);
      fecha.setHours(hh, mm, 0, 0);

      const busId = valorCampo('ed-bus') || null;
      const choferId = valorCampo('ed-chofer') || null;
      const cuando = fecha.toISOString();

      try {
        await Api.actualizarSalida(s.id, { busId, choferId, hora: cuando });
        s.busId = busId;
        s.choferId = choferId;
        s.hora = cuando;
        const bus = busId ? buscarBus(busId) : null;
        s._cap = bus ? bus.capacidad : 44;
        pintarHorarios();
        aviso('Asignación guardada');
        return true;
      } catch (e) { errorModal(e.message); return false; }
    },
  });
}

function borrarSalida(id) {
  const s = estado.salidas.find(x => x.id === id);
  if (!s) return;
  const ruta = buscarRuta(s.rutaId);

  confirmar({
    titulo: 'Cancelar esta salida',
    sub: `${ruta ? ruta.origen + ' → ' + ruta.destino : 'Salida'} de las ${horaAmPm(s.hora)}. Si hay tiquetes vendidos, hay que reubicar a esos pasajeros.`,
    textoBoton: 'Cancelar salida',
    alConfirmar: async () => {
      try {
        await Api.borrarSalida(id);
        estado.salidas = estado.salidas.filter(x => x.id !== id);
        pintarHorarios();
        aviso('Salida cancelada');
      } catch (e) { aviso(e.message, 'error'); }
    },
  });
}
