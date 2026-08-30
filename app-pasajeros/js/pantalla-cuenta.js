/* Syncro — pantalla-cuenta.js
   Las tres pantallas que cuelgan del perfil: editar datos,
   métodos de pago y preferencias de notificaciones. */

/* ---------- Editar perfil ---------- */
async function pintarEditarPerfil() {
  if (!estado.sesion) return ir('bienvenida');
  $('#ep-nombre').value = estado.sesion.nombre;
  $('#ep-correo').value = estado.sesion.correo;
  $('#ep-correo').disabled = true;   // el correo es la cuenta, no se cambia acá
  ocultarError('#ep-error');
  try {
    const p = await Api.perfil();
    $('#ep-telefono').value = p.telefono || '';
  } catch (e) { /* si falla se queda vacío */ }
}

async function guardarPerfil() {
  const nombre = $('#ep-nombre').value.trim();
  const telefono = $('#ep-telefono').value.trim();

  if (!nombre) return mostrarError('#ep-error', 'Escribí tu nombre.');

  try {
    await Api.guardarPerfil(estado.usuarioId, { nombre, telefono });
    estado.sesion.nombre = nombre;
    ir('perfil');
    toast('Datos actualizados');
  } catch (e) {
    mostrarError('#ep-error', e.message);
  }
}

/* ---------- Métodos de pago ---------- */
function pintarPagos() {
  const cont = $('#pagos-lista');
  const lista = estado.metodosPago;

  if (!lista.length) {
    cont.innerHTML = plantillaVacio('tarjeta', 'No tenés métodos de pago',
      'Agregá una tarjeta o SINPE Móvil para comprar tiquetes más rápido.');
    return;
  }

  cont.innerHTML = lista.map(m => `
    <div class="fila">
      <div class="fila-izq">
        <div class="fila-icono">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${m.icono === 'tarjeta'
              ? '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'
              : '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>'}
          </svg>
        </div>
        <div style="min-width:0">
          <div class="fila-titulo">${m.nombre}</div>
          <div class="fila-sub">${m.detalle}</div>
        </div>
      </div>
      <button class="btn-quitar" data-quitar-pago="${m.id}" aria-label="Quitar ${m.nombre}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
      </button>
    </div>`).join('');
}

function abrirNuevoPago() {
  $('#np-tipo').value = 'tarjeta';
  $('#np-numero').value = '';
  ocultarError('#np-error');
  cambiarTipoPago();
  ir('nuevo-pago');
}

/* El campo cambia según sea tarjeta o SINPE */
function cambiarTipoPago() {
  const tipo = $('#np-tipo').value;
  const esTarjeta = tipo === 'tarjeta';
  $('#np-label').textContent = esTarjeta ? 'Últimos 4 dígitos' : 'Número de teléfono';
  $('#np-numero').placeholder = esTarjeta ? '4821' : '8888-4821';
  $('#np-ayuda').textContent = esTarjeta
    ? 'Por seguridad solo guardamos los últimos cuatro dígitos.'
    : 'El número asociado a tu cuenta SINPE Móvil.';
}

async function guardarPago() {
  const tipo = $('#np-tipo').value;
  const valor = $('#np-numero').value.trim();
  let tipo_guardar, ref_guardar;

  if (tipo === 'tarjeta') {
    if (!/^\d{4}$/.test(valor)) {
      return mostrarError('#np-error', 'Escribí los últimos cuatro dígitos de la tarjeta.');
    }
    tipo_guardar = 'tarjeta'; ref_guardar = valor;
  } else {
    const limpio = valor.replace(/\D/g, '');
    if (limpio.length !== 8) {
      return mostrarError('#np-error', 'El teléfono debe tener ocho dígitos.');
    }
    const formateado = limpio.slice(0, 4) + '-' + limpio.slice(4);
    tipo_guardar = 'sinpe'; ref_guardar = formateado;
  }

  try {
    await Api.agregarMetodo(estado.usuarioId, tipo_guardar, ref_guardar);
    estado.metodosPago = await Api.metodosDePago();
    ir('pagos');
    toast('Método de pago agregado');
  } catch (e) {
    mostrarError('#np-error', e.message);
  }
}

async function quitarPago(id) {
  const metodo = estado.metodosPago.find(m => m.id === id);
  if (!metodo) return;

  try {
    await Api.quitarMetodo(id);
    estado.metodosPago = await Api.metodosDePago();
    if (estado.pagoElegido === id) {
      estado.pagoElegido = estado.metodosPago.length ? estado.metodosPago[0].id : null;
    }
    pintarPagos();
    toast('Método de pago eliminado');
  } catch (e) {
    toast('No se pudo eliminar');
  }
}

/* ---------- Preferencias de notificaciones ---------- */
function pintarPreferencias() {
  $('#pref-viaje').checked = estado.preferencias.avisoViaje;
  $('#pref-compra').checked = estado.preferencias.avisoCompra;
}

async function guardarPreferencia(cual, valor) {
  const antes = estado.preferencias[cual];
  estado.preferencias[cual] = valor;
  const campo = cual === 'avisoViaje' ? 'aviso_viaje' : 'aviso_compra';
  try {
    await Api.guardarPerfil(estado.usuarioId, { [campo]: valor });
    toast(valor ? 'Aviso activado' : 'Aviso desactivado');
  } catch (e) {
    estado.preferencias[cual] = antes;
    pintarPreferencias();
    toast('No se pudo guardar el cambio');
  }
}
