/* Syncro — utilidades.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 4. Utilidades ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function colones(n) {
  return '₡' + n.toLocaleString('es-CR');
}

function iniciales(nombre) {
  return (nombre || '?').trim().charAt(0).toUpperCase();
}

function horaCorta(fecha) {
  return new Date(fecha).toLocaleTimeString('es-CR', { hour:'numeric', minute:'2-digit', hour12:true });
}

function fechaRelativa(fecha) {
  const d = new Date(fecha);
  const hoy = new Date();
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === manana.toDateString()) return 'Mañana';
  return d.toLocaleDateString('es-CR', { day:'numeric', month:'short' });
}

function toast(mensaje) {
  const t = $('#toast');
  t.textContent = mensaje;
  t.classList.add('visible');
  clearTimeout(t._temporizador);
  t._temporizador = setTimeout(() => t.classList.remove('visible'), 2600);
}

