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

function pagar() {
  const c = estado.compra;
  if (!c || !c.asientos.length) return;
  if (!estado.metodosPago.length) {
    return mostrarError('#compra-error', 'Agregá un método de pago para continuar.');
  }
  const boton = $('#btn-pagar');
  boton.disabled = true;
  boton.textContent = 'Procesando…';

  // Simulamos la espera de una pasarela de pago
  setTimeout(() => {
    boton.disabled = false;
    boton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> Pagar y generar tiquete`;

    // 1 de cada 8 pagos falla, para poder mostrar el camino de error
    if (Math.random() < 0.125) {
      return mostrarError('#compra-error', 'El pago no se completó. Probá con otro método o intentá de nuevo.');
    }

    const cantidad = c.asientos.length;
    const tiquete = {
      id: 'TK' + Date.now().toString().slice(-8),
      rutaId: c.rutaId,
      hora: c.hora,
      precio: c.precio * cantidad,   // lo que se pagó en total
      precioUnitario: c.precio,
      asientos: [...c.asientos],
      comprado: new Date().toISOString(),
      estado: 'valido',
    };
    estado.tiquetes.push(tiquete);

    const ruta = RUTAS.find(r => r.id === c.rutaId);
    if (estado.preferencias.avisoCompra) agregarNotificacion({
      tipo: 'compra',
      titulo: 'Compra completada',
      texto: `Tu tiquete de ${ruta.origen} a ${ruta.destino} está listo. ${textoAsientos(tiquete)}.`,
      tiqueteId: tiquete.id,
    });
    // Aviso programado: 15 minutos antes de la salida
    if (estado.preferencias.avisoViaje) agregarNotificacion({
      tipo: 'viaje',
      titulo: 'Tu viaje sale pronto',
      texto: `Salís de ${ruta.origen} a las ${horaCorta(c.hora)}. Tené tu QR listo.`,
      tiqueteId: tiquete.id,
      mostrarDesde: new Date(new Date(c.hora).getTime() - 15 * 60000).toISOString(),
    });

    estado.compra = null;
    persistir();
    abrirTiquete(tiquete.id);
    toast(cantidad === 1 ? 'Tiquete comprado' : `${cantidad} tiquetes comprados`);
  }, 900);
}

/* Texto de asientos. Sirve tanto para los tiquetes nuevos como para
   los comprados antes de que existiera la selección múltiple. */
function textoAsientos(t) {
  const lista = t.asientos || (t.asiento ? [t.asiento] : []);
  if (!lista.length) return 'Sin asiento';
  return (lista.length === 1 ? 'Asiento ' : 'Asientos ') + lista.join(', ');
}
