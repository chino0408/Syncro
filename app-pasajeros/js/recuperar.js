/* Syncro — recuperar.js
   Recuperación de contraseña en tres pasos: correo, código y
   nueva contraseña.

   Sin servidor no se puede enviar un correo de verdad, así que el
   código se muestra en pantalla dentro de un recuadro marcado como
   demo. Cuando exista el backend, ese recuadro desaparece y el
   código viaja por correo; el resto del flujo queda igual. */

const MINUTOS_VIGENCIA = 10;
const INTENTOS_PERMITIDOS = 3;

let recuperacion = null;

function abrirRecuperar() {
  recuperacion = null;
  const correoEscrito = $('#login-correo').value.trim();
  $('#rec-correo').value = correoEscrito;
  mostrarPasoRecuperar(1);
  ir('recuperar');
}

function mostrarPasoRecuperar(paso) {
  [1, 2, 3].forEach(n => {
    $('#rec-paso-' + n).style.display = n === paso ? 'block' : 'none';
    const punto = $('#rec-punto-' + n);
    punto.classList.toggle('activo', n === paso);
    punto.classList.toggle('hecho', n < paso);
  });
  ocultarError('#rec-error');
}

/* ---------- Paso 1: el correo ---------- */
function enviarCodigo() {
  const correo = $('#rec-correo').value.trim().toLowerCase();

  if (!correo) {
    return mostrarError('#rec-error', 'Escribí el correo de tu cuenta.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return mostrarError('#rec-error', 'Revisá el correo, no parece válido.');
  }

  const usuario = estado.usuarios.find(u => u.correo === correo);
  if (!usuario) {
    return mostrarError('#rec-error', 'No hay ninguna cuenta con ese correo.');
  }

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  recuperacion = {
    correo,
    codigo,
    vence: Date.now() + MINUTOS_VIGENCIA * 60000,
    intentos: 0,
  };

  $('#rec-correo-envio').textContent = correo;
  $('#rec-codigo-demo').textContent = codigo;
  limpiarCasillas();
  mostrarPasoRecuperar(2);

  const primera = $('#rec-cod-0');
  if (primera) setTimeout(() => primera.focus(), 80);
}

/* ---------- Paso 2: el código ---------- */
function casillasCodigo() {
  return [0, 1, 2, 3, 4, 5].map(i => $('#rec-cod-' + i));
}

function limpiarCasillas() {
  casillasCodigo().forEach(c => { if (c) c.value = ''; });
}

function codigoEscrito() {
  return casillasCodigo().map(c => (c ? c.value : '')).join('');
}

function verificarCodigo() {
  if (!recuperacion) return abrirRecuperar();

  const escrito = codigoEscrito();
  if (escrito.length < 6) {
    return mostrarError('#rec-error', 'Escribí los seis dígitos del código.');
  }

  if (Date.now() > recuperacion.vence) {
    return mostrarError('#rec-error', 'El código venció. Pedí uno nuevo.');
  }

  if (escrito !== recuperacion.codigo) {
    recuperacion.intentos++;
    const quedan = INTENTOS_PERMITIDOS - recuperacion.intentos;
    limpiarCasillas();
    const primera = $('#rec-cod-0');
    if (primera) primera.focus();

    if (quedan <= 0) {
      recuperacion = null;
      mostrarPasoRecuperar(1);
      return mostrarError('#rec-error', 'Demasiados intentos. Pedí un código nuevo.');
    }
    return mostrarError('#rec-error',
      `El código no coincide. Te ${quedan === 1 ? 'queda 1 intento' : 'quedan ' + quedan + ' intentos'}.`);
  }

  $('#rec-clave').value = '';
  $('#rec-clave2').value = '';
  mostrarPasoRecuperar(3);
  const campo = $('#rec-clave');
  if (campo) setTimeout(() => campo.focus(), 80);
}

function reenviarCodigo() {
  if (!recuperacion) return abrirRecuperar();
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  recuperacion.codigo = codigo;
  recuperacion.vence = Date.now() + MINUTOS_VIGENCIA * 60000;
  recuperacion.intentos = 0;
  $('#rec-codigo-demo').textContent = codigo;
  limpiarCasillas();
  ocultarError('#rec-error');
  const primera = $('#rec-cod-0');
  if (primera) primera.focus();
  toast('Te enviamos un código nuevo');
}

/* ---------- Paso 3: la contraseña nueva ---------- */
function guardarClaveNueva() {
  if (!recuperacion) return abrirRecuperar();

  const clave = $('#rec-clave').value;
  const repetida = $('#rec-clave2').value;

  if (!clave || !repetida) {
    return mostrarError('#rec-error', 'Completá los dos campos.');
  }
  if (clave.length < 6) {
    return mostrarError('#rec-error', 'La contraseña necesita al menos 6 caracteres.');
  }
  if (clave !== repetida) {
    return mostrarError('#rec-error', 'Las dos contraseñas no coinciden.');
  }

  const usuario = estado.usuarios.find(u => u.correo === recuperacion.correo);
  if (!usuario) {
    recuperacion = null;
    mostrarPasoRecuperar(1);
    return mostrarError('#rec-error', 'No encontramos la cuenta. Empezá de nuevo.');
  }

  if (usuario.clave === clave) {
    return mostrarError('#rec-error', 'Esa es tu contraseña actual. Elegí una distinta.');
  }

  usuario.clave = clave;
  persistir();

  const correo = recuperacion.correo;
  recuperacion = null;

  volverALogin();
  $('#login-correo').value = correo;
  $('#login-clave').value = '';
  toast('Contraseña actualizada. Iniciá sesión.');
}

/* ---------- Volver al acceso ---------- */
function volverALogin() {
  recuperacion = null;
  estado.modoAuth = 'registro';
  alternarAuth();          // deja el formulario en modo login
  ocultarError('#auth-error');
  ir('bienvenida');
}

/* Avance automático entre las casillas del código */
function prepararCasillas() {
  casillasCodigo().forEach((casilla, i) => {
    if (!casilla) return;

    casilla.addEventListener('input', () => {
      casilla.value = casilla.value.replace(/\D/g, '').slice(0, 1);
      if (casilla.value && i < 5) {
        const siguiente = $('#rec-cod-' + (i + 1));
        if (siguiente) siguiente.focus();
      }
      if (codigoEscrito().length === 6) verificarCodigo();
    });

    casilla.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !casilla.value && i > 0) {
        const anterior = $('#rec-cod-' + (i - 1));
        if (anterior) { anterior.focus(); anterior.value = ''; }
      }
      if (e.key === 'Enter') verificarCodigo();
    });

    // Pegar el código completo de una vez
    casilla.addEventListener('paste', (e) => {
      e.preventDefault();
      const texto = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      casillasCodigo().forEach((c, j) => { if (c) c.value = texto[j] || ''; });
      if (texto.length === 6) verificarCodigo();
    });
  });
}
