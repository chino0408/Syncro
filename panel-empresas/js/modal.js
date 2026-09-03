/* Syncro Admin — modal.js
   Una sola ventana modal que arma su formulario según los campos
   que se le pasen. Todas las pantallas de alta y edición la usan. */

let _alGuardar = null;

/* campos: [{ id, etiqueta, tipo, valor, opciones, ayuda, ancho }]
   tipo: texto | numero | correo | select | textarea | lista        */
function abrirModal({ titulo, sub, campos, guardarTexto, alGuardar }) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-sub').textContent = sub || '';
  $('#modal-guardar').textContent = guardarTexto || 'Guardar';

  const cuerpo = $('#modal-cuerpo');
  cuerpo.innerHTML = `<div class="aviso-error" id="modal-error"></div>` +
    agruparCampos(campos);

  _alGuardar = alGuardar;
  $('#velo').classList.add('visible');

  const primero = cuerpo.querySelector('input, select, textarea');
  if (primero) setTimeout(() => primero.focus(), 60);
}

/* Los campos marcados con ancho:'mitad' se emparejan en una fila */
function agruparCampos(campos) {
  let html = '';
  let i = 0;
  while (i < campos.length) {
    const actual = campos[i];
    const siguiente = campos[i + 1];
    if (actual.ancho === 'mitad' && siguiente && siguiente.ancho === 'mitad') {
      html += `<div class="campo-fila">${campoHtml(actual)}${campoHtml(siguiente)}</div>`;
      i += 2;
    } else {
      html += campoHtml(actual);
      i += 1;
    }
  }
  return html;
}

function campoHtml(c) {
  const v = c.valor == null ? '' : c.valor;
  let control;

  if (c.tipo === 'select') {
    const ops = c.opciones.map(o =>
      `<option value="${limpio(o.valor)}" ${String(o.valor) === String(v) ? 'selected' : ''}>${limpio(o.texto)}</option>`
    ).join('');
    control = `<select id="${c.id}">${ops}</select>`;
  } else if (c.tipo === 'textarea' || c.tipo === 'lista') {
    const texto = c.tipo === 'lista' && Array.isArray(v) ? v.join('\n') : v;
    control = `<textarea id="${c.id}" placeholder="${limpio(c.marcador || '')}">${limpio(texto)}</textarea>`;
  } else {
    const tipoInput = c.tipo === 'numero' ? 'number' : (c.tipo === 'correo' ? 'email' : 'text');
    control = `<input type="${tipoInput}" id="${c.id}" value="${limpio(v)}" placeholder="${limpio(c.marcador || '')}">`;
  }

  return `
    <div class="campo">
      <label for="${c.id}">${limpio(c.etiqueta)}</label>
      ${control}
      ${c.ayuda ? `<div class="ayuda">${limpio(c.ayuda)}</div>` : ''}
    </div>`;
}

function cerrarModal() {
  $('#velo').classList.remove('visible');
  _alGuardar = null;
}

/* Lee el valor actual de un campo del modal */
function valorCampo(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* Lee un campo de tipo lista (una línea por elemento) */
function valorLista(id) {
  return valorCampo(id).split('\n').map(s => s.trim()).filter(Boolean);
}

function errorModal(mensaje) {
  mostrarError('#modal-error', mensaje);
}

/* Confirmación simple para acciones destructivas */
function confirmar({ titulo, sub, textoBoton, alConfirmar }) {
  abrirModal({
    titulo, sub,
    campos: [],
    guardarTexto: textoBoton || 'Eliminar',
    // alConfirmar puede escribir en la base, así que se espera antes
    // de cerrar. Si falla, ella misma avisa.
    alGuardar: async () => { await alConfirmar(); return true; },
  });
  const boton = $('#modal-guardar');
  boton.classList.remove('btn-primario');
  boton.classList.add('btn-peligro');
}

/* Devuelve el botón guardar a su estilo normal al abrir un modal común */
function restablecerBotonModal() {
  const boton = $('#modal-guardar');
  boton.classList.remove('btn-peligro');
  boton.classList.add('btn-primario');
}
