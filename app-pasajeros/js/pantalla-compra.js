/* Syncro — pantalla-compra.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 11. Compra ---------- */
function elegirHorario(indice) {
  const ruta = RUTAS.find(r => r.id === estado.rutaAbierta);
  const salida = estado._salidas[indice];
  estado.compra = {
    rutaId: ruta.id,
    hora: salida.hora,
    precio: ruta.precio,
    asiento: 1 + Math.floor(Math.random() * 40),
  };
  estado.pagoElegido = METODOS_PAGO[0].id;
  ir('compra');
}

function pintarCompra() {
  const c = estado.compra;
  if (!c) return ir('rutas');
  const ruta = RUTAS.find(r => r.id === c.rutaId);

  $('#compra-resumen').innerHTML = `
    <div class="resumen-linea"><span class="etq">Ruta</span><span>${ruta.origen} → ${ruta.destino}</span></div>
    <div class="resumen-linea"><span class="etq">Salida</span><span>${fechaRelativa(c.hora)}, ${horaCorta(c.hora)}</span></div>
    <div class="resumen-linea"><span class="etq">Asiento</span><span>${c.asiento}</span></div>
    <div class="resumen-linea"><span class="etq">Total</span><span class="resumen-total">${colones(c.precio)}</span></div>`;

  $('#compra-pagos').innerHTML = METODOS_PAGO.map(m => `
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

  ocultarError('#compra-error');
}

function pagar() {
  const c = estado.compra;
  if (!c) return;
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

    const tiquete = {
      id: 'TK' + Date.now().toString().slice(-8),
      rutaId: c.rutaId,
      hora: c.hora,
      precio: c.precio,
      asiento: c.asiento,
      comprado: new Date().toISOString(),
      estado: 'valido',
    };
    estado.tiquetes.push(tiquete);

    const ruta = RUTAS.find(r => r.id === c.rutaId);
    agregarNotificacion({
      tipo: 'compra',
      titulo: 'Compra completada',
      texto: `Tu tiquete de ${ruta.origen} a ${ruta.destino} está listo. Asiento ${c.asiento}.`,
      tiqueteId: tiquete.id,
    });
    // Aviso programado: 15 minutos antes de la salida
    agregarNotificacion({
      tipo: 'viaje',
      titulo: 'Tu viaje sale pronto',
      texto: `Salís de ${ruta.origen} a las ${horaCorta(c.hora)}. Tené tu QR listo.`,
      tiqueteId: tiquete.id,
      mostrarDesde: new Date(new Date(c.hora).getTime() - 15 * 60000).toISOString(),
    });

    estado.compra = null;
    persistir();
    abrirTiquete(tiquete.id);
    toast('Tiquete comprado');
  }, 900);
}
