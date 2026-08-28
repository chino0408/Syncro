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

/* Genera las próximas salidas de una ruta, a partir de la hora actual */
function proximasSalidas(ruta, cantidad = 6) {
  const salidas = [];
  const ahora = new Date();
  let t = new Date(ahora.getTime() + 10 * 60000); // primera salida en 10 min
  // Redondear al múltiplo de frecuencia más cercano
  t.setSeconds(0, 0);
  const resto = t.getMinutes() % (ruta.frecuencia > 30 ? 30 : ruta.frecuencia);
  t = new Date(t.getTime() + (resto === 0 ? 0 : ((ruta.frecuencia > 30 ? 30 : ruta.frecuencia) - resto)) * 60000);

  for (let i = 0; i < cantidad; i++) {
    const salida = new Date(t.getTime() + i * ruta.frecuencia * 60000);
    salidas.push({
      hora: salida.toISOString(),
      asientos: 4 + Math.floor(Math.abs(Math.sin(salida.getTime() / 1e6)) * 26),
    });
  }
  return salidas;
}
