/* Syncro Admin — auth.js
   Acceso de la empresa al panel. */

function entrar() {
  const correo = $('#acc-correo').value.trim().toLowerCase();
  const clave  = $('#acc-clave').value;

  if (!correo || !clave) {
    return mostrarError('#acceso-error', 'Escribí el correo y la contraseña de la empresa.');
  }
  if (correo !== estado.empresa.correo.toLowerCase() || clave !== estado.empresa.clave) {
    return mostrarError('#acceso-error', 'Ese correo y contraseña no coinciden con ninguna empresa.');
  }

  ocultarError('#acceso-error');
  estado.sesion = { correo: estado.empresa.correo };
  persistir();
  $('#acc-clave').value = '';
  mostrarPanel();
  aviso('Sesión iniciada');
}

function salir() {
  estado.sesion = null;
  persistir();
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
