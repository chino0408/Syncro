/* Syncro Admin — panel-flota.js
   Unidades de la empresa. La capacidad de cada bus es la que
   limita cuántos tiquetes se pueden vender por salida. */

function flotaFiltrada() {
  const f = estado.filtros.flota.trim().toLowerCase();
  if (!f) return estado.flota;
  return estado.flota.filter(b =>
    (b.placa + ' ' + b.modelo).toLowerCase().includes(f)
  );
}

function pintarFlota() {
  const activos = estado.flota.filter(b => b.estado === 'activo');
  const asientos = activos.reduce((a, b) => a + b.capacidad, 0);
  const enTaller = estado.flota.filter(b => b.estado === 'taller').length;

  $('#flota-indicadores').innerHTML = `
    ${indicador('Unidades', estado.flota.length, 'Registradas en total')}
    ${indicador('En servicio', activos.length, 'Disponibles para asignar')}
    ${indicador('En taller', enTaller, enTaller ? 'Fuera de servicio' : 'Ninguna', enTaller > 0)}
    ${indicador('Asientos', asientos, 'Capacidad total en servicio')}
  `;

  const lista = flotaFiltrada();
  const cont = $('#flota-tabla');

  if (!lista.length) {
    cont.innerHTML = estado.filtros.flota
      ? vacio('Sin coincidencias', 'Ninguna unidad coincide con lo que buscaste.')
      : vacio('Todavía no hay unidades', 'Agregá tu primer bus para poder asignarlo a las salidas del día.',
              '<button class="btn btn-primario" data-accion="nuevo-bus" style="margin-top:6px">Agregar unidad</button>');
    return;
  }

  cont.innerHTML = `
    <div class="tabla-scroll">
    <table class="tabla">
      <thead>
        <tr><th>Placa</th><th>Modelo</th><th>Año</th><th>Capacidad</th><th>Salidas hoy</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        ${lista.map(b => {
          const asignadas = estado.salidas.filter(s => s.busId === b.id).length;
          return `
          <tr>
            <td class="placa" style="color:var(--cian)">${limpio(b.placa)}</td>
            <td><div class="principal">${limpio(b.modelo)}</div></td>
            <td class="num">${b.anio}</td>
            <td class="num">${b.capacidad} asientos</td>
            <td class="num">${asignadas}</td>
            <td>${etiqueta(b.estado)}</td>
            <td class="derecha">
              <div class="acciones">
                <button class="btn-icono" data-editar-bus="${b.id}" title="Editar unidad" aria-label="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="btn-icono" data-borrar-bus="${b.id}" title="Eliminar unidad" aria-label="Eliminar">
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

function camposBus(b) {
  return [
    { id: 'bu-placa', etiqueta: 'Placa', tipo: 'texto', valor: b ? b.placa : '', marcador: 'SJB-1204', ancho: 'mitad' },
    { id: 'bu-anio', etiqueta: 'Año', tipo: 'numero', valor: b ? b.anio : '', marcador: '2020', ancho: 'mitad' },
    { id: 'bu-modelo', etiqueta: 'Modelo', tipo: 'texto', valor: b ? b.modelo : '', marcador: 'Mercedes-Benz OF-1721' },
    { id: 'bu-cap', etiqueta: 'Capacidad (asientos)', tipo: 'numero', valor: b ? b.capacidad : '', marcador: '44', ancho: 'mitad' },
    { id: 'bu-estado', etiqueta: 'Estado', tipo: 'select', valor: b ? b.estado : 'activo', ancho: 'mitad',
      opciones: [{ valor: 'activo', texto: 'Activo' }, { valor: 'taller', texto: 'En taller' }] },
  ];
}

function leerBus(idActual) {
  const placa = valorCampo('bu-placa').toUpperCase();
  const modelo = valorCampo('bu-modelo');
  const anio = Number(valorCampo('bu-anio'));
  const capacidad = Number(valorCampo('bu-cap'));

  if (!placa) { errorModal('Escribí la placa de la unidad.'); return null; }
  const repetida = estado.flota.some(b => b.placa.toUpperCase() === placa && b.id !== idActual);
  if (repetida) { errorModal('Ya hay una unidad registrada con esa placa.'); return null; }
  if (!modelo) { errorModal('Escribí el modelo de la unidad.'); return null; }
  if (!anio || anio < 1970 || anio > new Date().getFullYear() + 1) { errorModal('Revisá el año de la unidad.'); return null; }
  if (!capacidad || capacidad <= 0) { errorModal('Escribí cuántos asientos tiene la unidad.'); return null; }

  return { placa, modelo, anio, capacidad, estado: valorCampo('bu-estado') };
}

function nuevoBus() {
  restablecerBotonModal();
  abrirModal({
    titulo: 'Agregar unidad',
    sub: 'La capacidad define cuántos tiquetes se pueden vender por salida.',
    campos: camposBus(null),
    guardarTexto: 'Agregar unidad',
    alGuardar: async () => {
      const datos = leerBus(null);
      if (!datos) return false;
      try {
        const id = await Api.crearBus(estado.empresaId, datos);
        estado.flota.push({ id, ...datos });
        pintarFlota();
        aviso('Unidad agregada');
        return true;
      } catch (e) { errorModal(e.message); return false; }
    },
  });
}

function editarBus(id) {
  const b = buscarBus(id);
  if (!b) return;
  restablecerBotonModal();
  abrirModal({
    titulo: 'Editar unidad',
    sub: `Placa ${b.placa}`,
    campos: camposBus(b),
    guardarTexto: 'Guardar cambios',
    alGuardar: async () => {
      const datos = leerBus(id);
      if (!datos) return false;
      try {
        await Api.actualizarBus(id, datos);
        // Si pasa a taller, se libera de las salidas del día
        if (datos.estado === 'taller') await Api.liberarBusDeSalidas(id);
        Object.assign(b, datos);
        await recargarSalidas();   // cambió la capacidad o la asignación
        pintarFlota();
        aviso('Unidad actualizada');
        return true;
      } catch (e) { errorModal(e.message); return false; }
    },
  });
}

function borrarBus(id) {
  const b = buscarBus(id);
  if (!b) return;
  const asignadas = estado.salidas.filter(s => s.busId === id).length;

  confirmar({
    titulo: `Eliminar la unidad ${b.placa}`,
    sub: asignadas
      ? `Está asignada a ${asignadas} salidas de hoy. Esas salidas quedan sin unidad hasta que asignes otra.`
      : 'La unidad deja de estar disponible para asignar.',
    textoBoton: 'Eliminar unidad',
    alConfirmar: async () => {
      try {
        await Api.borrarBus(id);
        estado.flota = estado.flota.filter(x => x.id !== id);
        await recargarSalidas();
        pintarFlota();
        aviso('Unidad eliminada');
      } catch (e) { aviso(e.message, 'error'); }
    },
  });
}
