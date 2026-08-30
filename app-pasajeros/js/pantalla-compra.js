/* Syncro — pantalla-compra.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 11. Compra ----------
   La elección del horario ahora lleva a la pantalla de asientos
   (ver pantalla-asientos.js). Acá se cobra lo que se eligió ahí. */

function pintarCompra() {
  const c = estado.compra;
  if (!c || !c.asientos || !c.asientos.length) return ir('rutas');
  const ruta = RUTAS.find(r => r.id === c.rutaId);

  const cantidad = c.asientos.length;
  const subtotal = cantidad * c.precio;

  $('#compra-resumen').innerHTML = `
    <div class="resumen-linea"><span class="etq">Ruta</span><span>${ruta.origen} → ${ruta.destino}</span></div>
    <div class="resumen-linea"><span class="etq">Salida</span><span>${fechaRelativa(c.hora)}, ${horaCorta(c.hora)}</span></div>
    <div class="resumen-linea">
      <span class="etq">${cantidad === 1 ? 'Asiento' : 'Asientos'}</span>
      <span>${c.asientos.join(', ')}</span>
    </div>
    <div class="resumen-linea">
      <span class="etq">${colones(c.precio)} × ${cantidad}</span>
      <span>${colones(subtotal)}</span>
    </div>
    <div class="resumen-linea"><span class="etq">Total</span><span class="resumen-total">${colones(subtotal)}</span></div>`;

  $('#compra-pagos').innerHTML = estado.metodosPago.map(m => `
    <div class="opcion-pago ${estado.pagoElegido === m.id ? 'elegida' : ''}" data-pago="${m.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${m.icono === 'tarjeta'
          ? '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'
          : '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>'}
      </svg>
      <div>
        <div class="nombre">${m.nombre}</div>
        <div class="detalle">${m.detalle}</div>
      </div>
    </div>`).join('');

  if (!estado.metodosPago.length) {
    $('#compra-pagos').innerHTML = `
      <div class="card" style="text-align:center; padding:20px;">
        <div style="font-size:13.5px; color:var(--texto-tenue); line-height:1.6; margin-bottom:14px;">
          No tenés métodos de pago guardados.
        </div>
        <button class="btn btn-secundario" data-ir="pagos">Agregar uno</button>
      </div>`;
  }

  ocultarError('#compra-error');
}

async function pagar() {
  const c = estado.compra;
  if (!c || !c.asientos.length) return;
  if (!estado.metodosPago.length) {
    return mostrarError('#compra-error', 'Agregá un método de pago para continuar.');
  }

  const boton = $('#btn-pagar');
  boton.disabled = true;
  boton.textContent = 'Procesando…';
  ocultarError('#compra-error');

  try {
    const { tiquetes } = await Api.comprar({
      usuarioId: estado.usuarioId,
      viajeId: c.viajeId,
      asientos: c.asientos,
      precioUnitario: c.precio,
      metodoPagoId: estado.pagoElegido,
    });

    const ruta = RUTAS.find(r => r.id === c.rutaId);
    const cantidad = c.asientos.length;
    const primerTiquete = tiquetes[0] ? tiquetes[0].id : null;

    // Los avisos se crean solo si la persona los tiene activados
    const avisos = [];
    if (estado.preferencias.avisoCompra) {
      avisos.push(Api.crearNotificacion({
        usuarioId: estado.usuarioId,
        tipo: 'compra',
        titulo: 'Compra completada',
        texto: `Tu tiquete de ${ruta.origen} a ${ruta.destino} está listo. ` +
               `${cantidad === 1 ? 'Asiento' : 'Asientos'} ${c.asientos.join(', ')}.`,
        tiqueteId: primerTiquete,
      }));
    }
    if (estado.preferencias.avisoViaje) {
      avisos.push(Api.crearNotificacion({
        usuarioId: estado.usuarioId,
        tipo: 'viaje',
        titulo: 'Tu viaje sale pronto',
        texto: `Salís de ${ruta.origen} a las ${horaCorta(c.hora)}. Tené tu QR listo.`,
        tiqueteId: primerTiquete,
        mostrarDesde: new Date(new Date(c.hora).getTime() - 15 * 60000).toISOString(),
      }));
    }
    await Promise.all(avisos);

    // Volvemos a traer los tiquetes para tener el que se acaba de crear
    estado.tiquetes = await Api.misTiquetes();
    estado.notificaciones = await Api.notificaciones();

    const nuevo = estado.tiquetes.find(t => t.viajeId === c.viajeId &&
      t.asientos.join(',') === c.asientos.join(','));

    estado.compra = null;
    if (nuevo) abrirTiquete(nuevo.id); else ir('tiquetes');
    toast(cantidad === 1 ? 'Tiquete comprado' : `${cantidad} tiquetes comprados`);

  } catch (e) {
    mostrarError('#compra-error', e.message);
  } finally {
    boton.disabled = false;
    boton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> Pagar y generar tiquete';
  }
}

/* Texto de asientos. Sirve tanto para los tiquetes nuevos como para
   los comprados antes de que existiera la selección múltiple. */
function textoAsientos(t) {
  const lista = t.asientos || (t.asiento ? [t.asiento] : []);
  if (!lista.length) return 'Sin asiento';
  return (lista.length === 1 ? 'Asiento ' : 'Asientos ') + lista.join(', ');
}
