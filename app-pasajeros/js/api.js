/* Syncro — api.js
   Todo el diálogo con la base de datos pasa por acá.

   El resto de la app no sabe que existe Supabase: pide datos a estas
   funciones y recibe objetos con la misma forma que antes tenían los
   datos locales. Así las pantallas no tuvieron que reescribirse.

   Si algún día se cambia de proveedor, este es el único archivo que
   habría que tocar. */

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* Convierte los errores técnicos en algo que la persona entienda */
function mensajeDeError(error) {
  if (!error) return 'Algo salió mal. Probá de nuevo.';
  const t = (error.message || '').toLowerCase();

  if (t.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (t.includes('already registered') || t.includes('already exists'))
    return 'Ese correo ya tiene una cuenta. Iniciá sesión.';
  if (t.includes('password should be'))
    return 'La contraseña necesita al menos 6 caracteres.';
  if (t.includes('email not confirmed'))
    return 'Falta confirmar el correo de esta cuenta.';
  if (t.includes('failed to fetch') || t.includes('networkerror'))
    return 'No hay conexión con el servidor. Revisá tu internet.';
  if (t.includes('row-level security') || t.includes('violates'))
    return 'No tenés permiso para hacer esa operación.';
  return error.message || 'Algo salió mal. Probá de nuevo.';
}

/* ==========================================================
   SESIÓN
   ========================================================== */

const Api = {

  async sesionActual() {
    const { data } = await db.auth.getSession();
    return data.session || null;
  },

  async entrar(correo, clave) {
    const { data, error } = await db.auth.signInWithPassword({
      email: correo, password: clave,
    });
    if (error) throw new Error(mensajeDeError(error));
    return data.session;
  },

  async registrar(nombre, correo, clave) {
    const { data, error } = await db.auth.signUp({
      email: correo,
      password: clave,
      options: { data: { nombre, tipo: 'pasajero' } },
    });
    if (error) throw new Error(mensajeDeError(error));
    // Si el proyecto pide confirmar el correo, no viene sesión todavía
    if (!data.session) {
      throw new Error('Te enviamos un correo para confirmar la cuenta.');
    }
    return data.session;
  },

  async salir() {
    await db.auth.signOut();
  },

  /* Supabase envía el correo de recuperación de verdad */
  async pedirRecuperacion(correo) {
    const { error } = await db.auth.resetPasswordForEmail(correo, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw new Error(mensajeDeError(error));
  },

  async cambiarClave(nueva) {
    const { error } = await db.auth.updateUser({ password: nueva });
    if (error) throw new Error(mensajeDeError(error));
  },

  /* ==========================================================
     CATÁLOGO PÚBLICO: rutas y paradas
     ========================================================== */

  async cargarRutas() {
    const { data, error } = await db
      .from('ruta')
      .select(`
        id, origen, destino, precio, frecuencia_min, duracion_min, estado,
        ruta_parada ( orden, parada ( nombre, latitud, longitud ) )
      `)
      .eq('estado', 'activa')
      .order('origen');

    if (error) throw new Error(mensajeDeError(error));

    // Le damos la forma que ya usaban las pantallas
    return (data || []).map(r => ({
      id: String(r.id),
      origen: r.origen,
      destino: r.destino,
      precio: Number(r.precio),
      frecuencia: r.frecuencia_min,
      duracion: r.duracion_min,
      paradas: (r.ruta_parada || [])
        .sort((a, b) => a.orden - b.orden)
        .map(rp => rp.parada.nombre),
      coordenadas: (r.ruta_parada || [])
        .sort((a, b) => a.orden - b.orden)
        .map(rp => ({
          nombre: rp.parada.nombre,
          coord: [Number(rp.parada.latitud), Number(rp.parada.longitud)],
        })),
    }));
  },

  /* Salidas de una ruta, de hoy en adelante */
  async salidasDeRuta(rutaId) {
    const desde = new Date();
    const { data, error } = await db
      .from('viaje')
      .select('id, sale_en, bus ( id, capacidad )')
      .eq('ruta_id', rutaId)
      .gte('sale_en', desde.toISOString())
      .order('sale_en')
      .limit(8);

    if (error) throw new Error(mensajeDeError(error));
    return (data || []).map(v => ({
      id: v.id,
      hora: v.sale_en,
      capacidad: v.bus ? v.bus.capacidad : 48,
    }));
  },

  /* Asientos ya vendidos. Usa la función de la base, que devuelve
     solo los números sin exponer de quién es cada tiquete. */
  async asientosOcupados(viajeId) {
    const { data, error } = await db.rpc('asientos_ocupados', { p_viaje: viajeId });
    if (error) throw new Error(mensajeDeError(error));
    return new Set((data || []).map(f => f.numero_asiento));
  },

  async asientosAccesibles(viajeId) {
    const { data, error } = await db
      .from('viaje')
      .select('bus ( asiento ( numero, tipo ) )')
      .eq('id', viajeId)
      .single();
    if (error || !data || !data.bus) return [5, 6, 7, 8];
    return (data.bus.asiento || [])
      .filter(a => a.tipo === 'accesible')
      .map(a => a.numero)
      .sort((a, b) => a - b);
  },

  /* ==========================================================
     DATOS DE LA PERSONA
     ========================================================== */

  async perfil() {
    const { data, error } = await db
      .from('usuario')
      .select('id, nombre, correo, telefono, aviso_viaje, aviso_compra')
      .single();
    if (error) throw new Error(mensajeDeError(error));
    return data;
  },

  async guardarPerfil(id, campos) {
    const { error } = await db.from('usuario').update(campos).eq('id', id);
    if (error) throw new Error(mensajeDeError(error));
  },

  async metodosDePago() {
    const { data, error } = await db
      .from('metodo_pago')
      .select('id, tipo, referencia')
      .order('creado_en');
    if (error) throw new Error(mensajeDeError(error));
    return (data || []).map(m => ({
      id: String(m.id),
      icono: m.tipo === 'tarjeta' ? 'tarjeta' : 'movil',
      nombre: m.tipo === 'tarjeta'
        ? `Tarjeta terminada en ${m.referencia}`
        : 'SINPE Móvil',
      detalle: m.tipo === 'tarjeta' ? 'Guardada en tu cuenta' : m.referencia,
    }));
  },

  async agregarMetodo(usuarioId, tipo, referencia) {
    const { error } = await db.from('metodo_pago')
      .insert({ usuario_id: usuarioId, tipo, referencia });
    if (error) throw new Error(mensajeDeError(error));
  },

  async quitarMetodo(id) {
    const { error } = await db.from('metodo_pago').delete().eq('id', id);
    if (error) throw new Error(mensajeDeError(error));
  },

  async favoritas() {
    const { data, error } = await db.from('ruta_favorita').select('ruta_id');
    if (error) throw new Error(mensajeDeError(error));
    return (data || []).map(f => String(f.ruta_id));
  },

  async marcarFavorita(usuarioId, rutaId) {
    const { error } = await db.from('ruta_favorita')
      .insert({ usuario_id: usuarioId, ruta_id: rutaId });
    if (error) throw new Error(mensajeDeError(error));
  },

  async quitarFavorita(usuarioId, rutaId) {
    const { error } = await db.from('ruta_favorita').delete()
      .eq('usuario_id', usuarioId).eq('ruta_id', rutaId);
    if (error) throw new Error(mensajeDeError(error));
  },

  /* ==========================================================
     COMPRA
     ========================================================== */

  /* Crea la compra y un tiquete por asiento. Devuelve el tiquete
     con la forma que espera la pantalla del QR. */
  async comprar({ usuarioId, viajeId, asientos, precioUnitario, metodoPagoId }) {
    const { data: compra, error: e1 } = await db
      .from('compra')
      .insert({
        usuario_id: usuarioId,
        viaje_id: viajeId,
        metodo_pago_id: metodoPagoId || null,
        total: precioUnitario * asientos.length,
        estado_pago: 'aprobado',
      })
      .select('id')
      .single();

    if (e1) throw new Error(mensajeDeError(e1));

    const marca = Date.now().toString(36).toUpperCase();
    const filas = asientos.map(n => ({
      compra_id: compra.id,
      viaje_id: viajeId,
      numero_asiento: n,
      codigo_qr: `TK-${marca}-${n}`,
      precio: precioUnitario,
      estado: 'valido',
    }));

    const { data: tiquetes, error: e2 } = await db
      .from('tiquete').insert(filas).select('id, numero_asiento, codigo_qr');

    if (e2) {
      // Si fallan los tiquetes, la compra queda sin efecto
      await db.from('compra').delete().eq('id', compra.id);
      if ((e2.message || '').includes('asiento_unico_por_viaje')) {
        throw new Error('Alguien acaba de comprar uno de esos asientos. Elegí otros.');
      }
      throw new Error(mensajeDeError(e2));
    }

    return { compraId: compra.id, tiquetes: tiquetes || [] };
  },

  /* Tiquetes de la persona, del viaje más próximo al menos próximo */
  async misTiquetes() {
    const { data, error } = await db
      .from('compra')
      .select(`
        id, total, comprada_en,
        viaje ( id, sale_en, ruta ( id, origen, destino, precio ) ),
        tiquete ( id, numero_asiento, codigo_qr, precio, estado )
      `)
      .order('comprada_en', { ascending: false });

    if (error) throw new Error(mensajeDeError(error));

    return (data || [])
      .filter(c => c.viaje && c.tiquete && c.tiquete.length)
      .map(c => ({
        id: c.tiquete[0].codigo_qr,
        compraId: c.id,
        rutaId: String(c.viaje.ruta.id),
        viajeId: c.viaje.id,
        hora: c.viaje.sale_en,
        precio: Number(c.total),
        precioUnitario: Number(c.tiquete[0].precio),
        asientos: c.tiquete.map(t => t.numero_asiento).sort((a, b) => a - b),
        comprado: c.comprada_en,
        estado: c.tiquete[0].estado,
        origen: c.viaje.ruta.origen,
        destino: c.viaje.ruta.destino,
      }))
      .sort((a, b) => new Date(a.hora) - new Date(b.hora));
  },

  /* ==========================================================
     NOTIFICACIONES
     ========================================================== */

  async notificaciones() {
    const { data, error } = await db
      .from('notificacion')
      .select('id, tipo, titulo, texto, mostrar_desde, leida, creada_en, tiquete_id')
      .lte('mostrar_desde', new Date().toISOString())
      .order('creada_en', { ascending: false });
    if (error) throw new Error(mensajeDeError(error));
    return (data || []).map(n => ({
      id: String(n.id), tipo: n.tipo, titulo: n.titulo, texto: n.texto,
      creada: n.creada_en, mostrarDesde: n.mostrar_desde, leida: n.leida,
      tiqueteId: n.tiquete_id ? String(n.tiquete_id) : null,
    }));
  },

  async crearNotificacion({ usuarioId, tipo, titulo, texto, tiqueteId, mostrarDesde }) {
    const { error } = await db.from('notificacion').insert({
      usuario_id: usuarioId, tipo, titulo, texto,
      tiquete_id: tiqueteId || null,
      mostrar_desde: mostrarDesde || new Date().toISOString(),
    });
    if (error) throw new Error(mensajeDeError(error));
  },

  async marcarLeidas(usuarioId) {
    const { error } = await db.from('notificacion')
      .update({ leida: true }).eq('usuario_id', usuarioId).eq('leida', false);
    if (error) throw new Error(mensajeDeError(error));
  },

  /* ==========================================================
     SOPORTE
     ========================================================== */

  async enviarSolicitud({ usuarioId, folio, nombre, correo, detalle }) {
    const { error } = await db.from('solicitud_soporte')
      .insert({ usuario_id: usuarioId, folio, nombre, correo, detalle });
    if (error) throw new Error(mensajeDeError(error));
  },
};
