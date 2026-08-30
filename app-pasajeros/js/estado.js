/* Syncro — estado.js
   Estado de la aplicación.

   Ahora los datos viven en la base. Este objeto funciona como copia
   local de lo que ya se descargó, para que las pantallas se dibujen
   sin esperar en cada repintado. Se llena al iniciar sesión y se
   actualiza después de cada operación de escritura. */

let RUTAS = [];              // catálogo, se llena desde la base

let estado = {
  sesion: null,              // { id, nombre, correo }
  usuarioId: null,           // id en la tabla usuario
  favoritas: [],
  tiquetes: [],
  notificaciones: [],
  metodosPago: [],
  preferencias: { avisoViaje: true, avisoCompra: true },

  // Temporal, no se guarda
  pantalla: 'bienvenida',
  modoAuth: 'login',
  tabRutas: 'todas',
  filtro: '',
  rutaAbierta: null,
  compra: null,
  pagoElegido: null,
  _salidas: [],
  _vendidos: new Set(),
  _accesibles: [5, 6, 7, 8],
  _capacidad: 48,
};

/* Antes esto guardaba en el navegador. Ahora cada operación escribe
   directamente en la base, así que no hay nada que persistir acá.
   La función se mantiene para no tocar las pantallas que la llaman. */
function persistir() { /* la base ya guarda */ }

/* Trae de la base todo lo de la persona conectada */
async function cargarDatosDeUsuario() {
  const perfil = await Api.perfil();
  estado.usuarioId = perfil.id;
  estado.sesion = { nombre: perfil.nombre, correo: perfil.correo };
  estado.preferencias = {
    avisoViaje: perfil.aviso_viaje,
    avisoCompra: perfil.aviso_compra,
  };

  const [favoritas, tiquetes, notificaciones, metodos] = await Promise.all([
    Api.favoritas(),
    Api.misTiquetes(),
    Api.notificaciones(),
    Api.metodosDePago(),
  ]);

  estado.favoritas = favoritas;
  estado.tiquetes = tiquetes;
  estado.notificaciones = notificaciones;
  estado.metodosPago = metodos;
}

/* El catálogo de rutas es público: se puede cargar antes de entrar */
async function cargarCatalogo() {
  RUTAS = await Api.cargarRutas();
}
