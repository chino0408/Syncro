/* Syncro Admin — app.js
   Conecta los eventos y arranca el panel. Va siempre de último. */

/* ---------- Clics ---------- */
document.addEventListener('click', (e) => {
  // Cambio de vista desde el menú o desde un botón "Ver todas"
  const nav = e.target.closest('[data-vista]');
  if (nav) { irA(nav.dataset.vista); return; }

  // Editar / borrar por tipo de registro
  const mapaAcciones = [
    ['data-editar-salida', editarSalida],
    ['data-borrar-salida', borrarSalida],
    ['data-editar-ruta',   editarRuta],
    ['data-borrar-ruta',   borrarRuta],
    ['data-editar-bus',    editarBus],
    ['data-borrar-bus',    borrarBus],
    ['data-editar-chofer', editarChofer],
    ['data-borrar-chofer', borrarChofer],
  ];
  for (const [attr, fn] of mapaAcciones) {
    const el = e.target.closest('[' + attr + ']');
    if (el) { fn(el.getAttribute(attr)); return; }
  }

  // Acciones con nombre
  const accion = e.target.closest('[data-accion]');
  if (!accion) return;
  const fn = {
    'entrar': entrar,
    'salir': salir,
    'nueva-salida': nuevaSalida,
    'nueva-ruta': nuevaRuta,
    'nuevo-bus': nuevoBus,
    'nuevo-chofer': nuevoChofer,
    'marcar-reportes': marcarReportesVistos,
    'guardar-empresa': guardarEmpresa,
    'restablecer': restablecerDemo,
    'cerrar-modal': cerrarModal,
  }[accion.dataset.accion];
  if (fn) fn();
});

/* ---------- Guardar desde el modal ---------- */
$('#modal-guardar').addEventListener('click', () => {
  if (typeof _alGuardar === 'function') {
    // Si la función devuelve false, el modal se queda abierto
    // mostrando el error de validación.
    const ok = _alGuardar();
    if (ok !== false) cerrarModal();
  } else {
    cerrarModal();
  }
});

/* Cerrar el modal al hacer clic fuera o con Escape */
$('#velo').addEventListener('click', (e) => {
  if (e.target.id === 'velo') cerrarModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#velo').classList.contains('visible')) cerrarModal();
});

/* ---------- Filtros de cada tabla ---------- */
[
  ['#filtro-horarios', 'horarios', () => pintarHorarios()],
  ['#filtro-rutas',    'rutas',    () => pintarRutas()],
  ['#filtro-flota',    'flota',    () => pintarFlota()],
  ['#filtro-choferes', 'choferes', () => pintarChoferes()],
].forEach(([sel, clave, pintar]) => {
  const el = $(sel);
  if (el) el.addEventListener('input', (e) => {
    estado.filtros[clave] = e.target.value;
    pintar();
  });
});

/* ---------- Enter en el acceso ---------- */
['#acc-correo', '#acc-clave'].forEach(sel => {
  $(sel).addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
});

/* ---------- Arranque ---------- */
(function iniciar() {
  // Primera vez, o datos incompletos: cargamos el ejemplo
  if (!estado.empresa || !estado.rutas || !estado.flota || !estado.choferes || !estado.salidas || !estado.reportes) {
    cargarDatosEjemplo();
  }

  if (estado.sesion) {
    mostrarPanel();
  } else {
    $('#acceso').style.display = 'flex';
  }
})();
