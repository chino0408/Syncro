/* Syncro Admin — panel-choferes.js
   Personal de conducción y su disponibilidad para asignar. */

function choferesFiltrados() {
  const f = estado.filtros.choferes.trim().toLowerCase();
  if (!f) return estado.choferes;
  return estado.choferes.filter(c =>
    (c.nombre + ' ' + c.licencia).toLowerCase().includes(f)
  );
}

function pintarChoferes() {
  const lista = choferesFiltrados();
  const cont = $('#choferes-tabla');

  if (!lista.length) {
    cont.innerHTML = estado.filtros.choferes
      ? vacio('Sin coincidencias', 'Ningún chofer coincide con lo que buscaste.')
      : vacio('Todavía no hay choferes', 'Agregá al personal de conducción para poder asignarlo a las salidas.',
              '<button class="btn btn-primario" data-accion="nuevo-chofer" style="margin-top:6px">Agregar chofer</button>');
    return;
  }

  cont.innerHTML = `
    <div class="tabla-scroll">
    <table class="tabla">
      <thead>
        <tr><th>Nombre</th><th>Licencia</th><th>Teléfono</th><th>Salidas hoy</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        ${lista.map(c => {
          const asignadas = estado.salidas.filter(s => s.choferId === c.id).length;
          return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:11px;">
                <div style="width:32px;height:32px;border-radius:9px;background:rgba(29,205,241,.14);color:var(--cian);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:600;font-size:12px;flex-shrink:0">${limpio(siglas(c.nombre))}</div>
                <div class="principal">${limpio(c.nombre)}</div>
              </div>
            </td>
            <td class="num">${limpio(c.licencia)}</td>
            <td class="num">${limpio(c.telefono)}</td>
            <td class="num">${asignadas}</td>
            <td>${etiqueta(c.estado)}</td>
            <td class="derecha">
              <div class="acciones">
                <button class="btn-icono" data-editar-chofer="${c.id}" title="Editar chofer" aria-label="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="btn-icono" data-borrar-chofer="${c.id}" title="Eliminar chofer" aria-label="Eliminar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>`;
}

function camposChofer(c) {
  return [
    { id: 'ch-nombre', etiqueta: 'Nombre completo', tipo: 'texto', valor: c ? c.nombre : '', marcador: 'Marvin Rodríguez' },
    { id: 'ch-licencia', etiqueta: 'Licencia', tipo: 'texto', valor: c ? c.licencia : '', marcador: 'B4-108742', ancho: 'mitad' },
    { id: 'ch-tel', etiqueta: 'Teléfono', tipo: 'texto', valor: c ? c.telefono : '', marcador: '8812-4409', ancho: 'mitad' },
    { id: 'ch-estado', etiqueta: 'Estado', tipo: 'select', valor: c ? c.estado : 'disponible',
      opciones: [{ valor: 'disponible', texto: 'Disponible' }, { valor: 'incapacidad', texto: 'Incapacidad' }],
      ayuda: 'Solo los choferes disponibles aparecen al asignar una salida.' },
  ];
}

function leerChofer(idActual) {
  const nombre = valorCampo('ch-nombre');
  const licencia = valorCampo('ch-licencia').toUpperCase();
  const telefono = valorCampo('ch-tel');

  if (!nombre) { errorModal('Escribí el nombre del chofer.'); return null; }
  if (!licencia) { errorModal('Escribí el número de licencia.'); return null; }
  const repetida = estado.choferes.some(c => c.licencia.toUpperCase() === licencia && c.id !== idActual);
  if (repetida) { errorModal('Ya hay un chofer registrado con esa licencia.'); return null; }
  if (!telefono) { errorModal('Escribí un teléfono de contacto.'); return null; }

  return { nombre, licencia, telefono, estado: valorCampo('ch-estado') };
}

function nuevoChofer() {
  restablecerBotonModal();
  abrirModal({
    titulo: 'Agregar chofer',
    sub: 'Queda disponible para asignarlo a las salidas del día.',
    campos: camposChofer(null),
    guardarTexto: 'Agregar chofer',
    alGuardar: () => {
      const datos = leerChofer(null);
      if (!datos) return false;
      estado.choferes.push({ id: nuevoId('c'), ...datos });
      persistir();
      pintarChoferes();
      aviso('Chofer agregado');
      return true;
    },
  });
}

function editarChofer(id) {
  const c = buscarChofer(id);
  if (!c) return;
  restablecerBotonModal();
  abrirModal({
    titulo: 'Editar chofer',
    sub: limpio(c.nombre),
    campos: camposChofer(c),
    guardarTexto: 'Guardar cambios',
    alGuardar: () => {
      const datos = leerChofer(id);
      if (!datos) return false;
      Object.assign(c, datos);
      // Si queda en incapacidad, se libera de las salidas asignadas
      if (c.estado === 'incapacidad') {
        estado.salidas.forEach(s => { if (s.choferId === id) s.choferId = null; });
      }
      persistir();
      pintarChoferes();
      aviso('Chofer actualizado');
      return true;
    },
  });
}

function borrarChofer(id) {
  const c = buscarChofer(id);
  if (!c) return;
  const asignadas = estado.salidas.filter(s => s.choferId === id).length;

  confirmar({
    titulo: `Eliminar a ${c.nombre}`,
    sub: asignadas
      ? `Está asignado a ${asignadas} salidas de hoy. Esas salidas quedan sin chofer hasta que asignes otro.`
      : 'Deja de estar disponible para asignar.',
    textoBoton: 'Eliminar chofer',
    alConfirmar: () => {
      estado.choferes = estado.choferes.filter(x => x.id !== id);
      estado.salidas.forEach(s => { if (s.choferId === id) s.choferId = null; });
      persistir();
      pintarChoferes();
      aviso('Chofer eliminado');
    },
  });
}
