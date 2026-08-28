/* Syncro — navegacion.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 5. Navegación ---------- */
const PANTALLAS_CON_NAV = ['home','rutas','tiquetes','perfil'];

function ir(pantalla) {
  estado.pantalla = pantalla;
  $$('.screen').forEach(s => s.classList.remove('active'));
  const destino = $('#pantalla-' + pantalla);
  if (destino) destino.classList.add('active');

  // Barra inferior: visible solo en las pantallas raíz + secundarias con contexto
  const sinNav = ['bienvenida', 'compra', 'asientos', 'recuperar'];
  const mostrarNav = estado.sesion && !sinNav.includes(pantalla);
  $('#nav-inferior').style.display = mostrarNav ? 'flex' : 'none';

  // Marcar pestaña activa
  $$('.nav-item').forEach(b => {
    b.classList.toggle('activa', b.dataset.ir === pantalla);
  });

  // Refrescar el contenido de la pantalla
  const refresco = {
    home: pintarHome,
    rutas: pintarRutas,
    tiquetes: pintarTiquetes,
    perfil: pintarPerfil,
    notificaciones: pintarNotificaciones,
    'detalle-ruta': pintarDetalleRuta,
    asientos: pintarAsientos,
    compra: pintarCompra,
    'ayuda-reporte': prepararReporte,
  }[pantalla];
  if (refresco) refresco();

  // Volver arriba al cambiar de pantalla
  const cont = destino && destino.querySelector('.contenido');
  if (cont) cont.scrollTop = 0;
}
