/* Syncro — auth.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 6. Autenticación ---------- */
function alternarAuth() {
  estado.modoAuth = estado.modoAuth === 'login' ? 'registro' : 'login';
  const esLogin = estado.modoAuth === 'login';
  $('#form-login').style.display = esLogin ? 'block' : 'none';
  $('#form-registro').style.display = esLogin ? 'none' : 'block';
  $('#link-alternar').textContent = esLogin ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión';
  $('#bienvenida-tag').innerHTML = esLogin
    ? 'Consultá rutas, comprá tu tiquete<br>y viajá sin filas.'
    : 'Creá tu cuenta y empezá<br>a viajar sin filas.';
  ocultarError('#auth-error');
}

function mostrarError(sel, mensaje) {
  const e = $(sel);
  e.textContent = mensaje;
  e.classList.add('visible');
}
function ocultarError(sel) {
  $(sel).classList.remove('visible');
}

function entrar() {
  const correo = $('#login-correo').value.trim().toLowerCase();
  const clave = $('#login-clave').value;

  if (!correo || !clave) {
    return mostrarError('#auth-error', 'Completá tu correo y contraseña.');
  }
  const usuario = estado.usuarios.find(u => u.correo === correo);
  if (!usuario || usuario.clave !== clave) {
    return mostrarError('#auth-error', 'Correo o contraseña incorrectos.');
  }
  ocultarError('#auth-error');
  estado.sesion = { nombre: usuario.nombre, correo: usuario.correo };
  persistir();
  $('#login-clave').value = '';
  ir('home');
  toast('Hola de nuevo, ' + usuario.nombre.split(' ')[0]);
}

function crearCuenta() {
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
  if (estado.usuarios.some(u => u.correo === correo)) {
    return mostrarError('#auth-error', 'Ese correo ya tiene una cuenta. Iniciá sesión.');
  }

  ocultarError('#auth-error');
  estado.usuarios.push({ nombre, correo, clave });
  estado.sesion = { nombre, correo };
  persistir();
  $('#reg-clave').value = '';
  ir('home');
  toast('Cuenta creada. Bienvenido a Syncro.');
}

function cerrarSesion() {
  estado.sesion = null;
  persistir();
  estado.modoAuth = 'registro';
  alternarAuth(); // deja el formulario en "login"
  ir('bienvenida');
  toast('Cerraste sesión.');
}
