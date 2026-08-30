/* Syncro — auth.js
   Acceso a la app. Las contraseñas las maneja Supabase: nunca pasan
   por nuestro código ni se guardan en nuestras tablas. */

function alternarAuth() {
  estado.modoAuth = estado.modoAuth === 'login' ? 'registro' : 'login';
  const esLogin = estado.modoAuth === 'login';
  $('#form-login').style.display = esLogin ? 'block' : 'none';
  $('#form-registro').style.display = esLogin ? 'none' : 'block';
  $('#link-alternar').textContent = esLogin
    ? '¿No tenés cuenta? Registrate'
    : '¿Ya tenés cuenta? Iniciá sesión';
  $('#bienvenida-tag').innerHTML = esLogin
    ? 'Consultá rutas, comprá tu tiquete<br>y viajá sin filas.'
    : 'Creá tu cuenta y empezá<br>a viajar sin filas.';
  ocultarError('#auth-error');
}

/* Deja el botón en estado de espera mientras responde el servidor */
function ocupado(selector, texto) {
  const b = $(selector);
  if (!b) return () => {};
  const original = b.innerHTML;
  b.disabled = true;
  b.textContent = texto;
  return () => { b.disabled = false; b.innerHTML = original; };
}

async function entrar() {
  const correo = $('#login-correo').value.trim().toLowerCase();
  const clave = $('#login-clave').value;

  if (!correo || !clave) {
    return mostrarError('#auth-error', 'Completá tu correo y contraseña.');
  }

  ocultarError('#auth-error');
  const listo = ocupado('[data-accion="entrar"]', 'Entrando…');

  try {
    await Api.entrar(correo, clave);
    await cargarDatosDeUsuario();
    $('#login-clave').value = '';
    ir('home');
    toast('Hola de nuevo, ' + estado.sesion.nombre.split(' ')[0]);
  } catch (e) {
    mostrarError('#auth-error', e.message);
  } finally {
    listo();
  }
}

async function crearCuenta() {
  const nombre = $('#reg-nombre').value.trim();
  const correo = $('#reg-correo').value.trim().toLowerCase();
  const clave = $('#reg-clave').value;

  if (!nombre || !correo || !clave) {
    return mostrarError('#auth-error', 'Completá todos los campos para crear tu cuenta.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return mostrarError('#auth-error', 'Revisá el correo, no parece válido.');
  }
  if (clave.length < 6) {
    return mostrarError('#auth-error', 'La contraseña necesita al menos 6 caracteres.');
  }

  ocultarError('#auth-error');
  const listo = ocupado('[data-accion="crear-cuenta"]', 'Creando cuenta…');

  try {
    await Api.registrar(nombre, correo, clave);
    await cargarDatosDeUsuario();
    $('#reg-clave').value = '';
    ir('home');
    toast('Cuenta creada. Bienvenido a Syncro.');
  } catch (e) {
    mostrarError('#auth-error', e.message);
  } finally {
    listo();
  }
}

async function cerrarSesion() {
  await Api.salir();
  estado.sesion = null;
  estado.usuarioId = null;
  estado.tiquetes = [];
  estado.favoritas = [];
  estado.notificaciones = [];
  estado.metodosPago = [];
  estado.modoAuth = 'registro';
  alternarAuth();               // deja el formulario en modo login
  ir('bienvenida');
  toast('Cerraste sesión.');
}
