/* Syncro Admin — almacenamiento.js
   Guarda y lee del navegador. Si está bloqueado, cae a memoria
   para que la demo no se rompa. */

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
    },
    borrar(clave) {
      try {
        if (disponible) localStorage.removeItem(clave);
        else delete memoria[clave];
      } catch (e) { delete memoria[clave]; }
    }
  };
})();
