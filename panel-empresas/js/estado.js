/* Syncro Admin — estado.js
   Lo que el panel tiene cargado en este momento.

   Antes esto se guardaba en el navegador. Ahora la fuente de verdad es
   la base de datos: el estado es solo una copia de trabajo que se llena
   al entrar y se mantiene al día después de cada operación.

   Por eso ya no existe `persistir()`. Cada cambio se escribe en la base
   a través de `api.js` y, si la escritura salió bien, se refleja acá.
   El orden importa: primero la base, después la pantalla. Así el panel
   nunca muestra algo que no quedó guardado. */

let estado = {
  sesion:    null,   // sesión de Supabase
  empresaId: null,   // id numérico de la empresa del administrador
  empresa:   null,   // { razon, cedula, telefono, correo }
  rutas:     [],
  flota:     [],
  choferes:  [],
  salidas:   [],
  reportes:  [],
  paradas:   [],     // catálogo, para resolver los recorridos

  // Temporal, no viaja a ninguna parte
  vista: 'resumen',
  filtros: { horarios: '', rutas: '', flota: '', choferes: '' },
};


/* Trae todo desde la base y lo deja listo para pintar */
async function cargarDatos() {
  const d = await Api.cargarTodo();

  estado.empresaId = d.empresaId;
  estado.empresa   = d.empresa;
  estado.rutas     = d.rutas;
  estado.flota     = d.flota;
  estado.choferes  = d.choferes;
  estado.salidas   = d.salidas;
  estado.reportes  = d.reportes;
  estado.paradas   = d.paradas;
}


/* Vuelve a leer solo las salidas.

   Hace falta después de tocar rutas, buses o choferes: la vista de
   ocupación trae la capacidad y los tiquetes vendidos de cada salida,
   y esos números cambian cuando cambia lo que está asignado. */
async function recargarSalidas() {
  const ids = estado.rutas.map(r => Number(r.id));
  estado.salidas = await Api.cargarSalidas(ids);
}


/* Muestra u oculta el velo de "cargando" que cubre el panel */
function cargando(activo) {
  const v = document.getElementById('cargando');
  if (v) v.classList.toggle('visible', !!activo);
}
