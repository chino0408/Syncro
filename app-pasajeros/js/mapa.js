/* Syncro — mapa.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 9. Mapa esquemático ---------- */
/* Dibuja un mapa estilizado: no usa datos geográficos reales,
   es una representación del recorrido para la demo.          */
function mapaSVG(ruta, soloUbicacion) {
  const ancho = 400, alto = 190;

  // Retícula de fondo
  let lineas = '';
  for (let x = 0; x <= ancho; x += 40) lineas += `<line x1="${x}" y1="0" x2="${x}" y2="${alto}" stroke="#1DCDF1" stroke-opacity="0.06"/>`;
  for (let y = 0; y <= alto; y += 40) lineas += `<line x1="0" y1="${y}" x2="${ancho}" y2="${y}" stroke="#1DCDF1" stroke-opacity="0.06"/>`;

  if (soloUbicacion) {
    return `<svg class="mapa" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMid slice">
      ${lineas}
      <circle cx="200" cy="95" r="6" fill="#1DCDF1" class="pulso"/>
      <circle cx="200" cy="95" r="8" fill="#1DCDF1"/>
      <circle cx="200" cy="95" r="14" fill="none" stroke="#1DCDF1" stroke-opacity=".45"/>
      <text x="200" y="128" fill="#8CA3B3" font-size="11" text-anchor="middle" font-family="Inter, sans-serif">Estás aquí</text>
    </svg>`;
  }

  // Recorrido: distribuye las paradas en zigzag suave
  const n = ruta.paradas.length;
  const puntos = ruta.paradas.map((p, i) => {
    const x = 42 + (i * (ancho - 84)) / (n - 1);
    const y = 62 + Math.sin(i * 1.25) * 42;
    return { x, y, nombre: p };
  });

  const trazo = puntos.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');

  const marcas = puntos.map((p, i) => {
    const esExtremo = i === 0 || i === n - 1;
    return `
      <circle cx="${p.x}" cy="${p.y}" r="${esExtremo ? 7 : 4.5}" fill="${esExtremo ? '#1DCDF1' : '#163649'}" stroke="#1DCDF1" stroke-width="2"/>
      ${esExtremo ? `<text x="${p.x}" y="${p.y + (p.y > 90 ? 22 : -14)}" fill="#FFFFFF" font-size="10.5" text-anchor="middle" font-family="Inter, sans-serif">${p.nombre.split(' (')[0]}</text>` : ''}`;
  }).join('');

  return `<svg class="mapa" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMid slice">
    ${lineas}
    <path d="${trazo}" fill="none" stroke="#10B0D4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
    ${marcas}
  </svg>`;
}
