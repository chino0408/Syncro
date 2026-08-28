/* Syncro — estado.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 3. Estado de la aplicación ---------- */
let estado = {
  sesion: Guardado.leer('syncro_sesion', null),
  usuarios: Guardado.leer('syncro_usuarios', []),
  tiquetes: Guardado.leer('syncro_tiquetes', []),
  favoritas: Guardado.leer('syncro_favoritas', []),
  notificaciones: Guardado.leer('syncro_notificaciones', []),
  reportes: Guardado.leer('syncro_reportes', []),
  // Estado temporal (no se guarda)
  pantalla: 'bienvenida',
  modoAuth: 'login',
  tabRutas: 'todas',
  filtro: '',
  rutaAbierta: null,
  compra: null,
  pagoElegido: 'p1',
};

function persistir() {
  Guardado.escribir('syncro_sesion', estado.sesion);
  Guardado.escribir('syncro_usuarios', estado.usuarios);
  Guardado.escribir('syncro_tiquetes', estado.tiquetes);
  Guardado.escribir('syncro_favoritas', estado.favoritas);
  Guardado.escribir('syncro_notificaciones', estado.notificaciones);
  Guardado.escribir('syncro_reportes', estado.reportes);
}
