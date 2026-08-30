/* Syncro — recuperar.js
   Recuperación de contraseña.

   Ya no hay código simulado: Supabase envía un correo real con un
   enlace. Al abrirlo, la persona vuelve a la app con una sesión
   temporal que le permite escribir su contraseña nueva. */

function abrirRecuperar() {
  const correoEscrito = $('#login-correo').value.trim();
  $('#rec-correo').value = correoEscrito;
  mostrarPasoRecuperar(1);
  ir('recuperar');
}

function mostrarPasoRecuperar(paso) {
  [1, 2, 3].forEach(n => {
    const bloque = $('#rec-paso-' + n);
    if (bloque) bloque.style.display = n === paso ? 'block' : 'none';
    const punto = $('#rec-punto-' + n);
    if (punto) {
      punto.classList.toggle('activo', n === paso);
      punto.classList.toggle('hecho', n < paso);
    }
  });
  ocultarError('#rec-error');
}

/* ---------- Paso 1: pedir el correo ---------- */
async function enviarCodigo() {
  const correo = $('#rec-correo').value.trim().toLowerCase();

  if (!correo) {
    return mostrarError('#rec-error', 'Escribí el correo de tu cuenta.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return mostrarError('#rec-error', 'Revisá el correo, no parece válido.');
  }

  ocultarError('#rec-error');
  const boton = $('[data-accion="enviar-codigo"]');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Enviando…';

  try {
    await Api.pedirRecuperacion(correo);
    $('#rec-correo-envio').textContent = correo;
    mostrarPasoRecuperar(2);
  } catch (e) {
    mostrarError('#rec-error', e.message);
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

/* ---------- Paso 2: esperar el correo ----------
   No hay código que escribir: el enlace del correo trae la sesión. */
async function reenviarCodigo() {
  const correo = $('#rec-correo').value.trim().toLowerCase();
  if (!correo) return mostrarPasoRecuperar(1);
  try {
    await Api.pedirRecuperacion(correo);
    toast('Te enviamos el correo de nuevo');
  } catch (e) {
    mostrarError('#rec-error', e.message);
  }
}

/* ---------- Paso 3: contraseña nueva ----------
   Se llega acá desde el enlace del correo, que deja una sesión de
   recuperación abierta. */
async function guardarClaveNueva() {
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

  ocultarError('#rec-error');
  try {
    await Api.cambiarClave(clave);
    await Api.salir();
    volverALogin();
    toast('Contraseña actualizada. Iniciá sesión.');
  } catch (e) {
    mostrarError('#rec-error', e.message);
  }
}

function volverALogin() {
  estado.modoAuth = 'registro';
  alternarAuth();          // deja el formulario en modo login
  ocultarError('#auth-error');
  ir('bienvenida');
}

/* Si la app se abrió desde el enlace del correo, Supabase deja una
   sesión de recuperación. En ese caso se salta directo al paso 3. */
async function revisarEnlaceDeRecuperacion() {
  const hash = window.location.hash || '';
  if (!hash.includes('type=recovery')) return false;

  history.replaceState(null, '', window.location.pathname);
  mostrarPasoRecuperar(3);
  ir('recuperar');
  return true;
}

/* Las casillas de código ya no se usan: el enlace del correo
   reemplaza al código de seis dígitos. */
function prepararCasillas() { /* sin efecto */ }
