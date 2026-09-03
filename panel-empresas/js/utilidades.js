/* Syncro Admin — utilidades.js
   Funciones cortas que usan todas las vistas. */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function colones(n) {
  return '₡' + Number(n || 0).toLocaleString('es-CR');
}

function hora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function horaAmPm(fecha) {
  return new Date(fecha).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fechaLarga(fecha) {
  const t = new Date(fecha).toLocaleDateString('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function haceCuanto(fecha) {
  const min = Math.round((Date.now() - new Date(fecha)) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function siglas(texto) {
  return (texto || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p.charAt(0).toUpperCase()).join('');
}

/* Evita que texto del usuario rompa el HTML que armamos */
function limpio(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function aviso(mensaje, tipo) {
  const a = $('#aviso');
  a.textContent = mensaje;
  a.className = tipo === 'error' ? 'error visible' : 'visible';
  clearTimeout(a._t);
  a._t = setTimeout(() => { a.className = ''; }, 2800);
}

function mostrarError(sel, mensaje) {
  const e = $(sel);
  if (!e) return;
  e.textContent = mensaje;
  e.classList.add('visible');
}

function ocultarError(sel) {
  const e = $(sel);
  if (e) e.classList.remove('visible');
}

/* Buscadores por nombre */
function buscarRuta(id)   { return estado.rutas.find(r => r.id === id); }
function buscarBus(id)    { return estado.flota.find(b => b.id === id); }
function buscarChofer(id) { return estado.choferes.find(c => c.id === id); }

function nombreRuta(id) {
  const r = buscarRuta(id);
  return r ? `${r.origen} → ${r.destino}` : 'Ruta eliminada';
}

/* Plantilla de estado vacío, reutilizada por todas las vistas */
function vacio(titulo, texto, botonHtml) {
  return `
    <div class="vacio">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <div class="tit">${limpio(titulo)}</div>
      <div class="txt">${limpio(texto)}</div>
      ${botonHtml || ''}
    </div>`;
}

/* Cómo se muestra cada tipo de reporte. No son datos de ejemplo:
   son etiquetas de la interfaz, por eso viven acá y no en la base. */
const ETIQUETAS_REPORTE = {
  retraso: { texto: 'Retraso en ruta', clase: 'rep-retraso' },
  lleno:   { texto: 'Unidad llena',    clase: 'rep-lleno' },
  falla:   { texto: 'Falla mecánica',  clase: 'rep-falla' },
};

/* Etiqueta de estado con su color */
function etiqueta(estadoTexto) {
  const mapa = {
    activa:      ['et-activo',  'Activa'],
    pausada:     ['et-inactivo','Pausada'],
    activo:      ['et-activo',  'Activo'],
    taller:      ['et-falla',   'En taller'],
    disponible:  ['et-activo',  'Disponible'],
    incapacidad: ['et-espera',  'Incapacidad'],
  };
  const [clase, texto] = mapa[estadoTexto] || ['et-inactivo', estadoTexto];
  return `<span class="etiqueta ${clase}">${texto}</span>`;
}
