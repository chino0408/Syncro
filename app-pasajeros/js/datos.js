/* Syncro — datos.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 2. Datos base (catálogo de rutas) ---------- */
/* Coordenadas reales de las paradas, para el mapa.
   Son aproximadas al centro de cada localidad: alcanzan para
   ubicar el recorrido y calcular distancias. */
const COORDENADAS = {
  'San José (Terminal)': [9.9333, -84.0833],
  'Curridabat':          [9.9178, -84.0333],
  'Tres Ríos':           [9.9060, -84.0089],
  'Taras':               [9.8790, -83.9560],
  'Cartago Centro':      [9.8644, -83.9194],
  'La Uruca':            [9.9508, -84.1178],
  'Río Segundo':         [9.9880, -84.1930],
  'Alajuela Centro':     [10.0162, -84.2116],
  'Heredia Centro':      [9.9981, -84.1197],
  'Santo Domingo':       [9.9797, -84.0897],
  'Tibás':               [9.9600, -84.0800],
  'Atenas':              [9.9800, -84.3800],
  'Orotina':             [9.9070, -84.5230],
  'Caldera':             [9.9150, -84.7200],
  'Puntarenas Centro':   [9.9763, -84.8384],
  'Paraíso':             [9.8383, -83.8656],
  'Cervantes':           [9.8770, -83.8180],
  'Turrialba Centro':    [9.9047, -83.6811],
  'Puntarenas':          [9.9763, -84.8384],
  'Cañas':               [10.4300, -85.0930],
  'Bagaces':             [10.5240, -85.2530],
  'Liberia Centro':      [10.6339, -85.4377],
};

function coordenadasDe(nombreParada) {
  return COORDENADAS[nombreParada] || null;
}
