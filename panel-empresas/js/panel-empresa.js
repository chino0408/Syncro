/* Syncro Admin — panel-empresa.js
   Datos de la empresa y restablecimiento de la demo. */

function pintarEmpresa() {
  $('#emp-razon').value  = estado.empresa.razon;
  $('#emp-cedula').value = estado.empresa.cedula;
  $('#emp-tel').value    = estado.empresa.telefono;
  $('#emp-correo').value = estado.empresa.correo;
}

function guardarEmpresa() {
  const razon = $('#emp-razon').value.trim();
  const correo = $('#emp-correo').value.trim();

  if (!razon)  return aviso('Escribí el nombre comercial de la empresa', 'error');
  if (!correo) return aviso('Escribí un correo de contacto', 'error');

  estado.empresa.razon    = razon;
  estado.empresa.cedula   = $('#emp-cedula').value.trim();
  estado.empresa.telefono = $('#emp-tel').value.trim();
  estado.empresa.correo   = correo;
  persistir();

  $('#emp-sigla').textContent  = siglas(razon);
  $('#emp-nombre').textContent = razon;
  aviso('Datos guardados');
}

function restablecerDemo() {
  confirmar({
    titulo: 'Restablecer los datos de ejemplo',
    sub: 'Se borran las rutas, unidades, choferes y salidas que hayas creado, y el panel vuelve al estado inicial.',
    textoBoton: 'Restablecer todo',
    alConfirmar: () => {
      cargarDatosEjemplo();
      pintarEmpresa();
      actualizarGlobo();
      irA('resumen');
      aviso('Datos restablecidos');
    },
  });
}
