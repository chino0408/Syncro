/* Syncro — pantalla-perfil.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 15. Pantalla: Perfil ---------- */
function pintarPerfil() {
  if (!estado.sesion) return ir('bienvenida');
  $('#perfil-avatar').textContent = iniciales(estado.sesion.nombre);
  $('#perfil-nombre').textContent = estado.sesion.nombre;
  $('#perfil-correo').textContent = estado.sesion.correo;
  $('#stat-viajes').textContent = estado.tiquetes.length;
  $('#stat-favoritas').textContent = estado.favoritas.length;
}
