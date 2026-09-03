/* Syncro Admin — panel-empresa.js
   Datos de la empresa y restablecimiento de la demo. */

function pintarEmpresa() {
  $('#emp-razon').value  = estado.empresa.razon;
  $('#emp-cedula').value = estado.empresa.cedula;
  $('#emp-tel').value    = estado.empresa.telefono;
  $('#emp-correo').value = estado.empresa.correo;
}

async function guardarEmpresa() {
  const razon = $('#emp-razon').value.trim();
  const correo = $('#emp-correo').value.trim();

  if (!razon)  return aviso('Escribí el nombre comercial de la empresa', 'error');
  if (!correo) return aviso('Escribí un correo de contacto', 'error');

  const datos = {
    razon,
    cedula: $('#emp-cedula').value.trim(),
    telefono: $('#emp-tel').value.trim(),
    correo,
  };

  const boton = $('[data-accion="guardar-empresa"]');
  if (boton) boton.disabled = true;

  try {
    await Api.actualizarEmpresa(estado.empresa.id, datos);
    Object.assign(estado.empresa, datos);
    $('#emp-sigla').textContent  = siglas(razon);
    $('#emp-nombre').textContent = razon;
    aviso('Datos guardados');
  } catch (e) {
    aviso(e.message, 'error');
  } finally {
    if (boton) boton.disabled = false;
  }
}
