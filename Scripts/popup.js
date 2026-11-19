/* popup.js — pop-up de Navidad al abrir index.html (necesita config.js antes) */
(function () {
  var popup = document.getElementById('popup-navidad');
  if (!popup || typeof popup.showModal !== 'function') return;

  var P = window.PROMO || {};

  /* No mostrar después de la fecha límite */
  if (P.fin && new Date() > new Date(P.fin)) return;

  /* Rellena los textos desde config.js: <span data-promo="porcentaje"></span> */
  var campos = popup.querySelectorAll('[data-promo]');
  for (var i = 0; i < campos.length; i++) {
    var valor = P[campos[i].getAttribute('data-promo')];
    if (valor !== undefined) campos[i].textContent = valor;
  }

  /* Una vez por visita: si ya lo cerró, no vuelve hasta que cierre la pestaña */
  var CLAVE = 'popupNavidad2026';
  try { if (sessionStorage.getItem(CLAVE)) return; } catch (e) {}

  setTimeout(function () {
    popup.showModal();
    try { sessionStorage.setItem(CLAVE, '1'); } catch (e) {}
  }, 1500);

  /* Cerrar con la ✕ o con clic fuera de la tarjeta (Esc ya funciona solo) */
  popup.addEventListener('click', function (e) {
    if (e.target === popup || e.target.closest('[data-cerrar]')) popup.close();
  });
})();