/* ============================================================
   SYNCRO — Lógica de la demo
   Todo corre en el teléfono. No hay servidor.
   ============================================================ */

/* Syncro — almacenamiento.js
   Ver README.md para el orden de carga de los archivos. */

/* ---------- 1. Almacenamiento ---------- */
/* Guardamos en localStorage. Si el navegador lo bloquea,
   caemos a memoria para que la demo no se rompa.        */
const Guardado = (() => {
  let memoria = {};
  let disponible = true;
  try {
    localStorage.setItem('__prueba', '1');
    localStorage.removeItem('__prueba');
  } catch (e) { disponible = false; }

  return {
    leer(clave, pordefecto) {
      try {
        const crudo = disponible ? localStorage.getItem(clave) : memoria[clave];
        return crudo ? JSON.parse(crudo) : pordefecto;
      } catch (e) { return pordefecto; }
    },
    escribir(clave, valor) {
      const crudo = JSON.stringify(valor);
      try {
        if (disponible) localStorage.setItem(clave, crudo);
        else memoria[clave] = crudo;
      } catch (e) { memoria[clave] = crudo; }
    }
  };
})();
