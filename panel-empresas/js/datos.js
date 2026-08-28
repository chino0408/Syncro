/* Syncro Admin — datos.js
   Datos de ejemplo de una empresa autobusera de Costa Rica.
   En la versión con backend esto vendría de la base de datos. */

const EMPRESA_EJEMPLO = {
  razon: 'Transportes Unidos del Valle',
  cedula: '3-101-482910',
  telefono: '2222-4488',
  correo: 'admin@transportescr.com',
  clave: 'admin123',
};

const RUTAS_EJEMPLO = [
  {
    id: 'r1', origen: 'San José', destino: 'Cartago',
    precio: 650, frecuencia: 15, duracion: 45, estado: 'activa',
    paradas: ['San José (Terminal)', 'Curridabat', 'Tres Ríos', 'Taras', 'Cartago Centro'],
  },
  {
    id: 'r2', origen: 'San José', destino: 'Alajuela',
    precio: 700, frecuencia: 20, duracion: 50, estado: 'activa',
    paradas: ['San José (Terminal)', 'La Uruca', 'Río Segundo', 'Alajuela Centro'],
  },
  {
    id: 'r3', origen: 'Heredia', destino: 'San José',
    precio: 600, frecuencia: 10, duracion: 35, estado: 'activa',
    paradas: ['Heredia Centro', 'Santo Domingo', 'Tibás', 'San José (Terminal)'],
  },
  {
    id: 'r4', origen: 'San José', destino: 'Puntarenas',
    precio: 2900, frecuencia: 60, duracion: 130, estado: 'activa',
    paradas: ['San José (Terminal)', 'Atenas', 'Orotina', 'Caldera', 'Puntarenas Centro'],
  },
  {
    id: 'r5', origen: 'Cartago', destino: 'Turrialba',
    precio: 1450, frecuencia: 30, duracion: 75, estado: 'pausada',
    paradas: ['Cartago Centro', 'Paraíso', 'Cervantes', 'Turrialba Centro'],
  },
];

const FLOTA_EJEMPLO = [
  { id: 'b1', placa: 'SJB-1204', modelo: 'Mercedes-Benz OF-1721', anio: 2019, capacidad: 44, estado: 'activo' },
  { id: 'b2', placa: 'SJB-1198', modelo: 'Volvo B8R', anio: 2021, capacidad: 48, estado: 'activo' },
  { id: 'b3', placa: 'SJB-0876', modelo: 'Hino RK8', anio: 2017, capacidad: 40, estado: 'activo' },
  { id: 'b4', placa: 'SJB-1350', modelo: 'Scania K250', anio: 2022, capacidad: 50, estado: 'activo' },
  { id: 'b5', placa: 'SJB-0742', modelo: 'Mercedes-Benz OH-1526', anio: 2015, capacidad: 42, estado: 'taller' },
];

const CHOFERES_EJEMPLO = [
  { id: 'c1', nombre: 'Marvin Rodríguez', licencia: 'B4-108742', telefono: '8812-4409', estado: 'disponible' },
  { id: 'c2', nombre: 'Kevin Mora', licencia: 'B4-220185', telefono: '8730-1192', estado: 'disponible' },
  { id: 'c3', nombre: 'Luis Fernando Chaves', licencia: 'B4-091337', telefono: '8654-7781', estado: 'disponible' },
  { id: 'c4', nombre: 'Óscar Jiménez', licencia: 'B4-334902', telefono: '8901-2245', estado: 'disponible' },
  { id: 'c5', nombre: 'Alberto Solano', licencia: 'B4-556128', telefono: '8477-3390', estado: 'incapacidad' },
];

/* Reportes que llegan desde la app de pasajeros */
const REPORTES_EJEMPLO = [
  { id: 'x1', tipo: 'retraso', rutaId: 'r1', detalle: 'Presa fuerte a la altura de Taras, el bus lleva unos 20 minutos de atraso.', minutosAtras: 12, visto: false },
  { id: 'x2', tipo: 'lleno', rutaId: 'r3', detalle: 'La unidad de las 6:40 salió llena, se quedó gente en la parada de Santo Domingo.', minutosAtras: 48, visto: false },
  { id: 'x3', tipo: 'falla', rutaId: 'r2', detalle: 'El aire acondicionado no funciona en la unidad SJB-1198.', minutosAtras: 95, visto: false },
  { id: 'x4', tipo: 'retraso', rutaId: 'r4', detalle: 'La salida de las 5:00 a Puntarenas nunca llegó a la terminal.', minutosAtras: 180, visto: true },
];

const ETIQUETAS_REPORTE = {
  retraso: { texto: 'Retraso en ruta', clase: 'rep-retraso' },
  lleno:   { texto: 'Unidad llena',    clase: 'rep-lleno' },
  falla:   { texto: 'Falla mecánica',  clase: 'rep-falla' },
};
