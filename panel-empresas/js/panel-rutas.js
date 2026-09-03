/* Syncro Admin — panel-rutas.js
   Rutas publicadas: es donde la empresa define el precio del
   tiquete y las paradas que ve el pasajero. */

/* Las paradas son un catálogo compartido: guardan nombre y coordenadas,
   y esas coordenadas son las que dibujan el recorrido en el mapa de la
   app. Por eso el panel no puede inventar una parada nueva desde un
   campo de texto: no sabría dónde ponerla. */
function errorDeParadas(faltantes) {
  const nombres = faltantes.map(p => '"' + p + '"').join(', ');
  return 'Estas paradas no existen en el catálogo: ' + nombres +
         '. Revisá que estén bien escritas, o pedí que se agreguen con sus coordenadas.';
}

function rutasFiltradas() {
  const f = estado.filtros.rutas.trim().toLowerCase();
  if (!f) return estado.rutas;
  return estado.rutas.filter(r =>
    (r.origen + ' ' + r.destino).toLowerCase().includes(f) ||
    r.paradas.some(p => p.toLowerCase().includes(f))
  );
}

function pintarRutas() {
  const lista = rutasFiltradas();
  const cont = $('#rutas-tabla');

  if (!lista.length) {
    cont.innerHTML = estado.filtros.rutas
      ? vacio('Sin coincidencias', 'Ninguna ruta coincide con lo que buscaste.')
      : vacio('Todavía no hay rutas', 'Publicá tu primera ruta para que los pasajeros puedan comprar tiquetes.',
              '<button class="btn btn-primario" data-accion="nueva-ruta" style="margin-top:6px">Nueva ruta</button>');
    return;
  }

  cont.innerHTML = `
    <div class="tabla-scroll">
    <table class="tabla">
      <thead>
        <tr>
          <th>Ruta</th>
          <th>Paradas</th>
          <th>Frecuencia</th>
          <th>Duración</th>
          <th>Precio</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(r => `
          <tr>
            <td>
              <div class="principal">${limpio(r.origen)} → ${limpio(r.destino)}</div>
              <div class="secundario">${r.paradas.length} paradas</div>
            </td>
            <td style="max-width:250px">
              <div class="secundario" style="margin:0">${limpio(r.paradas.slice(1, -1).join(' · ') || 'Directo')}</div>
            </td>
            <td class="num">cada ${r.frecuencia} min</td>
            <td class="num">${r.duracion} min</td>
            <td class="num" style="color:var(--cian)">${colones(r.precio)}</td>
            <td>${etiqueta(r.estado)}</td>
            <td class="derecha">
              <div class="acciones">
                <button class="btn-icono" data-editar-ruta="${r.id}" title="Editar ruta" aria-label="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="btn-icono" data-borrar-ruta="${r.id}" title="Eliminar ruta" aria-label="Eliminar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}

function camposRuta(r) {
  return [
    { id: 'ru-origen', etiqueta: 'Origen', tipo: 'texto', valor: r ? r.origen : '', marcador: 'San José', ancho: 'mitad' },
    { id: 'ru-destino', etiqueta: 'Destino', tipo: 'texto', valor: r ? r.destino : '', marcador: 'Cartago', ancho: 'mitad' },
    { id: 'ru-precio', etiqueta: 'Precio del tiquete (₡)', tipo: 'numero', valor: r ? r.precio : '', marcador: '650', ancho: 'mitad' },
    { id: 'ru-frec', etiqueta: 'Frecuencia (min)', tipo: 'numero', valor: r ? r.frecuencia : '', marcador: '15', ancho: 'mitad' },
    { id: 'ru-dur', etiqueta: 'Duración del viaje (min)', tipo: 'numero', valor: r ? r.duracion : '', marcador: '45', ancho: 'mitad' },
    { id: 'ru-estado', etiqueta: 'Estado', tipo: 'select', valor: r ? r.estado : 'activa', ancho: 'mitad',
      opciones: [{ valor: 'activa', texto: 'Activa' }, { valor: 'pausada', texto: 'Pausada' }] },
    { id: 'ru-paradas', etiqueta: 'Paradas', tipo: 'lista', valor: r ? r.paradas : [],
      marcador: 'San José (Terminal)\nCurridabat\nTres Ríos\nCartago Centro',
      ayuda: 'Una parada por línea, en el orden del recorrido. La primera es el origen y la última el destino.' },
  ];
}

