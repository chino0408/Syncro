/* Syncro — Instalación como aplicación (PWA)
   Captura el evento de instalación del navegador y muestra
   un botón propio, en lugar de depender del menú del navegador. */

let promptInstalacion = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstalacion = e;
  mostrarBotonInstalar();
});

function mostrarBotonInstalar() {
  if (document.getElementById('btn-instalar')) return;

  const btn = document.createElement('button');
  btn.id = 'btn-instalar';
  btn.className = 'btn btn-primario';
  btn.textContent = 'Instalar Syncro';
  btn.style.cssText = 'position:fixed;left:16px;right:16px;bottom:84px;z-index:60';

  btn.addEventListener('click', async () => {
    if (!promptInstalacion) return;
    promptInstalacion.prompt();
    const { outcome } = await promptInstalacion.userChoice;
    promptInstalacion = null;
    btn.remove();
    if (outcome === 'accepted' && typeof toast === 'function') {
      toast('Syncro se está instalando');
    }
  });

  document.body.appendChild(btn);
}

/* Si ya está instalada, no ofrecer instalarla de nuevo */
window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('btn-instalar');
  if (btn) btn.remove();
  promptInstalacion = null;
});