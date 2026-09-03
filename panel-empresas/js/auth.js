/* Syncro Admin — auth.js
   Acceso de la empresa al panel, contra Supabase Auth.

   La contraseña ya no vive en ningún archivo del repositorio: la
   guarda y la verifica Supabase. */

async function entrar() {
  const correo = $('#acc-correo').value.trim().toLowerCase();
  const clave  = $('#acc-clave').value;

  if (!correo || !clave) {
    return mostrarError('#acceso-error', 'Escribí el correo y la contraseña de la empresa.');
  }

  ocultarError('#acceso-error');
  const boton = $('[data-accion="entrar"]');
  boton.disabled = true;
  boton.textContent = 'Entrando…';

  try {
    estado.sesion = await Api.entrar(correo, clave);
    await cargarDatos();
    $('#acc-clave').value = '';
    mostrarPanel();
    aviso('Sesión iniciada');
  } catch (e) {
    // Si la cuenta existe pero no tiene empresa, la sesión quedó abierta
    // y hay que cerrarla para no dejar el panel a medias.
    if (estado.sesion) { await Api.salir(); estado.sesion = null; }
    mostrarError('#acceso-error', e.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar al panel';
  }
}


/* Primera vez: crea la cuenta de acceso para una empresa que Syncro ya
   dio de alta. El disparador de la base enlaza la cuenta con su ficha
   por el correo; si no hay ficha, la cuenta queda sin empresa y el
   panel lo avisa al intentar cargar. */
async function activarCuenta() {
  const correo = $('#acc-correo').value.trim().toLowerCase();
  const clave  = $('#acc-clave').value;

  if (!correo || !clave) {
    return mostrarError('#acceso-error', 'Escribí el correo de la empresa y la contraseña que querés usar.');
  }
  if (clave.length < 6) {
    return mostrarError('#acceso-error', 'La contraseña necesita al menos 6 caracteres.');
  }

  ocultarError('#acceso-error');
  try {
    estado.sesion = await Api.activarCuenta(correo, clave);
    await cargarDatos();
    $('#acc-clave').value = '';
    mostrarPanel();
    aviso('Cuenta activada');
  } catch (e) {
    if (estado.sesion) { await Api.salir(); estado.sesion = null; }
    mostrarError('#acceso-error', e.message);
  }
}


async function salir() {
  await Api.salir();
  estado.sesion = null;
  estado.empresa = null;
  estado.rutas = []; estado.flota = []; estado.choferes = [];
  estado.salidas = []; estado.reportes = [];

  $('#panel').classList.remove('visible');
  $('#acceso').style.display = 'flex';
  aviso('Cerraste sesión');
}


function mostrarPanel() {
  $('#acceso').style.display = 'none';
  $('#panel').classList.add('visible');
  $('#emp-sigla').textContent = siglas(estado.empresa.razon);
  $('#emp-nombre').textContent = estado.empresa.razon;
  actualizarGlobo();
  irA('resumen');
}
