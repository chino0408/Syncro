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
    'volver-detalle': () => ir('detalle-ruta'),
    'pagar': pagar,
    'enviar-reporte': enviarReporte,
  }[accion.dataset.accion] || (() => {}))();
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
/* ---------- 18. Arranque ---------- */
(function iniciar() {
  // Cuenta de prueba, para poder entrar sin registrarse
  if (!estado.usuarios.length) {
    estado.usuarios.push({ nombre:'Usuario Demo', correo:'demo@syncro.cr', clave:'123456' });
    persistir();
  }
  if (estado.sesion) {
    ir('home');
  } else {
    ir('bienvenida');
  }
  actualizarPuntoNotif();

  // Revisa cada minuto si toca mostrar el aviso de "sale en 15 minutos"
  setInterval(actualizarPuntoNotif, 60000);
})();
