/* Syncro Admin — api.js
   Todo el diálogo con la base de datos pasa por acá.

   Las vistas del panel siguen recibiendo los mismos objetos que antes
   venían de datos.js: una ruta tiene `frecuencia` y `duracion`, una
   salida tiene `hora` y `vendidos`. La traducción entre esos nombres y
   los de la base ocurre solo en este archivo, así que las pantallas no
   tuvieron que reescribirse.

   ---------------------------------------------------------------------
   POR QUÉ CASI TODA LECTURA FILTRA POR EMPRESA A MANO

   Las políticas de seguridad de la base protegen la ESCRITURA de
   `ruta`, `bus` y `viaje`, pero no la lectura: son el catálogo público
   del transporte, y el pasajero tiene que poder leerlas sin sesión.

   Si el panel confiara en las políticas para filtrar, la empresa vería
   la flota y las rutas de la competencia en su propio panel. Por eso
   cada consulta lleva su `.eq('empresa_id', ...)` explícito.

   La única tabla que sí se filtra sola es `chofer`, porque son datos
   internos y su política sí restringe la lectura.
   --------------------------------------------------------------------- */

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* Convierte los errores técnicos en algo que la persona entienda */
function mensajeDeError(error) {
  if (!error) return 'Algo salió mal. Probá de nuevo.';
  const t = (error.message || '').toLowerCase();

  if (t.includes('invalid login')) return 'Ese correo y contraseña no coinciden con ninguna empresa.';
  if (t.includes('email not confirmed')) return 'Falta confirmar el correo de esta cuenta.';
  if (t.includes('already registered') || t.includes('already exists'))
    return 'Ese correo ya tiene una cuenta. Iniciá sesión.';
  if (t.includes('password should be')) return 'La contraseña necesita al menos 6 caracteres.';
  if (t.includes('failed to fetch') || t.includes('networkerror'))
    return 'No hay conexión con el servidor. Revisá tu internet.';
  if (t.includes('row-level security') || t.includes('violates row'))
    return 'No tenés permiso para hacer esa operación.';
  if (t.includes('ruta_unica_por_empresa'))
    return 'Ya publicaste una ruta con ese mismo origen y destino.';
  if (t.includes('salida_unica') || t.includes('idx_viaje_unico'))
    return 'Ya hay una salida de esa ruta a esa misma hora.';
  if (t.includes('origen_distinto_destino'))
    return 'El origen y el destino no pueden ser el mismo lugar.';
  if (t.includes('bus_placa') || t.includes('duplicate key') && t.includes('placa'))
    return 'Ya hay una unidad registrada con esa placa.';
  if (t.includes('duplicate key')) return 'Ese registro ya existe.';
  return error.message || 'Algo salió mal. Probá de nuevo.';
}

/* Corta el proceso si la consulta falló */
function revisar(error) {
  if (error) throw new Error(mensajeDeError(error));
}

/* Los ids de la base son números; el panel los trata como texto */
const txt = (v) => (v == null ? null : String(v));
const num = (v) => (v == null || v === '' ? null : Number(v));

