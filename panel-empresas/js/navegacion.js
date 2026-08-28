/* Syncro Admin — navegacion.js
   Cambio entre vistas. Cada vista define su título y los botones
   de acción que aparecen en la barra superior. */

const VISTAS = {
  resumen:   { titulo: 'Resumen',              sub: 'La operación de hoy',                       pintar: () => pintarResumen() },
  horarios:  { titulo: 'Horarios',             sub: 'Salidas programadas y asignación de unidades', pintar: () => pintarHorarios(),
               acciones: [{ texto: 'Programar salida', accion: 'nueva-salida', tipo: 'primario', icono: 'mas' }] },
  rutas:     { titulo: 'Rutas y precios',      sub: 'Lo que ven los pasajeros en la app',        pintar: () => pintarRutas(),
               acciones: [{ texto: 'Nueva ruta', accion: 'nueva-ruta', tipo: 'primario', icono: 'mas' }] },
  flota:     { titulo: 'Flota',                sub: 'Unidades registradas',                      pintar: () => pintarFlota(),
               acciones: [{ texto: 'Agregar unidad', accion: 'nuevo-bus', tipo: 'primario', icono: 'mas' }] },
  choferes:  { titulo: 'Choferes',             sub: 'Personal de conducción',                    pintar: () => pintarChoferes(),
               acciones: [{ texto: 'Agregar chofer', accion: 'nuevo-chofer', tipo: 'primario', icono: 'mas' }] },
  reportes:  { titulo: 'Reportes de pasajeros',sub: 'Incidencias enviadas desde la app',         pintar: () => pintarReportes() },
  empresa:   { titulo: 'Datos de la empresa',  sub: 'Información y ajustes de la cuenta',        pintar: () => pintarEmpresa() },
};

const ICONOS = {
  mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
};

function irA(vista) {
  const def = VISTAS[vista];
  if (!def) return;
  estado.vista = vista;

  $$('.vista').forEach(v => v.classList.remove('activa'));
  const seccion = $('#vista-' + vista);
  if (seccion) seccion.classList.add('activa');

  $$('.menu-item').forEach(b => b.classList.toggle('activo', b.dataset.vista === vista));

  $('#titulo-vista').textContent = def.titulo;
  $('#sub-vista').textContent = def.sub;

  $('#acciones-vista').innerHTML = (def.acciones || []).map(a => `
    <button class="btn btn-${a.tipo}" data-accion="${a.accion}">
      ${a.icono ? ICONOS[a.icono] : ''}${a.texto}
    </button>`).join('');

  def.pintar();
  cerrarMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* El globo del menú muestra cuántos reportes están sin ver */
function actualizarGlobo() {
  const sinVer = estado.reportes.filter(r => !r.visto).length;
  const globo = $('#globo-reportes');
  globo.style.display = sinVer ? 'flex' : 'none';
  globo.textContent = sinVer;
}

/* ---------- Menú lateral en pantallas chicas ----------
   En móvil el menú se abre como cajón sobre el contenido. */
function abrirMenu() {
  $('#lateral').classList.add('abierta');
  $('#velo-menu').classList.add('visible');
}

function cerrarMenu() {
  $('#lateral').classList.remove('abierta');
  $('#velo-menu').classList.remove('visible');
}
