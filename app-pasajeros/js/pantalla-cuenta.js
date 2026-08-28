/* Syncro — pantalla-cuenta.js
   Las tres pantallas que cuelgan del perfil: editar datos,
   métodos de pago y preferencias de notificaciones. */

/* ---------- Editar perfil ---------- */
function pintarEditarPerfil() {
  if (!estado.sesion) return ir('bienvenida');
  const usuario = estado.usuarios.find(u => u.correo === estado.sesion.correo);
  $('#ep-nombre').value = estado.sesion.nombre;
  $('#ep-correo').value = estado.sesion.correo;
  $('#ep-telefono').value = (usuario && usuario.telefono) || '';
  ocultarError('#ep-error');
}

function guardarPerfil() {
  const nombre = $('#ep-nombre').value.trim();
  const correo = $('#ep-correo').value.trim().toLowerCase();
  const telefono = $('#ep-telefono').value.trim();

  if (!nombre) return mostrarError('#ep-error', 'Escribí tu nombre.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return mostrarError('#ep-error', 'Revisá el correo, no parece válido.');
  }

  const usuario = estado.usuarios.find(u => u.correo === estado.sesion.correo);
  if (!usuario) return mostrarError('#ep-error', 'No encontramos tu cuenta.');

  // Si cambia el correo, no puede chocar con otra cuenta
  if (correo !== estado.sesion.correo &&
      estado.usuarios.some(u => u.correo === correo)) {
    return mostrarError('#ep-error', 'Ya hay una cuenta con ese correo.');
  }

  usuario.nombre = nombre;
  usuario.correo = correo;
  usuario.telefono = telefono;
  estado.sesion = { nombre, correo };
  persistir();

  ir('perfil');
  toast('Datos actualizados');
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

function guardarPago() {
  const tipo = $('#np-tipo').value;
  const valor = $('#np-numero').value.trim();

  if (tipo === 'tarjeta') {
    if (!/^\d{4}$/.test(valor)) {
      return mostrarError('#np-error', 'Escribí los últimos cuatro dígitos de la tarjeta.');
    }
    estado.metodosPago.push({
      id: 'p' + Date.now().toString(36),
      nombre: `Tarjeta terminada en ${valor}`,
      detalle: 'Agregada por vos',
      icono: 'tarjeta',
    });
  } else {
    const limpio = valor.replace(/\D/g, '');
    if (limpio.length !== 8) {
      return mostrarError('#np-error', 'El teléfono debe tener ocho dígitos.');
    }
    const formateado = limpio.slice(0, 4) + '-' + limpio.slice(4);
    estado.metodosPago.push({
      id: 'p' + Date.now().toString(36),
      nombre: 'SINPE Móvil',
      detalle: formateado,
      icono: 'movil',
    });
  }

  persistir();
  ir('pagos');
  toast('Método de pago agregado');
}

function quitarPago(id) {
  const metodo = estado.metodosPago.find(m => m.id === id);
  if (!metodo) return;

  estado.metodosPago = estado.metodosPago.filter(m => m.id !== id);
  // Si era el elegido para una compra en curso, se pasa al primero
  if (estado.pagoElegido === id) {
    estado.pagoElegido = estado.metodosPago.length ? estado.metodosPago[0].id : null;
  }
  persistir();
  pintarPagos();
  toast('Método de pago eliminado');
}

/* ---------- Preferencias de notificaciones ---------- */
function pintarPreferencias() {
  $('#pref-viaje').checked = estado.preferencias.avisoViaje;
  $('#pref-compra').checked = estado.preferencias.avisoCompra;
}

function guardarPreferencia(cual, valor) {
  estado.preferencias[cual] = valor;
  persistir();
  toast(valor ? 'Aviso activado' : 'Aviso desactivado');
}