/* Para comparar nombres de parada sin que estorben tildes ni mayúsculas */
function normalizar(t) {
  return String(t || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* Rango del día de hoy, en hora de Costa Rica, para pedir las salidas */
function rangoDeHoy() {
  const ahora = new Date();
  const inicio = new Date(ahora); inicio.setHours(0, 0, 0, 0);
  const fin = new Date(ahora); fin.setHours(23, 59, 59, 999);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}


const Api = {

  /* ==========================================================
     SESIÓN
     ========================================================== */

  async sesionActual() {
    const { data } = await db.auth.getSession();
    return data.session || null;
  },

  async entrar(correo, clave) {
    const { data, error } = await db.auth.signInWithPassword({
      email: correo, password: clave,
    });
    revisar(error);
    return data.session;
  },

  /* Activación de la cuenta de empresa.

     La empresa no se registra sola: Syncro la da de alta en la tabla
     `administrador`, y este paso solo crea la cuenta de acceso. El
     disparador de la base (06-panel-empresas.sql) enlaza las dos por
     el correo. Si no hay ficha con ese correo, la cuenta queda creada
     pero sin empresa, y el panel lo detecta al cargar. */
  async activarCuenta(correo, clave) {
    const { data, error } = await db.auth.signUp({
      email: correo,
      password: clave,
      options: { data: { tipo: 'empresa' } },
    });
    revisar(error);
    if (!data.session) {
      throw new Error('Te enviamos un correo para confirmar la cuenta. Confirmalo y volvé a entrar.');
    }
    return data.session;
  },

  async salir() {
    await db.auth.signOut();
  },


  /* ==========================================================
     CARGA INICIAL

     Una sola función que trae todo lo que el panel necesita para
     pintarse. Devuelve los objetos con la forma que ya usaban las
     pantallas.
     ========================================================== */

  async cargarTodo() {
    // 1. Quién soy: la ficha del administrador dice a qué empresa
    //    pertenezco. Sin esto no se puede filtrar nada.
    const { data: ficha, error: eFicha } = await db
      .from('administrador')
      .select('id, nombre, correo, empresa_id')
      .maybeSingle();
    revisar(eFicha);

    if (!ficha) {
      throw new Error(
        'Esta cuenta no está asociada a ninguna empresa. ' +
        'Pedile a Syncro que registre el correo antes de entrar.'
      );
    }

    const empresaId = ficha.empresa_id;

    // 2. Todo lo demás en paralelo
    const [empresa, rutas, flota, choferes, paradas] = await Promise.all([
      this.cargarEmpresa(empresaId),
      this.cargarRutas(empresaId),
      this.cargarFlota(empresaId),
      this.cargarChoferes(),
      this.cargarParadas(),
    ]);

    // Las salidas y los reportes cuelgan de las rutas, así que van después
    const idsRutas = rutas.map(r => Number(r.id));
    const [salidas, reportes] = await Promise.all([
      this.cargarSalidas(idsRutas),
      this.cargarReportes(idsRutas),
    ]);

    return { empresaId, admin: ficha, empresa, rutas, flota, choferes, salidas, reportes, paradas };
  },

  async cargarEmpresa(empresaId) {
    const { data, error } = await db
      .from('empresa')
      .select('id, nombre, cedula_juridica, telefono, correo')
      .eq('id', empresaId)
      .single();
    revisar(error);

    return {
      id: txt(data.id),
      razon: data.nombre,
      cedula: data.cedula_juridica,
      telefono: data.telefono || '',
      correo: data.correo,
    };
  },

  /* Rutas de la empresa, con su recorrido en orden */
  async cargarRutas(empresaId) {
    const { data, error } = await db
      .from('ruta')
      .select(`
        id, origen, destino, precio, frecuencia_min, duracion_min, estado,
        ruta_parada ( orden, parada ( id, nombre ) )
      `)
      .eq('empresa_id', empresaId)
      .order('origen');
    revisar(error);

    return (data || []).map(r => ({
      id: txt(r.id),
      origen: r.origen,
      destino: r.destino,
      precio: Number(r.precio),
      frecuencia: r.frecuencia_min,
      duracion: r.duracion_min,
      estado: r.estado,
      paradas: (r.ruta_parada || [])
        .slice().sort((a, b) => a.orden - b.orden)
        .map(rp => rp.parada.nombre),
    }));
  },

  async cargarFlota(empresaId) {
    const { data, error } = await db
      .from('bus')
      .select('id, placa, modelo, anio, capacidad, estado')
      .eq('empresa_id', empresaId)
      .order('placa');
    revisar(error);

    return (data || []).map(b => ({
      id: txt(b.id),
      placa: b.placa,
      modelo: b.modelo,
      anio: b.anio,
      capacidad: b.capacidad,
      estado: b.estado,
    }));
  },

  /* Los choferes sí los filtra la política de la base */
  async cargarChoferes() {
    const { data, error } = await db
      .from('chofer')
      .select('id, nombre, licencia, telefono, estado')
      .order('nombre');
    revisar(error);

    return (data || []).map(c => ({
      id: txt(c.id),
      nombre: c.nombre,
      licencia: c.licencia,
      telefono: c.telefono || '',
      estado: c.estado,
    }));
  },

  /* Salidas de hoy. Se leen de la vista de ocupación porque ahí ya
     viene contado cuántos tiquetes se vendieron en cada una. */
  async cargarSalidas(idsRutas) {
    if (!idsRutas.length) return [];
    const { inicio, fin } = rangoDeHoy();

    const { data, error } = await db
      .from('vista_ocupacion_viaje')
      .select('viaje_id, ruta_id, sale_en, capacidad, vendidos')
      .in('ruta_id', idsRutas)
      .gte('sale_en', inicio)
      .lte('sale_en', fin)
      .order('sale_en');
    revisar(error);

    // La vista no trae bus_id ni chofer_id, solo sus nombres. Para poder
    // preseleccionarlos en el modal hacen falta los ids.
    const ids = (data || []).map(v => v.viaje_id);
    let asignaciones = {};
    if (ids.length) {
      const { data: viajes, error: eV } = await db
        .from('viaje')
        .select('id, bus_id, chofer_id')
        .in('id', ids);
      revisar(eV);
      (viajes || []).forEach(v => { asignaciones[v.id] = v; });
    }

    return (data || []).map(v => {
      const a = asignaciones[v.viaje_id] || {};
      return {
        id: txt(v.viaje_id),
        rutaId: txt(v.ruta_id),
        hora: v.sale_en,
        busId: txt(a.bus_id),
        choferId: txt(a.chofer_id),
        vendidos: Number(v.vendidos || 0),
        _cap: Number(v.capacidad || 0) || 44,
      };
    });
  },

  /* Incidencias que los pasajeros reportaron sobre las rutas de esta
     empresa. `nueva` es lo que el panel muestra como "sin ver". */
  async cargarReportes(idsRutas) {
    if (!idsRutas.length) return [];

    const { data, error } = await db
      .from('incidencia')
      .select('id, ruta_id, tipo, detalle, estado, creada_en')
      .in('ruta_id', idsRutas)
      .order('creada_en', { ascending: false })
      .limit(50);
    revisar(error);

    return (data || []).map(i => ({
      id: txt(i.id),
      rutaId: txt(i.ruta_id),
      tipo: i.tipo === 'accidente' ? 'falla' : i.tipo,
      detalle: i.detalle || '',
      fecha: i.creada_en,
      visto: i.estado !== 'nueva',
    }));
  },

  /* Catálogo de paradas. El panel lo usa para resolver los nombres que
     la empresa escribe al armar el recorrido de una ruta. */
  async cargarParadas() {
    const { data, error } = await db
      .from('parada')
      .select('id, nombre')
      .order('nombre');
    revisar(error);
    return (data || []).map(p => ({ id: p.id, nombre: p.nombre }));
  },


  /* ==========================================================
     RUTAS
     ========================================================== */

  /* Traduce los nombres de parada a ids del catálogo.
     Devuelve { ids } o { faltantes } con los nombres desconocidos. */
  resolverParadas(nombres, catalogo) {
    const porNombre = {};
    catalogo.forEach(p => { porNombre[normalizar(p.nombre)] = p.id; });

    const ids = [];
    const faltantes = [];
    nombres.forEach(n => {
      const id = porNombre[normalizar(n)];
      if (id) ids.push(id); else faltantes.push(n);
    });
    return { ids, faltantes };
  },

  async guardarRecorrido(rutaId, paradaIds) {
    const { error: eBorrar } = await db.from('ruta_parada').delete().eq('ruta_id', rutaId);
    revisar(eBorrar);

    if (!paradaIds.length) return;
    const filas = paradaIds.map((pid, i) => ({ ruta_id: rutaId, parada_id: pid, orden: i + 1 }));
    const { error } = await db.from('ruta_parada').insert(filas);
    revisar(error);
  },

  async crearRuta(empresaId, datos, paradaIds) {
    const { data, error } = await db
      .from('ruta')
      .insert({
        empresa_id: empresaId,
        origen: datos.origen,
        destino: datos.destino,
        precio: datos.precio,
        frecuencia_min: datos.frecuencia,
        duracion_min: datos.duracion,
        estado: datos.estado,
      })
      .select('id')
      .single();
    revisar(error);

    await this.guardarRecorrido(data.id, paradaIds);
    return txt(data.id);
  },

  async actualizarRuta(id, datos, paradaIds) {
    const { error } = await db
      .from('ruta')
      .update({
        origen: datos.origen,
        destino: datos.destino,
        precio: datos.precio,
        frecuencia_min: datos.frecuencia,
        duracion_min: datos.duracion,
        estado: datos.estado,
      })
      .eq('id', num(id));
    revisar(error);

    await this.guardarRecorrido(num(id), paradaIds);
  },

  async borrarRuta(id) {
    const { error } = await db.from('ruta').delete().eq('id', num(id));
    revisar(error);
  },


  /* ==========================================================
     FLOTA

     Los asientos de cada unidad los genera un disparador de la base
     (06-panel-empresas.sql), así que acá no hay que crearlos.
     ========================================================== */

  async crearBus(empresaId, d) {
    const { data, error } = await db
      .from('bus')
      .insert({
        empresa_id: empresaId,
        placa: d.placa, modelo: d.modelo,
        anio: d.anio, capacidad: d.capacidad, estado: d.estado,
      })
      .select('id')
      .single();
    revisar(error);
    return txt(data.id);
  },

  async actualizarBus(id, d) {
    const { error } = await db
      .from('bus')
      .update({ placa: d.placa, modelo: d.modelo, anio: d.anio, capacidad: d.capacidad, estado: d.estado })
      .eq('id', num(id));
    revisar(error);
  },

  async borrarBus(id) {
    const { error } = await db.from('bus').delete().eq('id', num(id));
    revisar(error);
  },

  /* Al mandar una unidad al taller, se libera de las salidas del día */
  async liberarBusDeSalidas(busId) {
    const { inicio, fin } = rangoDeHoy();
    const { error } = await db
      .from('viaje')
      .update({ bus_id: null })
      .eq('bus_id', num(busId))
      .gte('sale_en', inicio).lte('sale_en', fin);
    revisar(error);
  },


  /* ==========================================================
     CHOFERES
     ========================================================== */

  async crearChofer(empresaId, d) {
    const { data, error } = await db
      .from('chofer')
      .insert({
        empresa_id: empresaId,
        nombre: d.nombre, licencia: d.licencia,
        telefono: d.telefono, estado: d.estado,
      })
      .select('id')
      .single();
    revisar(error);
    return txt(data.id);
  },

  async actualizarChofer(id, d) {
    const { error } = await db
      .from('chofer')
      .update({ nombre: d.nombre, licencia: d.licencia, telefono: d.telefono, estado: d.estado })
      .eq('id', num(id));
    revisar(error);
  },

  async borrarChofer(id) {
    const { error } = await db.from('chofer').delete().eq('id', num(id));
    revisar(error);
  },

  async liberarChoferDeSalidas(choferId) {
    const { inicio, fin } = rangoDeHoy();
    const { error } = await db
      .from('viaje')
      .update({ chofer_id: null })
      .eq('chofer_id', num(choferId))
      .gte('sale_en', inicio).lte('sale_en', fin);
    revisar(error);
  },


  /* ==========================================================
     SALIDAS
     ========================================================== */

  async crearSalida(d) {
    const { data, error } = await db
      .from('viaje')
      .insert({
        ruta_id: num(d.rutaId),
        bus_id: num(d.busId),
        chofer_id: num(d.choferId),
        sale_en: d.hora,
      })
      .select('id')
      .single();
    revisar(error);
    return txt(data.id);
  },

  async actualizarSalida(id, d) {
    const { error } = await db
      .from('viaje')
      .update({ bus_id: num(d.busId), chofer_id: num(d.choferId), sale_en: d.hora })
      .eq('id', num(id));
    revisar(error);
  },

  async borrarSalida(id) {
    const { error } = await db.from('viaje').delete().eq('id', num(id));
    revisar(error);
  },


  /* ==========================================================
     REPORTES Y EMPRESA
     ========================================================== */

  async marcarReportesVistos(ids) {
    if (!ids.length) return;
    const { error } = await db
      .from('incidencia')
      .update({ estado: 'vista' })
      .in('id', ids.map(num));
    revisar(error);
  },

  async actualizarEmpresa(id, d) {
    const { error } = await db
      .from('empresa')
      .update({
        nombre: d.razon,
        cedula_juridica: d.cedula,
        telefono: d.telefono,
        correo: d.correo,
      })
      .eq('id', num(id));
    revisar(error);
  },
};
