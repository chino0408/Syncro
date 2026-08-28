/* Syncro — datos.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 2. Datos base (catálogo de rutas) ---------- */
const RUTAS = [
  { id:'r1', origen:'San José', destino:'Cartago', precio:650, frecuencia:15,
    paradas:['San José (Terminal)','Curridabat','Tres Ríos','Taras','Cartago Centro'] },
  { id:'r2', origen:'San José', destino:'Alajuela', precio:700, frecuencia:20,
    paradas:['San José (Terminal)','La Uruca','Río Segundo','Alajuela Centro'] },
  { id:'r3', origen:'Heredia', destino:'San José', precio:600, frecuencia:10,
    paradas:['Heredia Centro','Santo Domingo','Tibás','San José (Terminal)'] },
  { id:'r4', origen:'San José', destino:'Puntarenas', precio:2900, frecuencia:60,
    paradas:['San José (Terminal)','Atenas','Orotina','Caldera','Puntarenas Centro'] },
  { id:'r5', origen:'San José', destino:'Liberia', precio:4200, frecuencia:90,
    paradas:['San José (Terminal)','Puntarenas','Cañas','Bagaces','Liberia Centro'] },
  { id:'r6', origen:'Cartago', destino:'Turrialba', precio:1450, frecuencia:30,
    paradas:['Cartago Centro','Paraíso','Cervantes','Turrialba Centro'] },
];

const METODOS_PAGO = [
  { id:'p1', nombre:'Tarjeta terminada en 4821', detalle:'Visa · Débito', icono:'tarjeta' },
  { id:'p2', nombre:'SINPE Móvil', detalle:'8888-4821', icono:'movil' },
];