function leerRuta() {
  const origen = valorCampo('ru-origen');
  const destino = valorCampo('ru-destino');
  const precio = Number(valorCampo('ru-precio'));
  const frecuencia = Number(valorCampo('ru-frec'));
  const duracion = Number(valorCampo('ru-dur'));
  const paradas = valorLista('ru-paradas');

  if (!origen || !destino) { errorModal('Escribí el origen y el destino de la ruta.'); return null; }
  if (origen.toLowerCase() === destino.toLowerCase()) { errorModal('El origen y el destino no pueden ser el mismo lugar.'); return null; }
  if (!precio || precio <= 0) { errorModal('Escribí el precio del tiquete en colones.'); return null; }
  if (!frecuencia || frecuencia <= 0) { errorModal('Escribí cada cuántos minutos sale esta ruta.'); return null; }
  if (!duracion || duracion <= 0) { errorModal('Escribí cuánto dura el viaje en minutos.'); return null; }
  if (paradas.length < 2) { errorModal('Agregá al menos dos paradas: el origen y el destino.'); return null; }

  return { origen, destino, precio, frecuencia, duracion, paradas, estado: valorCampo('ru-estado') };
}

function nuevaRuta() {
  restablecerBotonModal();
  abrirModal({
    titulo: 'Nueva ruta',
    sub: 'Los pasajeros van a ver esta ruta y su precio en la app.',
    campos: camposRuta(null),
    guardarTexto: 'Publicar ruta',
    alGuardar: async () => {
      const datos = leerRuta();
      if (!datos) return false;

      const { ids, faltantes } = Api.resolverParadas(datos.paradas, estado.paradas);
      if (faltantes.length) { errorModal(errorDeParadas(faltantes)); return false; }

      try {
        const id = await Api.crearRuta(estado.empresaId, datos, ids);
        estado.rutas.push({ id, ...datos });
        pintarRutas();
        aviso('Ruta publicada');
        return true;
      } catch (e) { errorModal(e.message); return false; }
    },
  });
}

function editarRuta(id) {
  const r = buscarRuta(id);
  if (!r) return;
  restablecerBotonModal();
  abrirModal({
    titulo: 'Editar ruta',
    sub: 'Los cambios se reflejan de inmediato en la app de los pasajeros.',
    campos: camposRuta(r),
    guardarTexto: 'Guardar cambios',
    alGuardar: async () => {
      const datos = leerRuta();
      if (!datos) return false;

      const { ids, faltantes } = Api.resolverParadas(datos.paradas, estado.paradas);
      if (faltantes.length) { errorModal(errorDeParadas(faltantes)); return false; }

      try {
        await Api.actualizarRuta(r.id, datos, ids);
        Object.assign(r, datos);
        await recargarSalidas();   // el precio y el estado afectan las salidas
        pintarRutas();
        aviso('Ruta actualizada');
        return true;
      } catch (e) { errorModal(e.message); return false; }
    },
  });
}

function borrarRuta(id) {
  const r = buscarRuta(id);
  if (!r) return;
  const salidasLigadas = estado.salidas.filter(s => s.rutaId === id).length;

  confirmar({
    titulo: `Eliminar ${r.origen} → ${r.destino}`,
    sub: salidasLigadas
      ? `Esta ruta tiene ${salidasLigadas} salidas programadas hoy. Se cancelan junto con la ruta y deja de aparecer en la app.`
      : 'La ruta deja de aparecer en la app de los pasajeros.',
    textoBoton: 'Eliminar ruta',
    alConfirmar: async () => {
      try {
        await Api.borrarRuta(id);
        estado.rutas = estado.rutas.filter(x => x.id !== id);
        estado.salidas = estado.salidas.filter(s => s.rutaId !== id);
        pintarRutas();
        aviso('Ruta eliminada');
      } catch (e) { aviso(e.message, 'error'); }
    },
  });
}
