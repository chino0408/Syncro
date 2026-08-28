/* Syncro Admin — estado.js
   Estado de la aplicación y su persistencia. */

let estado = {
  sesion:     Guardado.leer('admin_sesion', null),
  empresa:    Guardado.leer('admin_empresa', null),
  rutas:      Guardado.leer('admin_rutas', null),
  flota:      Guardado.leer('admin_flota', null),
  choferes:   Guardado.leer('admin_choferes', null),
  salidas:    Guardado.leer('admin_salidas', null),
  reportes:   Guardado.leer('admin_reportes', null),

  // Temporal, no se guarda
  vista: 'resumen',
  filtros: { horarios: '', rutas: '', flota: '', choferes: '' },
};

function persistir() {
  Guardado.escribir('admin_sesion', estado.sesion);
  Guardado.escribir('admin_empresa', estado.empresa);
  Guardado.escribir('admin_rutas', estado.rutas);
  Guardado.escribir('admin_flota', estado.flota);
  Guardado.escribir('admin_choferes', estado.choferes);
  Guardado.escribir('admin_salidas', estado.salidas);
  Guardado.escribir('admin_reportes', estado.reportes);
}

/* Genera las salidas del día a partir de las rutas activas.
   Cada ruta produce salidas según su frecuencia, dentro del
   horario de servicio (5:00 a 21:00). */
function generarSalidasDelDia() {
  const salidas = [];
  const hoy = new Date();
  const activas = estado.rutas.filter(r => r.estado === 'activa');

  activas.forEach((ruta) => {
    // Para no saturar la vista, tomamos un máximo de salidas por ruta
    const paso = Math.max(ruta.frecuencia, 30);
    let hora = new Date(hoy);
    hora.setHours(5, 0, 0, 0);
    const cierre = new Date(hoy);
    cierre.setHours(21, 0, 0, 0);

    let i = 0;
    while (hora <= cierre && i < 8) {
      salidas.push({
        id: 'v' + ruta.id + '-' + i,
        rutaId: ruta.id,
        hora: hora.toISOString(),
        busId: null,
        choferId: null,
        vendidos: 0,
      });
      hora = new Date(hora.getTime() + paso * 3 * 60000);
      i++;
    }
  });

  return salidas.sort((a, b) => new Date(a.hora) - new Date(b.hora));
}

/* Asigna bus y chofer a una parte de las salidas, y simula
   tiquetes vendidos, para que la demo tenga datos realistas. */
function sembrarAsignaciones(salidas) {
  const buses = estado.flota.filter(b => b.estado === 'activo');
  const choferes = estado.choferes.filter(c => c.estado === 'disponible');

  return salidas.map((s, i) => {
    // Dejamos algunas salidas sin asignar a propósito: son las que
    // el panel marca como pendientes.
    const asignar = i % 4 !== 3;
    const bus = asignar ? buses[i % buses.length] : null;
    const ruta = estado.rutas.find(r => r.id === s.rutaId);
    const cap = bus ? bus.capacidad : 44;
    return {
      ...s,
      busId: bus ? bus.id : null,
      choferId: asignar ? choferes[i % choferes.length].id : null,
      vendidos: Math.min(cap, Math.round(cap * (0.25 + ((i * 37) % 60) / 100))),
      _cap: cap,
      _precio: ruta ? ruta.precio : 0,
    };
  });
}

/* Carga los datos de ejemplo la primera vez, o cuando se
   restablece la demo. */
function cargarDatosEjemplo() {
  estado.empresa  = { ...EMPRESA_EJEMPLO };
  estado.rutas    = RUTAS_EJEMPLO.map(r => ({ ...r, paradas: [...r.paradas] }));
  estado.flota    = FLOTA_EJEMPLO.map(b => ({ ...b }));
  estado.choferes = CHOFERES_EJEMPLO.map(c => ({ ...c }));

  const base = new Date();
  estado.reportes = REPORTES_EJEMPLO.map(r => ({
    ...r,
    fecha: new Date(base.getTime() - r.minutosAtras * 60000).toISOString(),
  }));

  estado.salidas = sembrarAsignaciones(generarSalidasDelDia());
  persistir();
}
