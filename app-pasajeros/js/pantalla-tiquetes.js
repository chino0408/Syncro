/* Syncro — pantalla-tiquetes.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 12. Pantalla: Tiquetes ---------- */
function tiquetesOrdenados() {
  // Del más próximo al menos próximo
  return [...estado.tiquetes].sort((a, b) => new Date(a.hora) - new Date(b.hora));
}

function pintarTiquetes() {
  const cont = $('#tiquetes-lista');
  const lista = tiquetesOrdenados();

  if (!lista.length) {
    cont.innerHTML = plantillaVacio('tiquete', 'No hay próximo viaje',
      'Cuando compres un tiquete lo vas a ver acá, con su código QR.') +
      `<button class="btn btn-primario" style="max-width:260px; margin:0 auto;" data-ir="rutas">Buscar una ruta</button>`;
    return;
  }

  const ahora = new Date();
  cont.innerHTML = lista.map(t => {
    const ruta = RUTAS.find(r => r.id === t.rutaId);
    const pasado = new Date(t.hora) < ahora;
    return `
      <div class="fila" data-ver-tiquete="${t.id}">
        <div class="fila-izq">
          <div class="fila-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>
          </div>
          <div style="min-width:0">
            <div class="fila-titulo">${ruta.origen} → ${ruta.destino}</div>
            <div class="fila-sub">${fechaRelativa(t.hora)} · ${horaCorta(t.hora)} · ${textoAsientos(t)}</div>
          </div>
        </div>
        <span class="chip ${pasado ? 'chip-usado' : 'chip-valido'}">${pasado ? 'Usado' : 'Válido'}</span>
      </div>`;
  }).join('');
}
/* ---------- 13. Pantalla: QR del tiquete ---------- */
function abrirTiquete(id) {
  const t = estado.tiquetes.find(x => x.id === id);
  if (!t) return ir('tiquetes');
  const ruta = RUTAS.find(r => r.id === t.rutaId);
  const pasado = new Date(t.hora) < new Date();

  $('#qr-contenido').innerHTML = `
    <div class="card" style="text-align:center; padding:22px 18px;">
      <span class="chip ${pasado ? 'chip-usado' : 'chip-valido'}" style="margin-bottom:16px;">${pasado ? 'Usado' : 'Válido'}</span>
      <div class="qr-caja"><canvas id="qr-canvas" width="180" height="180"></canvas></div>
      <div style="font-family:var(--display); font-weight:600; font-size:17px; margin-bottom:4px;">${ruta.origen} → ${ruta.destino}</div>
      <div style="font-size:13px; color:var(--texto-tenue);">${fechaRelativa(t.hora)} · ${horaCorta(t.hora)}</div>
      <div style="font-family:var(--display); font-weight:500; font-size:14px; color:var(--cian); margin-top:8px;">${textoAsientos(t)}</div>
    </div>

    <div class="card">
      <div class="resumen-linea"><span class="etq">Código</span><span style="font-family:var(--display); font-weight:500;">${t.id}</span></div>
      <div class="resumen-linea"><span class="etq">Pagado</span><span>${colones(t.precio)}</span></div>
      <div class="resumen-linea"><span class="etq">Comprado</span><span>${fechaRelativa(t.comprado)}, ${horaCorta(t.comprado)}</span></div>
    </div>

    <p style="font-size:12.5px; color:var(--texto-tenue); text-align:center; line-height:1.6; margin-top:4px;">
      Mostrá este código al chofer para abordar.
    </p>`;

  ir('tiquete-qr');
  dibujarQR($('#qr-canvas'), t.id);
}

/* Dibuja un patrón tipo QR a partir del código del tiquete.
   Nota: es una representación visual para la demo; en la versión
   real se generaría un QR estándar leíble por un escáner.        */
function dibujarQR(canvas, texto) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const modulos = 25;
  const tam = canvas.width / modulos;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0B101B';

  // Generador pseudoaleatorio determinista, a partir del texto
  let semilla = 0;
  for (let i = 0; i < texto.length; i++) semilla = (semilla * 31 + texto.charCodeAt(i)) >>> 0;
  const aleatorio = () => {
    semilla = (semilla * 1664525 + 1013904223) >>> 0;
    return semilla / 4294967296;
  };

  const esEsquina = (f, c) =>
    (f < 8 && c < 8) || (f < 8 && c >= modulos - 8) || (f >= modulos - 8 && c < 8);

  for (let f = 0; f < modulos; f++) {
    for (let c = 0; c < modulos; c++) {
      if (esEsquina(f, c)) continue;
      if (aleatorio() > 0.52) ctx.fillRect(c * tam, f * tam, tam, tam);
    }
  }

  // Marcas de posición (las tres esquinas del QR)
  const marca = (f, c) => {
    ctx.fillStyle = '#0B101B';
    ctx.fillRect(c * tam, f * tam, tam * 7, tam * 7);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect((c + 1) * tam, (f + 1) * tam, tam * 5, tam * 5);
    ctx.fillStyle = '#0B101B';
    ctx.fillRect((c + 2) * tam, (f + 2) * tam, tam * 3, tam * 3);
  };
  marca(0, 0); marca(0, modulos - 7); marca(modulos - 7, 0);
}
