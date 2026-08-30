/* Syncro — app.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 17. Eventos ---------- */
document.addEventListener('click', (e) => {
  // Navegación directa
  const nav = e.target.closest('[data-ir]');
  if (nav) { ir(nav.dataset.ir); return; }

  // Favorita (antes que abrir ruta, porque está adentro de la fila)
  const fav = e.target.closest('[data-fav]');
  if (fav) { e.stopPropagation(); alternarFavorita(fav.dataset.fav); return; }

  const abrir = e.target.closest('[data-abrir-ruta]');
  if (abrir) { abrirRuta(abrir.dataset.abrirRuta); return; }

  const quitar = e.target.closest('[data-quitar-pago]');
  if (quitar) { quitarPago(quitar.dataset.quitarPago); return; }

  const asiento = e.target.closest('[data-asiento]');
  if (asiento) { alternarAsiento(asiento.dataset.asiento); return; }

  const horario = e.target.closest('[data-elegir-horario]');
  if (horario) { elegirHorario(Number(horario.dataset.elegirHorario)); return; }

  const pago = e.target.closest('[data-pago]');
  if (pago) { estado.pagoElegido = pago.dataset.pago; pintarCompra(); return; }

  const verTiquete = e.target.closest('[data-ver-tiquete]');
  if (verTiquete) { abrirTiquete(verTiquete.dataset.verTiquete); return; }

  const notif = e.target.closest('[data-notif]');
  if (notif) {
    const n = estado.notificaciones.find(x => x.id === notif.dataset.notif);
    if (n && n.tiqueteId && estado.tiquetes.some(t => t.id === n.tiqueteId)) abrirTiquete(n.tiqueteId);
    else ir('tiquetes');
    return;
  }

  // Pestañas de rutas
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    estado.tabRutas = tab.dataset.tab;
    $$('.tab').forEach(t => t.classList.toggle('activa', t === tab));
    pintarRutas();
    return;
  }

  // Acciones con nombre
  const accion = e.target.closest('[data-accion]');
  if (!accion) return;
  ({
    'alternar-auth': alternarAuth,
    'entrar': entrar,
    'crear-cuenta': crearCuenta,
    'cerrar-sesion': cerrarSesion,
    'buscar-desde-home': buscarDesdeHome,
    'mi-ubicacion': mostrarMiUbicacion,
    'volver-detalle': () => ir('asientos'),
    'volver-horarios': () => ir('detalle-ruta'),
    'continuar-asientos': continuarAlPago,
    'olvide-clave': abrirRecuperar,
    'volver-login': volverALogin,
    'enviar-codigo': enviarCodigo,
    'reenviar-codigo': reenviarCodigo,
    'guardar-clave': guardarClaveNueva,
    'guardar-perfil': guardarPerfil,
    'nuevo-pago': abrirNuevoPago,
    'guardar-pago': guardarPago,
    'pagar': pagar,
    'enviar-reporte': enviarReporte,
  }[accion.dataset.accion] || (() => {}))();
});

// Interruptores de preferencias
document.addEventListener('change', (e) => {
  const pref = e.target.closest('[data-preferencia]');
  if (pref) guardarPreferencia(pref.dataset.preferencia, pref.checked);
  const tipo = e.target.closest('#np-tipo');
  if (tipo) cambiarTipoPago();
});

// Buscador de rutas
$('#rutas-buscar').addEventListener('input', (e) => {
  estado.filtro = e.target.value;
  pintarRutas();
});

// Enter para enviar los formularios de acceso
['login-clave', 'login-correo'].forEach(id => {
  $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
});
['reg-clave', 'reg-correo', 'reg-nombre'].forEach(id => {
  $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') crearCuenta(); });
});

$('#rec-correo').addEventListener('keydown', e => { if (e.key === 'Enter') enviarCodigo(); });
['rec-clave', 'rec-clave2'].forEach(id => {
  $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') guardarClaveNueva(); });
});
/* ---------- 18. Arranque ---------- */
(async function iniciar() {
  prepararCasillas();

  const carga = $('#carga-inicial');
  const fallo = (mensaje) => {
    if (carga) carga.innerHTML =
      `<div class="aviso-fallo" style="margin:24px">${mensaje}</div>`;
  };

  try {
    // El catálogo es público: se puede pedir antes de iniciar sesión
    await cargarCatalogo();
  } catch (e) {
    return fallo('No pudimos conectar con el servidor. Revisá tu conexión y recargá la página.');
  }

  // ¿Se abrió desde el enlace de recuperación del correo?
  if (await revisarEnlaceDeRecuperacion()) {
    if (carga) carga.style.display = 'none';
    return;
  }

  try {
    const sesion = await Api.sesionActual();
    if (sesion) {
      await cargarDatosDeUsuario();
      if (carga) carga.style.display = 'none';
      ir('home');
    } else {
      if (carga) carga.style.display = 'none';
      ir('bienvenida');
    }
  } catch (e) {
    // Si la sesión guardada ya no sirve, se empieza de nuevo
    await Api.salir().catch(() => {});
    if (carga) carga.style.display = 'none';
    ir('bienvenida');
  }

  // Cada minuto revisa si toca mostrar el aviso de "sale en 15 minutos"
  setInterval(actualizarPuntoNotif, 60000);
})();
